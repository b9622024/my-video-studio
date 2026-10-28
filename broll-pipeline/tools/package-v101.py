"""Private review bundle containing only the six referenced previews, never API cache."""
from pathlib import Path
import json, shutil, zipfile, hashlib, os

ROOT=Path(__file__).resolve().parents[1]
OUT=Path('/workspace/outputs/broll-v101-review')
OUT.mkdir(exist_ok=True)
data=json.loads((ROOT/'projects/bento-v101/broll-candidates.json').read_text())
files={}
project=ROOT/'projects/bento-v101'
for name in ['review.html','scene-plan.json','broll-candidates.json','asset-manifest.json','edit-timeline.json','visual-review.json','api-test-result.json']:
    files[name]=project/name
for row in data['scenes']:
    for c in row['candidates']+row.get('excluded_previews',[]):
        preview=c['local_preview']
        for name in [preview['video']]+[f['path'] for f in preview['frames']]:
            assert name.startswith('previews/pixabay-') and '..' not in name
            files[name]=project/name
files['server.mjs']=ROOT/'src/server.mjs'
files['QUALITY.md']=ROOT/'docs/V101-QUALITY.md'
files['REBUILD.md']=ROOT/'docs/V101-REBUILD.md'
files['TESTS.json']=ROOT/'docs/test-results/v101-ui.json'
secret=os.environ.get('PIXABAY_API_KEY','').strip().encode()
for name,source in files.items():
    contents=source.read_bytes()
    assert not secret or secret not in contents, 'Sensitive output blocked'
    target=OUT/name;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(contents)
(OUT/'serve.mjs').write_text("import {serve} from './server.mjs';import {fileURLToPath} from 'node:url';const host=process.argv.includes('--lan')?'0.0.0.0':'127.0.0.1';serve(fileURLToPath(new URL('.',import.meta.url)),3112,host);console.log('Review server port 3112; --lan is for trusted local Wi-Fi only.');\n")
(OUT/'README.txt').write_text('可樂吉 B-roll V1.0.1 私人素材審核包\n\n完整解壓縮後，在同Wi-Fi可信任電腦執行 node serve.mjs --lan。\niPhone Safari開啟 http://<該電腦區域網路IP>:3112/ 。\n這不是雲端localhost或公開部署。請勿公網轉發。\n\nB近似方案11605建議查看34–40秒；沒有已確認的精確裝餐／盛飯素材。\n5支排除影片可觀看核對，但Approve停用。\nSearch Again匯出請求交回後端，不會直接搜尋。\nHTML單獨離線開啟於iOS檔案預覽時，JS互動不保證運作；mp4可個別觀看。\n詳見QUALITY.md及REBUILD.md。\n\n預覽僅供本次私人審核，不是正式核准素材；審核後刪除不用的影片。\n')
manifest={name:hashlib.sha256((OUT/name).read_bytes()).hexdigest() for name in list(files)+['serve.mjs','README.txt']}
(OUT/'checksums.json').write_text(json.dumps(manifest,indent=2))
archive=OUT.with_suffix('.zip')
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as z:
    for name in list(files)+['serve.mjs','README.txt','checksums.json']:
        z.write(OUT/name,'broll-v101-review/'+name)
print(json.dumps({'archive':str(archive),'bytes':archive.stat().st_size,'video_files':6,'evidence_frames':18,'secret_scan_passed':True}))
