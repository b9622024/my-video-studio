"""Package audited source and current truthful project state; excludes API cache/secrets/media."""
from pathlib import Path
import json,hashlib,zipfile,tempfile,shutil
P=Path(__file__).resolve().parents[1];O=Path('/workspace/outputs/broll-pipeline-v1');O.mkdir(exist_ok=True)
def sha(f):return hashlib.sha256(f.read_bytes()).hexdigest()
def pack(target,files):
 expected={n:sha(f) for n,f in files.items()}
 with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED) as z:
  for n,f in files.items():z.write(f,n)
  z.writestr('SHA256SUMS.txt',''.join(f'{h}  {n}\n' for n,h in expected.items()))
 with tempfile.TemporaryDirectory(prefix='broll-restore-') as d:
  with zipfile.ZipFile(target) as z:assert z.testzip() is None;z.extractall(d)
  for n,h in expected.items():assert sha(Path(d)/n)==h
 return {'zip':target.name,'files_verified':len(expected),'bytes':target.stat().st_size,'sha256':sha(target),'actual_extraction_and_hash_check':'PASS'}
m=json.loads((P/'.local/source-manifest.json').read_text());files={}
for row in m:
 f=P/row['path'];assert sha(f)==row['sha256'];files['broll-pipeline/'+row['path']]=f
files['SOURCE-MANIFEST.json']=P/'.local/source-manifest.json'
if (O/'GITHUB-SAVE-RECEIPT.txt').exists():files['GITHUB-SAVE-RECEIPT.txt']=O/'GITHUB-SAVE-RECEIPT.txt'
reports=[pack(O/'broll-pipeline-v1-source.zip',files)]
for n in ['scene-plan.json','broll-candidates.json','asset-manifest.json','edit-timeline.json','api-test-result.json']:shutil.copyfile(P/'projects/bento-v1'/n,O/n)
shutil.copyfile(P/'projects/bento-v1/review.html',O/'bento-review.html');shutil.copyfile(P/'README.md',O/'README.md');shutil.copyfile(P/'docs/STATUS.md',O/'STATUS.md');shutil.copyfile(P/'docs/TEST-REPORT.md',O/'TEST-REPORT.md')
selected=['broll-pipeline-v1-source.zip','bento-review.html','README.md','STATUS.md','TEST-REPORT.md','scene-plan.json','broll-candidates.json','asset-manifest.json','edit-timeline.json','api-test-result.json','review-results-empty.json','backend-test-report.json','ui-test-report.json','remotion-interface-test.json']
if (O/'GITHUB-SAVE-RECEIPT.txt').exists():selected.append('GITHUB-SAVE-RECEIPT.txt')
reports.append(pack(O/'broll-pipeline-v1-delivery.zip',{n:O/n for n in selected}));(O/'BACKUP-VERIFICATION.json').write_text(json.dumps(reports,indent=2));print(json.dumps(reports,indent=2))
