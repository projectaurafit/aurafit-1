"""Real Chromium QA. Requires Python playwright and a locally served project.
Run: python tests/browser_qa.py --url http://127.0.0.1:8124 --phase baseline
Override CHROME_PATH when the installed Playwright browser differs from its cache.
"""
import argparse, json, os
from pathlib import Path
from playwright.sync_api import sync_playwright

p = argparse.ArgumentParser()
p.add_argument('--url', default='http://127.0.0.1:8124')
p.add_argument('--phase', default='final')
args = p.parse_args()
out = Path(__file__).parent / 'artifacts' / args.phase
out.mkdir(parents=True, exist_ok=True)
report = {'routes': [], 'flows': [], 'errors': []}

with sync_playwright() as pw:
    cached = Path(os.environ.get('LOCALAPPDATA', '')) / 'ms-playwright/chromium-1208/chrome-win64/chrome.exe'
    executable = os.environ.get('CHROME_PATH') or (str(cached) if cached.exists() else None)
    browser = pw.chromium.launch(headless=True, executable_path=executable)
    context = browser.new_context(viewport={'width':390,'height':844}, service_workers='block', reduced_motion='reduce')
    context.route('https://fonts.googleapis.com/**', lambda route: route.abort())
    page = context.new_page()
    page.set_default_timeout(5000)
    page.on('pageerror', lambda e: report['errors'].append(str(e)))
    def route(path):
        page.evaluate('(hash) => Router.go(hash)', '#/' + path)
        page.wait_for_timeout(180)
    page.goto(args.url + '/index.html#/login',wait_until='domcontentloaded',timeout=15000)
    for width in [320,390,768,1440]:
        page.set_viewport_size({'width':width,'height':844})
        for theme in ['light','dark']:
            page.evaluate('(theme)=>{Store.state.theme=theme;Store.save();document.documentElement.dataset.theme=theme}',theme)
            for path in ['start','login','signup','forgot']:
                route(path)
                result=page.evaluate("""()=>({width:innerWidth,docWidth:document.documentElement.scrollWidth,empty:!document.querySelector('#root').textContent.trim(),unlabelled:[...document.querySelectorAll('button')].filter(b=>b.getBoundingClientRect().width&&!b.textContent.trim()&&!b.getAttribute('aria-label')&&!b.title).map(b=>b.outerHTML.slice(0,160))})""")
                report['routes'].append(dict(route=path,theme=theme,**result))
                if width in [390,1440] and path=='login':
                    page.screenshot(path=str(out/f'{width}-{theme}-login.png'),full_page=True)
    route('login')
    page.locator('#email').fill('user@aurafit.app')
    page.locator('#pass').fill('User@123')
    page.locator('form button[type=submit]').click()
    page.wait_for_timeout(900)
    page.evaluate("Store.updateUser({onboarded:true,gender:'male'}); Router.go('#/home')")
    page.wait_for_timeout(200)
    item, outfit = page.evaluate('[Store.state.wardrobe[0].id, Store.state.outfits[0].id]')
    routes = ['home','wardrobe','wardrobe?mode=outfits','item/'+item,'outfit/'+outfit,'add','add?mode=outfit','ideas','account','stats','onboarding']
    for width in [320,390,768,1440]:
        page.set_viewport_size({'width':width,'height':900 if width>400 else 844})
        for theme in ['light','dark']:
            page.evaluate('(theme) => {Store.state.theme=theme; Store.save(); document.documentElement.dataset.theme=theme}', theme)
            for path in routes:
                route(path)
                result = page.evaluate("""() => ({width:innerWidth,docWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,empty:!document.querySelector('#root')?.textContent.trim(),unlabelled:[...document.querySelectorAll('button')].filter(b=>b.getBoundingClientRect().width && !b.textContent.trim() && !b.getAttribute('aria-label') && !b.getAttribute('title')).map(b=>b.outerHTML.slice(0,160))})""")
                report['routes'].append(dict(route=path,theme=theme,**result))
                if path in ['home','wardrobe','add','ideas','account'] and width in [390,1440]:
                    page.screenshot(path=str(out / f'{width}-{theme}-{path}.png'), full_page=True)
    page.set_viewport_size({'width':390,'height':844})
    def check(name, fn):
        try:
            fn()
            report['flows'].append({'name':name,'pass':True})
        except Exception as e:
            report['flows'].append({'name':name,'pass':False,'error':str(e)[:1500]})
    def assert_js(js):
        assert page.evaluate(js), js
    def item_crud():
        route('add')
        page.locator('#f-name').fill('QA Linen Shirt')
        page.locator('[data-form] button[type=submit]').click()
        page.wait_for_timeout(200)
        assert_js("Store.state.wardrobe.some(i=>i.name==='QA Linen Shirt')")
        page.locator('[data-go^="#/add?edit="]').click()
        page.wait_for_timeout(200)
        page.locator('#f-name').fill('QA Edited Shirt')
        page.locator('[data-form] button[type=submit]').click()
        page.wait_for_timeout(200)
        assert_js("Store.state.wardrobe.some(i=>i.name==='QA Edited Shirt')")
    check('item create and edit through buttons',item_crud)
    def search_back():
        route('wardrobe')
        page.locator('[data-search-toggle]').click()
        page.locator('[data-search]').fill('QA Edited')
        page.wait_for_timeout(300)
        page.locator('[data-body] .itemcard').first.click()
        page.wait_for_timeout(150)
        page.go_back()
        page.wait_for_timeout(250)
        assert page.locator('[data-search]').input_value()=='QA Edited'
    check('wardrobe search survives item and Back',search_back)
    def modal_focus():
        route('outfit/'+outfit)
        page.locator('[data-remove]').click()
        page.wait_for_timeout(250)
        assert_js("!!document.activeElement.closest('[role=dialog]')")
        for _ in range(5): page.keyboard.press('Tab')
        assert_js("!!document.activeElement.closest('[role=dialog]')")
        page.keyboard.press('Escape')
        page.wait_for_timeout(250)
        assert_js("document.activeElement.matches('[data-remove]')")
    check('confirm modal traps and restores keyboard focus',modal_focus)
    page.keyboard.press('Escape')
    page.wait_for_timeout(250)
    def sheet_flow():
        route('item/'+item)
        page.locator('[data-similar]').click()
        page.wait_for_timeout(450)
        assert_js("!!document.activeElement.closest('.sheet')")
        page.locator('.prodcard').first.click()
        page.locator('.sheet [data-save]').click()
        assert_js("Store.state.savedProducts.length===1")
        assert page.locator('.sheet [data-save]').get_attribute('aria-pressed')=='true'
        page.keyboard.press('Escape')
        page.wait_for_timeout(450)
        assert_js("document.activeElement.matches('[data-similar]')")
    check('recommendation sheet save and keyboard focus',sheet_flow)
    page.keyboard.press('Escape')
    page.wait_for_timeout(450)
    def outfit_edit():
        route('outfit/'+outfit)
        page.locator('[data-edit]').click()
        page.wait_for_timeout(250)
        assert page.locator('#o-name').count()==1
        page.locator('#o-name').fill('QA Edited Look')
        page.locator('[data-saveoutfit]').click()
        page.wait_for_timeout(250)
        assert_js("Store.getOutfit('"+outfit+"').name==='QA Edited Look'")
    check('outfit Edit opens full builder and updates existing outfit',outfit_edit)
    page.keyboard.press('Escape')
    page.wait_for_timeout(250)
    def corrupt_photo():
        route('add')
        page.locator('[data-file]').set_input_files({'name':'broken.png','mimeType':'image/png','buffer':b'not an image'})
        page.wait_for_timeout(300)
        assert page.locator('.dropzone img').count()==0
    check('corrupt image rejected without broken preview',corrupt_photo)
    def favourite_revisit():
        route('ideas')
        button=page.locator('[data-save-look]').first
        if button.get_attribute('aria-pressed')!='true': button.click()
        label=button.get_attribute('aria-label')
        route('home')
        route('ideas')
        assert page.get_by_role('button',name=label,exact=True).get_attribute('aria-pressed')=='true'
    check('idea favourite remains selected after revisiting',favourite_revisit)
    def preferences_skip():
        before=page.evaluate('JSON.stringify(Store.user().prefs)')
        route('onboarding')
        page.locator('[data-val]').first.click()
        page.locator('[data-skip]').click()
        page.wait_for_timeout(200)
        assert page.evaluate('JSON.stringify(Store.user().prefs)')==before
    check('cancel preference editing preserves existing preferences',preferences_skip)
    def async_navigation():
        route('ideas')
        page.locator('[data-ask]').fill('office look')
        page.locator('[data-generate]').click()
        route('home')
        before=page.locator('#root').inner_text()
        page.wait_for_timeout(1500)
        assert page.locator('#root').inner_text()==before
    check('leaving stylist during generation does not alter next screen',async_navigation)
    def create_plan_delete():
        route('add?mode=outfit')
        page.locator('#o-name').fill('QA Weekend Set')
        page.locator('[data-toggle]').nth(0).click()
        page.locator('[data-toggle]').nth(1).click()
        page.locator('[data-saveoutfit]').click()
        page.wait_for_timeout(200)
        outfit_id=page.evaluate("Store.state.outfits.find(o=>o.name==='QA Weekend Set').id")
        page.locator('[data-wear]').click()
        page.wait_for_timeout(200)
        assert page.evaluate('Store.planFor(Store.dateKey()).id')==outfit_id
        route('outfit/'+outfit_id)
        page.locator('[data-remove]').click()
        page.locator('[data-yes]').click()
        page.wait_for_timeout(250)
        assert page.evaluate('(id)=>Store.getOutfit(id)===null',outfit_id)
        assert_js('Store.planFor(Store.dateKey())===null')
    check('create outfit, plan today, remove and clean calendar',create_plan_delete)
    def draft_guard():
        route('add')
        page.locator('#f-name').fill('Unsaved QA draft')
        page.locator('.tabbar [data-go="#/home"]').click()
        page.wait_for_timeout(100)
        assert page.locator('[role=dialog]').count()==1
        page.locator('[data-no]').click()
        page.wait_for_timeout(250)
        assert page.locator('#f-name').input_value()=='Unsaved QA draft'
        page.locator('.tabbar [data-go="#/home"]').click()
        page.locator('[data-yes]').click()
        page.wait_for_timeout(250)
        assert page.evaluate('location.hash')=='#/home'
        assert_js("!Store.state.wardrobe.some(i=>i.name==='Unsaved QA draft')")
    check('dirty item form keeps draft on cancel and discards only after confirmation',draft_guard)
    def long_text():
        page.evaluate("Store.updateItem(Store.state.wardrobe[0].id,{name:'VeryLongUnbrokenWardrobeItemName'.repeat(12),notes:'LongNotes'.repeat(100)});Store.updateUser({name:'VeryLongUnbrokenUserName'.repeat(12)})")
        for path in ['home','account','item/'+item,'wardrobe']:
            route(path)
            assert_js('document.documentElement.scrollWidth<=innerWidth')
    check('long user content does not overflow mobile viewport',long_text)
    page.goto(args.url + '/admin.html',wait_until='domcontentloaded',timeout=15000)
    page.evaluate('Store.logout(); Router.refresh()')
    page.locator('#email').fill('admin@aurafit.app')
    page.locator('#pass').fill('Admin@123')
    page.locator('form button[type=submit]').click()
    page.wait_for_timeout(700)
    for width in [320,390,768,1440]:
        page.set_viewport_size({'width':width,'height':844})
        for theme in ['light','dark']:
            page.evaluate('(theme)=>{Store.state.theme=theme;Store.save();document.documentElement.dataset.theme=theme}',theme)
            for path in ['admin','admin/users','admin/smtp','admin/emails','admin/settings']:
                route(path)
                result=page.evaluate("""()=>({width:innerWidth,docWidth:document.documentElement.scrollWidth,empty:!document.querySelector('#root').textContent.trim(),unlabelled:[...document.querySelectorAll('button')].filter(b=>b.getBoundingClientRect().width&&!b.textContent.trim()&&!b.getAttribute('aria-label')&&!b.title).map(b=>b.outerHTML.slice(0,160))})""")
                report['routes'].append(dict(route=path,theme=theme,**result))
                if width in [390,1440] and path in ['admin','admin/users']:
                    page.screenshot(path=str(out/f'{width}-{theme}-{path.replace("/","-")}.png'),full_page=True)
    context.close()
    browser.close()

report['summary']={'route_checks':len(report['routes']),'overflow':sum(r['docWidth']>r['width'] for r in report['routes']),'empty':sum(r['empty'] for r in report['routes']),'unlabelled':sum(bool(r['unlabelled']) for r in report['routes']),'flows_passed':sum(f['pass'] for f in report['flows']),'flows_total':len(report['flows']),'runtime_errors':len(report['errors'])}
(out/'report.json').write_text(json.dumps(report,indent=2),encoding='utf8')
print(json.dumps(report['summary'],indent=2))
print(json.dumps(report['flows'],indent=2))
raise SystemExit(1 if report['summary']['overflow'] or report['summary']['empty'] or report['errors'] or any(not f['pass'] for f in report['flows']) else 0)
