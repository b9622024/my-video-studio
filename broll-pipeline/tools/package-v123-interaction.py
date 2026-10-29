"""Private, current-revision-only action review package; never auto-approves art."""
import pathlib,json,hashlib,subprocess,shutil,zipfile,os
from PIL import Image,ImageChops,ImageDraw,ImageFont
P=pathlib.Path(__file__).resolve().parents[1];OUT=pathlib.Path('/workspace/outputs/broll-v123-interaction');project=P/'projects/interaction-v123';docs=P/'docs/v123';public=P/'.runtime/v123-public'
sha=lambda f:hashlib.sha256(pathlib.Path(f).read_bytes()).hexdigest();revision=json.loads((project/'render-revision.json').read_text());review=json.loads((project/'intermediate-review.json').read_text())
source_hash=hashlib.sha256(b''.join((P/'adapters/remotion/v123'/n).read_bytes() for n in ['TransferMath.ts','PayloadTransferStudy.tsx'])).hexdigest()
assert revision['last_operation']=='render' and revision['config_sha256']==sha(project/'config.json') and revision['source_sha256']==source_hash
assert review['pass'] and review['config_sha256']==revision['config_sha256'] and review['source_sha256']==source_hash and review['assets_sha256']==sha(project/'assets.json')
for f in review['reviewed_frames']:assert sha(OUT/f['file'])==f['sha256']
assets=json.loads((project/'assets.json').read_text())
for a in [*assets['originals'],*assets['derived'],assets['new_generated_payload']]:assert sha(public/a['file'])==a['sha256']
video=OUT/'interaction-540.mp4';probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(video)],text=True));v=next(s for s in probe['streams'] if s['codec_type']=='video')
assert (v['width'],v['height'],v['r_frame_rate'],int(v['nb_frames']))==(540,960,'30/1',90);assert v['codec_name']=='h264' and v['pix_fmt']=='yuv420p' and v['color_space']=='bt709';assert abs(float(probe['format']['duration'])-3)<.001;assert not any(s['codec_type']=='audio' for s in probe['streams'])
subprocess.run(['ffmpeg','-v','error','-i',str(video),'-f','null','-'],check=True)
assert sha(OUT/'frame-82.png')==sha(OUT/'frame-89.png'),'Unstable result hold'
# Only the deposited food region may differ between start and the final carrier-free result.
a=Image.open(OUT/'frame-0.png').convert('RGB');b=Image.open(OUT/'frame-89.png').convert('RGB');areas=[(0,0,160,960),(420,0,540,960),(160,0,420,470),(160,720,420,960)]
for box in areas:assert ImageChops.difference(a.crop(box),b.crop(box)).getbbox() is None
contact=json.loads((project/'contact-diagnostics.json').read_text());checks={x['frame']:x for x in contact['checks']};assert checks[18]['payload_projection_over_carrier_fraction']>.95;assert checks[36]['carrier_receiver_overlap_pixels']>0 and checks[36]['payload_receiver_overlap_pixels']>0;assert 0<checks[48]['payload_projection_over_carrier_fraction']<1;assert checks[60]['payload_carrier_overlap_pixels']==0 and checks[60]['payload_receiver_overlap_pixels']>0;assert checks[89]['added_receiver_silhouette_pixels']>0
# Every prior official research output/art input remains unchanged.
old_art=json.loads((P/'projects/m3-v121-art/art-review.json').read_text())
for f in old_art['artifacts']:assert sha(pathlib.Path(old_art['artifact_root'])/f['file'])==f['sha256']
for doc,folder in [('docs/v12/verification.json','/workspace/outputs/broll-v12-modules'),('docs/v122/verification.json','/workspace/outputs/broll-v122-comparison')]:
 for item in json.loads((P/doc).read_text())['media']:assert sha(pathlib.Path(folder)/item['file'])==item['sha256']
encoded=OUT/'encoded';encoded.mkdir(exist_ok=True)
for frame in [0,18,27,36,40,44,48,52,56,60,70,89]:
 subprocess.run(['ffmpeg','-v','error','-y','-i',str(video),'-vf',f'select=eq(n\\,{frame})','-frames:v','1','-vsync','0',str(encoded/f'frame-{frame}.png')],check=True)
font=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc',22)
board=Image.new('RGB',(1080,1360),'#f3efe5');d=ImageDraw.Draw(board)
for i,(frame,label) in enumerate([(18,'載飯進場'),(27,'接觸前緣'),(36,'載荷接觸'),(48,'滑卸中'),(60,'空匙撤離'),(89,'米飯留下')]):
 x=i%3*360;y=i//3*680+38;board.paste(Image.open(encoded/f'frame-{frame}.png').convert('RGB').resize((360,640)),(x,y));d.text((x+10,y-31),f'{label} f{frame}',font=font,fill='#1c3442')
board.save(OUT/'action-keyframes.jpg',quality=95)
board=Image.new('RGB',(1240,1020),'#f3efe5');d=ImageDraw.Draw(board)
for i,frame in enumerate([27,36,48,60]):
 im=Image.open(encoded/f'frame-{frame}.png').convert('RGB').crop((170,470,480,700)).resize((620,460));x=i%2*620;y=i//2*510+38;board.paste(im,(x,y));d.text((x+12,y-31),f'接觸／卸飯 f{frame} / {frame/30:.2f}s',font=font,fill='#1c3442')
board.save(OUT/'contact-detail.jpg',quality=96)
board=Image.new('RGB',(1080,1020),'#f3efe5');d=ImageDraw.Draw(board)
for x,frame,label in [(0,0,'開始：原飯堆'),(540,89,'結果：原飯堆＋單一載荷')]:
 board.paste(Image.open(encoded/f'frame-{frame}.png').convert('RGB'),(x,45));d.text((x+15,8),label,font=font,fill='#1c3442')
board.save(OUT/'start-result.jpg',quality=95)
if (OUT/'attempt-1/frame-89.png').exists():
 board=Image.new('RGB',(1080,1020),'#f3efe5');d=ImageDraw.Draw(board)
 for x,file,label in [(0,OUT/'attempt-1/frame-89.png','否決：米粒過細'),(540,OUT/'frame-89.png','候選：較少粒數＋固定尺度註冊')]:
  board.paste(Image.open(file).convert('RGB'),(x,45));d.text((x+10,8),label,font=font,fill='#1c3442')
 board.save(OUT/'rejected-vs-candidate.jpg',quality=95)
report={'version':'1.2.3','scope':'private_interaction_research_only','media':{'file':video.name,'sha256':sha(video),'bytes':video.stat().st_size,'dimensions':[540,960],'fps':30,'frames':90,'duration_seconds':3,'codec':'h264','pixel_format':'yuv420p','color_space':'bt709','audio':False,'full_decode_errors':0},'source_revision':revision,'matched_intermediate_review':True,'same_carrier_source_all_frames':True,'one_conserved_payload':True,'food_opacity_animation':False,'food_scale_animation':False,'whole_rice_A_B_replacement':False,'final_hold_frames_82_89_identical':True,'fixed_meal_regions_unchanged_between_start_and_result':True,'2d_contact_diagnostics':contact,'typecheck':'PASS strict with runtime vector/timing boundary validation','continuity_unit_tests':'PASS attached load, handoff continuity, stable rest, finite paths and malformed JSON rejection','new_generated_payloads':2,'rejected_material_version':'v1','active_material_version':'v2 at a constant 67px opaque-bounds width','intermediate_inspection':'actual f18/27/36/48/60/89 samples reviewed before rendering','encoded_samples':'encoded/ contains actual MP4 action samples for additional visual inspection','old_V121_art_unchanged':True,'old_V12_M1_M2_media_unchanged':True,'old_V122_AB_media_unchanged':True,'motion_model':'cohesive sticky-rice unit sliding off a single carrier against receiver stop; not granular/soft-body simulation','remaining_risks':['grain-level material/lighting join needs human review','screen-space shadows and layer occlusion are not calibrated 3D force/collision physics','no spoon pitch or grain redistribution assets are provided'],'human_art_acceptance':False,'public_use_approved':False,'formal_12s_created':False,'new_external_paid_service_added':False,'voice_or_existing_engines_modified':False}
(docs/'verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
for f in [*project.glob('*.json'),docs/'INTERACTION-REVIEW.md',docs/'GENERATION.md',docs/'verification.json']:shutil.copyfile(f,OUT/f.name)
# Native source/derived layers remain separate. Historical source food is never rewritten.
for group in ['original','derived','generated']:
 dest=OUT/'assets'/group;dest.mkdir(parents=True,exist_ok=True)
 for f in (public/'assets'/group).glob('*.png'):shutil.copyfile(f,dest/f.name)
files=[video,*encoded.glob('*.png'),*(OUT/f'frame-{f}.png' for f in [0,18,27,36,48,60,70,82,89]),*list((OUT/'assets').rglob('*.png')),*list(OUT.glob('*.jpg')),*list(OUT.glob('*.json')),*list(OUT.glob('*.md'))]
# Include representative failed material evidence, not a failed animation.
for name in ['frame-36.png','frame-89.png','config.json','assets.json']:
 f=OUT/'attempt-1'/name
 if f.exists():files.append(f)
files=sorted(set(f for f in files if f.name!='checksums.json'));key=os.environ.get('PIXABAY_API_KEY')
for f in files:
 if key and key.encode() in f.read_bytes():raise ValueError('Secret detected; package blocked')
checksums={str(f.relative_to(OUT)):sha(f) for f in files};(OUT/'checksums.json').write_text(json.dumps(checksums,indent=2)+'\n')
with zipfile.ZipFile(str(OUT)+'.zip','w',zipfile.ZIP_DEFLATED) as z:
 for f in [*files,OUT/'checksums.json']:z.write(f,arcname=str(f.relative_to(OUT)))
print(json.dumps({'current_revision_preview':True,'seconds':3,'frames':90,'receiver_contact_and_empty_departure':'checked','legacy_art_media':'UNCHANGED','archive_bytes':pathlib.Path(str(OUT)+'.zip').stat().st_size,'human_art_acceptance':False}))
