"""Static art review ONLY. Original AI RGBA assets; no food drawing, blending or film rendering."""
import pathlib,json,hashlib
from PIL import Image
P=pathlib.Path(__file__).resolve().parents[1];OUT=pathlib.Path('/workspace/outputs/broll-v121-art-review');project=P/'projects/m3-v121-art';project.mkdir(parents=True,exist_ok=True)
sha=lambda f:hashlib.sha256(pathlib.Path(f).read_bytes()).hexdigest()
asset=OUT/'assets';rice=Image.open(asset/'rice-states-atlas.png');alpha=rice.getchannel('A');cuts=[0,672,1400,2172]
states=[]
for i,key in enumerate('ABC'):
 x0,x1=cuts[i:i+2];box=alpha.crop((x0,0,x1,724)).point(lambda v:255 if v>32 else 0).getbbox()
 if not box:raise ValueError('Missing rice asset')
 scale=.52;center=(box[0]+box[2])/2;bottom=box[3]
 state={'id':key,'label':['較少白飯','中間狀態','較多白飯'][i],'source':'assets/rice-states-atlas.png','sprite_rect':[x0,0,x1-x0,724],'exported_asset':f'assets/rice-{key}.png','opaque_bounds_in_sprite':list(box),'display':{'scale':scale,'left':540-center*scale,'top':1350-bottom*scale,'width':(x1-x0)*scale,'height':724*scale},'status':'awaiting_human_art_approval'}
 states.append(state)
 d=state['display']
 html=f'''<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><title>V1.2.1 State {key} — art review</title><style>
 *{{box-sizing:border-box}}html,body{{margin:0;width:1080px;height:1920px;background:#f3efe5;color:#1c3442;font-family:"Noto Sans CJK TC",sans-serif}}.stage{{position:relative;width:1080px;height:1920px;overflow:hidden}}.brand{{position:absolute;left:70px;top:80px;font-size:28px;letter-spacing:4px}}.title{{position:absolute;left:70px;top:170px;font-size:52px;font-weight:700}}.base{{position:absolute;left:40px;top:450px;width:1000px;height:1000px}}.rice{{position:absolute;left:{d['left']}px;top:{d['top']}px;width:{d['width']}px;height:{d['height']}px;overflow:hidden}}.rice img{{position:absolute;width:{2172*scale}px;height:{724*scale}px;left:{-x0*scale}px;top:0}}.state{{position:absolute;left:70px;top:1570px;font-size:48px;font-weight:650}}.note{{position:absolute;left:70px;top:1680px;font-size:28px;line-height:1.7;color:#52616a}}
 </style><div class="stage"><div class="brand">可樂吉 ／ 餐點筆記</div><div class="title">同一餐盤・不同主食狀態</div><img class="base" alt="原創生成的固定餐盤、蔬菜與雞肉底層" src="assets/plate-fixed-foods.png"><div class="rice"><img alt="獨立生成白飯狀態{key}" src="assets/rice-states-atlas.png"></div><div class="state">State {key} ／ {state['label']}</div><div class="note">概念示意<br>相對狀態，不是建議份量。</div></div></html>'''
 (OUT/f'State-{key}.html').write_text(html)
 # A source atlas viewport, exported at exactly native pixel dimensions with alpha.
 (OUT/f'export-rice-{key}.html').write_text(f'<!doctype html><style>html,body{{margin:0;background:transparent}}div{{position:relative;width:{x1-x0}px;height:724px;overflow:hidden}}img{{position:absolute;left:{-x0}px;top:0;width:2172px;height:724px}}</style><div><img src="assets/rice-states-atlas.png"></div>')
for key,start,width in [('empty',0,983),('loaded',983,1189)]:
 (OUT/f'export-paddle-{key}.html').write_text(f'<!doctype html><style>html,body{{margin:0;background:transparent}}div{{position:relative;width:{width}px;height:724px;overflow:hidden}}img{{position:absolute;left:{-start}px;top:0;width:2172px;height:724px}}</style><div><img src="assets/paddle-states-atlas.png"></div>')
manifest={'version':'1.2.1','stage':'static_art_review_only','plate_base':{'file':'assets/plate-fixed-foods.png','rect':[40,450,1000,1000],'contains':['plate','fixed_vegetables','fixed_protein','baked_contact_shadows'],'note':'固定食物暫為同一原創底層，未宣稱可獨立動畫；若需換菜色，先更換或拆分美術資產。'},'states':states,'native_rice_atlas_dimensions':list(rice.size),'state_scaling':'one common native-pixel scale .52 for all three distinct generated mounds; no cloned rice stamps','paddle_atlas':{'file':'assets/paddle-states-atlas.png','rects':{'empty':[0,0,983,724],'loaded':[983,0,1189,724]},'animation_ready':False,'reason':'generated silhouettes differ; no registered release/intermediate frames or separate contact shadow'},'originals':[{'file':f'assets/{f}','sha256':sha(asset/f)} for f in ['plate-fixed-foods.png','rice-states-atlas.png','paddle-states-atlas.png']],'human_approved':False,'animation_allowed':False,'formal_asset_selection_changed':False}
(project/'art-layout.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
(OUT/'overview.html').write_text('<!doctype html><style>html,body{margin:0;background:#f3efe5}main{display:flex;width:1620px;height:960px}img{width:540px;height:960px}</style><main>'+''.join(f'<img src="State-{key}.png">' for key in 'ABC')+'</main>')
print('Prepared 3 static layouts; no animation/render approval')
