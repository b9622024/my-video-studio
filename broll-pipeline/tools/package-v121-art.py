"""Verify unchanged art context and history; private STATIC-ONLY review package."""
import pathlib,json,hashlib,shutil,zipfile,os
from PIL import Image,ImageChops
from jsonschema import Draft202012Validator
P=pathlib.Path(__file__).resolve().parents[1];OUT=pathlib.Path('/workspace/outputs/broll-v121-art-review');project=P/'projects/m3-v121-art';docs=P/'docs/v121'
sha=lambda f:hashlib.sha256(pathlib.Path(f).read_bytes()).hexdigest()
schema=json.loads((project/'contract.schema.json').read_text());Draft202012Validator.check_schema(schema);Draft202012Validator(schema).validate(json.loads((project/'object-module-draft.json').read_text()))
# Image analysis only: no repainting, masking, sharpening or food synthesis.
images={s:Image.open(OUT/f'State-{s}-art-only.png').convert('RGB') for s in 'ABC'}
for im in images.values():assert im.size==(1080,1920)
fixed_roi=(40,450,1040,1000);fixed=images['A'].crop(fixed_roi)
for s in 'BC':assert ImageChops.difference(fixed,images[s].crop(fixed_roi)).getbbox() is None
changes={s:ImageChops.difference(images['A'],images[s]).getbbox() for s in 'BC'}
# RGB plates can differ ONLY below the fixed food region; text already disabled.
assert all(box and box[1]>=1000 for box in changes.values())
asset_checks=[]
for f in sorted((OUT/'assets').glob('*.png')):
 im=Image.open(f);assert im.mode=='RGBA' and im.getchannel('A').getextrema()==(0,255)
 asset_checks.append({'file':str(f.relative_to(OUT)),'sha256':sha(f),'dimensions':list(im.size),'alpha':True})
assert len({sha(OUT/f'assets/rice-{s}.png') for s in 'ABC'})==3
old=json.loads((P/'docs/v12/verification.json').read_text())['media']
for media in old:assert sha(pathlib.Path('/workspace/outputs/broll-v12-modules')/media['file'])==media['sha256']
report={'version':'1.2.1','stage':'static_original_art_pending_human_review','state_dimensions':[1080,1920],'static_frames':3,'art_only_frames':3,'fixed_food_roi':list(fixed_roi),'fixed_plate_vegetables_protein_pixels_identical':True,'rice_change_bounds_vs_A':changes,'original_art_assets':asset_checks,'single_native_scale_for_all_rice_states':.52,'old_C1_photo_used':False,'old_M3_mask_or_lighten_used':False,'static_visual_review':'Three actual boards viewed: complete plate, identifiable rice and fixed foods, no obvious food interpenetration or old repeated-stamp seams; final art acceptance is human','human_art_approved':False,'motion_assets_ready':False,'animation_created':False,'new_remotion_render_invocations':0,'new_video_files':0,'old_v12_media_hashes_unchanged':[{k:m[k] for k in ['file','sha256']} for m in old],'contract_schema_validation':'PASS','model_version_and_seed':'not exposed by image tool','shadow_readiness':'baked static contact shadows present; independent moving shadow/occlusion not ready','risks':['grain scale and perspective require human confirmation','alpha edge and soft shadow review at full resolution','generated utensil shapes not registered','rice states are not topology-continuous motion assets']}
(docs/'verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
for f in [project/'art-layout.json',project/'generation.json',project/'object-module-draft.json',project/'contract.schema.json',docs/'ART-REVIEW.md',docs/'GENERATION-PROMPTS.md',docs/'layout-checks.json',docs/'verification.json']:shutil.copyfile(f,OUT/f.name)
revision_files=[OUT/f'State-{s}.png' for s in 'ABC']+[OUT/f'State-{s}-art-only.png' for s in 'ABC']+sorted((OUT/'assets').glob('*.png'))+[OUT/'art-layout.json',OUT/'generation.json',OUT/'object-module-draft.json']
artifacts=[{'file':str(f.relative_to(OUT)),'sha256':sha(f)} for f in revision_files]
review_id=hashlib.sha256('\n'.join(sorted(a['file']+':'+a['sha256'] for a in artifacts)).encode()).hexdigest()
review={'version':'1.2.1','review_id':review_id,'artifact_root':str(OUT),'state_ids':['A','B','C'],'artifacts':artifacts,'human_art_approved':False,'motion_assets_ready':False,'animation_allowed':False,'missing_motion_assets':json.loads((project/'generation.json').read_text())['missing_for_motion']}
(project/'art-review.json').write_text(json.dumps(review,ensure_ascii=False,indent=2)+'\n');shutil.copyfile(project/'art-review.json',OUT/'art-review.json')
files=sorted(f for f in OUT.rglob('*') if f.is_file() and f.name!='checksums.json');assert not any(f.suffix.lower() in ['.mp4','.mov','.webm'] for f in files)
key=os.environ.get('PIXABAY_API_KEY')
for f in files:
 if key and key.encode() in f.read_bytes():raise ValueError('Secret detected; no package written')
checks={str(f.relative_to(OUT)):sha(f) for f in files};(OUT/'checksums.json').write_text(json.dumps(checks,indent=2)+'\n')
with zipfile.ZipFile(str(OUT)+'.zip','w',zipfile.ZIP_DEFLATED) as z:
 for f in [*files,OUT/'checksums.json']:z.write(f,arcname=str(f.relative_to(OUT)))
print(json.dumps({'states':3,'RGBA_assets':len(asset_checks),'fixed_food_pixels':'IDENTICAL','legacy_media':'UNCHANGED','archive_bytes':pathlib.Path(str(OUT)+'.zip').stat().st_size,'animation_allowed':False}))
