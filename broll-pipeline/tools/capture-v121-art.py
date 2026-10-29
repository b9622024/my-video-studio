"""Browser rendering of native alpha sprites and static layout, not food repainting."""
import pathlib,json,threading,http.server,functools
from playwright.sync_api import sync_playwright
P=pathlib.Path(__file__).resolve().parents[1];OUT=pathlib.Path('/workspace/outputs/broll-v121-art-review')
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(OUT)));threading.Thread(target=server.serve_forever,daemon=True).start();base=f'http://127.0.0.1:{server.server_address[1]}'
layout=json.loads((P/'projects/m3-v121-art/art-layout.json').read_text());checks=[]
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':1080,'height':1920},device_scale_factor=1)
  for s in layout['states']:
   page.set_viewport_size({'width':s['sprite_rect'][2],'height':724});page.goto(base+f"/export-rice-{s['id']}.html");page.evaluate('Promise.all([...document.images].map(i=>i.decode()))');page.screenshot(path=str(OUT/s['exported_asset']),omit_background=True)
  for key,width in [('empty',983),('loaded',1189)]:
   page.set_viewport_size({'width':width,'height':724});page.goto(base+f'/export-paddle-{key}.html');page.evaluate('Promise.all([...document.images].map(i=>i.decode()))');page.screenshot(path=str(OUT/f'assets/paddle-{key}.png'),omit_background=True)
  for s in layout['states']:
   page.set_viewport_size({'width':1080,'height':1920});page.goto(base+f"/State-{s['id']}.html");page.evaluate('document.fonts.ready');page.evaluate('Promise.all([...document.images].map(i=>i.decode()))')
   checks.append({'state':s['id'],'decoded':page.evaluate('[...document.images].every(i=>i.complete&&i.naturalWidth>0)'),'dimensions':[1080,1920]})
   page.screenshot(path=str(OUT/f"State-{s['id']}.png"))
   page.add_style_tag(content='.brand,.title,.state,.note{visibility:hidden}')
   page.screenshot(path=str(OUT/f"State-{s['id']}-art-only.png"))
  page.set_viewport_size({'width':1620,'height':960});page.goto(base+'/overview.html');page.evaluate('Promise.all([...document.images].map(i=>i.decode()))');page.screenshot(path=str(OUT/'overview.png'))
  browser.close()
finally:server.shutdown();server.server_close()
(P/'docs/v121/layout-checks.json').write_text(json.dumps(checks,indent=2)+'\n')
print('Captured three static states and native alpha sprite exports')
