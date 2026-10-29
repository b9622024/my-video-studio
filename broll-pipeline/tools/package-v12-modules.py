"""Verify actual renders and package private module previews, never formal footage."""
import pathlib,json,hashlib,subprocess,shutil,zipfile,os,argparse
from PIL import Image,ImageDraw,ImageFont
p=pathlib.Path(__file__).resolve().parents[1];out=pathlib.Path('/workspace/outputs/broll-v12-modules');proj=p/'projects/modules-v12';docs=p/'docs/v12'
a=argparse.ArgumentParser();a.add_argument('--legacy-v11',default='/workspace/broll-v11/broll-pipeline/projects/bento-v11');args=a.parse_args()
sha=lambda f:hashlib.sha256(pathlib.Path(f).read_bytes()).hexdigest()
config=json.loads((proj/'modules.json').read_text());clips=[]
for spec in config['modules']:
 for suffix in ['', '-clean-review']:
  f=out/f"{spec['id']}{suffix}-540.mp4"
  probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(f)],text=True));v=next(s for s in probe['streams'] if s['codec_type']=='video')
  assert (v['width'],v['height'],v['r_frame_rate'],int(v['nb_frames']))==(540,960,'30/1',spec['frames'])
  assert v['codec_name']=='h264' and v['pix_fmt'] in ['yuv420p','yuvj420p'];assert not any(s['codec_type']=='audio' for s in probe['streams'])
  assert abs(float(probe['format']['duration'])-spec['frames']/30)<.001
  subprocess.run(['ffmpeg','-v','error','-i',str(f),'-f','null','-'],check=True)
  clips.append({'file':f.name,'sha256':sha(f),'bytes':f.stat().st_size,'frames':spec['frames'],'duration':spec['frames']/30,'dimensions':[540,960],'fps':30,'codec':'h264','pixel_format':v['pix_fmt'],'color_range':v.get('color_range'),'color_space':v.get('color_space'),'audio':False,'decode_errors':0})
old=json.loads((p/'docs/v111/verification.json').read_text())['original_hashes']
for f,h in old.items():assert sha(pathlib.Path(args.legacy_v11)/f)==h
for spec in config['modules']:assert Image.open(out/f"{spec['id']}-1080-key.jpg").size==(1080,1920)
font=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc',21)
for key,frames in [('M1',[0,30,65]),('M2',[0,30,65]),('M3',[0,40,55,68,85])]:
 cols=3;rows=(len(frames)+2)//3;board=Image.new('RGB',(900,540*rows),'#f3efe4');d=ImageDraw.Draw(board)
 for i,f in enumerate(frames):
  x=i%cols*300+15;y=i//cols*540+42;board.paste(Image.open(out/f'{key}-{f}.jpg').resize((270,480)),(x,y));d.text((x,y-32),f'{key}  {f/30:.2f}s / f{f}',font=font,fill='#182f40')
 board.save(out/f'{key}-keyframes.jpg',quality=95)
board=Image.new('RGB',(900,540),'#f3efe4');d=ImageDraw.Draw(board)
for i,(key,f) in enumerate([('M1',65),('M2',65),('M3',85)]):
 x=i*300+15;board.paste(Image.open(out/f'{key}-{f}.jpg').resize((270,480)),(x,42));d.text((x,10),key,font=font,fill='#182f40')
board.save(out/'overview.jpg',quality=95)
report={'version':'1.2','stage':'isolated_module_tests_pending_user_visual_review','media':clips,'formal_1080_mp4_created':False,'full_12s_movie_created':False,'hd_keyframes_dimensions_checked':[1080,1920],'frame_determinism':'PASS repeated nonsequential clean still requests in render script','typecheck':'PASS existing V2.5 runtime TypeScript strict','react_review':'hooks unconditional; no effect/timer/random; data props; stable layer keys; source image alt; no legacy adapter changes','old_hashes_unchanged':old,'formal_asset_approval_changed':False,'M1_full_plate_edges_visible':False,'M1_limitation':'A1 is a close meal shot; complete plate view requires wider footage','M2_quality':'natural motion blur remains; human acceptance pending','M3_method':'explicit conceptual photographic layering on one stationary tray; not measured or filmed portion change','human_publication_quality_approved':False,'continuous_source_frame_sequences':json.loads((proj/'sources.json').read_text())['continuous_video_sequences'],'local_decoder_fallback':'original OffthreadVideo bridge failed Request closed with free disk; standard continuous PNG source frames used in same Composition','new_paid_services':0,'new_api_searches':0,'new_downloads':0}
(docs/'verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
for f in [*proj.glob('*.json'),docs/'MODULES.md',docs/'verification.json']:shutil.copyfile(f,out/f.name)
# Include only legal derived review imagery, not raw full-length source videos.
assets=out/'assets';assets.mkdir(exist_ok=True)
for name in ['rice.jpg','rice-matte.svg']:shutil.copyfile(p/'.runtime/v12-public/assets'/name,assets/name)
files=sorted(f for f in out.rglob('*') if f.is_file() and f.name!='checksums.json')
secret=os.environ.get('PIXABAY_API_KEY')
for f in files:
 if secret and secret.encode() in f.read_bytes():raise ValueError('Secret detected; no archive written')
checks={str(f.relative_to(out)):sha(f) for f in files};(out/'checksums.json').write_text(json.dumps(checks,indent=2)+'\n')
with zipfile.ZipFile(str(out)+'.zip','w',zipfile.ZIP_DEFLATED) as z:
 for f in [*files,out/'checksums.json']:z.write(f,arcname=str(f.relative_to(out)))
print(json.dumps({'clips':6,'main_previews':3,'archive_bytes':pathlib.Path(str(out)+'.zip').stat().st_size,'legacy_integrity':'PASS','decode':'PASS'}))
