from pathlib import Path
from PIL import Image,ImageDraw,ImageFont,ImageOps
import json,subprocess,zipfile,shutil,os
ROOT=Path(__file__).resolve().parents[1];OUT=Path('/workspace/outputs/broll-v111-visual-tests');F=lambda n:ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc',n)
contact=Image.new('RGB',(810,1545),'#f5efdf');draw=ImageDraw.Draw(contact)
for row,ident in enumerate(['B2','C2A','C2B']):
 for col,frame in enumerate([0,55,110]):
  p=Image.open(OUT/f'{ident}-{frame}.jpg');p.thumbnail((270,480));x=col*270;y=row*515;draw.text((x+8,y+3),f'{ident} / {frame/30:.2f}s',font=F(18),fill='#1d344b');contact.paste(p,(x,y+30))
contact.save(OUT/'keyframes.jpg',quality=92)
old='/workspace/broll-v11/broll-pipeline/projects/bento-v11/outputs/preview-540.mp4'
for ident,at in [('old-B2',6.5),('old-C2',10.5)]:subprocess.run(['ffmpeg','-v','error','-y','-ss',str(at),'-i',old,'-frames:v','1',str(OUT/(ident+'.jpg'))],check=True)
compare=Image.new('RGB',(540,1545),'#f5efdf');draw=ImageDraw.Draw(compare)
for row,(oldname,newname) in enumerate([('old-B2','B2'),('old-C2','C2A'),('old-C2','C2B')]):
 for col,(f,label) in enumerate([(oldname+'.jpg','V1.1'),(newname+'-110.jpg','V1.1.1 '+newname)]):
  p=Image.open(OUT/f);p.thumbnail((270,480));x=col*270;y=row*515;draw.text((x+8,y+3),label,font=F(18),fill='#1d344b');compare.paste(p,(x,y+30))
compare.save(OUT/'before-after.jpg',quality=92)
shutil.copy(ROOT/'docs/v111/DESIGN.md',OUT/'DESIGN.md');shutil.copy(ROOT/'projects/bento-v111-visual-tests/scene-plan.json',OUT/'scene-plan.json');shutil.copy(ROOT/'schemas/v111/contracts.schema.json',OUT/'contracts.schema.json')
for p in (ROOT/'projects/bento-v111-visual-tests').glob('*source.json'):shutil.copy(p,OUT/p.name)
(OUT/'assets').mkdir(exist_ok=True)
for p in (ROOT/'.runtime/v111-public/assets').iterdir():shutil.copy(p,OUT/'assets'/p.name)
key=os.environ.get('PIXABAY_API_KEY','').strip().encode()
with zipfile.ZipFile(OUT.with_suffix('.zip'),'w',zipfile.ZIP_DEFLATED) as z:
 for p in sorted(OUT.rglob('*')):
  if p.is_file():
   assert not key or key not in p.read_bytes(),'Sensitive output blocked'
   z.write(p,'broll-v111-visual-tests/'+str(p.relative_to(OUT)))
print(json.dumps({'archive':str(OUT.with_suffix('.zip')),'bytes':OUT.with_suffix('.zip').stat().st_size,'new_12_second_film':False,'c1_approved':False}))
