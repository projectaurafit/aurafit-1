from pathlib import Path
from playwright.sync_api import sync_playwright
import sys
out=Path('tests/artifacts/wardrobe-visual')/sys.argv[1];out.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path='C:/Users/jimmy/AppData/Local/ms-playwright/chromium-1208/chrome-win64/chrome.exe')
 page=b.new_page(service_workers='block',reduced_motion='reduce')
 page.goto('http://127.0.0.1:8124/index.html#/login');page.locator('#email').fill('user@aurafit.app');page.locator('#pass').fill('User@123');page.locator('form button[type=submit]').click();page.wait_for_timeout(700)
 page.evaluate('Store.user().onboarded=true;Store.save()');page.wait_for_timeout(3000)
 oid=page.evaluate('Store.state.outfits[0].id')
 for width in [320,390,768,1440]:
  page.set_viewport_size({'width':width,'height':900 if width>400 else 844})
  for theme in ['light','dark']:
   page.evaluate('(t)=>{Store.state.theme=t;Store.save();document.documentElement.dataset.theme=t}',theme)
   for name,route in [('clothes','wardrobe'),('outfits','wardrobe?mode=outfits'),('detail','outfit/'+oid)]:
    page.evaluate('(r)=>Router.go("#/"+r)',route);page.wait_for_timeout(850)
    page.screenshot(path=str(out/f'{width}-{theme}-{name}.png'),full_page=True)
 b.close()
