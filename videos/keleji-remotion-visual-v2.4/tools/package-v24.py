"""Back up reviewed source + licensed production trims; preserve master bytes."""
from pathlib import Path
import json,hashlib,zipfile,tempfile,shutil
P=Path(__file__).resolve().parents[1];O=Path('/workspace/outputs/visual-v2.4');O.mkdir(exist_ok=True)
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def archive(path,files,extras=None):
 manifest={name:sha(f) for name,f in files.items()}
 with zipfile.ZipFile(path,'w',zipfile.ZIP_DEFLATED) as z:
  for name,f in files.items():z.write(f,name)
  for name,text in (extras or {}).items():z.writestr(name,text)
  z.writestr('SHA256SUMS.txt',''.join(f'{digest}  {name}\n' for name,digest in manifest.items()))
 with tempfile.TemporaryDirectory(prefix='keleji-v24-restore-') as d:
  with zipfile.ZipFile(path) as z:assert z.testzip() is None;z.extractall(d)
  for name,digest in manifest.items():assert sha(Path(d)/name)==digest
 return {'zip':path.name,'bytes':path.stat().st_size,'sha256':sha(path),'files_verified':len(files),'actual_extraction_and_hash_check':'PASS'}
manifest=json.loads((P/'out/source-manifest.json').read_text());files={}
for row in manifest:
 f=P/row['path'];assert sha(f)==row['sha256'];files['keleji-remotion-visual-v2.4/'+row['path']]=f
for name in ['pexels-6535488-4to8-30fps.mp4','pexels-6535488-v24-12s.mp4']:
 f=P/'public/assets'/name;files['keleji-remotion-visual-v2.4/public/assets/'+name]=f
files['SOURCE-MANIFEST.json']=P/'out/source-manifest.json'
if (O/'GITHUB-SAVE-RECEIPT.txt').exists():files['GITHUB-SAVE-RECEIPT.txt']=O/'GITHUB-SAVE-RECEIPT.txt'
reports=[archive(O/'keleji-v24-project-backup.zip',files,{'RESTORE.txt':'Extract into a NEW directory. Follow README.md; npm ci, render preview, inspect, render master, QA. Existing licensed production trims included only for restoring this project; not a stock library for redistribution. No voice/model/key files. Store ZIP in durable personal storage, outside temporary Codex workspace.\n'})]
master=O/'keleji-v24-12s-master-1080x1920.mp4';reports.append(archive(O/'keleji-v24-1080p-original.zip',{master.name:master},{'READ-ME.txt':'Unscaled original Remotion master. 1080x1920,30fps,360frames,12seconds,H.264,no audio. Verify with ffprobe and SHA256SUMS. Displayed browser preview size does not determine encoded resolution.\n'}))
for src,name in [('design-v24.md','design.md'),('docs/SOURCES-V24.md','SOURCES-V24.md'),('docs/QA-V24.md','QA-V24.md'),('docs/nutrition-v24.json','nutrition-v24.json'),('docs/timeline-v24.json','timeline-v24.json')]:shutil.copyfile(P/src,O/name)
selected=['keleji-v24-12s-master-1080x1920.mp4','keleji-v24-12s-preview-540p.mp4','keyframes-v24.png','design.md','SOURCES-V24.md','QA-V24.md','nutrition-v24.json','timeline-v24.json','v24-qa-metrics.json','keleji-v24-project-backup.zip']
if (O/'GITHUB-SAVE-RECEIPT.txt').exists():selected.append('GITHUB-SAVE-RECEIPT.txt')
reports.append(archive(O/'keleji-v24-complete-delivery.zip',{n:O/n for n in selected}))
(O/'BACKUP-VERIFICATION.json').write_text(json.dumps(reports,indent=2));(O/'SHA256SUMS.txt').write_text(''.join(f'{sha(f)}  {f.name}\n' for f in sorted(O.iterdir()) if f.is_file() and f.name!='SHA256SUMS.txt'));print(json.dumps(reports,indent=2))
