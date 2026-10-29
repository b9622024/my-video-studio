from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,shutil,zipfile,os,hashlib
ROOT=Path(__file__).resolve().parents[1];OUT=Path('/workspace/outputs/broll-v112-design');font=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc',24)
for suffix,target in [('', 'overview.jpg'),('-no-text','no-text-overview.jpg')]:
 canvas=Image.new('RGB',(1080,1980),'#f5f0e5');draw=ImageDraw.Draw(canvas)
 for i,ident in enumerate(['B-01','B-02','C-01','C-02']):
  image=Image.open(OUT/(ident+suffix+'.jpg'));image.thumbnail((540,960));x=i%2*540;y=i//2*990;draw.text((x+14,y+2),ident+(' / 無文字' if suffix else ''),font=font,fill='#213b4a');canvas.paste(image,(x,y+30))
 canvas.save(OUT/target,quality=94)
for name in ['design-options.json','design-review.json','scene-plan.json','sources.json']:shutil.copy(ROOT/'projects/bento-v112-design'/name,OUT/name)
for source,name in [(ROOT/'docs/v112/DESIGN-REVIEW.md','DESIGN-REVIEW.md'),(ROOT/'docs/v112/verification.json','verification.json'),(ROOT/'docs/v112/layout-checks.json','layout-checks.json')]:shutil.copy(source,OUT/name)
files=[p for p in OUT.rglob('*') if p.is_file()];key=os.environ.get('PIXABAY_API_KEY','').strip().encode();assert not any(p.suffix.lower()=='.mp4' for p in files)
checksums={str(p.relative_to(OUT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in files if p.name!='checksums.json'};(OUT/'checksums.json').write_text(json.dumps(checksums,indent=2)+'\n')
with zipfile.ZipFile(OUT.with_suffix('.zip'),'w',zipfile.ZIP_DEFLATED) as z:
 for p in sorted(OUT.rglob('*')):
  if p.is_file():
   assert not key or key not in p.read_bytes(),'Sensitive output blocked'
   z.write(p,'broll-v112-design/'+str(p.relative_to(OUT)))
print(json.dumps({'archive':str(OUT.with_suffix('.zip')),'bytes':OUT.with_suffix('.zip').stat().st_size,'static_designs':4,'mp4_files':0,'secret_scan_passed':True}))
