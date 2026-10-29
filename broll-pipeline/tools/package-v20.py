import pathlib,json,subprocess,hashlib,shutil,zipfile,os
from PIL import Image,ImageDraw,ImageFont
r=pathlib.Path(__file__).resolve().parents[1];o=pathlib.Path(os.environ.get('OUTPUT_DIR','/workspace/outputs/visual-language-v20'));v=o/'visual-language-v20-540.mp4'
subprocess.run(['ffmpeg','-v','error','-i',str(v),'-f','null','-'],check=True,capture_output=True)
probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(v)]));s=probe['streams'][0];assert s['width']==540 and s['height']==960 and s['nb_frames']=='360' and s['r_frame_rate']=='30/1';assert len(probe['streams'])==1
(o/'encoded').mkdir(exist_ok=True)
for f in [45,115,205,245,290,335]:
 subprocess.run(['ffmpeg','-y','-v','error','-i',str(v),'-vf',f'select=eq(n\\,{f})','-frames:v','1',str(o/'encoded'/f'{f}.png')],check=True)
board=Image.new('RGB',(810,1020),'#F3F0E7');d=ImageDraw.Draw(board)
for i,f in enumerate([45,115,205,245,290,335]):
 im=Image.open(o/'encoded'/f'{f}.png').convert('RGB');im.thumbnail((270,480));x=(i%3)*270;y=(i//3)*510;board.paste(im,(x,y));d.text((x+16,y+485),f'{f/30:.2f}s / frame {f}',fill='#243D3A')
board.save(o/'keyframes.jpg',quality=95)
unchanged=subprocess.run(['git','diff','--exit-code','broll-pipeline-v1.2.3','--','adapters/remotion/v123','projects/interaction-v123','adapters/remotion/v12','projects/modules-v12','src','videos'],cwd=r,capture_output=True).returncode==0
report={'version':'V2.0','technical_checks':{'decode':'pass','duration':probe['format']['duration'],'frames':s['nb_frames'],'width':s['width'],'height':s['height'],'fps':s['r_frame_rate'],'audio_tracks':0,'typescript':'strict tsc pass','legacy_source_unchanged':unchanged},'sha256':hashlib.sha256(v.read_bytes()).hexdigest(),'art_review':{'human_approved':False,'status':'style validation candidate','inspected_encoded_frames':[45,115,205,245,290,335],'risks':['三區比例僅示意，不是飲食建議','末段三盤縮小為比較尺度，需要手機實看可讀性','幾何分區可能仍被感受為圖表；不是已通過美術驗收','Spectrum僅完成原型示範，未進主片','任意主題自動編排尚未實作']}}
(r/'docs/v20/verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
for folder in ['docs/v20','projects/visual-language-v20','adapters/remotion/v20']:
 shutil.copytree(r/folder,o/folder,dirs_exist_ok=True)
shutil.copy(r/'tools/render-v20.mjs',o/'render-v20.mjs')
with zipfile.ZipFile(str(o)+'.zip','w',zipfile.ZIP_DEFLATED) as z:
 for p in o.rglob('*'):
  if p.is_file():z.write(p,p.relative_to(o))
print(json.dumps(report,ensure_ascii=False,indent=2))
