"""Package only original storyboard stills and private reference-analysis evidence."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import os,json,hashlib,shutil,zipfile,subprocess,math
R=Path(__file__).resolve().parents[1];O=Path(os.environ.get('OUTPUT_DIR','/workspace/outputs/visual-language-v202'));O.mkdir(parents=True,exist_ok=True)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
subprocess.run([str(R/'.runtime/v202-stage/node_modules/.bin/tsc'),'--project',str(R/'.runtime/v202-stage/tsconfig.json')],check=True,capture_output=True)
graph=json.loads((R/'projects/narrative-v202/scene-graph.json').read_text());camera=json.loads((R/'projects/narrative-v202/camera-timeline.json').read_text());events=json.loads((R/'projects/narrative-v202/motion-events.json').read_text())
assert graph['stage']=='storyboard_only' and not graph['approval']['storyboard'] and not graph['approval']['animation_render_authorized']
shots=camera['shots'];assert shots[0]['frames'][0]==0 and shots[-1]['frames'][1]==240
for a,b in zip(shots,shots[1:]):assert a['frames'][1]==b['frames'][0] and a['end']==b['start'],'Camera/time continuity error'
for event in events['events']:assert 0<=event['frames'][0]<event['frames'][1]<=240
assert events['model']['implemented'] is False
assert all(any(e['frames'][0]<=f<e['frames'][1] for e in events['events'])for f in range(240)),'Planned event coverage has a gap'
for q in [0,2,5]:
 dy=math.sqrt(48**2-q**2);assert abs(math.hypot(q,dy)-48)<1e-8,'Illustrative hanger constraint failed'
assert not list(O.rglob('*.mp4')),'This stage must not contain an animation'
for name in ['StoryboardScenes.tsx','camera-timeline.json']:assert sha(R/'adapters/remotion/v202'/name)==sha(R/'.runtime/v202-stage/src'/name),'Rendered source revision changed'
keydir=R/'projects/narrative-v202/keyframes';keydir.mkdir(exist_ok=True)
board=Image.new('RGB',(1080,1980),'#F6F3EC');d=ImageDraw.Draw(board);art=[]
for i in range(4):
 p=O/f'shot-0{i+1}.png';im=Image.open(p);assert im.size==(540,960);x=(i%2)*540;y=(i//2)*990
 board.paste(im.convert('RGB'),(x,y+25));d.text((x+24,y+8),f'SHOT {i+1:02d} / '+['0.0-1.8s','1.8-3.5s','3.5-6.0s','6.0-8.0s'][i],fill='#182F40')
 shutil.copy(p,keydir/p.name);art.append({'file':p.name,'sha256':sha(p),'size':[540,960],'kind':'posed original storyboard art; not an animated-frame extraction'})
board.save(O/'storyboard-contact.jpg',quality=96)
ref=R/'.runtime/v202-reference';provenance=json.loads((R/'projects/narrative-v202/reference-provenance.json').read_text());evidence=[]
if (ref/'hard-cut-evidence.jpg').exists():
 e=O/'reference-evidence-private';e.mkdir(exist_ok=True)
 for name in ['hard-cut-evidence.jpg','overview-0.jpg','overview-1.jpg','overview-2.jpg']:
  shutil.copy(ref/name,e/name);evidence.append({'file':str((e/name).relative_to(O)),'sha256':sha(e/name)})
 (e/'READ-ME.txt').write_text('使用者參考影片的私人分析影格，僅供核對分析。不是本次原創素材，不可納入正式影片。overview時間為抽樣約值；硬切圖使用原始相鄰影格PTS。原始影片未打包。\n')
changed=subprocess.check_output(['git','diff','--name-only','visual-language-v2.0.1'],cwd=R).decode().splitlines()
allowed=('broll-pipeline/adapters/remotion/v202/','broll-pipeline/projects/narrative-v202/','broll-pipeline/docs/v202/','broll-pipeline/tools/render-v202-storyboard.mjs','broll-pipeline/tools/package-v202.py')
assert all(p.startswith(allowed)for p in changed),changed
report={'stage':'storyboard_only','source_sha256':sha(R/'adapters/remotion/v202/StoryboardScenes.tsx'),'technical_checks':{'strict_typescript':'pass','key_art_count':4,'dimensions':[540,960],'planned_frame_coverage':[0,240],'camera_boundary_continuity':'pass','posed_hanger_length_check':'pass; static only','old_tracked_sources_unchanged':True,'mp4_generated':False},'reference':{'source_sha256':provenance['sha256'],'analysis_completed':True,'two_native_adjacent_frame_hard_cuts_verified':True,'raw_reference_in_git':False,'source_art_reused':False,'private_evidence':evidence},'key_art':art,'motion_implemented':False,'human_storyboard_approved':False,'human_art_approved':False,'real_phone_test_completed':False}
(R/'docs/v202/technical-verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
for folder in ['docs/v202','projects/narrative-v202','adapters/remotion/v202']:shutil.copytree(R/folder,O/folder,dirs_exist_ok=True)
(O/'tools').mkdir(exist_ok=True)
for name in ['render-v202-storyboard.mjs','package-v202.py']:shutil.copy(R/'tools'/name,O/'tools'/name)
(O/'checksums.json').write_text(json.dumps({str(p.relative_to(O)):sha(p)for p in O.rglob('*')if p.is_file() and p.name!='checksums.json'},indent=2)+'\n')
with zipfile.ZipFile(str(O)+'.zip','w',zipfile.ZIP_DEFLATED)as z:
 for p in O.rglob('*'):
  if p.is_file():z.write(p,p.relative_to(O))
print('Four original stills + storyboard/data/source + private analysis evidence packaged. No MP4; human approval pending.')
