"""Build unscaled masters + recoverable working backup. Never touches voice files."""
from pathlib import Path
import zipfile,json,hashlib,tempfile,shutil
P=Path(__file__).resolve().parents[1];O=Path('/workspace/outputs/visual-v2.3');O.mkdir(exist_ok=True)
def sha(b):return hashlib.sha256(b).hexdigest()
def zip_checked(path,files,extras=None):
 manifest={name:sha(f.read_bytes()) for name,f in files.items()}
 with zipfile.ZipFile(path,'w',zipfile.ZIP_DEFLATED) as z:
  for name,f in files.items():z.write(f,name)
  for name,text in (extras or {}).items():z.writestr(name,text)
  z.writestr('SHA256SUMS.txt',''.join(f'{v}  {k}\n' for k,v in manifest.items()))
 with tempfile.TemporaryDirectory(prefix='keleji-restore-') as d:
  with zipfile.ZipFile(path) as z:assert z.testzip() is None;z.extractall(d)
  for name,hash in manifest.items():assert sha((Path(d)/name).read_bytes())==hash
 return {'zip':path.name,'files_verified':len(files),'sha256':sha(path.read_bytes()),'bytes':path.stat().st_size,'actual_extraction_and_hash_check':'PASS'}
source=json.loads((P/'out/source-manifest.json').read_text())
files={}
for row in source:
 f=P/row['path'];assert sha(f.read_bytes())==row['sha256'];files['keleji-remotion-visual-v2.3/'+row['path']]=f
# Licensed production trim for this project only; not in public Git, not raw stock resale.
f=P/'public/assets/pexels-6535488-4to8-30fps.mp4';files['keleji-remotion-visual-v2.3/public/assets/'+f.name]=f
files['SOURCE-MANIFEST.json']=P/'out/source-manifest.json'
receipt=O/'GITHUB-SAVE-RECEIPT.txt'
if receipt.exists():files[receipt.name]=receipt
reports=[zip_checked(O/'keleji-visual-v23-project-backup.zip',files,{'RESTORE.txt':'Extract to a NEW directory. Follow keleji-remotion-visual-v2.3/README.md: npm ci, render, verify. Licensed Pexels production trim included only for this project; no raw stock redistribution in Git. No private voice files or model weights. Store this ZIP outside the temporary Codex workspace.\n'})]
masters={f.name:f for f in O.glob('*-MASTER-1080x1920.mp4')}
reports.append(zip_checked(O/'keleji-v23-1080p-original-masters.zip',masters,{'READ-ME.txt':'Original unscaled Remotion MP4 bytes. Each 1080x1920, H.264, 30fps, 120 frames, 4 seconds, silent. Extract and verify with ffprobe and SHA256SUMS.txt. Browser displayed preview size may differ from encoded file dimensions.\n'}))
for src,name in [('design.md','design.md'),('docs/COMPARISON-V23.md','COMPARISON-V23.md'),('docs/RESOLUTION-AUDIT.md','RESOLUTION-AUDIT.md'),('docs/ASSETS-V23.md','ASSETS-V23.md'),('docs/v23-timeline.json','v23-timeline.json'),('docs/v22-resolution-audit.json','v22-resolution-audit.json')]:shutil.copyfile(P/src,O/name)
selected=['keleji-v23-A-MASTER-1080x1920.mp4','keleji-v23-B-MASTER-1080x1920.mp4','A-keyframes.png','B-keyframes.png','AB-keyframes.png','design.md','COMPARISON-V23.md','RESOLUTION-AUDIT.md','ASSETS-V23.md','v23-timeline.json','v23-qa-metrics.json','v22-resolution-audit.json','keleji-visual-v23-project-backup.zip']
if receipt.exists():selected.append(receipt.name)
reports.append(zip_checked(O/'keleji-visual-v23-delivery.zip',{n:O/n for n in selected}))
(O/'BACKUP-VERIFICATION.json').write_text(json.dumps(reports,indent=2))
(O/'SHA256SUMS.txt').write_text(''.join(f'{sha(f.read_bytes())}  {f.name}\n' for f in sorted(O.iterdir()) if f.is_file() and f.name!='SHA256SUMS.txt'))
print(json.dumps(reports,indent=2))
