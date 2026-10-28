"""Real local Pixabay media test. Automation decisions are discarded."""
from pathlib import Path
import json
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
OUT=Path('/workspace/outputs/broll-v101-tests');OUT.mkdir(exist_ok=True)
data=json.loads((ROOT/'projects/bento-v101/broll-candidates.json').read_text())
checks=[];errors=[];playback=[]
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
    ctx=browser.new_context(viewport={'width':393,'height':852},is_mobile=True,has_touch=True,accept_downloads=True)
    ctx.route('https://**/*',lambda r:r.abort())
    page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto('http://127.0.0.1:3112/')
    assert page.locator('.candidate').count()==6
    assert page.get_by_role('button',name='Approve｜採用',exact=True).locator('visible=true').count()==6
    assert page.locator('button:disabled').count()==5
    for i,card in enumerate(page.locator('.candidate').all()):
        video=card.locator('video')
        video.evaluate('v=>{v.scrollIntoView();v.load();}')
        video.evaluate('v=>v.play()')
        page.wait_for_function('(i)=>{const v=document.querySelectorAll("video")[i];return v.readyState>=2&&v.videoWidth>0&&v.currentTime>0.1}',arg=i)
        result=video.evaluate('v=>({url:v.getAttribute("src"),width:v.videoWidth,height:v.videoHeight,duration:v.duration,time:v.currentTime})')
        video.evaluate('v=>v.pause()');playback.append(result)
        poster=video.get_attribute('poster')
        assert page.evaluate('async url=>{const img=new Image();img.src=url;await img.decode();return img.naturalWidth>0}',poster)
        for img in card.locator('.evidence-frames img').all():
            img.scroll_into_view_if_needed()
            assert img.evaluate('async i=>{await i.decode();return i.naturalWidth>0}')
    checks.append('all six local mp4 files decoded and played; all posters and 18 evidence images decoded')
    card=page.locator('[data-scene="B"] [data-candidate="pixabay-11605"]')
    card.get_by_role('button',name='Approve｜採用').click()
    assert '採用前' in page.locator('#message').inner_text()
    card.get_by_role('button',name='Reject｜排除').click()
    assert 'rejected' in card.locator('.status').inner_text()
    card.get_by_label('實際動作描述').fill('AUTOMATED INTERFACE TEST ONLY: lifted cooked greens; not user approval')
    card.get_by_label('使用開始（秒）').fill('34')
    card.get_by_label('使用結束（秒）').fill('40')
    card.get_by_role('checkbox').nth(0).check();card.get_by_role('checkbox').nth(1).check()
    card.get_by_role('button',name='Approve｜採用').click()
    assert 'approved' in card.locator('.status').inner_text()
    card.get_by_role('button',name='切換9:16預覽').click()
    assert card.locator('.frame').evaluate('e=>e.classList.contains("crop-mode")')
    page.locator('[data-scene="A"] .candidate').first.get_by_role('button',name='Reject｜排除').click()
    with page.expect_download() as info:page.get_by_role('button',name='匯出審核結果 JSON',exact=True).click()
    review=json.loads(Path(info.value.path()).read_text())
    assert review['candidate_set_id']==data['revision_id']
    assert review['decisions'][0]['selected_trim']=={'start':34,'end':40}
    assert review['decisions'][0]['status']=='approved'
    assert review['decisions'][1]['status']=='rejected'
    assert json.loads(page.locator('#export-fallback').input_value())==review
    review['provenance']='automated_test_only_not_user_approval'
    (OUT/'TEST-ONLY-review.json').write_text(json.dumps(review,indent=2))
    card.get_by_label('9:16 主體水平位置').fill('0.3')
    assert 'pending' in card.locator('.status').inner_text()
    page.get_by_label('新的英文動作搜尋詞').first.fill('packing lunch box')
    with page.expect_download() as info:page.get_by_role('button',name='Search Again｜加入請求').first.click()
    request=json.loads(Path(info.value.path()).read_text())
    assert request['requests'][0]=={'scene_id':'A','queries':['packing lunch box']}
    page.reload();assert 'pending' in page.locator('[data-candidate="pixabay-11605"] .status').inner_text()
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    checks.append('Approve, Reject, required checks, crop, invalidation, persistence, Search Again and JSON export verified')
    # No automated approvals or re-search requests remain in the deliverable.
    page.evaluate('localStorage.clear()');page.reload()
    assert not errors,errors
    page.screenshot(path=str(OUT/'mobile-review.png'),full_page=True)
    browser.close()
report={'status':'PASS','engine':'Chromium 393x852 touch','physical_iPhone_Safari_tested':False,
        'checks':checks,'playback':playback,'page_errors':errors,'real_pixabay_media':True,
        'automated_decisions_discarded':True,'production_approval_performed':False}
(ROOT/'docs/test-results/v101-ui.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps(report,ensure_ascii=False,indent=2))
