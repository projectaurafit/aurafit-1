"""Exercise the console UI in disposable browser contexts; never touch real accounts."""
import json, os
from pathlib import Path
from playwright.sync_api import sync_playwright

OUT = Path(__file__).parent / 'artifacts/admin-review'
OUT.mkdir(parents=True, exist_ok=True)
BASE = os.environ.get('AURA_QA_URL', 'http://127.0.0.1:8124')
report = {'flows': [], 'layouts': [], 'errors': []}
with sync_playwright() as pw:
    cached = Path(os.environ.get('LOCALAPPDATA', '')) / 'ms-playwright/chromium-1208/chrome-win64/chrome.exe'
    browser = pw.chromium.launch(headless=True, executable_path=str(cached) if cached.exists() else None)
    for entry in ['admin.html', 'admin-preview.html']:
        ctx = browser.new_context(service_workers='block', reduced_motion='reduce', viewport={'width':390,'height':844})
        ctx.route('https://fonts.googleapis.com/**', lambda route: route.abort())
        page = ctx.new_page()
        page.set_default_timeout(7000)
        page.on('pageerror', lambda e: report['errors'].append(str(e)))
        page.goto(BASE + '/' + entry, wait_until='domcontentloaded')
        def route(path):
            page.evaluate('(h) => Router.go(h)', '#/' + path)
        def check(name):
            report['flows'].append({'entry':entry, 'name':name, 'pass':True})
        def confirm():
            page.locator('.modal-scrim.is-open [data-yes]').click()
            page.wait_for_timeout(250)
        def login(email='admin@aurafit.app', password='Admin@123'):
            page.locator('#email').fill(email)
            page.locator('#pass').fill(password)
            page.locator('form button[type=submit]').click()
        def menu(email, action):
            page.locator('[data-menu="' + email + '"]').click()
            page.locator('.adm-menu.is-open [data-act="' + action + '"]').click()
        login('user@aurafit.app', 'User@123')
        assert page.evaluate('Store.user() === null')
        login(password='incorrect')
        assert page.locator('[data-field=pass]').get_attribute('class').endswith('has-err')
        page.locator('[data-peek]').click()
        assert page.locator('#pass').get_attribute('type') == 'text'
        login()
        assert page.evaluate('location.hash') == '#/admin'
        check('admin sign-in, validation, password visibility, user rejection')
        for width in [320,390,768,1024,1440]:
            page.set_viewport_size({'width':width,'height':844})
            for theme in ['light','dark']:
                page.evaluate('(t) => Store.setTheme(t)', theme)
                for path in ['admin','admin/users','admin/smtp','admin/emails','admin/settings']:
                    route(path)
                    result = page.evaluate('''() => ({overflow:document.documentElement.scrollWidth > innerWidth,
                        blank:!document.querySelector('#root').textContent.trim(),
                        unnamed:[...document.querySelectorAll('button')].filter(b => b.getBoundingClientRect().width && !b.textContent.trim() && !b.getAttribute('aria-label') && !b.title).length})''')
                    assert not any(result.values()), (entry,width,theme,path,result)
                    report['layouts'].append({'entry':entry,'width':width,'theme':theme,'route':path,**result})
                    if entry == 'admin.html' and width in [390,1440]:
                        page.screenshot(path=str(OUT / f'{width}-{theme}-{path.replace("/","-")}.png'), full_page=True)
        page.set_viewport_size({'width':390,'height':844})
        route('admin/users')
        page.locator('[data-create-panel] summary').click()
        for id, value in [('new-name','Test Member'),('new-email','member@example.com'),('new-pass','Member@123')]:
            page.locator('#' + id).fill(value)
        page.locator('[data-create-user] button[type=submit]').click()
        assert page.evaluate("Store.user().email === 'admin@aurafit.app' && Store.state.users['member@example.com'].role === 'user'")
        page.locator('[data-q]').fill('member@example.com')
        assert page.locator('tbody tr').count() == 1
        page.locator('[data-view="member@example.com"]').click()
        assert 'Gender' in page.locator('.adm-modal').inner_text()
        page.keyboard.press('Escape')
        page.wait_for_timeout(250)
        menu('member@example.com','role')
        assert page.evaluate("Store.state.users['member@example.com'].role === 'admin'")
        menu('member@example.com','role')
        menu('member@example.com','status')
        assert page.evaluate("!Store.login('member@example.com','Member@123').ok")
        page.locator('[data-filter=suspended]').click()
        assert page.locator('[data-filter=suspended]').get_attribute('aria-pressed') == 'true'
        menu('member@example.com','status')
        page.locator('[data-filter=all]').click()
        page.locator('[data-q]').fill('no-matching-user')
        page.locator('[data-clear]').click()
        assert page.locator('tbody tr').count() == 3
        menu('member@example.com','password')
        page.locator('#admin-current').fill('bad-password')
        page.locator('#account-password').fill('Updated@123')
        page.locator('#account-confirm').fill('Updated@123')
        page.locator('.adm-modal button[type=submit]').click()
        assert page.evaluate("Store.state.users['member@example.com'].pass === 'Member@123'")
        page.locator('#admin-current').fill('Admin@123')
        page.locator('.adm-modal button[type=submit]').click()
        assert page.evaluate("Store.state.users['member@example.com'].pass === 'Updated@123'")
        page.locator('[data-menu="admin@aurafit.app"]').click()
        for action in ['role','status','delete']:
            assert page.locator('.adm-menu.is-open [data-act='+action+']').is_disabled()
        page.keyboard.press('Escape')
        check('create user, search, filters, details, role, suspension, password reset, owner protection')
        route('admin/settings')
        page.locator('#set-appname').fill('Test Studio')
        route('admin')
        page.locator('.modal-scrim.is-open [data-no]').click()
        page.wait_for_timeout(250)
        assert page.locator('#set-appname').input_value() == 'Test Studio'
        page.locator('[data-general] button[type=submit]').click()
        route('admin')
        route('admin/settings')
        assert page.locator('#set-appname').input_value() == 'Test Studio'
        for toggle in ['allowSignups','maintenance']:
            page.locator('[data-toggle='+toggle+']').click()
            assert page.evaluate("!Store.register('Blocked','blocked@example.com','Blocked@123').ok")
            if toggle == 'maintenance':
                assert page.evaluate("!Store.login('member@example.com','Updated@123').ok")
            page.locator('[data-toggle='+toggle+']').click()
        assert page.locator('[data-toggle=socialLogin]').is_disabled()
        assert page.locator('[data-toggle=requireVerify]').is_disabled()
        page.locator('[data-own-password]').click()
        page.locator('#admin-current').fill('Admin@123')
        page.locator('#account-password').fill('OwnerNew@123')
        page.locator('#account-confirm').fill('OwnerNew@123')
        page.locator('.adm-modal button[type=submit]').click()
        page.locator('[data-signout]:visible').first.click()
        confirm()
        login(password='Admin@123')
        assert page.evaluate('Store.user() === null')
        login(password='OwnerNew@123')
        assert page.evaluate('location.hash') == '#/admin'
        check('settings persistence, unsaved navigation, signup and maintenance gates, own password and mobile sign-out')
        route('admin/smtp')
        page.locator('[data-save]').click()
        assert page.locator('#smtp-host').get_attribute('aria-invalid') == 'true'
        for preset, host in [('gmail','smtp.gmail.com'),('outlook','smtp.office365.com'),('sendgrid','smtp.sendgrid.net'),('mailgun','smtp.mailgun.org')]:
            page.locator('[data-preset='+preset+']').click()
            assert page.locator('#smtp-host').input_value() == host
        page.locator('#smtp-fromemail').fill('test@example.com')
        page.locator('#smtp-port').fill('587.5')
        page.locator('[data-save]').click()
        assert page.locator('#smtp-port').get_attribute('aria-invalid') == 'true'
        page.locator('#smtp-port').fill('587')
        page.locator('[data-test]').click()
        page.wait_for_function('Store.state.smtp.testOk === true')
        assert 'Demo test passed' in page.locator('[data-pill]').inner_text()
        page.locator('#smtp-host').fill('localhost')
        page.locator('[data-test]').click()
        page.wait_for_function('Store.state.smtp.testOk === false')
        page.locator('#smtp-host').fill('smtp.example.com')
        page.locator('[data-test]').click()
        page.locator('#smtp-host').fill('smtp.changed.example')
        page.wait_for_timeout(1900)
        assert page.evaluate('Store.state.smtp.testedAt === null')
        route('admin/emails')
        confirm()
        check('SMTP validation, four presets, demo pass/fail and cancellation on edits')
        for template in ['welcome','verify','reset','changed']:
            page.locator('[data-tpl='+template+']').click()
            page.locator('#tpl-subject').fill('Hello {{name}} from {{app_name}}')
            page.locator('#tpl-body').fill('Safe <script>bad()</script> {{unknown}}')
            assert page.locator('.adm-var-miss').count() == 1
            assert page.locator('[data-preview] script').count() == 0
            page.locator('[data-var=name]').click()
            assert '{{name}}' in page.locator('#tpl-body').input_value()
            page.locator('[data-save]').click()
            assert page.evaluate('(t) => Store.state.emailTemplates[t].subject',template).startswith('Hello')
            page.locator('[data-reset]').click()
            confirm()
            assert page.locator('#tpl-subject').input_value() != 'Hello {{name}} from {{app_name}}'
        page.locator('#tpl-body').fill('Unsaved draft')
        page.locator('[data-tpl=welcome]').click()
        page.locator('.modal-scrim.is-open [data-no]').click()
        page.wait_for_timeout(250)
        assert page.locator('#tpl-body').input_value() == 'Unsaved draft'
        route('admin/settings')
        confirm()
        check('all four templates, variables, safe preview, save, reset and discard protection')
        with page.expect_download() as download:
            page.locator('[data-export]').click()
        exported = json.loads(Path(download.value.path()).read_text(encoding='utf-8'))
        assert exported['users']['member@example.com']['pass'] == 'Updated@123'
        check('JSON export includes updated accounts and settings')
        route('admin/users')
        menu('member@example.com','delete')
        confirm()
        assert page.evaluate("!Store.state.users['member@example.com'] && !Store.state.libraries['member@example.com']")
        route('admin/settings')
        previous_name = page.evaluate('Store.state.adminSettings.appName')
        page.locator('#set-appname').fill('Should not save')
        page.evaluate("() => { window.originalSetItem = Storage.prototype.setItem; Storage.prototype.setItem = () => { throw new Error('QuotaExceededError'); }; }")
        page.locator('[data-general] button[type=submit]').click()
        assert page.evaluate('Store.state.adminSettings.appName') == previous_name
        assert page.locator('#set-appname').input_value() == 'Should not save'
        page.evaluate('() => { Storage.prototype.setItem = window.originalSetItem; }')
        page.locator('#set-appname').fill(previous_name)
        check('storage failure preserves the draft and rolls back saved settings')
        page.locator('[data-reset-all]').click()
        confirm()
        assert page.evaluate('Store.user() === null')
        login()
        assert page.evaluate("Store.user().email === 'admin@aurafit.app'")
        check('delete account and reset demo data with working default sign-in')
        ctx.close()
    browser.close()
(OUT / 'report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
assert not report['errors'], report['errors']
print(f"PASS: {len(report['flows'])} admin flow groups, {len(report['layouts'])} layout checks, zero runtime errors")
