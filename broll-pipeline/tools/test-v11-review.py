"""File-based review test; no local server, no approval import."""
from pathlib import Path
import json,subprocess,threading
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];approval_file=ROOT/'projects/bento-v11/approved-assets.json';approval_before=approval_file.read_bytes() if approval_file.exists() else None;OUT=Path('/workspace/outputs/broll-v11-review');checks=[];media=[]
for name in ['A1','A2','B1','C1']:
 m=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(OUT/(name+'.mp4'))]))
 assert abs(float(m['format']['duration'])-4)<.15
 assert any(s['codec_type']=='video' and s['codec_name']=='h264' for s in m['streams'])
 media.append({'id':name,'duration':float(m['format']['duration']),'codec':'h264'})
class Handler(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Handler,directory=str(OUT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);ctx=browser.new_context(viewport={'width':393,'height':852},is_mobile=True,has_touch=True,accept_downloads=True);page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto('http://127.0.0.1:'+str(server.server_port)+'/review.html')
 for i,v in enumerate(page.locator('video').all()):
  v.evaluate('v=>{v.scrollIntoView();v.load();}');v.evaluate('v=>v.play()');page.wait_for_function('(i)=>{let v=document.querySelectorAll("video")[i];return v.readyState>=2&&v.videoWidth>0&&v.currentTime>.1}',arg=i);v.evaluate('v=>v.pause()')
 for image in page.locator('img').all():assert image.evaluate('async i=>{await i.decode();return i.naturalWidth>0}')
 page.locator('#A').select_option('A1');page.locator('#B').select_option('B2');page.locator('#C').select_option('C1')
 with page.expect_download() as info:page.get_by_role('button',name='匯出選片請求').click()
 req=json.loads(Path(info.value.path()).read_text());assert req['provenance']=='selection_request_not_formal_approval';assert req['selections'][1]['option_id']=='B2';assert json.loads(page.locator('textarea').input_value())==req
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth');assert not errors
 browser.close()
server.shutdown()
assert (approval_file.read_bytes() if approval_file.exists() else None)==approval_before
report={'status':'PASS','real_candidate_media':media,'file_uri_playback_verified':False,'file_uri_limitation':'managed Chromium policy ERR_BLOCKED_BY_ADMINISTRATOR; not bypassed','local_http_media_playback_verified':True,'html_request_export':'PASS','formal_approval_created':False,'physical_iPhone_Safari_tested':False,'engine':'Chromium 393x852 touch, private local HTTP for QA only; user may reply with IDs directly','rendered_12_second_film':False}
(ROOT/'docs/v11/review-test.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps(report,ensure_ascii=False,indent=2))
