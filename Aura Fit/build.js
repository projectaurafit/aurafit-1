/* ==========================================================
   AURA FIT - bundler
   Inlines every stylesheet and script into a single
   self-contained page, for hosting or sharing.

     node build.js          -> both
     node build.js app      -> preview.html        (user app)
     node build.js admin    -> admin-preview.html  (admin console)
   ========================================================== */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;

/* Keep the generated console paired with this build of the user app. */
const USER_APP_URL = 'preview.html';
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');

const CSS = [
  'vendor/bootstrap.min.css',            /* framework base, grid + utilities */
  'css/tokens.css', 'css/base.css', 'css/components.css',
  'css/layout.css', 'css/screens.css', 'css/auth.css', 'css/admin.css',
  'css/bootstrap-interop.css'            /* must stay last */
];

/* shared core, in load order */
const CORE = [
  'vendor/bootstrap.bundle.min.js',
  'js/sprite.js', 'js/garments.js', 'js/colour.js', 'js/illustrations.js', 'js/data.js',
  'js/store.js', 'js/ui.js', 'js/recommend.js', 'js/pwa.js'
];

const TARGETS = {
  app: {
    entry: 'index.html',
    out: 'preview.html',
    title: 'Aura Fit',
    js: CORE.concat([
      'js/screens/auth.js', 'js/screens/onboarding.js', 'js/screens/home.js',
      'js/screens/wardrobe.js', 'js/screens/item.js', 'js/screens/additem.js',
      'js/screens/outfit.js', 'js/screens/ideas.js', 'js/screens/account.js',
      'js/screens/stats.js', 'js/screens/admin.js',
      'js/router.js', 'js/app.js'
    ])
  },
  admin: {
    entry: 'admin.html',
    out: 'admin-preview.html',
    title: 'Aura Fit Console',
    /* where the console's "Open user app" link should point once hosted */
    prelude: "window.AURA_USER_APP_URL = '" + USER_APP_URL + "';",
    js: CORE.concat(['js/screens/admin.js', 'js/admin-shell.js'])
  }
};

function build(key) {
  const t = TARGETS[key];
  const html = read(t.entry);

  const body = html
    .slice(html.indexOf('<body>') + 6, html.indexOf('</body>'))
    .replace(/<script src="[^"]+"><\/script>\s*/g, '')
    .trim();

  const css = CSS.map(f => '/* ===== ' + f + ' ===== */\n' + read(f)).join('\n\n');
  let js = t.js.map(f => '/* ===== ' + f + ' ===== */\n' + read(f)).join('\n\n');
  if (t.prelude) js = '/* ===== build-time configuration ===== */\n' + t.prelude + '\n\n' + js;

  /* A complete document works both on a local server and as a shared file. */
  const out = '<!DOCTYPE html>\n<html lang="en" data-theme="light">\n<head>\n' +
    '<meta charset="UTF-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' +
    '<meta name="theme-color" content="#FBF7F4">\n' +
    '<title>' + t.title + '</title>\n' +
    '<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
    '<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" media="print" onload="this.media=\'all\'">\n' +
    '<style>\n' + css + '\n</style>\n</head>\n<body>\n' +
    body + '\n\n' +
    '<script>\n' + js + '\n<' + '/script>\n</body>\n</html>\n';

  fs.writeFileSync(path.join(ROOT, t.out), out, 'utf8');
  const kb = n => (n / 1024).toFixed(1) + ' KB';
  console.log(t.out.padEnd(20) + ' css ' + kb(css.length).padStart(9) +
              '   js ' + kb(js.length).padStart(9) + '   total ' + kb(out.length));
}

const arg = (process.argv[2] || 'both').toLowerCase();
if (arg === 'app') build('app');
else if (arg === 'admin') build('admin');
else { build('app'); build('admin'); }
