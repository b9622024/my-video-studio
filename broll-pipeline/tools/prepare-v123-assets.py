"""Original-source validation and separate payload preparation; no rice-state replacement."""
import pathlib,json,hashlib,shutil,threading,http.server,functools,argparse
from PIL import Image
from playwright.sync_api import sync_playwright
P=pathlib.Path(__file__).resolve().parents[1];OUT=pathlib.Path('/workspace/outputs/broll-v123-interaction');public=P/'.runtime/v123-public';original=public/'assets/original';derived=public/'assets/derived';original.mkdir(parents=True,exist_ok=True);derived.mkdir(parents=True,exist_ok=True)
parser=argparse.ArgumentParser();parser.add_argument('--source',default='/workspace/outputs/broll-v121-art-review');args=parser.parse_args();source_root=pathlib.Path(args.source)
sha=lambda f:hashlib.sha256(pathlib.Path(f).read_bytes()).hexdigest();old=json.loads((P/'projects/m3-v121-art/art-review.json').read_text());expected={a['file']:a['sha256'] for a in old['artifacts']}
names=['plate-fixed-foods.png','rice-A.png','rice-B.png','rice-C.png','paddle-empty.png','paddle-loaded.png']
for name in names:
 source=source_root/'assets'/name
 if not source.exists():source=source_root/'assets/original'/name
 assert sha(source)==expected['assets/'+name],name
 shutil.copyfile(source,original/name)
provenance=json.loads((P/'projects/interaction-v123/payload-provenance.json').read_text());active=next(c for c in provenance['candidates'] if c['id']==provenance['active']);payload_relative=active['file']
(public/'assets/generated').mkdir(exist_ok=True)
for candidate in provenance['candidates']:
 src=OUT/candidate['file']
 if not src.exists():src=source_root/candidate['file']
 if src.exists():shutil.copyfile(src,public/candidate['file'])
if not (public/payload_relative).exists():raise ValueError('Missing active generated payload; use the private asset package')
inputs=[('rice-A.png','original/rice-A.png'),('paddle-empty.png','original/paddle-empty.png'),('payload.png',payload_relative.removeprefix('assets/'))]
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(public)));threading.Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);page=browser.new_page(device_scale_factor=1)
  for outname,relative in inputs:
   source=public/'assets'/relative;w,h=Image.open(source).size
   html=f'''<!doctype html><style>html,body{{margin:0;background:transparent}}img{{position:absolute;left:0;top:0;width:{w}px;height:{h}px;filter:url(#edge)}}</style><svg width="0" height="0"><defs><filter id="edge" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feComponentTransfer><feFuncA type="table" tableValues="0 0 .18 .3 .4 .5 .6 .7 .8 .9 1"/></feComponentTransfer></filter></defs></svg><img src="assets/{relative}">'''
   filename='prepare-'+outname+'.html';(public/filename).write_text(html);page.set_viewport_size({'width':w,'height':h});page.goto(f'http://127.0.0.1:{server.server_address[1]}/{filename}');page.evaluate('Promise.all([...document.images].map(i=>i.decode()))');page.screenshot(path=str(derived/outname),omit_background=True)
  browser.close()
finally:server.shutdown();server.server_close()
checks=[]
for outname,relative in inputs:
 a=Image.open(public/'assets'/relative).convert('RGBA');b=Image.open(derived/outname).convert('RGBA');pairs=list(zip(a.get_flattened_data(),b.get_flattened_data()));core=[(x,y) for x,y in pairs if x[3]>=240];delta=max(max(abs(x[i]-y[i]) for i in range(4)) for x,y in core);assert delta<=1 and all(x[3]==y[3] for x,y in core)
 checks.append({'file':'assets/derived/'+outname,'source':'assets/'+relative,'source_sha256':sha(public/'assets'/relative),'sha256':sha(derived/outname),'dimensions':list(a.size),'high_alpha_alpha_preserved':True,'high_alpha_max_RGBA_delta':delta,'high_alpha_RGBA_exact':all(x==y for x,y in core),'cleanup':'same low-alpha-only recipe as V1.2.2, no RGB painting or geometry edit'})
payload=Image.open(derived/'payload.png');bounds=payload.getchannel('A').point(lambda v:255 if v>32 else 0).getbbox();anchor=[(bounds[0]+bounds[2])/2,(bounds[1]+bounds[3])/2]
layout=json.loads((P/'projects/m3-v121-art/art-layout.json').read_text());a=layout['states'][0]['display'];receiver=[(a['left']-40)*.54,180+(a['top']-450)*.54,a['width']*.54,a['height']*.54]
config={'version':'1.2.3','scope':'private_interaction_research_only','width':540,'height':960,'fps':30,'frames':90,'base':{'asset':'assets/original/plate-fixed-foods.png','rect':[0,180,540,540]},'receiver':{'asset':'assets/derived/rice-A.png','rect':receiver,'contactPoint':[300,580]},'carrier':{'asset':'assets/derived/paddle-empty.png','sourceSize':list(Image.open(derived/'paddle-empty.png').size),'anchor':[315,500],'scale':.23},'payload':{'asset':'assets/derived/payload.png','sourceSize':list(payload.size),'anchor':anchor,'scale':67/(bounds[2]-bounds[0]),'attachOffset':[0,-3],'rest':[329,582]},'timing':{'enter':6,'touch':27,'release':36,'separate':60,'exit':82},'path':{'start':[625,280],'approachControls':[[580,360],[405,445]],'touch':[337,558],'release':[334,565],'separate':[415,515],'exitControls':[[490,470],[580,340]],'exit':[650,250]},'public_use_approved':False,'motion_model':'one cohesive payload, continuously attached then slid off against receiver; no granular physics claim','food_opacity':1,'food_scale_changes':False,'physical_measurement':False}
project=P/'projects/interaction-v123';project.mkdir(exist_ok=True)
(project/'config.json').write_text(json.dumps(config,ensure_ascii=False,indent=2)+'\n')
manifest={'version':'1.2.3','originals':[{'file':'assets/original/'+name,'sha256':sha(original/name)} for name in names],'new_generated_payload':{'file':payload_relative,'sha256':sha(public/payload_relative),'method':'built-in image_gen.imagegen edits; exact reference chain and rejected revision recorded in payload-provenance.json','original_saved_path':active['generated_original'],'model_and_seed':'not exposed','wood_in_payload':'pending visual audit'},'derived':checks,'old_art_overwritten':False,'old_rice_B_C_used_for_replacement':False,'old_loaded_paddle_used_in_animation':False,'public_use_approved':False}
(project/'assets.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print('Verified 6 originals; prepared one fixed carrier and one separate new payload; intermediates pending')
