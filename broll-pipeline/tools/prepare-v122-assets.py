"""Reversible low-alpha cleanup only; never generates/redraws food or overwrites V1.2.1."""
import pathlib,json,hashlib,shutil,http.server,threading,functools,argparse
from PIL import Image
from playwright.sync_api import sync_playwright
P=pathlib.Path(__file__).resolve().parents[1];a=argparse.ArgumentParser();a.add_argument('--source',default='/workspace/outputs/broll-v121-art-review');args=a.parse_args();source=pathlib.Path(args.source)
public=P/'.runtime/v122-public';original=public/'assets/original';clean=public/'assets/clean';original.mkdir(parents=True,exist_ok=True);clean.mkdir(parents=True,exist_ok=True)
sha=lambda f:hashlib.sha256(pathlib.Path(f).read_bytes()).hexdigest();review=json.loads((P/'projects/m3-v121-art/art-review.json').read_text());expected={x['file']:x['sha256'] for x in review['artifacts']}
files=['plate-fixed-foods.png','rice-A.png','rice-B.png','rice-C.png']
for name in files:
 src=source/'assets'/name
 if not src.exists():src=source/'assets/original'/name
 if sha(src)!=expected['assets/'+name]:raise ValueError('Previously checked original changed: '+name)
 shutil.copyfile(src,original/name)
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(public)));threading.Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);page=browser.new_page(device_scale_factor=1)
  for name in files[1:]:
   w,h=Image.open(original/name).size
   html=f'''<!doctype html><style>html,body{{margin:0;background:transparent}}img{{position:absolute;left:0;top:0;width:{w}px;height:{h}px;filter:url(#edge)}}</style><svg width="0" height="0"><defs><filter id="edge" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feComponentTransfer><feFuncA type="table" tableValues="0 0 .18 .3 .4 .5 .6 .7 .8 .9 1"/></feComponentTransfer></filter></defs></svg><img src="assets/original/{name}">'''
   (public/('cleanup-'+name+'.html')).write_text(html);page.set_viewport_size({'width':w,'height':h});page.goto(f'http://127.0.0.1:{server.server_address[1]}/cleanup-{name}.html');page.evaluate('Promise.all([...document.images].map(i=>i.decode()))');page.screenshot(path=str(clean/name),omit_background=True)
  browser.close()
finally:server.shutdown();server.server_close()
# Read-only pixel analysis: opaque food pixels must remain exactly the same.
checks=[]
for name in files[1:]:
 before=Image.open(original/name).convert('RGBA');after=Image.open(clean/name).convert('RGBA');pairs=list(zip(before.get_flattened_data(),after.get_flattened_data()));opaque=[(b,c) for b,c in pairs if b[3]>=240]
 exact=sum(b==c for b,c in opaque);assert exact==len(opaque),'Opaque food changed'
 checks.append({'asset':name,'original_sha256':sha(original/name),'derived_sha256':sha(clean/name),'dimensions':list(before.size),'opaque_pixel_count':len(opaque),'opaque_pixels_exactly_preserved':True,'alpha_mass_retained':sum(c[3] for _,c in pairs)/sum(b[3] for b,_ in pairs),'method':'only alpha<.3 modified; alpha<=.1 suppressed, .2 maps to .18; no RGB operation; original alpha>=240 RGBA exactly preserved'})
manifest={'version':'1.2.2','scope':'private_comparison_research_only','originals':[{'file':'assets/original/'+n,'sha256':sha(original/n)} for n in files],'derived':checks,'original_art_regenerated':False,'old_art_overwritten':False,'new_contact_shadow':'small alpha-derived CSS drop shadow; parameters in config','public_use_approved':False}
(P/'projects/comparison-v122/assets.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
layout=json.loads((P/'projects/m3-v121-art/art-layout.json').read_text());states=[]
for s in layout['states']:
 d=s['display'];states.append({'id':s['id'],'label':{'A':'較少','B':'中間','C':'較多'}[s['id']],'asset':'assets/clean/rice-'+s['id']+'.png','originalAsset':'assets/original/rice-'+s['id']+'.png','rect':[d['left']-40,d['top']-450,d['width'],d['height']]})
config={'version':'1.2.2','scope':'private_comparison_research_only','fps':30,'frames':120,'width':540,'height':960,'baseAsset':'assets/original/plate-fixed-foods.png','states':states,'style':{'paper':'#f3efe5','ink':'#1c3442','plateShadow':'drop-shadow(1px 3px 2px rgba(61,48,29,.14)) drop-shadow(4px 10px 13px rgba(61,48,29,.09))','riceShadow':'drop-shadow(1px 2px 2px rgba(76,60,40,.10))'},'matchCut':{'stateFrames':40,'plateCenter':[270,450],'plateSize':540,'labelY':104},'table':{'plateSize':540,'objects':[{'stateId':'A','center':[0,0]},{'stateId':'B','center':[580,100]},{'stateId':'C','center':[290,630]}],'screenCenter':[270,425],'cameraKeys':[{'frame':0,'x':0,'y':0,'zoom':.84},{'frame':18,'x':0,'y':0,'zoom':.84},{'frame':39,'x':580,'y':100,'zoom':.84},{'frame':54,'x':580,'y':100,'zoom':.84},{'frame':75,'x':290,'y':630,'zoom':.84},{'frame':88,'x':290,'y':630,'zoom':.84},{'frame':103,'x':290,'y':315,'zoom':.43},{'frame':119,'x':290,'y':315,'zoom':.43}]},'publication_approved':False,'full_12s_created':False}
(P/'projects/comparison-v122/config.json').write_text(json.dumps(config,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'originals_verified':4,'derived_alpha_assets':3,'opaque_food_pixels_preserved':True}))
