from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,subprocess,hashlib,shutil,zipfile,os
R=Path(__file__).resolve().parents[1];P=R/'projects/asset-first-v21';O=Path(os.environ.get('OUTPUT_DIR','/workspace/outputs/asset-first-v21'));S=R/'.runtime/v21-stage';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
subprocess.run([str(S/'node_modules/.bin/tsc'),'--project',str(S/'tsconfig.json')],check=True,capture_output=True)
receipt=json.loads((O/'render-receipt.json').read_text());scene=json.loads((P/'scene.json').read_text());assert receipt['source_sha256']==sha(R/'adapters/remotion/v21/AssetFirstArt.tsx') and receipt['scene_sha256']==sha(P/'scene.json');assert scene['human_art_approved'] is False and receipt['mp4_generated'] is False
sources={'scene-interior.png':'exec-739ad9dc-838b-4605-9f70-d120990971de.png','outer-facade-source.png':'exec-8127e8b4-2fc0-49a0-a623-7d05042938ef.png','mass-gold.png':'exec-160b7f5c-db81-416a-81a6-9749ba920f34.png','cradle-front.png':'exec-bf001297-826c-42bf-ab91-92b6fe71a1dd.png','hydraulic-body.png':'exec-1c4eed01-4c78-4452-8a00-8fd7c074bad9.png'}
assets=[]
for p in sorted((P/'assets').rglob('*')):
 if not p.is_file():continue
 entry={'file':str(p.relative_to(P)),'bytes':p.stat().st_size,'sha256':sha(p),'kind':'original generated illustration'if p.parent.name=='original'else'derived matte or controllable vector from registered source'}
 if p.suffix=='.png':
  im=Image.open(p);entry.update({'native_size':list(im.size),'mode':im.mode})
  if im.mode=='RGBA':
   a=im.getchannel('A');entry['alpha_bbox_128']=a.point(lambda v:255 if v>=128 else 0).getbbox();entry['corner_alpha']=a.getpixel((0,0));assert a.getextrema()[0]==0 and a.getextrema()[1]>0,'Independent layer lacks alpha'
 if p.name in sources:
  entry['generation_file']=sources[p.name];original=Path('/workspace/generated_images')/sources[p.name]
  if original.exists():assert sha(original)==sha(p),'Original artwork pixels changed'
 assets.append(entry)
(P/'asset-manifest.json').write_text(json.dumps({'version':'2.1-stage1','generator':'existing platform image_gen generation/edit tool; model and seed not exposed','assets':assets,'external_source_art_reused':False,'old_svg_hero_reused':False,'paid_service_enabled':False,'human_art_approved':False},ensure_ascii=False,indent=2)+'\n')
keydir=P/'keyframes';keydir.mkdir(exist_ok=True);keyart=[]
contact=Image.new('RGB',(1620,1000),'#F6F3EC');draw=ImageDraw.Draw(contact)
for i,id in enumerate('ABC'):
 p=O/f'key-{id}-1080.png';im=Image.open(p).convert('RGB');assert im.size==(1080,1920);shutil.copy(p,keydir/p.name);small=im.resize((540,960),Image.Resampling.LANCZOS);small.save(O/f'key-{id}-540.jpg',quality=96);contact.paste(small,(i*540,30));draw.text((i*540+20,10),f'SCENE {id} / SAME ASSET SET',fill='#182F40');keyart.append({'file':p.name,'sha256':sha(p),'size':[1080,1920]})
contact.save(O/'three-keyframes.jpg',quality=96)
# Old footage is supplied only as a reference. No V2.1 video is generated.
old_dir=O/'old-v203';old_dir.mkdir(exist_ok=True)
master=Path(os.environ.get('V203_MASTER','/workspace/outputs/visual-language-v203/B-master-1080.mp4'))
for i,f in enumerate([0,36,75]):
 target=old_dir/f'{i+1:02d}.png'
 if not target.exists():subprocess.run(['ffmpeg','-y','-v','error','-i',str(master),'-vf',f'select=eq(n\\,{f})','-frames:v','1',str(target)],check=True)
 assert Image.open(target).size==(1080,1920)
old_preview=Path(os.environ.get('V203_PREVIEW','/workspace/outputs/visual-language-v203/B-preview-540.mp4'))
if old_preview.exists():shutil.copy(old_preview,old_dir/'V203-B-reference-only.mp4')
comparison=Image.new('RGB',(1080,3*990),'#F6F3EC');draw=ImageDraw.Draw(comparison)
for row,id in enumerate('ABC'):
 for col,p in enumerate([old_dir/f'{row+1:02d}.png',O/f'key-{id}-1080.png']):
  im=Image.open(p).convert('RGB').resize((540,960),Image.Resampling.LANCZOS);comparison.paste(im,(col*540,row*990+25));draw.text((col*540+15,row*990+7),f'{"V2.0.3 B"if col==0 else"V2.1"} / PHASE {id}',fill='#182F40')
comparison.save(O/'old-vs-new-all.jpg',quality=95)
close=Image.new('RGB',(2160,1950),'#F6F3EC');draw=ImageDraw.Draw(close)
for i,p in enumerate([old_dir/'03.png',O/'key-C-1080.png']):close.paste(Image.open(p).convert('RGB'),(i*1080,30));draw.text((i*1080+24,10),'V2.0.3 B / 1080x1920'if i==0 else'V2.1 / 1080x1920',fill='#182F40')
close.save(O/'old-vs-new-C.jpg',quality=96)
# A locator sheet is metadata, separate from the unlabelled key art.
im=Image.open(O/'key-C-1080.png').convert('RGB');d=ImageDraw.Draw(im);camera=scene['key_art'][2]['camera']
for name,(x,y)in scene['anchors'].items():
 sx=540+(x-camera['center'][0])*camera['scale'];sy=960+(y-camera['center'][1])*camera['scale'];d.ellipse((sx-8,sy-8,sx+8,sy+8),fill='#E3B35F',outline='#182F40',width=2);tx=max(15,min(900,sx+12));d.rectangle((tx,sy-12,tx+160,sy+10),fill='#F6F3EC');d.text((tx+3,sy-7),name,fill='#182F40')
im.save(O/'anchor-map.jpg',quality=96)
# Layer contact sheet with checkerboard transparency, not final art.
layer_names=['original/scene-interior.png','derived/facade-layer.png','original/mass-gold.png','original/cradle-front.png','original/hydraulic-body.png','derived/suspension-layer.png','derived/rods-layer.png','derived/foreground-layer.png','derived/shadow-layer.png'];board=Image.new('RGB',(1050,3*410),'#F6F3EC');d=ImageDraw.Draw(board)
for i,name in enumerate(layer_names):
 x=(i%3)*350;y=(i//3)*410;tile=Image.new('RGBA',(330,370),'#DFE3DF');td=ImageDraw.Draw(tile)
 for xx in range(0,330,20):
  for yy in range(0,370,20):
   if (xx//20+yy//20)%2:td.rectangle((xx,yy,xx+19,yy+19),fill='#F3F1E9')
 asset=Image.open(P/'assets'/name).convert('RGBA');asset.thumbnail((320,360),Image.Resampling.LANCZOS);tile.alpha_composite(asset,((330-asset.width)//2,(370-asset.height)//2));board.paste(tile.convert('RGB'),(x+10,y+25));d.text((x+10,y+7),Path(name).name,fill='#182F40')
board.save(O/'layer-inventory.jpg',quality=95)
legacy=['adapters/remotion/v202-motion/MotionModel.ts','adapters/remotion/v202-motion/config.json','adapters/remotion/v203/ArtStudy.tsx']
for name in legacy:assert hashlib.sha256(subprocess.check_output(['git','show','407d44e:broll-pipeline/'+name],cwd=R)).hexdigest()==sha(R/name)
report={'stage':'art_review_only','strict_typescript':'pass','same_asset_set_for_all_three_keys':True,'native_scene':[1024,1536],'review_output':[1080,1920],'generated_subject_alpha_verified':True,'five_layer_mattes_have_transparency':True,'new_v21_mp4_generated':False,'old_v203_reference_video_only':True,'original_model_and_v203_unchanged':True,'keyart':keyart,'human_art_approved':False,'motion_rig_validated':False,'real_phone_test_completed':False,'art_style_risk':'more painterly/detail-rich than final recognizable-minimal brand may require','required_next':'human art approval and projected rig validation before any 3-second animation'}
(R/'docs/v21/technical-verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
for folder in ['docs/v21','projects/asset-first-v21','adapters/remotion/v21']:shutil.copytree(R/folder,O/folder,dirs_exist_ok=True)
(O/'tools').mkdir(exist_ok=True)
for n in ['render-v21-art.mjs','export-v21-layer-vectors.mjs','package-v21-art.py']:shutil.copy(R/'tools'/n,O/'tools'/n)
(O/'checksums.json').write_text(json.dumps({str(p.relative_to(O)):sha(p)for p in O.rglob('*')if p.is_file()and p.name!='checksums.json'and 'drafts'not in p.parts and '/projects/asset-first-v21/keyframes/'not in str(p)},indent=2))
with zipfile.ZipFile(str(O)+'.zip','w',zipfile.ZIP_DEFLATED)as z:
 for p in O.rglob('*'):
  if p.is_file()and 'drafts'not in p.parts and '/projects/asset-first-v21/keyframes/'not in str(p):z.write(p,p.relative_to(O))
print('Three artworks, original alpha assets, editable layers, anchors and V203 comparison packaged. No new video.')
