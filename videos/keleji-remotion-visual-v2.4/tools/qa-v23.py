"""Technical checks, not an aesthetic score. Also audits actual delivery bytes."""
from pathlib import Path
import json,subprocess,hashlib,shutil
import numpy as np
from PIL import Image,ImageDraw
p=Path(__file__).resolve().parents[1];out=Path('/workspace/outputs/visual-v2.3');out.mkdir(exist_ok=True)
reports=[]
for label,name in [('A','MilkEditorialA'),('B','MilkFootageB')]:
 source=p/f'out/{name}-master-1080x1920.mp4';delivery=out/f'keleji-v23-{label}-MASTER-1080x1920.mp4';shutil.copyfile(source,delivery)
 probes=[]
 for f in [source,delivery]:
  data=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(f)]));s=next(x for x in data['streams'] if x['codec_type']=='video');assert (s['width'],s['height'],s['r_frame_rate'],int(s['nb_frames']))==(1080,1920,'30/1',120);assert s['codec_name']=='h264';assert not any(x['codec_type']=='audio' for x in data['streams']);assert abs(float(data['format']['duration'])-4)<1e-6
  probes.append({'path':str(f),'sha256':hashlib.sha256(f.read_bytes()).hexdigest(),'ffprobe':data})
 assert probes[0]['sha256']==probes[1]['sha256']
 subprocess.run(['ffmpeg','-v','error','-i',str(source),'-f','null','-'],check=True,capture_output=True)
 raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(source),'-vf','scale=108:192,format=gray','-f','rawvideo','-pix_fmt','gray','-']);frames=np.frombuffer(raw,dtype=np.uint8).reshape(-1,192,108);assert len(frames)==120
 means=frames.mean(axis=(1,2));assert means.min()>20;mad=np.abs(np.diff(frames.astype(float),axis=0)).mean(axis=(1,2))
 errors=[];contact=Image.new('RGB',(1296,440),'#eee8df');draw=ImageDraw.Draw(contact)
 for j,n in enumerate([0,24,42,60,90,119]):
  f=p/f'out/{name}-frame-{n:03d}.png';im=Image.open(f).convert('RGB');thumbnail=im.resize((216,384),Image.Resampling.LANCZOS);contact.paste(thumbnail,(j*216,38));draw.text((j*216+9,12),f'{label} / {n/30:.2f}s',fill='#183149')
  d=out/'frames'/label;d.mkdir(parents=True,exist_ok=True);shutil.copyfile(f,d/f.name)
  decoded=subprocess.check_output(['ffmpeg','-v','error','-i',str(source),'-vf',f'select=eq(n\\,{n})','-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','-']);arr=np.frombuffer(decoded,dtype=np.uint8).reshape(1920,1080,3);err=np.abs(np.array(im).astype(float)-arr).mean();assert err<5,(name,n,err);errors.append({'frame':n,'mean_RGB_error':float(err)})
 contact.save(out/f'{label}-keyframes.png')
 a=np.array(Image.open(p/f'out/{name}-seek-reference.png').convert('RGB')).astype(int);b=np.array(Image.open(p/f'out/{name}-seek-return.png').convert('RGB')).astype(int);delta=np.abs(a-b);assert delta.max()<=1 and delta.mean()<.001
 reports.append({'version':label,'files':probes,'all_120_frames_decoded':True,'minimum_gray_mean':float(means.min()),'maximum_adjacent_frame_gray_MAD':float(mad.max()),'maximum_change_frame':int(mad.argmax()+1),'keyframe_RGB_comparisons':errors,'seek_order':[60,119,60],'seek_max_RGB_delta':int(delta.max()),'seek_mean_RGB_delta':float(delta.mean()),'render':json.loads((p/f'out/{name}-final-render.json').read_text())})
(p/'docs/v23-qa-metrics.json').write_text(json.dumps({'reports':reports,'aesthetic_scope':'Not an automatic art-quality score; see comparison report.'},indent=2));shutil.copyfile(p/'docs/v23-qa-metrics.json',out/'v23-qa-metrics.json')
for r in reports: print(r['version'],r['render']['elapsedSeconds'],'seconds; source/delivery hash match; 1080x1920/30fps/120 frames; seek delta',r['seek_max_RGB_delta'])
a=Image.open(out/'A-keyframes.png');b=Image.open(out/'B-keyframes.png');both=Image.new('RGB',(1296,880));both.paste(a,(0,0));both.paste(b,(0,440));both.save(out/'AB-keyframes.png')
