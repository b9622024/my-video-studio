"""Validate render/delivery bytes separately; technical checks are not an art score."""
from pathlib import Path
import json,subprocess,hashlib,shutil
import numpy as np
from PIL import Image,ImageDraw
P=Path(__file__).resolve().parents[1];O=Path('/workspace/outputs/visual-v2.5');O.mkdir(exist_ok=True)
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
checks=[]
for kind,w,h in [('preview-540p',540,960),('master-1080x1920',1080,1920)]:
 source=P/f'out/MilkBrollV25-{kind}.mp4';dest=O/f'keleji-v25-12s-{kind}.mp4';shutil.copyfile(source,dest)
 probes=[]
 for f in [source,dest]:
  data=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(f)]));s=next(x for x in data['streams'] if x['codec_type']=='video');assert (s['width'],s['height'],s['r_frame_rate'],int(s['nb_frames']))==(w,h,'30/1',360);assert s['codec_name']=='h264';assert abs(float(data['format']['duration'])-12)<1e-6;assert not any(x['codec_type']=='audio' for x in data['streams']);probes.append({'path':str(f),'sha256':sha(f),'ffprobe':data})
 assert probes[0]['sha256']==probes[1]['sha256'];subprocess.run(['ffmpeg','-v','error','-i',str(source),'-f','null','-'],check=True,capture_output=True)
 raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(source),'-vf','scale=108:192,format=gray','-f','rawvideo','-pix_fmt','gray','-']);frames=np.frombuffer(raw,dtype=np.uint8).reshape(-1,192,108);assert len(frames)==360;means=frames.mean(axis=(1,2));assert means.min()>20;mad=np.abs(np.diff(frames.astype(float),axis=0)).mean(axis=(1,2))
 checks.append({'kind':kind,'files':probes,'all_360_frames_decoded':True,'minimum_gray_mean':float(means.min()),'maximum_adjacent_frame_gray_MAD':float(mad.max()),'maximum_change_frame':int(mad.argmax()+1),'scene_boundary_MAD':{'119_to_120':float(mad[119]),'239_to_240':float(mad[239])}})
master=P/'out/MilkBrollV25-master-1080x1920.mp4';errors=[];canvas=Image.new('RGB',(810,2040),'#eee8df');draw=ImageDraw.Draw(canvas)
for j,n in enumerate([30,119,120,165,225,239,240,248,285,330,359]):
 f=P/f'out/MilkBrollV25-frame-{n:03d}.png';im=Image.open(f).convert('RGB');x=j%3*270;y=j//3*510;canvas.paste(im.resize((270,480),Image.Resampling.LANCZOS),(x,y+30));draw.text((x+10,y+9),f'{n/30:.2f}s / frame {n}',fill='#183149');(O/'frames').mkdir(exist_ok=True);shutil.copyfile(f,O/'frames'/f.name)
 raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(master),'-vf',f'select=eq(n\\,{n})','-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','-']);decoded=np.frombuffer(raw,dtype=np.uint8).reshape(1920,1080,3);err=float(np.abs(np.array(im).astype(float)-decoded).mean());assert err<5,(n,err);errors.append({'frame':n,'mean_RGB_error':err})
canvas.save(O/'keyframes-v25.png')
a=np.array(Image.open(P/'out/v25-seek-reference.png').convert('RGB')).astype(int);b=np.array(Image.open(P/'out/v25-seek-return.png').convert('RGB')).astype(int);delta=np.abs(a-b);assert delta.max()<=1 and delta.mean()<.001
report={'files':checks,'direct_still_to_MP4_keyframes':errors,'seek':{'order':[245,359,245],'max_RGB_delta':int(delta.max()),'mean_RGB_delta':float(delta.mean())},'render_times':{n:json.loads((P/f'out/MilkBrollV25-{n}-render.json').read_text()) for n in ['preview','final']},'scope':'Technical validation only. Hard cut at120 and 8-frame panel expansion at240 are intentional. No end freeze. No automatic aesthetic approval.'}
(P/'docs/v25-qa-metrics.json').write_text(json.dumps(report,indent=2));shutil.copyfile(P/'docs/v25-qa-metrics.json',O/'v25-qa-metrics.json');print(json.dumps({'preview_and_master_spec':'PASS','source_delivery_hash_match':True,'all_frames_decoded':True,'seek_max_delta':int(delta.max()),'max_keyframe_RGB_error':max(e['mean_RGB_error'] for e in errors)},indent=2))
