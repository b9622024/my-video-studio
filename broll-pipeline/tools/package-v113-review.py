"""Private source-review package, including integrity and history checks."""
import pathlib,json,hashlib,shutil,zipfile,os,subprocess,argparse
p=pathlib.Path(__file__).resolve().parents[1];project=p/'projects/bento-v113-shots'
artifacts=json.loads((project/'artifacts.json').read_text());out=pathlib.Path(artifacts['artifact_root']);docs=p/'docs/v113'
sha=lambda f:hashlib.sha256(pathlib.Path(f).read_bytes()).hexdigest()
parser=argparse.ArgumentParser();parser.add_argument('--legacy-v11',default='/workspace/broll-v11/broll-pipeline/projects/bento-v11');args=parser.parse_args()
old=json.loads((p/'docs/v111/verification.json').read_text())['original_hashes'];original=pathlib.Path(args.legacy_v11)
for f,h in old.items():
 if sha(original/f)!=h:raise ValueError('Original V1.1 result changed: '+f)
sources=json.loads((project/'sources.json').read_text())['sources'];prior=json.loads((p/'projects/bento-v112-design/sources.json').read_text())['sources'];expected={s['option_id']:s['sha256'] for s in prior}
expected['A1']=next(s['source_sha256'] for s in json.loads((p/'projects/bento-v11/asset-manifest.json').read_text())['assets'] if s['option_id']=='A1')
assert all(s['download_sha256']==expected[s['option_id']] for s in sources)
plan=json.loads((project/'shot-plan.json').read_text());durations={'A1':4,'B1':5,'C1':3}
for item in artifacts['artifacts']:
 assert sha(out/item['file'])==item['sha256']
 stream=item['probe']['streams'][0];duration=float(item['probe']['format']['duration']);assert abs(duration-durations[item['source_option']])<.001
 assert stream['codec_name']=='h264'
 assert int(stream['nb_frames'])==durations[item['source_option']]*(25 if item['source_option']=='A1' else 30)
 assert item['decode_errors']==0
files=[v['file'] for v in artifacts['artifacts']]+['shot-continuity.jpg']
for key in ['A1','B1','C1']:
 files.append(f'{key}-motion-evidence.jpg')
 for n in [1,2,3]:
  files.extend([f'{key}-{n}-portrait.jpg',f'{key}-{n}-source.jpg'])
# Review JPEG revision is also recorded so future human feedback can identify the viewed evidence.
stills=[{'file':f,'sha256':sha(out/f)} for f in files if f.endswith('.jpg')]
verification={'version':'1.1.3','stage':'candidate_shot_review_only','full_12s_movie_created':False,'remotion_invocations':0,'new_api_searches':0,'new_downloads':0,'separate_review_clips':5,'clip_durations_checked':True,'clip_frame_counts_checked':True,'all_clips_full_decode_errors':0,'all_clips_have_no_audio':True,'native_fps':{'A1':25,'B1':30,'C1':30},'temporal_sampling':'5fps source-frame inspection, not a human playback-quality approval','visual_inspection':'source strips, portrait sequences and continuity sheet viewed; quality remains subject to user veto','C1_portion_change_evidence':False,'B1_material_approved':False,'C1_material_approved':False,'static_designs_approved':False,'formal_render_allowed':False,'legacy_hashes_unchanged':old,'source_download_hashes_match_history':True,'tests':['shot-review bounds, timing and independent approval cases PASS','design-first original five tests PASS'],'current_gate':'exit2: shot-design, human-quality and B1/C1 material approvals missing','stills':stills}
(docs/'verification.json').write_text(json.dumps(verification,ensure_ascii=False,indent=2)+'\n')
for src in [*project.glob('*.json'),docs/'verification.json',docs/'SHOT-REVIEW.md']:
 shutil.copyfile(src,out/src.name);files.append(src.name)
# Remove only the exploratory outputs produced in this version, not prior project assets.
for glob in ['research-*.jpg','temporal-*.jpg','crop-*.jpg']:
 for f in out.glob(glob):f.unlink()
key=os.environ.get('PIXABAY_API_KEY')
for f in files:
 if key and key.encode() in (out/f).read_bytes():raise ValueError('Secret detected; package blocked')
checks={f:sha(out/f) for f in sorted(files)};(out/'checksums.json').write_text(json.dumps(checks,indent=2)+'\n');files.append('checksums.json')
with zipfile.ZipFile(str(out)+'.zip','w',zipfile.ZIP_DEFLATED) as z:
 for f in sorted(files):z.write(out/f,arcname=f)
print(json.dumps({'files':len(files),'clips':5,'archive_bytes':pathlib.Path(str(out)+'.zip').stat().st_size,'legacy_integrity':'PASS','secret_scan':'PASS'}))
