from pathlib import Path
from PIL import Image,ImageDraw,ImageChops,ImageStat
import json,subprocess,hashlib,os,shutil,zipfile
R=Path(__file__).resolve().parents[1];O=Path(os.environ.get('OUTPUT_DIR','/workspace/outputs/visual-language-v202-motion'));S=R/'.runtime/v202-motion-stage';encoded=R/'.runtime/v202-motion-encoded';encoded.mkdir(parents=True,exist_ok=True)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
subprocess.run([str(S/'node_modules/.bin/tsc'),'--project',str(S/'tsconfig.json')],check=True,capture_output=True)
receipt=json.loads((O/'render-receipt.json').read_text());files=['MotionModel.ts','SceneObjects.tsx','NarrativeFilm.tsx','config.json'];assert receipt['mode']=='--render';assert receipt['source_sha256']==hashlib.sha256(b''.join((R/'adapters/remotion/v202-motion'/f).read_bytes()for f in files)).hexdigest()
model=json.loads((R/'projects/narrative-v202-motion/model-checks.json').read_text());assert model['pass']
media=[]
for name in ['narrative-8s-540.mp4','narrative-8s-no-labels-540.mp4']:
 p=O/name;probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(p)]));v=probe['streams'][0];assert len(probe['streams'])==1 and v['codec_name']=='h264' and v['width']==540 and v['height']==960 and v['r_frame_rate']=='30/1' and v['nb_frames']=='240' and abs(float(probe['format']['duration'])-8)<.001
 subprocess.run(['ffmpeg','-v','error','-i',str(p),'-f','null','-'],check=True,capture_output=True)
 media.append({'file':name,'sha256':sha(p),'frames':240,'fps':30,'duration_s':8,'size':[540,960],'codec':'h264','pixel_format':v['pix_fmt'],'color_space':v.get('color_space'),'audio_tracks':0,'decode':'pass'})
subprocess.run(['ffmpeg','-y','-v','error','-i',str(O/'narrative-8s-540.mp4'),'-vsync','0',str(encoded/'%03d.png')],check=True)
actual=sorted(encoded.glob('*.png'));assert len(actual)==240
pts=json.loads(subprocess.check_output(['ffprobe','-v','error','-select_streams','v:0','-show_entries','frame=best_effort_timestamp_time','-of','json',str(O/'narrative-8s-540.mp4')]))['frames'];assert len(pts)==240;assert all(abs(float(f['best_effort_timestamp_time'])-i/30)<.00001 for i,f in enumerate(pts))
groups={'half-second':list(range(0,240,15))+[239],'joins':[52,53,54,55,103,104,105,106,178,179,180,181],'mechanism':[105,120,135,150,165,179],'comparison':[180,192,204,216,228,239]}
for name,frames in groups.items():
 folder=O/'frames'/name;folder.mkdir(parents=True,exist_ok=True);cols=4 if name in ['half-second','joins']else 3;w=180 if name=='half-second' else 270;h=round(w*960/540);cell=h+25;board=Image.new('RGB',(w*cols,cell*((len(frames)+cols-1)//cols)),'#F6F3EC');draw=ImageDraw.Draw(board)
 for i,f in enumerate(frames):
  p=encoded/f'{f+1:03d}.png';shutil.copy(p,folder/f'frame-{f:03d}.png');im=Image.open(p).convert('RGB');im.thumbnail((w,h));x=(i%cols)*w;y=(i//cols)*cell;board.paste(im,(x,y));draw.text((x+9,y+h+5),f'{f/30:.3f}s / f{f}',fill='#182F40')
 board.save(O/f'{name}-overview.jpg',quality=96)
diffs=[]
for i in range(1,240):
 a=Image.open(actual[i-1]).convert('RGB');b=Image.open(actual[i]).convert('RGB');diffs.append({'frame':i,'mean_abs_rgb':sum(ImageStat.Stat(ImageChops.difference(a,b)).mean)/3})
old=['adapters/remotion/v202/StoryboardScenes.tsx','projects/narrative-v202/camera-timeline.json']+[f'projects/narrative-v202/keyframes/shot-0{i}.png'for i in range(1,5)]
legacy=[]
for name in old:
 before=subprocess.check_output(['git','show','1184ab0:broll-pipeline/'+name],cwd=R);assert hashlib.sha256(before).hexdigest()==sha(R/name);legacy.append({'file':name,'sha256':sha(R/name)})
report={'version':'V2.0.2 second-stage motion test','media':media,'checks':{'strict_typescript':'pass','model_tests':model['tests'],'source_revision_matches_render':True,'decoded_frames':240,'timestamps_match_30fps':True,'intentional_cut_frame':180,'source_storyboard_unchanged':legacy},'pixel_change_diagnostics':{'joins':[d for d in diffs if d['frame']in[54,105,180]],'largest_changes':sorted(diffs,key=lambda d:d['mean_abs_rgb'],reverse=True)[:8],'meaning':'Pixel difference is a diagnostic, not an aesthetic score or proof of no artifacts'},'human_visual_approved':False,'real_phone_test_completed':False,'review_method':'Actual encoded frame sequence and contact sheets; no independent audience test'}
(R/'docs/v202-motion/technical-verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
for folder in ['docs/v202-motion','projects/narrative-v202-motion','adapters/remotion/v202-motion']:shutil.copytree(R/folder,O/folder,dirs_exist_ok=True)
(O/'tools').mkdir(exist_ok=True)
for f in ['render-v202-motion.mjs','package-v202-motion.py']:shutil.copy(R/'tools'/f,O/'tools'/f)
(O/'tests').mkdir(exist_ok=True);shutil.copy(R/'tests/v202-motion.test.mjs',O/'tests')
(O/'checksums.json').write_text(json.dumps({str(p.relative_to(O)):sha(p)for p in O.rglob('*')if p.is_file()and p.name!='checksums.json'},indent=2))
with zipfile.ZipFile(str(O)+'.zip','w',zipfile.ZIP_DEFLATED)as z:
 for p in O.rglob('*'):
  if p.is_file():z.write(p,p.relative_to(O))
print(json.dumps({'videos':2,'actual_decoded_frames':240,'duration':8,'overview_groups':list(groups),'intentional_cut':180,'human_visual_approved':False},indent=2))
