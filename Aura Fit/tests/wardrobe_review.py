"""Targeted wardrobe UX regression and rendered review. Run after starting server8124."""
import argparse,json
from pathlib import Path
from playwright.sync_api import sync_playwright
parser=argparse.ArgumentParser();parser.add_argument('--phase',default='wardrobe-review-after');args=parser.parse_args()
out=Path(__file__).parent/'artifacts'/args.phase;out.mkdir(parents=True,exist_ok=True)
report={'layouts':[],'flows':[],'errors':[]}
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='C:/Users/jimmy/AppData/Local/ms-playwright/chromium-1208/chrome-win64/chrome.exe')
 page=browser.new_page(viewport={'width':390,'height':900},service_workers='block',reduced_motion='reduce')
 page.set_default_timeout(5000);page.on('pageerror',lambda e:report['errors'].append(str(e)))
 page.goto('http://127.0.0.1:8124/index.html',wait_until='domcontentloaded',timeout=15000);page.wait_for_timeout(1800)
 page.evaluate("Store.login('user@aurafit.app','User@123');Store.user().onboarded=true;Store.save()")
 outfit=page.evaluate('Store.state.outfits[0].id')
 def route(r):
  page.evaluate('(r)=>Router.go("#/"+r)',r);page.wait_for_timeout(150)
 def yes(js):assert page.evaluate(js),js
 def check(name,fn):
  try:fn();report['flows'].append({'name':name,'pass':True})
  except Exception as e:report['flows'].append({'name':name,'pass':False,'error':str(e)[:1000]})
 for width in [320,390,768,1440]:
  page.set_viewport_size({'width':width,'height':900})
  for theme in ['light','dark']:
   page.evaluate('(t)=>document.documentElement.dataset.theme=t',theme)
   for name,r in [('clothes','wardrobe'),('category','wardrobe/top'),('outfits','wardrobe?mode=outfits'),('detail','outfit/'+outfit),('builder','add?mode=outfit&edit='+outfit)]:
    route(r)
    if name in ['detail','builder']: assert not page.locator('.fab').is_visible()
    issues=page.evaluate('''()=>{const issues=[];if(document.documentElement.scrollWidth>innerWidth)issues.push('horizontal overflow');for(const b of document.querySelectorAll('.fav')){const r=b.getBoundingClientRect(),s=b.querySelector('svg').getBoundingClientRect(),art=b.parentElement.querySelector('.outfitcard__thumb>svg').getBoundingClientRect();if(art.top<r.bottom+3)issues.push('heart overlaps artwork');if(Math.abs(r.width-44)>1||Math.abs(r.height-44)>1)issues.push('favourite not44square');if(Math.abs(r.x+r.width/2-s.x-s.width/2)>1||Math.abs(r.y+r.height/2-s.y-s.height/2)>1)issues.push('heart not centred');}for(const b of document.querySelectorAll('.actbtn,.segment__btn,.tab')){const r=b.getBoundingClientRect();if(r.height<43)issues.push('short control:'+b.textContent.trim());}return issues}''')
    page.screenshot(path=str(out/f'{width}-{theme}-{name}.png'),full_page=True)
    report['layouts'].append({'width':width,'theme':theme,'screen':name,'issues':issues})
 page.set_viewport_size({'width':320,'height':740})
 def category_focus():
  route('wardrobe');page.locator('.catcard').first.focus();page.keyboard.press('Enter')
  yes("document.activeElement.matches('.tab.is-active[aria-pressed=true]')")
  assert page.locator('.tab[aria-pressed=true]').count()==1
  assert 'shown' in page.locator('[role=status][data-results-status]').inner_text()
 check('category keyboard activation retains visible selected control focus',category_focus)
 def mode_focus():
  page.locator('[data-mode=outfits]').focus();page.keyboard.press('Enter')
  yes("document.activeElement.matches('[data-mode=outfits][aria-pressed=true]')")
  page.keyboard.press('Tab');yes("document.activeElement.matches('.fav')")
 check('mode keyboard activation preserves focus and natural next tab',mode_focus)
 def fav_persistence():
  route('wardrobe?mode=outfits');f=page.locator('.fav').first;old=f.get_attribute('aria-pressed');label=f.get_attribute('aria-label')
  assert len(label)>len('Favourite ');f.focus();page.keyboard.press('Space')
  assert f.get_attribute('aria-pressed')!=old
  yes("location.hash==='#/wardrobe?mode=outfits'")
  page.locator('.outfitcard__link').first.click();page.wait_for_timeout(150)
  assert page.locator('.topbar [data-fav]').get_attribute('aria-pressed')!=old
  page.reload(wait_until='domcontentloaded',timeout=15000);page.wait_for_timeout(1600)
  assert page.locator('.topbar [data-fav]').get_attribute('aria-pressed')!=old
 check('favourite keyboard toggle persists through detail and reload',fav_persistence)
 def empty_search():
  route('wardrobe?mode=outfits');page.locator('[data-search-toggle]').click();page.locator('[data-search]').fill('no such outfit 789');page.wait_for_timeout(250)
  assert page.locator('[data-results-status]').inner_text()=='0 outfits shown'
  page.locator('[data-clear-search]').click();yes("document.activeElement.matches('[data-search]')")
  assert page.locator('.outfitcard').count()>0
  page.locator('[data-search-toggle]').click();assert page.locator('[data-search-toggle]').get_attribute('aria-expanded')=='false'
 check('empty search announces results and clear restores input focus',empty_search)
 def edit_cancel_save():
  route('outfit/'+outfit);original=page.evaluate('(id)=>JSON.stringify(Store.getOutfit(id))',outfit)
  page.locator('[data-edit]').click();page.locator('#o-name').fill('QA unsaved look')
  page.locator('[data-back]').click();page.locator('[data-no]').click();page.wait_for_timeout(200)
  assert page.locator('#o-name').input_value()=='QA unsaved look'
  page.locator('[data-back]').click();page.locator('[data-yes]').click();page.wait_for_timeout(200)
  assert page.evaluate('(id)=>JSON.stringify(Store.getOutfit(id))',outfit)==original
  page.locator('[data-edit]').click();page.locator('#o-name').fill('QA saved edited look');page.locator('#o-notes').fill('Checked full edit')
  before=page.evaluate('Store.state.outfits.length');page.locator('[data-saveoutfit]').click();page.wait_for_timeout(200)
  assert page.evaluate('Store.state.outfits.length')==before
  yes("Store.getOutfit('"+outfit+"').notes==='Checked full edit'")
 check('full outfit edit keep/discard/save protects data and ID',edit_cancel_save)
 def missing_outfit():
  route('outfit/nonexistent');assert page.locator('.topbar [data-fav]').count()==0
  page.get_by_role('button',name='Back to outfits',exact=True).click();yes("location.hash==='#/wardrobe?mode=outfits'")
 check('missing outfit has recovery and no dead favourite',missing_outfit)
 def long_text_and_scroll():
  page.evaluate('(id)=>Store.updateOutfit(id,{name:"LongUnbrokenOutfitName".repeat(12),notes:"Detailed notes ".repeat(90)})',outfit)
  for width in [320,390,768,1440]:
   page.set_viewport_size({'width':width,'height':740});route('outfit/'+outfit)
   yes('document.documentElement.scrollWidth<=innerWidth')
   last=page.locator('.itemcard').last;last.scroll_into_view_if_needed();last.focus();page.keyboard.press('Enter');page.wait_for_timeout(100)
   yes("location.hash.startsWith('#/item/')")
  route('wardrobe?mode=outfits');last=page.locator('.outfitcard__link').last;last.scroll_into_view_if_needed();last.click()
  yes("location.hash.startsWith('#/outfit/')")
 check('long outfit content wraps and final cards remain reachable',long_text_and_scroll)
 browser.close()
report['summary']={'layout_checks':len(report['layouts']),'layout_issues':sum(len(r['issues']) for r in report['layouts']),'flows_passed':sum(r['pass'] for r in report['flows']),'flows_total':len(report['flows']),'runtime_errors':len(report['errors'])}
(out/'report.json').write_text(json.dumps(report,indent=2),encoding='utf8');print(json.dumps(report['summary'],indent=2));print(json.dumps(report['flows'],indent=2))
raise SystemExit(1 if report['summary']['layout_issues'] or report['errors'] or any(not r['pass'] for r in report['flows']) else 0)
