from pathlib import Path
from PIL import Image,ImageDraw
import subprocess,json,hashlib,shutil,os,zipfile
R=Path(__file__).resolve().parents[1];O=Path(os.environ.get('OUTPUT_DIR','/workspace/outputs/visual-language-v203'));stage=R/'.runtime/v203-stage';work=R/'.runtime/v203-encoded';work.mkdir(parents=True,exist_ok=True)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
subprocess.run([str(stage/'node_modules/.bin/tsc'),'--project',str(stage/'tsconfig.json')],check=True,capture_output=True)
receipt=json.loads((O/'render-receipt.json').read_text());assert receipt['mode']=='--render';assert receipt['source_sha256']==hashlib.sha256(b''.join((R/'adapters/remotion'/p).read_bytes()for p in receipt['paths'])).hexdigest()
assert json.loads((R/'projects/art-calibration-v203/reuse-checks.json').read_text())['pass']
records=[]
for variant in 'AB':
 for res,size in [('preview-540',(540,960)),('master-1080',(1080,1920))]:
  p=O/f'{variant}-{res}.mp4';probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(p)]));v=probe['streams'][0]
  assert len(probe['streams'])==1 and (v['width'],v['height'])==size and v['nb_frames']=='120' and v['r_frame_rate']=='30/1' and abs(float(probe['format']['duration'])-4)<.001 and v['codec_name']=='h264'
  subprocess.run(['ffmpeg','-v','error','-i',str(p),'-f','null','-'],check=True,capture_output=True)
  records.append({'file':p.name,'size':list(size),'duration_s':4,'frames':120,'fps':30,'codec':'h264','pixel_format':v['pix_fmt'],'color_space':v.get('color_space'),'sample_aspect_ratio':v.get('sample_aspect_ratio'),'display_aspect_ratio':v.get('display_aspect_ratio'),'audio_tracks':0,'bytes':p.stat().st_size,'sha256':sha(p),'source':'native Remotion vector rasterization','scale':1 if size[0]==540 else 2,'decode':'pass'})
 for f in [0,18,36,45,60,75,90,105,119]:
  d=O/'encoded'/variant;d.mkdir(parents=True,exist_ok=True)
  subprocess.run(['ffmpeg','-y','-v','error','-i',str(O/f'{variant}-preview-540.mp4'),'-vf',f'select=eq(n\\,{f})','-frames:v','1',str(d/f'{f:03}.png')],check=True)
 # Native master close-up, not a resized preview still.
 subprocess.run(['ffmpeg','-y','-v','error','-i',str(O/f'{variant}-master-1080.mp4'),'-vf','select=eq(n\\,75)','-frames:v','1',str(O/f'{variant}-native-1080-frame75.png')],check=True)
frames=[0,36,60,75,105,119];board=Image.new('RGB',(1080,6*990),'#F6F3EC');draw=ImageDraw.Draw(board)
for row,f in enumerate(frames):
 for col,variant in enumerate('AB'):
  im=Image.open(O/'encoded'/variant/f'{f:03}.png').convert('RGB');board.paste(im,(col*540,row*990+25));draw.text((col*540+22,row*990+8),f'{variant} / {f/30:.2f}s / frame {f}',fill='#182F40')
board.save(O/'matched-keyframes.jpg',quality=95)
close=Image.new('RGB',(1080,990),'#F6F3EC');draw=ImageDraw.Draw(close)
for i,variant in enumerate('AB'):
 close.paste(Image.open(O/'encoded'/variant/'075.png').convert('RGB'),(i*540,25));draw.text((i*540+22,8),f'VERSION {variant} / SAME FRAME 75',fill='#182F40')
close.save(O/'art-direction-comparison.jpg',quality=96)
integrity={'records':records,'platform_transcode':{'observed':False,'status':'unknown','reason':'platform playback/transcoded binary not accessible; source file hashes do not establish platform behavior'},'master_is_test_not_publicly_approved':True,'previews_are_not_upscaled_masters':True}
(R/'projects/art-calibration-v203/artifact-integrity.json').write_text(json.dumps(integrity,ensure_ascii=False,indent=2)+'\n')
(R/'docs/v203/technical-verification.json').write_text(json.dumps({'strict_typescript':'pass','original_physics_and_geometry':'preserved per reuse-checks.json','render_revision_matches':True,'all_four_mp4_decode':'pass','matched_camera_and_timeline':True,'human_art_approved':False,'real_phone_test_completed':False,'platform_transcode_status':'unknown'},indent=2)+'\n')
for folder in ['docs/v203','projects/art-calibration-v203','adapters/remotion/v203']:shutil.copytree(R/folder,O/folder,dirs_exist_ok=True)
# Rebuild dependencies are original, unchanged files, kept in their original relative paths.
for p in ['MotionModel.ts','SceneObjects.tsx','config.json']:
 d=O/'adapters/remotion/v202-motion';d.mkdir(parents=True,exist_ok=True);shutil.copy(R/'adapters/remotion/v202-motion'/p,d/p)
(O/'tools').mkdir(exist_ok=True)
for p in ['render-v203-art.mjs','package-v203-art.py']:shutil.copy(R/'tools'/p,O/'tools'/p)
(O/'tests').mkdir(exist_ok=True);shutil.copy(R/'tests/v203-art.test.mjs',O/'tests')
(O/'checksums.json').write_text(json.dumps({str(p.relative_to(O)):sha(p)for p in O.rglob('*')if p.is_file()and p.name!='checksums.json'},indent=2))
with zipfile.ZipFile(str(O)+'.zip','w',zipfile.ZIP_DEFLATED)as z:
 for p in O.rglob('*'):
  if p.is_file():z.write(p,p.relative_to(O))
print(json.dumps({'native_outputs':records,'platform_transcode':'unknown','human_art_approved':False},indent=2))
