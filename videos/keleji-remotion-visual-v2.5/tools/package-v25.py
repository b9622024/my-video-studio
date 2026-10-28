"""Back up reviewed source + licensed production trims; preserve master bytes."""
from pathlib import Path
import json,hashlib,zipfile,tempfile,shutil
P=Path(__file__).resolve().parents[1];O=Path('/workspace/outputs/visual-v2.5');O.mkdir(exist_ok=True)
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def archive(path,files,extras=None):
 manifest={name:sha(f) for name,f in files.items()}
 with zipfile.ZipFile(path,'w',zipfile.ZIP_DEFLATED) as z:
  for name,f in files.items():z.write(f,name)
  for name,text in (extras or {}).items():z.writestr(name,text)
  z.writestr('SHA256SUMS.txt',''.join(f'{digest}  {name}\n' for name,digest in manifest.items()))
 with tempfile.TemporaryDirectory(prefix='keleji-v25-restore-') as d:
  with zipfile.ZipFile(path) as z:assert z.testzip() is None;z.extractall(d)
  for name,digest in manifest.items():assert sha(Path(d)/name)==digest
 return {'zip':path.name,'bytes':path.stat().st_size,'sha256':sha(path),'files_verified':len(files),'actual_extraction_and_hash_check':'PASS'}
manifest=json.loads((P/'out/source-manifest.json').read_text());files={}
for row in manifest:
 f=P/row['path'];assert sha(f)==row['sha256'];files['keleji-remotion-visual-v2.5/'+row['path']]=f
for name in ['pexels-6535488-4to8-30fps.mp4','pexels-6535488-v24-12s.mp4','v25-pour.mp4','v25-compare-left.mp4','v25-compare-portion.mp4']:
 f=P/'public/assets'/name;files['keleji-remotion-visual-v2.5/public/assets/'+name]=f
files['SOURCE-MANIFEST.json']=P/'out/source-manifest.json'
if (O/'GITHUB-SAVE-RECEIPT.txt').exists():files['GITHUB-SAVE-RECEIPT.txt']=O/'GITHUB-SAVE-RECEIPT.txt'
reports=[archive(O/'keleji-v25-project-backup.zip',files,{'RESTORE.txt':'Extract into a NEW directory. Follow README.md; npm ci, render preview, inspect, render master, QA. Existing licensed production trims included only for restoring this project; not a stock library for redistribution. No voice/model/key files. Store ZIP in durable personal storage, outside temporary Codex workspace.\n'})]
master=O/'keleji-v25-12s-master-1080x1920.mp4';reports.append(archive(O/'keleji-v25-1080p-original.zip',{master.name:master},{'READ-ME.txt':'Unscaled original Remotion master. 1080x1920,30fps,360frames,12seconds,H.264,no audio. Verify with ffprobe and SHA256SUMS. Displayed browser preview size does not determine encoded resolution.\n'}))
for src,name in [('design-v25.md','design.md'),('docs/SOURCES-V25.md','SOURCES-V25.md'),('docs/DIFF-QA-V25.md','DIFF-QA-V25.md'),('scene-plan.json','scene-plan.json'),('broll-candidates.json','broll-candidates.json'),('asset-manifest.json','asset-manifest.json'),('edit-timeline.json','edit-timeline.json')]:shutil.copyfile(P/src,O/name)
selected=['keleji-v25-12s-master-1080x1920.mp4','keleji-v25-12s-preview-540p.mp4','keyframes-v25.png','design.md','SOURCES-V25.md','DIFF-QA-V25.md','scene-plan.json','broll-candidates.json','asset-manifest.json','edit-timeline.json','storyboard-material-preview.png','v25-qa-metrics.json','keleji-v25-project-backup.zip']
if (O/'GITHUB-SAVE-RECEIPT.txt').exists():selected.append('GITHUB-SAVE-RECEIPT.txt')
reports.append(archive(O/'keleji-v25-complete-delivery.zip',{n:O/n for n in selected}))
(O/'BACKUP-VERIFICATION.json').write_text(json.dumps(reports,indent=2));(O/'SHA256SUMS.txt').write_text(''.join(f'{sha(f)}  {f.name}\n' for f in sorted(O.iterdir()) if f.is_file() and f.name!='SHA256SUMS.txt'));print(json.dumps(reports,indent=2))
