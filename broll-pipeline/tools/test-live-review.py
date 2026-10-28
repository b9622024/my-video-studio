"""Verify real candidate UI without saving test decisions into the project."""
from pathlib import Path
import json
import urllib.request
import urllib.error
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = Path('/workspace/outputs/broll-live-review')
OUT.mkdir(parents=True, exist_ok=True)
data = json.loads((ROOT/'projects/bento-v1/broll-candidates.json').read_text())
checks = []
links = []
for scene in data['scenes']:
    for c in scene['candidates']:
        for field in ['source_url', 'thumbnail_url']:
            req = urllib.request.Request(c[field], method='HEAD')
            try:
                with urllib.request.urlopen(req, timeout=20) as r:
                    links.append({'candidate_id': c['candidate_id'], 'field': field,
                                  'url': c[field], 'status': r.status,
                                  'content_type': r.headers.get('Content-Type')})
            except urllib.error.HTTPError as e:
                links.append({'candidate_id': c['candidate_id'], 'field': field,
                              'url': c[field], 'status': e.code})
            except Exception as e:
                links.append({'candidate_id': c['candidate_id'], 'field': field,
                              'url': c[field], 'error_type': type(e).__name__})
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', headless=True,
                               args=['--no-sandbox'])
    context = browser.new_context(viewport={'width':393,'height':852}, is_mobile=True,
                                  has_touch=True, accept_downloads=True)
    # Media connectivity is checked separately above and by backend HEAD checks.
    context.route('https://**/*', lambda route: route.abort())
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda err: errors.append(str(err)))
    page.goto('http://127.0.0.1:3110/')
    assert page.locator('.candidate').count() == 9
    assert page.locator('main section').count() == 3
    for scene in data['scenes']:
        for c in scene['candidates']:
            card = page.locator(f'[data-scene="{scene["scene_id"]}"] [data-candidate="{c["candidate_id"]}"]')
            assert card.get_by_role('link', name='Pixabay 原始來源').get_attribute('href') == c['source_url']
            assert card.locator('video').get_attribute('poster') == c['thumbnail_url']
    checks.append('nine real candidates; all source hrefs and poster URLs match API metadata')
    card = page.locator('.candidate').first
    card.get_by_role('button',name='Approve｜採用').click()
    assert '採用前' in page.locator('#message').inner_text()
    card.get_by_role('button',name='Reject｜排除').click()
    assert 'rejected' in card.locator('.status').inner_text()
    card.get_by_label('實際動作描述').fill('AUTOMATED UI TEST ONLY; not a visual approval')
    card.get_by_role('checkbox').nth(0).check()
    card.get_by_role('checkbox').nth(1).check()
    card.get_by_role('button',name='Approve｜採用').click()
    assert 'approved' in card.locator('.status').inner_text()
    card.get_by_label('9:16 主體水平位置').fill('0.3')
    assert 'pending' in card.locator('.status').inner_text()
    # Invalidation keeps the previous decision payload until a new decision.
    card.get_by_role('button',name='Reject｜排除').click()
    card.get_by_role('button',name='切換9:16預覽').click()
    assert card.locator('.frame').evaluate('e=>e.classList.contains("crop-mode")')
    checks.append('incomplete approval blocked; Reject, Approve, crop toggle and invalidation work')
    with page.expect_download() as info:
        page.get_by_role('button',name='匯出審核結果 JSON',exact=True).click()
    exported = json.loads(Path(info.value.path()).read_text())
    assert exported['candidate_set_id'] == data['revision_id']
    assert exported['decisions'][0]['status'] == 'rejected'
    assert exported['decisions'][0]['crop_parameters']['object_position_x'] == .3
    assert json.loads(page.locator('#export-fallback').input_value()) == exported
    checks.append('review JSON download and copy fallback preserve current revision, status and crop')
    page.get_by_label('新的英文動作搜尋詞').first.fill('packing lunch box')
    with page.expect_download() as info:
        page.get_by_role('button',name='Search Again｜加入請求').first.click()
    request = json.loads(Path(info.value.path()).read_text())
    assert request['requests'][0] == {'scene_id':'A','queries':['packing lunch box']}
    checks.append('Search Again exports actionable scene A request')
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    assert not errors, errors
    # Discard all automation decisions, then capture pristine pending page.
    page.evaluate('localStorage.clear()')
    page.reload()
    assert all('pending' in text for text in page.locator('.status').all_inner_texts())
    page.screenshot(path=str(OUT/'bento-review-mobile.png'),full_page=True)
    browser.close()
report = {'candidate_set_id':data['revision_id'], 'ui_status':'PASS', 'checks':checks,
          'page_errors':errors, 'links':links, 'physical_iPhone_Safari_tested':False,
          'remote_media_rendering_tested':False, 'automated_decisions_discarded':True,
          'visual_approval_performed':False}
(OUT/'live-review-test.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps(report,ensure_ascii=False,indent=2))
