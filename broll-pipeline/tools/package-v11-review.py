"""Direct-chat review assets. These are separate candidates, never an approved film."""
from pathlib import Path
import json,subprocess,hashlib,shutil,zipfile,html,os
from PIL import Image,ImageDraw,ImageFont,ImageOps
ROOT=Path(__file__).resolve().parents[1];P=ROOT/'projects/bento-v11';OUT=Path('/workspace/outputs/broll-v11-review');OUT.mkdir(exist_ok=True)
d=json.load(open(P/'review-options.json'));font='/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc';F=lambda n:ImageFont.truetype(font,n)
items=[];sources=[];ledger=[]
for o in d['options']:
 ident=o['option_id'];graphic=o['mode']=='information_motion_graphics'
 if not graphic:
  src=P/o['preview']['video'];assert hashlib.sha256(src.read_bytes()).hexdigest()==o['preview']['sha256']
  start=o['selected_trim']['start'];mp4=OUT/(ident+'.mp4')
  subprocess.run(['ffmpeg','-v','error','-y','-ss',str(start),'-i',str(src),'-t','4','-an','-c:v','libx264','-crf','22','-pix_fmt','yuv420p','-movflags','+faststart',str(mp4)],check=True)
  for i,at in enumerate([.5,2,3.5],1):
   subprocess.run(['ffmpeg','-v','error','-y','-ss',str(at),'-i',str(mp4),'-frames:v','1',str(OUT/f'{ident}-{i}.jpg')],check=True)
  picture=Image.open(OUT/f'{ident}-2.jpg').convert('RGB')
  crop=ImageOps.fit(picture,(270,480),centering=(.5,.5));crop.save(OUT/f'{ident}-crop9x16.jpg')
  sources.append(f"{ident}\t{o['candidate_id']}\t{o['author']}\t{o['source_url']}\t{o['license_url']}\t{start}-{start+4}s\tcontextual_match (pending)")
  ledger.append({'option_id':ident,'file':mp4.name,'sha256':hashlib.sha256(mp4.read_bytes()).hexdigest(),'source_preview_sha256':o['preview']['sha256'],'source_interval':[start,start+4],'approved':False})
 else:
  picture=Image.new('RGB',(640,360),'#172b25');draw=ImageDraw.Draw(picture)
  if o['graphic']['kind']=='portion_concept':
   draw.line((65,165,575,165),fill='#55796b',width=18);draw.line((65,165,340,165),fill='#b4d6ad',width=18);draw.ellipse((322,147,358,183),fill='#f5f1e7')
  else:
   draw.line((100,160,320,100,540,160),fill='#b4d6ad',width=6)
   for x,y in [(100,160),(320,100),(540,160)]:draw.ellipse((x-28,y-28,x+28,y+28),outline='#b4d6ad',width=4)
  for i,label in enumerate(o['graphic']['labels']):draw.text((50+i*210,230),label,font=F(24),fill='white')
  draw.text((30,315),'資訊動畫構圖提案｜尚未渲染影片',font=F(19),fill='#b4d6ad');picture.save(OUT/(ident+'-concept.jpg'))
 panel=Image.new('RGB',(680,580),'#f5f2e9');draw=ImageDraw.Draw(panel)
 draw.text((24,18),ident+'｜'+('資訊動畫提案' if graphic else '情境實拍候選'),font=F(27),fill='#19382b')
 thumb=ImageOps.contain(picture,(630,350));panel.paste(thumb,((680-thumb.width)//2,75))
 brief={'A1':'餐盤肉與沙拉；不宣稱營養均衡','A2':'牛肉與白飯；可用分割畫面標註','B1':'烹調綠葉菜；不宣稱已裝入便當','B2':'逐步連結蔬菜與配菜關係','C1':'熟白飯特寫＋非量化份量概念圖','C2':'觀察→依需求→調整，無數值'}[ident]
 draw.text((24,446),brief,font=F(21),fill='#19382b');draw.text((24,488),'待你核准；不是正式選用或成品',font=F(21),fill='#59675b')
 panel.save(OUT/(ident+'-card.jpg'));items.append(panel)
contact=Image.new('RGB',(1360,1840),'#19382b');draw=ImageDraw.Draw(contact);draw.text((30,15),'V1.1 選片聯絡表｜請回覆 A1/A2、B1/B2、C1/C2',font=F(31),fill='white')
for i,pic in enumerate(items):contact.paste(pic,((i%2)*680,80+(i//2)*580))
contact.save(OUT/'contact-sheet.jpg',quality=90)
for name in ['scene-plan.json','review-options.json','asset-manifest.json','edit-timeline.json']:shutil.copy(P/name,OUT/name)
for source,name in [(ROOT/'schemas/v11/contracts.schema.json','CONTRACTS.schema.json'),(ROOT/'docs/v11/README.md','GUIDE.md'),(ROOT/'docs/v11/REBUILD.md','REBUILD.md'),(ROOT/'docs/v11/verification.json','verification.json'),(ROOT/'docs/v11/review-test.json','review-test.json')]:
 if source.exists():shutil.copy(source,OUT/name)
(OUT/'sources.tsv').write_text('編號\tPixabay編號\t作者\t來源\t授權\t原片區間\t狀態\n'+'\n'.join(sources)+'\n')
(OUT/'preview-hashes.json').write_text(json.dumps(ledger,indent=2))
(OUT/'README.txt').write_text('V1.1 階段一私人選片包\n\n直接觀看A1/A2/B1/C1.mp4，並比較contact-sheet.jpg。B2/C2為資訊動畫構圖提案JPG，尚未渲染。\n不需自行架server：可直接在Codex對話回覆，例如 A：候選1；B：候選1；C：候選1。\n這只是回覆格式示例，不代表已核准。若選B2/C2請明說資訊動畫。\n有自己的MP4/MOV也可以另行提供，但本次不要求。\n\n每支MP4僅4秒獨立候選，不是12秒正式影片。原片使用區間與來源作者授權見sources.tsv。\nC1預覽只顯示來源白飯；資訊圖待你核准後才由Remotion合成。\n裁切JPG是9:16中心裁切示意，A2分割與C1上下資訊版面會保留更多橫幅內容。\nreview.html提供另一種瀏覽器選片表；iOS檔案預覽可能不執行JS，此時直接回覆編號即可。\n不公開散布為素材庫；僅本次私人審核，刪除不再使用的預覽。\n')
cards=[]
for o in d['options']:
 ident=o['option_id'];media=f'<video controls playsinline muted preload="none" poster="{ident}-2.jpg" src="{ident}.mp4"></video>' if o.get('asset_id') else f'<img src="{ident}-concept.jpg" alt="資訊動畫構圖提案">'
 cards.append(f'<article><h2>{ident}</h2>{media}<p>{html.escape(o["title"])}</p><p>待核准｜{html.escape(o["match_status"])}</p></article>')
controls=''.join(f'<label>{s}：<select id="{s}"><option value="">尚未選擇</option><option>{s}1</option><option>{s}2</option></select></label>' for s in 'ABC')
script="""document.querySelector('button').onclick=()=>{let selections=['A','B','C'].map(scene_id=>({scene_id,option_id:document.getElementById(scene_id).value}));if(selections.some(x=>!x.option_id)){document.querySelector('#msg').textContent='請先選擇三場景';return;}let data={project_id:PROJECT,revision_id:REVISION,provenance:'selection_request_not_formal_approval',selections};let text=JSON.stringify(data,null,2);document.querySelector('textarea').value=text;let a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:'application/json'}));a.download='review-selection.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),10000);};""".replace('PROJECT',json.dumps(d['project_id'])).replace('REVISION',json.dumps(d['revision_id']))
(OUT/'review.html').write_text('<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>V1.1 選片</title><style>body{font-family:sans-serif;background:#f5f2e9;margin:20px;color:#19382b}article{margin:24px 0;padding:16px;background:white;border-radius:12px}video,img{width:100%;max-height:380px;object-fit:contain}label{display:block;margin:16px}select,button{font-size:20px;padding:12px}textarea{width:100%;height:180px}</style><h1>V1.1 待核准候選</h1><p>不需使用此頁也可直接在Codex回覆編號。匯出只產生選片請求，不自動建立正式核准清單。</p>'+''.join(cards)+controls+'<button>匯出選片請求</button><p id="msg"></p><textarea aria-label="選片JSON備用"></textarea><script>'+script+'</script></html>')
for p in OUT.iterdir():
 if p.is_file():
  key=os.environ.get('PIXABAY_API_KEY','').strip().encode();assert not key or key not in p.read_bytes(),'Sensitive output blocked'
with zipfile.ZipFile(OUT.with_suffix('.zip'),'w',zipfile.ZIP_DEFLATED) as z:
 for p in sorted(OUT.iterdir()):
  if p.is_file():z.write(p,'broll-v11-review/'+p.name)
print(json.dumps({'archive':str(OUT.with_suffix('.zip')),'mp4_files':4,'keyframes':12,'candidate_count':6,'approved':False,'bytes':OUT.with_suffix('.zip').stat().st_size}))
