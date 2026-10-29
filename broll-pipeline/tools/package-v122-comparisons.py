"""Actual-media verification and private review packaging; no aesthetic auto-approval."""
import pathlib,json,hashlib,subprocess,shutil,zipfile,os
from PIL import Image,ImageChops,ImageDraw,ImageFont
P=pathlib.Path(__file__).resolve().parents[1];OUT=pathlib.Path('/workspace/outputs/broll-v122-comparison');project=P/'projects/comparison-v122';docs=P/'docs/v122'
sha=lambda f:hashlib.sha256(pathlib.Path(f).read_bytes()).hexdigest();spec=json.loads((project/'config.json').read_text())
main={'A':[0,39,40,60,79,80,119],'B':[0,18,28,39,54,60,65,75,88,103,119]};clean={'A':[0,20,39,40,60,79,80,100,119],'B':[0,10,18,39,45,54,75,80,88,103,110,119]}
allowed=set()
for variant in 'AB':
 allowed.update(f'{variant}-{f}.png' for f in main[variant]);allowed.update(f'{variant}-clean-{f}.png' for f in clean[variant]);allowed.add(variant+'-before-art.png')
# Archive only exploratory outputs from this new version, not historical assets.
archive=P/'.runtime/v122-iteration-archive';archive.mkdir(parents=True,exist_ok=True)
for f in OUT.glob('*.png'):
 if f.name not in allowed:shutil.move(str(f),str(archive/f.name))
media=[]
for variant in 'AB':
 f=OUT/f'{variant}-540.mp4';probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(f)],text=True));v=next(s for s in probe['streams'] if s['codec_type']=='video')
 assert (v['width'],v['height'],v['r_frame_rate'],int(v['nb_frames']))==(540,960,'30/1',120)
 assert v['codec_name']=='h264' and v['pix_fmt']=='yuv420p' and v['color_space']=='bt709';assert abs(float(probe['format']['duration'])-4)<.001;assert not any(s['codec_type']=='audio' for s in probe['streams'])
 subprocess.run(['ffmpeg','-v','error','-i',str(f),'-f','null','-'],check=True)
 media.append({'file':f.name,'sha256':sha(f),'bytes':f.stat().st_size,'dimensions':[540,960],'fps':30,'frames':120,'duration_seconds':4,'codec':'h264','pixel_format':v['pix_fmt'],'color_space':v['color_space'],'audio':False,'full_decode_errors':0})
# Frozen PNGs within every hold window must match exactly, not just approximately.
holds={'A':[[0,20,39],[40,60,79],[80,100,119]],'B':[[0,10,18],[39,45,54],[75,80,88],[103,110,119]]}
for variant,groups in holds.items():
 for frames in groups:
  assert len({sha(OUT/f'{variant}-clean-{f}.png') for f in frames})==1,('Unexpected hold-frame change',variant,frames)
# State cuts may change rice only. Labels disabled; plate, veggies, chicken stay identical.
areas=[(0,0,150,960),(410,0,540,960),(150,0,410,470),(150,710,410,960)]
base=Image.open(OUT/'A-clean-0.png').convert('RGB')
for f in [40,80]:
 im=Image.open(OUT/f'A-clean-{f}.png').convert('RGB')
 for box in areas:assert ImageChops.difference(base.crop(box),im.crop(box)).getbbox() is None,('Fixed region moved',f,box)
# Actual encoded video frames, including immediately before/after both match cuts.
encoded=OUT/'encoded';encoded.mkdir(exist_ok=True)
for variant,frames in {'A':[0,39,40,79,80,119],'B':[0,28,39,65,75,103,119]}.items():
 for frame in frames:
  target=encoded/f'{variant}-{frame}.png';subprocess.run(['ffmpeg','-v','error','-y','-i',str(OUT/f'{variant}-540.mp4'),'-vf',f'select=eq(n\\,{frame})','-frames:v','1','-vsync','0',str(target)],check=True)
# All prior V1.2.1 art and V1.2 media remain byte-identical.
old_art=json.loads((P/'projects/m3-v121-art/art-review.json').read_text());old_root=pathlib.Path(old_art['artifact_root'])
for item in old_art['artifacts']:assert sha(old_root/item['file'])==item['sha256']
old_media=json.loads((P/'docs/v12/verification.json').read_text())['media']
for item in old_media:assert sha(pathlib.Path('/workspace/outputs/broll-v12-modules')/item['file'])==item['sha256']
assets=json.loads((project/'assets.json').read_text())
for item in assets['originals']:assert sha(P/'.runtime/v122-public'/item['file'])==item['sha256']
for item in assets['derived']:assert sha(P/'.runtime/v122-public/assets/clean'/item['asset'])==item['derived_sha256']
font=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc',24)
for variant,frames in [('A',[0,40,80,119]),('B',[0,39,75,119])]:
 board=Image.new('RGB',(1080,2040),'#f3efe5');d=ImageDraw.Draw(board)
 for i,f in enumerate(frames):
  x=i%2*540;y=i//2*1020+50;board.paste(Image.open(OUT/f'{variant}-{f}.png').convert('RGB'),(x,y));d.text((x+20,y-39),f'{variant} / f{f} / {f/30:.3f}s',font=font,fill='#1c3442')
 board.save(OUT/f'{variant}-keyframes.jpg',quality=94)
board=Image.new('RGB',(1080,1020),'#f3efe5');d=ImageDraw.Draw(board)
for x,name,label in [(0,'A-before-art.png','原始alpha／無補強投影'),(540,'A-60.png','低alpha整理／接觸與落桌投影')]:
 board.paste(Image.open(OUT/name).convert('RGB'),(x,50));d.text((x+20,10),label,font=font,fill='#1c3442')
board.save(OUT/'art-difference.jpg',quality=95)
board=Image.new('RGB',(1040,1040),'#f3efe5');d=ImageDraw.Draw(board)
for i,f in enumerate([39,40,79,80]):
 im=Image.open(encoded/f'A-{f}.png').convert('RGB').crop((150,470,410,710)).resize((520,480));x=i%2*520;y=i//2*520+36;board.paste(im,(x,y));d.text((x+12,y-30),f'Encoded A / f{f}',font=font,fill='#1c3442')
board.save(OUT/'A-cut-detail.jpg',quality=96)
report={'version':'1.2.2','scope':'private_comparison_research_only','media':media,'source_originals_verified':assets['originals'],'derived_alpha_checks':assets['derived'],'render_hold_frames_exactly_identical':holds,'A_fixed_regions_unchanged_outside_rice_roi':[150,470,410,710],'A_transition_frames':[40,80],'A_blend_frames':0,'A_equal_state_exposure_frames':[40,40,40],'B_fixed_object_size':540,'B_camera_model':'one orthographic 2.5D world transform, no individual object animation','B_focus_screen_plate_size':540*.84,'B_overview_screen_plate_size':540*.43,'B_partial_plate_labels_hidden':True,'nonsequential_frame_determinism':'PASS both variants','typecheck':'PASS strict existing runtime','react_review':'frame hooks unconditional; no random/timer/effect; stable state-id keys; data-driven assets and positions; no legacy components changed','actual_encoded_frames_inspected':'A f39/40/79/80 and B f28/65 sampled visually; no obvious double contours in cut samples; playback comfort still needs human review','B_concept_footer_safe_zone':True,'legacy_V121_art_hashes_unchanged':True,'legacy_V12_media_hashes_unchanged':True,'no_new_art_generation':True,'spoon_or_physical_serving_animation':False,'full_12s_created':False,'paid_service_or_gpu_added':False,'visual_self_review':{'A':'comparison readable, fixed meal and explicit state cuts; private candidate, not public approval','B':'shared-table relation visible, but 4-second camera pacing and final detail size remain human-review risks; not recommended as a publication master'},'human_art_quality_pass':False,'public_use_approved':False,'remaining_risks':['native baked rice lighting cannot be fully reconstructed by alpha cleanup','2.5D drop shadows are not calibrated physical lighting','B movement resampling/grain shimmer and playback comfort need human inspection','A match cuts are intentional discontinuous comparisons, never evidence of actual serving']}
(docs/'verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
for f in [*project.glob('*.json'),*project.glob('*.csv'),docs/'COMPARISON-REVIEW.md',docs/'verification.json']:shutil.copyfile(f,OUT/f.name)
for group in ['original','clean']:
 target=OUT/'assets'/group;target.mkdir(parents=True,exist_ok=True)
 for f in (P/'.runtime/v122-public/assets'/group).glob('*.png'):shutil.copyfile(f,target/f.name)
# Curated review evidence only, excluding exploratory obsolete frames.
files=[OUT/name for name in sorted(allowed)]+[OUT/f'{v}-540.mp4' for v in 'AB']+list(encoded.glob('*.png'))+list((OUT/'assets').rglob('*.png'))+[OUT/name for name in ['A-keyframes.jpg','B-keyframes.jpg','art-difference.jpg','A-cut-detail.jpg']]+[OUT/f.name for f in [*project.glob('*.json'),*project.glob('*.csv'),docs/'COMPARISON-REVIEW.md',docs/'verification.json']]
native_review={f'{v}-{f}.png' for v,frames in [('A',[0,40,60,80,119]),('B',[0,39,75,119])] for f in frames}|{'A-before-art.png'}
encoded_review={f'{v}-{f}.png' for v,frames in [('A',[39,40,79,80]),('B',[0,28,39,65,75,119])] for f in frames}
files=[f for f in files if f.suffix!='.png' or 'assets' in f.parts or (f.parent==OUT and f.name in native_review) or (f.parent==encoded and f.name in encoded_review)]
files=sorted(set(files));key=os.environ.get('PIXABAY_API_KEY')
for f in files:
 if key and key.encode() in f.read_bytes():raise ValueError('Secret detected; package blocked')
checks={str(f.relative_to(OUT)):sha(f) for f in files};(OUT/'checksums.json').write_text(json.dumps(checks,indent=2)+'\n')
with zipfile.ZipFile(str(OUT)+'.zip','w',zipfile.ZIP_DEFLATED) as z:
 for f in [*files,OUT/'checksums.json']:z.write(f,arcname=str(f.relative_to(OUT)))
print(json.dumps({'previews':2,'duration_each':4,'hold_frames':'IDENTICAL','fixed_regions':'UNCHANGED','legacy_art_media':'UNCHANGED','archive_bytes':pathlib.Path(str(OUT)+'.zip').stat().st_size,'public_use_approved':False}))
