"""Capture static HTML layouts only. Does not launch Remotion or encode video."""
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
import json,threading
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];OUT=Path('/workspace/outputs/broll-v112-design')
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(OUT)));threading.Thread(target=server.serve_forever,daemon=True).start();report=[]
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);page=browser.new_page(viewport={'width':1080,'height':1920},device_scale_factor=1)
  for ident in ['B-01','B-02','C-01','C-02']:
   for suffix in ['','-no-text']:
    page.goto(f'http://127.0.0.1:{server.server_port}/{ident}{suffix}.html');page.evaluate('document.fonts.ready');page.locator('img').evaluate('i=>i.decode()')
    assert page.locator('img').evaluate('i=>i.naturalWidth>0')
    assert page.evaluate('document.documentElement.scrollWidth===1080&&document.documentElement.scrollHeight===1920')
    if not suffix:
     bounds=page.locator('.brand,.eyebrow,.headline,.note').evaluate_all('els=>els.filter(e=>getComputedStyle(e).display!=="none").map(e=>{const r=e.getBoundingClientRect();return {class:e.className,x:r.x,y:r.y,width:r.width,height:r.height}})')
     assert all(b['x']>=0 and b['y']>=0 and b['x']+b['width']<=1080 and b['y']+b['height']<=1920 for b in bounds),bounds
     report.append({'id':ident,'text_bounds':bounds,'overflow':False})
    page.screenshot(path=str(OUT/(ident+suffix+'.jpg')),type='jpeg',quality=96)
  browser.close()
finally:server.shutdown()
(ROOT/'docs/v112/layout-checks.json').write_text(json.dumps({'static_capture':'PASS','canvas':[1080,1920],'remotion_invoked':False,'mp4_encoded':0,'checks':report},ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'static_designs':4,'no_text_variants':4,'no_overflow':True,'remotion_invoked':False}))
