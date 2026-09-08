"""Check actual favourite-control geometry and navigation in source and bundle."""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

out = Path(__file__).parent / 'artifacts' / 'card-alignment'
out.mkdir(parents=True, exist_ok=True)
results = []
with sync_playwright() as pw:
    cached = Path(os.environ.get('LOCALAPPDATA', '')) / 'ms-playwright/chromium-1208/chrome-win64/chrome.exe'
    browser = pw.chromium.launch(headless=True, executable_path=str(cached))
    for document in ['index.html', 'preview.html']:
        context = browser.new_context(service_workers='block', reduced_motion='reduce')
        page = context.new_page()
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto('http://127.0.0.1:8124/' + document, wait_until='load')
        page.evaluate("Store.login('user@aurafit.app','User@123');Router.go('#/wardrobe?mode=outfits')")
        for width in [320, 390, 768, 1440]:
            page.set_viewport_size({'width': width, 'height': 924})
            for theme in ['light', 'dark']:
                page.evaluate('(theme)=>document.documentElement.dataset.theme=theme', theme)
                page.wait_for_timeout(250)
                geometry = page.locator('.outfitcard').evaluate_all('''cards => cards.map(card => {
                    const b = card.querySelector('.fav').getBoundingClientRect();
                    const i = card.querySelector('.fav .ico').getBoundingClientRect();
                    const c = card.querySelector('.outfitcard__thumb').getBoundingClientRect();
                    return {width:b.width,height:b.height,top:b.top-c.top,right:c.right-b.right,
                        cx:Math.abs(i.x+i.width/2-b.x-b.width/2),cy:Math.abs(i.y+i.height/2-b.y-b.height/2)};
                })''')
                assert geometry
                for g in geometry:
                    assert abs(g['width'] - 44) < 1 and abs(g['height'] - 44) < 1, g
                    assert abs(g['top'] - 12) < 1 and abs(g['right'] - 12) < 1, g
                    assert g['cx'] < 1 and g['cy'] < 1, g
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
                page.screenshot(path=str(out / f'{document}-{width}-{theme}.png'), full_page=True)
                results.append({'document':document,'width':width,'theme':theme,'cards':len(geometry),'pass':True})
        fav = page.locator('.fav').first
        before = fav.get_attribute('aria-pressed')
        fav.click()
        assert fav.get_attribute('aria-pressed') != before
        assert page.evaluate("location.hash === '#/wardrobe?mode=outfits'")
        page.locator('.outfitcard__link').first.click()
        assert page.evaluate("location.hash.startsWith('#/outfit/')")
        page.evaluate("Router.go('#/wardrobe?mode=outfits')")
        assert page.locator('.fab').get_attribute('aria-label') == 'Create outfit'
        page.locator('.fab').click()
        assert page.evaluate("location.hash === '#/add?mode=outfit'")
        page.evaluate("Router.go('#/wardrobe')")
        assert page.locator('.fab').get_attribute('aria-label') == 'Add item'
        assert not errors, errors
        context.close()
    browser.close()
(out / 'report.json').write_text(json.dumps(results, indent=2), encoding='utf-8')
print(f'{len(results)} card-layout checks and both source/bundle button flows passed.')
