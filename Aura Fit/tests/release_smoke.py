"""Verify generated documents and the actual offline app shell in Chromium."""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent
OUT = ROOT / 'artifacts' / 'release'
OUT.mkdir(parents=True, exist_ok=True)
BASE = os.environ.get('AURA_QA_URL', 'http://127.0.0.1:8124')
results = []

with sync_playwright() as pw:
    cached = Path(os.environ.get('LOCALAPPDATA', '')) / 'ms-playwright/chromium-1208/chrome-win64/chrome.exe'
    browser = pw.chromium.launch(headless=True, executable_path=os.environ.get('CHROME_PATH') or (str(cached) if cached.exists() else None))
    for name, email, password, route in [
        ('preview.html', 'user@aurafit.app', 'User@123', '#/home'),
        ('admin-preview.html', 'admin@aurafit.app', 'Admin@123', '#/admin'),
    ]:
        context = browser.new_context(service_workers='block', reduced_motion='reduce')
        context.route('https://fonts.googleapis.com/**', lambda route: route.abort())
        page = context.new_page()
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(BASE + '/' + name, wait_until='load')
        page.evaluate('([email,password,route]) => { Store.login(email,password); Store.updateUser({gender:"male"}); Router.go(route); }', [email,password,route])
        page.wait_for_timeout(1100)
        for width in [390, 1440]:
            page.set_viewport_size({'width': width, 'height': 844})
            assert page.evaluate("document.compatMode === 'CSS1Compat'")
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), name
            assert page.locator('#root').inner_text().strip()
            page.screenshot(path=str(OUT / f'{width}-{name}.png'), full_page=True)
            results.append({'document': name, 'width': width, 'pass': True})
        assert not errors, errors
        context.close()

    context = browser.new_context(reduced_motion='reduce')
    context.route('https://fonts.googleapis.com/**', lambda route: route.abort())
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(BASE + '/index.html', wait_until='load')
    page.evaluate('navigator.serviceWorker.ready')
    page.wait_for_function('navigator.serviceWorker.controller !== null')
    page.evaluate("Store.login('user@aurafit.app','User@123');Store.updateUser({gender:'male'});Router.go('#/wardrobe')")
    assert page.evaluate("caches.keys().then(keys=>keys.includes('aura-fit-v10'))")
    context.set_offline(True)
    page.goto(BASE + '/index.html?offline-check=1#/wardrobe', wait_until='load')
    page.wait_for_selector('.catgrid')
    assert page.locator('.catcard').count() > 0
    results.append({'offline': 'user wardrobe with query string', 'pass': True})
    page.goto(BASE + '/admin.html?offline-check=1', wait_until='load')
    page.evaluate("Store.login('admin@aurafit.app','Admin@123');Router.go('#/admin')")
    page.wait_for_timeout(300)
    assert page.locator('#root').inner_text().strip()
    assert page.evaluate("location.hash === '#/admin'")
    results.append({'offline': 'admin console with query string', 'pass': True})
    assert not errors, errors
    context.close()
    browser.close()

(OUT / 'report.json').write_text(json.dumps(results, indent=2), encoding='utf-8')
print(json.dumps(results, indent=2))
