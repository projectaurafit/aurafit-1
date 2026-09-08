"""Profile selection: signup, persistence, account isolation and responsive UI."""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests/artifacts/gender'
OUT.mkdir(parents=True, exist_ok=True)
with sync_playwright() as pw:
    cached = Path(os.environ.get('LOCALAPPDATA', '')) / 'ms-playwright/chromium-1208/chrome-win64/chrome.exe'
    browser = pw.chromium.launch(headless=True, executable_path=str(cached) if cached.exists() else None)
    for entry in ['index.html', 'preview.html']:
        context = browser.new_context(service_workers='block', reduced_motion='reduce')
        context.route('https://fonts.googleapis.com/**', lambda route: route.abort())
        page = context.new_page()
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto((ROOT / entry).as_uri() + '#/signup')
        for field, value in [('name', 'Profile Test'), ('email', 'profile@example.com'), ('pass', 'DemoPass123!'), ('pass2', 'DemoPass123!')]:
            page.locator('#' + field).fill(value)
        page.locator('.a-check').click()
        page.locator('button[type=submit]').click()
        page.wait_for_selector('[data-gender]')
        assert page.locator('[data-gender-next]').is_disabled()
        page.evaluate("Router.go('#/home')")
        assert page.evaluate('location.hash') == '#/gender'
        page.locator('[data-gender=male]').focus()
        page.keyboard.press('Enter')
        assert page.locator('[data-gender=male]').get_attribute('aria-pressed') == 'true'
        page.locator('[data-gender=female]').click()
        assert page.locator('[data-gender=male]').get_attribute('aria-pressed') == 'false'
        for width in [320, 390, 768, 1440]:
            page.set_viewport_size({'width': width, 'height': 844})
            for theme in ['light', 'dark']:
                page.evaluate('(theme) => document.documentElement.dataset.theme = theme', theme)
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
                page.screenshot(path=str(OUT / f'{entry}-{width}-{theme}.png'), full_page=True)
        page.locator('[data-gender-next]').click()
        assert page.evaluate('Store.user().gender') == 'female'
        page.reload()
        assert page.evaluate('Store.user().gender') == 'female'
        page.evaluate("Router.go('#/onboarding')")
        page.locator('[data-skip]').click()
        assert page.evaluate('location.hash') == '#/home'
        page.evaluate("Router.go('#/account')")
        page.locator('[data-go="#/gender?edit=1"]').click()
        page.locator('[data-gender=male]').click()
        page.locator('[data-nav="#/account"]').click()
        assert page.evaluate('Store.user().gender') == 'female'
        page.locator('[data-go="#/gender?edit=1"]').click()
        page.locator('[data-gender=male]').click()
        page.locator('[data-gender-next]').click()
        assert page.evaluate('location.hash') == '#/account'
        assert page.evaluate('Store.user().gender') == 'male'
        page.evaluate("Store.logout(); Store.login('profile@example.com', 'DemoPass123!'); Router.go('#/home')")
        assert page.evaluate('location.hash') == '#/home'
        page.evaluate("Store.logout(); Store.login('user@aurafit.app', 'User@123'); Router.go('#/home')")
        assert page.evaluate('location.hash') == '#/gender'
        assert page.locator('[data-gender-next]').is_disabled()
        page.locator('[data-gender=male]').click()
        page.evaluate("() => { window.originalUpdateUser = Store.updateUser; Store.updateUser = () => { throw new Error('Storage full'); }; }")
        page.locator('[data-gender-next]').click()
        assert page.evaluate('location.hash') == '#/gender'
        page.evaluate('() => { Store.updateUser = window.originalUpdateUser; }')
        page.locator('[data-gender-next]').click()
        assert page.evaluate('location.hash') == '#/home'
        assert page.evaluate('Store.user().gender') == 'male'
        assert not errors, errors
        context.close()
    browser.close()
print('PASS: signup, both choices, keyboard, route guard, reload, sign-in, account isolation, save failure, and 16 responsive captures')
