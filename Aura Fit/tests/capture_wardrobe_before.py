from pathlib import Path
from playwright.sync_api import sync_playwright
out=Path('tests/artifacts/wardrobe-review-before');out.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path='C:/Users/jimmy/AppData/Local/ms-playwright/chromium-1208/chrome-win64/chrome.exe')
 c=b.new_context(service_workers='block',reduced_motion='reduce');page=c.new_page()
 page.goto('http://127.0.0.1:8124/index.html');page.wait_for_timeout(1800)
 page.evaluate("Store.login('user@aurafit.app','User@123')")
 outfit=page.evaluate('Store.state.outfits[0].id')
 for width in [320,390,768,1440]:
  page.set_viewport_size({'width':width,'height':900})
  for theme in ['light','dark']:
   page.evaluate('(t)=>document.documentElement.dataset.theme=t',theme)
   for name,route in [('clothes','wardrobe'),('outfits','wardrobe?mode=outfits'),('detail','outfit/'+outfit)]:
    page.evaluate('(r)=>Router.go("#/"+r)',route);page.wait_for_timeout(120)
    page.screenshot(path=str(out/f'{width}-{theme}-{name}.png'),full_page=True)
 print('Captured 24 baseline screenshots')
 page.evaluate('Router.go("#/wardrobe")');page.wait_for_timeout(100)
 page.locator('.catcard').first.focus();page.keyboard.press('Enter');page.wait_for_timeout(100)
 print('Category activation focus:',page.evaluate('document.activeElement.outerHTML.slice(0,300)'))
 print('Selected tab semantics:',page.locator('.tab.is-active').evaluate('(e)=>e.outerHTML'))
 b.close()

