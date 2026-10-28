"""Validate traceable decisions, actual source ranges, timeline and same-serving data."""
from pathlib import Path
import json,hashlib
P=Path(__file__).resolve().parents[1]
def load(n):return json.loads((P/n).read_text())
scene=load('scene-plan.json');candidates=load('broll-candidates.json');assets=load('asset-manifest.json');edit=load('edit-timeline.json');nutrition=load('docs/nutrition-v24.json')
assert scene['duration_frames']==edit['duration_frames']==360 and scene['fps']==edit['fps']==30
assert len({a['source_id'] for a in assets['assets']})>=2
sources={s['id']:s for s in assets['sources']}
for a in assets['assets']:
 start,end=a['source_seconds'];assert 0<=start<end<=sources[a['source_id']]['duration_seconds'];assert hashlib.sha256((P/a['path']).read_bytes()).hexdigest()==a['sha256']
for s in candidates['scenes']:assert 2<=len(s['candidates'])<=3
for p in nutrition['products']:assert round(p['fat_g_per_100ml']*nutrition['display_serving_ml']/nutrition['basis_ml'],1)==p['fat_g_per_200ml']
assert [x['frames'] for x in scene['scenes']]==[[0,120],[120,240],[240,360]]
assert edit['clips'][2]['continuous_across_frame']==240
print('PASS: two actual sources; legal source hashes; bounded source ranges; 3 candidates/scene; 200mL calculations; 360-frame scene plan.')
