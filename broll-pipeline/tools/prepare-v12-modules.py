"""Use verified existing downloads only; photo matte is a render mask, not new food."""
import argparse,pathlib,json,hashlib,shutil,subprocess,base64
from PIL import Image
p=pathlib.Path(__file__).resolve().parents[1];a=argparse.ArgumentParser()
a.add_argument('--a1',default='/workspace/broll-v11/broll-pipeline/projects/bento-v11/media/pixabay-227128.mp4');a.add_argument('--b1',default='/workspace/broll-v112/broll-pipeline/.runtime/v112-assets/B1-large.mp4');a.add_argument('--c1',default='/workspace/broll-v112/broll-pipeline/.runtime/v112-assets/C1.mp4');args=a.parse_args()
out=p/'.runtime/v12-public/assets';out.mkdir(parents=True,exist_ok=True)
sources=json.loads((p/'projects/bento-v113-shots/sources.json').read_text())['sources'];by={s['option_id']:s for s in sources}
sha=lambda x:hashlib.sha256(pathlib.Path(x).read_bytes()).hexdigest()
for key,src in [('A1',args.a1),('B1',args.b1),('C1',args.c1)]:
 if sha(src)!=by[key]['download_sha256']:raise ValueError('Reviewed source hash differs: '+key)
 shutil.copyfile(src,out/f'{key}.mp4')
subprocess.run(['ffmpeg','-v','error','-y','-ss','9.5','-i',args.c1,'-frames:v','1','-vf','scale=960:-2','-q:v','2',str(out/'rice.jpg')],check=True)
config=json.loads((p/'projects/modules-v12/modules.json').read_text());study=config['modules'][2]['riceStudy'];b64=base64.b64encode((out/'rice.jpg').read_bytes()).decode()
# Both red and green must be bright, rejecting dark plate, pink flowers and leaves.
filters='''<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 5 0 0 0 -1.5" result="red"/><feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 5 0 0 -1.5" result="green"/><feComposite in="green" in2="red" operator="in" result="bright"/><feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 -4 4 0 0 1" result="neutral"/><feComposite in="bright" in2="neutral" operator="in"/><feComponentTransfer><feFuncA type="discrete" tableValues="0 1"/></feComponentTransfer><feMorphology operator="dilate" radius="3"/><feMorphology operator="erode" radius="4"/>'''
svg=f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 960 540"><defs><filter id="rice" color-interpolation-filters="sRGB">{filters}</filter><clipPath id="region"><path d="{study['maskRegionPath']}"/></clipPath></defs><image width="960" height="540" xlink:href="data:image/jpeg;base64,{b64}" filter="url(#rice)" clip-path="url(#region)"/></svg>'''
(out/'rice-matte.svg').write_text(svg)
for source in sources:
 source['historical_review_interval_seconds']=source.pop('source_interval_seconds')
 source['historical_formal_use_status']=source.pop('use_status')
 source['use_status']='authorized_for_v12_module_test_only'
sequence_records=[]
for spec in config['modules']:
 count=24 if spec['id']=='M3' else spec['frames']
 seq=p/'.runtime/v12-public'/spec['frameSequence'];seq.mkdir(parents=True,exist_ok=True)
 src=out/({'M1':'A1','M2':'B1','M3':'C1'}[spec['id']]+'.mp4')
 vf='fps=30,scale=1080:1920' if spec['id']=='M1' else 'fps=30'
 subprocess.run(['ffmpeg','-v','error','-y','-ss',str(spec['startFrom']/30),'-i',str(src),'-frames:v',str(count),'-vf',vf,'-start_number','0',str(seq/'%03d.png')],check=True)
 files=sorted(seq.glob('*.png'));assert len(files)==count
 sequence_records.append({'module':spec['id'],'frames':count,'fps':30,'source_start_seconds':spec['startFrom']/30,'method':'continuous decoded video frames; native25fps A1 duplicated to30; no motion interpolation','unique_decoded_frames':len(set(sha(f) for f in files)),'frame_dimensions':list(Image.open(files[0]).size),'aggregate_sha256':hashlib.sha256(''.join(sha(f) for f in files).encode()).hexdigest()})
manifest={'version':'1.2','scope':'module_test_only','formal_asset_approvals_changed':False,'sources':sources,'derived_rice':{'source':'C1','time_seconds':9.5,'photo_sha256':sha(out/'rice.jpg'),'matte_sha256':sha(out/'rice-matte.svg'),'method':'source RGB threshold and spatial mask; repeated same-scale photographic layers; no generated food','measurement':False},'new_downloads':0,'new_api_requests':0,'continuous_video_sequences':sequence_records}
(p/'projects/modules-v12/sources.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print('Verified 3 source hashes; prepared private video and rice matte assets')
