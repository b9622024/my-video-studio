"""Mobile Chromium test with synthetic metadata. Not a live Pixabay/Safari claim."""
from pathlib import Path
import json
from playwright.sync_api import sync_playwright
O=Path('/workspace/outputs/broll-pipeline-v1');O.mkdir(exist_ok=True)
checks=[]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 context=browser.new_context(viewport={'width':393,'height':852},is_mobile=True,has_touch=True,device_scale_factor=2,accept_downloads=True)
 context.route('https://**/*',lambda route:route.abort())
 page=context.new_page();errors=[];page.on('pageerror',lambda err:errors.append(str(err)))
 page.goto('http://127.0.0.1:3111/');page.get_by_role('button',name='Approve｜採用').click();assert '採用前' in page.locator('#message').inner_text();checks.append('incomplete approval blocked')
 page.get_by_role('button',name='Reject｜排除').click();assert 'rejected' in page.locator('.status').inner_text();checks.append('Reject changes state')
 page.get_by_label('實際動作描述').fill('TEST FIXTURE ONLY: served food into a container')
 page.get_by_role('checkbox').nth(0).check();page.get_by_role('checkbox').nth(1).check()
 page.get_by_role('button',name='Approve｜採用').click();assert 'approved' in page.locator('.status').inner_text();checks.append('Approve changes state')
 page.get_by_role('button',name='切換9:16預覽').click();assert page.locator('.frame').evaluate('e=>e.classList.contains("crop-mode")');checks.append('9:16 preview toggle')
 page.get_by_label('9:16 主體水平位置').fill('0.3');assert 'pending' in page.locator('.status').inner_text();checks.append('editing invalidates previous approval')
 page.get_by_role('button',name='Approve｜採用').click()
 with page.expect_download() as info:page.get_by_role('button',name='匯出審核結果 JSON',exact=True).click()
 download=info.value;download.save_as(O/'TEST-ONLY-review-results.json');review=json.loads((O/'TEST-ONLY-review-results.json').read_text());assert review['decisions'][0]['status']=='approved' and review['decisions'][0]['crop_parameters']['object_position_x']==.3;assert review['candidate_set_id']=='fixture-ui-only';checks.append('review JSON download contains approved action/trim/crop')
 assert json.loads(page.locator('#export-fallback').input_value())['decisions'][0]['status']=='approved';checks.append('Safari copy fallback JSON')
 page.get_by_label('新的英文動作搜尋詞').fill('a');page.get_by_role('button',name='Search Again｜加入請求').click();assert '4–100' in page.locator('#message').inner_text();checks.append('invalid search request blocked')
 page.get_by_label('新的英文動作搜尋詞').fill('packing lunch box')
 with page.expect_download() as info:page.get_by_role('button',name='Search Again｜加入請求').click()
 info.value.save_as(O/'TEST-ONLY-search-again.json');request=json.loads((O/'TEST-ONLY-search-again.json').read_text());assert request['requests'][0]['queries']==['packing lunch box'];checks.append('Search Again exports an actionable request')
 with page.expect_download() as info:page.get_by_role('button',name='匯出重新搜尋請求',exact=True).click()
 assert json.loads(Path(info.value.path()).read_text())['requests'][0]['scene_id']=='A';checks.append('global search export')
 page.reload();assert 'approved' in page.locator('.status').inner_text();checks.append('localStorage retains current revision review')
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth');checks.append('393px mobile viewport no horizontal overflow')
 page.screenshot(path=str(O/'TEST-ONLY-mobile-review.png'),full_page=True)
 page.goto('http://127.0.0.1:3110/');assert page.locator('main section').count()==3;assert page.locator('.candidate').count()==0;assert 'blocked' in page.locator('#run-status').inner_text();checks.append('real project shows empty blocked state, no fictional candidates')
 page.screenshot(path=str(O/'bento-review-current.png'),full_page=True)
 assert not errors,errors
 browser.close()
report={'engine':'Existing Chromium, iPhone-sized touch viewport393x852','physical_iPhone_Safari_tested':False,'WebKit_available':False,'fixtures':'Synthetic metadata only; not search results or real approvals','checks':checks,'page_errors':errors,'status':'PASS'}
(O/'ui-test-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps(report,ensure_ascii=False,indent=2))
