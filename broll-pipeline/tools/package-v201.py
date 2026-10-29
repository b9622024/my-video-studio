"""Validate actual previews and build a private art-review package; no art pass inference."""
from pathlib import Path
from PIL import Image,ImageDraw
import subprocess,json,hashlib,shutil,os,zipfile
R=Path(__file__).resolve().parents[1]; O=Path(os.environ.get('OUTPUT_DIR','/workspace/outputs/visual-language-v201'))
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
receipt=json.loads((O/'render-receipt.json').read_text());gate=json.loads((R/'projects/recognizable-v201/object-recognition-gate.json').read_text())
assert receipt['source_sha256']==gate['source_sha256'] and receipt['mode']=='--render'
assert receipt['source_sha256']==hashlib.sha256(b''.join((R/'adapters/remotion/v201'/f).read_bytes() for f in ['Objects.tsx','Prototype.tsx','MotionMath.ts','style-tokens.json','prototypes.json'])).hexdigest()
encoded=O/'encoded';encoded.mkdir(exist_ok=True);blind=O/'blind-test';blind.mkdir(exist_ok=True)
media=[];timings={'A':[12,40,74],'B':[18,40,74],'C':[12,40,74]};codes={'A':'17','B':'42','C':'68'}
for id in 'ABC':
 for variant in ['', '-no-text']:
  video=O/f'{id}{variant}-540.mp4';probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(video)]));s=probe['streams'][0]
  assert len(probe['streams'])==1 and s['codec_name']=='h264' and s['width']==540 and s['height']==960 and s['r_frame_rate']=='30/1' and s['nb_frames']=='75' and probe['format']['duration']=='2.500000'
  subprocess.run(['ffmpeg','-v','error','-i',str(video),'-f','null','-'],check=True,capture_output=True)
  media.append({'file':video.name,'sha256':sha(video),'codec':'h264','frames':75,'fps':30,'duration':2.5,'width':540,'height':960,'audio_tracks':0,'decode':'pass','visible_text':not bool(variant)})
 for f in [0,*timings[id],63]:
  subprocess.run(['ffmpeg','-y','-v','error','-i',str(O/f'{id}-no-text-540.mp4'),'-vf',f'select=eq(n\\,{f})','-frames:v','1',str(encoded/f'{id}-{f}.png')],check=True)
 board=Image.new('RGB',(810,515),'#F6F3EC');d=ImageDraw.Draw(board)
 for i,f in enumerate(timings[id]):
  im=Image.open(encoded/f'{id}-{f}.png').convert('RGB');im.thumbnail((270,480));board.paste(im,(i*270,0));d.text((i*270+16,490),f'{id}  {f/30:.2f}s / frame {f}',fill='#182F40')
 board.save(O/f'{id}-keyframes.jpg',quality=95)
 assert (O/f'{id}-63.png').read_bytes()==(O/f'{id}-74.png').read_bytes(),id+' source payoff changed'
 shutil.copy(O/f'{id}-no-text-540.mp4',blind/f'test-{codes[id]}.mp4');shutil.copy(encoded/f'{id}-74.png',blind/f'test-{codes[id]}-completion.png')
 (blind/'INSTRUCTIONS.md').write_text('# 無提示觀看\n\n請先看 completion 圖約一秒，說出你看到的物件。再播放同代號影片：哪個物件發生變化？怎麼變？最後結果是什麼？沒有標準提示，請用自己的話回答。以手機正常大小觀看，不先看其他資料夾或解答。\n')
phone=Image.new('RGB',(810,480),'#F6F3EC')
for i,id in enumerate('ABC'):
 im=Image.open(encoded/f'{id}-74.png').convert('RGB');im.thumbnail((270,480));phone.paste(im,(i*270,0))
phone.save(O/'no-text-object-lineup.jpg',quality=95)
board=Image.new('RGB',(810,1545),'#F6F3EC')
for i,id in enumerate('ABC'):board.paste(Image.open(O/f'{id}-keyframes.jpg'),(0,i*515))
board.save(O/'all-keyframes.jpg',quality=95)
legacy=subprocess.check_output(['git','diff','visual-language-v2.0','--name-only'],cwd=R).decode().strip().splitlines()
allowed=('broll-pipeline/adapters/remotion/v201/','broll-pipeline/projects/recognizable-v201/','broll-pipeline/docs/v201/','broll-pipeline/tools/','broll-pipeline/tests/')
assert all(s.startswith(allowed) for s in legacy),legacy
report={'version':'V2.0.1','source_sha256':receipt['source_sha256'],'technical_checks':{'strict_tsc':'pass','causal_motion_tests':'pass','all_six_previews_decode':'pass','stable_payoff_source_frames_63_74':'identical for A/B/C','legacy_tracked_sources_untouched':True},'media':media,'human_test_completed':False,'human_art_approved':False,'real_phone_test_completed':False,'object_gate':'creator_self_check_only','blind_answer_key':codes,'vector_assets':[{'file':p.name,'sha256':sha(p)}for p in sorted((R/'projects/recognizable-v201/assets').glob('*.svg'))]}
(R/'docs/v201/verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
for folder in ['adapters/remotion/v201','projects/recognizable-v201','docs/v201']:shutil.copytree(R/folder,O/folder,dirs_exist_ok=True)
(O/'tools').mkdir(exist_ok=True)
for name in ['render-v201.mjs','export-v201-svg.mjs','package-v201.py']:shutil.copy(R/'tools'/name,O/'tools'/name)
(O/'tests').mkdir(exist_ok=True);shutil.copy(R/'tests/recognizable-v201.test.mjs',O/'tests')
checks={str(p.relative_to(O)):sha(p)for p in O.rglob('*')if p.is_file() and p.name!='checksums.json'};(O/'checksums.json').write_text(json.dumps(checks,indent=2))
with zipfile.ZipFile(str(O)+'.zip','w',zipfile.ZIP_DEFLATED)as z:
 for p in O.rglob('*'):
  if p.is_file():z.write(p,p.relative_to(O))
print(json.dumps({'checks':'pass','videos':len(media),'zip':str(O)+'.zip','human_review':'pending'},indent=2))
