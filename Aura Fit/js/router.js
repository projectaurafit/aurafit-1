/* ==========================================================
   AURA FIT - ROUTER + APP SHELL
   Hash routing, shell construction (sidebar / topbar / tab bar
   / floating "+"), and view lifecycle.
   ========================================================== */
(function (w) {
  'use strict';
  var U = w.UI, S = w.Store;

  /* four main sections - the "+" is deliberately NOT one of them */
  var TABS = [
    { id: 'home',     label: 'Home',     icon: 'i-home',    href: '#/home' },
    { id: 'wardrobe', label: 'Wardrobe', icon: 'i-hanger',  href: '#/wardrobe' },
    { id: 'ideas',    label: 'AI Ideas', icon: 'i-sparkle', href: '#/ideas' },
    { id: 'account',  label: 'Account',  icon: 'i-user',    href: '#/account' }
  ];

  var ROUTES = [
    { re: /^\/?$/,               screen: 'home' },
    { re: /^\/start$/,           screen: 'start' },
    { re: /^\/login$/,           screen: 'login' },
    { re: /^\/signup$/,          screen: 'signup' },
    { re: /^\/forgot$/,          screen: 'forgot' },
    { re: /^\/check-email$/,     screen: 'checkEmail' },
    { re: /^\/reset$/,           screen: 'reset' },
    { re: /^\/password-updated$/,screen: 'passwordUpdated' },
    { re: /^\/welcome$/,         screen: 'welcome' },
    { re: /^\/gender$/,          screen: 'gender' },
    { re: /^\/onboarding$/,      screen: 'onboarding' },
    { re: /^\/home$/,            screen: 'home' },
    { re: /^\/wardrobe$/,        screen: 'wardrobe' },
    { re: /^\/wardrobe\/(.+)$/,  screen: 'wardrobe', keys: ['cat'] },
    { re: /^\/item\/(.+)$/,      screen: 'item',     keys: ['id'] },
    { re: /^\/outfit\/(.+)$/,    screen: 'outfit',   keys: ['id'] },
    { re: /^\/add$/,             screen: 'add' },
    { re: /^\/ideas$/,           screen: 'ideas' },
    { re: /^\/account$/,         screen: 'account' },
    { re: /^\/stats$/,           screen: 'stats' },
    { re: /^\/admin$/,           screen: 'adminDashboard' },
    { re: /^\/admin\/users$/,    screen: 'adminUsers' },
    { re: /^\/admin\/smtp$/,     screen: 'adminSmtp' },
    { re: /^\/admin\/emails$/,   screen: 'adminEmails' },
    { re: /^\/admin\/settings$/, screen: 'adminSettings' }
  ];

  /* reachable while signed out */
  var PUBLIC = ['start', 'login', 'signup', 'forgot', 'checkEmail', 'reset', 'passwordUpdated'];
  /* reachable while signed in but before the one-time setup is done */
  var PRE_ONBOARD = ['gender', 'onboarding', 'welcome'];
  /* admin-only */
  var ADMIN = ['adminDashboard', 'adminUsers', 'adminSmtp', 'adminEmails', 'adminSettings'];

  var shellBuilt = false;
  var rendered = null;      // the hash we last actually painted
  var active = null;        // screen currently mounted, for teardown
  var trail = [];          // only destinations visited inside this app
  var goingBack = false;
  var leavePrompt = false;

  function decode(value) {
    try { return decodeURIComponent(value.replace(/\+/g, ' ')); }
    catch (e) { return value; }
  }

  function parse() {
    var h = location.hash.replace(/^#/, '') || '/home';
    var qi = h.indexOf('?');
    var path = qi >= 0 ? h.slice(0, qi) : h;
    var qs = qi >= 0 ? h.slice(qi + 1) : '';
    var params = {};
    qs.split('&').forEach(function (kv) {
      if (!kv) return;
      var equals = kv.indexOf('=');
      var key = equals < 0 ? kv : kv.slice(0, equals);
      params[decode(key)] = decode(equals < 0 ? '' : kv.slice(equals + 1));
    });

    for (var i = 0; i < ROUTES.length; i++) {
      var m = path.match(ROUTES[i].re);
      if (m) {
        (ROUTES[i].keys || []).forEach(function (k, idx) { params[k] = decode(m[idx + 1]); });
        return { screen: ROUTES[i].screen, params: params, path: path };
      }
    }
    return { screen: 'home', params: params, path: path };
  }

  /* ---------------- shell ---------------- */
  function buildShell() {
    var root = U.$('#root');
    root.innerHTML =
      '<a class="skip-link" href="#main-content" data-skip-main>Skip to main content</a><div class="app">' +
        '<aside class="sidebar">' +
          '<div class="sidebar__brand">' +
            '<span class="brand__mark">' + U.icon('i-hanger') + '</span>' +
            '<span class="brand__name">Aura<em>Fit</em></span>' +
          '</div>' +
          '<nav class="sidebar__nav" aria-label="Main navigation">' +
            '<div class="sidebar__lbl">Menu</div>' +
            TABS.map(function (t) {
              return '<button class="sidebar__btn" data-tab="' + t.id + '" data-go="' + t.href + '">' +
                U.icon(t.icon) + '<span>' + t.label + '</span></button>';
            }).join('') +
            '<div class="sidebar__lbl">Library</div>' +
            '<button class="sidebar__btn" data-go="#/wardrobe?mode=outfits">' + U.icon('i-grid') + '<span>My outfits</span></button>' +
            '<button class="sidebar__btn" data-go="#/stats">' + U.icon('i-sliders') + '<span>Wardrobe stats</span></button>' +
          '</nav>' +
          '<div class="sidebar__foot">' +
            '<button class="sidebar__user" data-go="#/account">' +
              '<span class="sidebar__avatar" data-avatar>A</span>' +
              '<span class="grow" style="min-width:0">' +
                '<span class="t-sm t-med trunc" style="display:block" data-uname>Guest</span>' +
                '<span class="t-xs t-faint trunc" style="display:block" data-uemail></span>' +
              '</span>' +
            '</button>' +
          '</div>' +
        '</aside>' +

        '<div class="main">' +
          '<header class="topbar">' +
            '<div class="topbar__side topbar__side--l" data-tb-left></div>' +
            '<div class="topbar__title" data-tb-title></div>' +
            '<div class="topbar__side topbar__side--r" data-tb-right></div>' +
          '</header>' +
          '<main class="view" id="main-content" tabindex="-1" data-view></main>' +
        '</div>' +

        '<nav class="tabbar" aria-label="Main navigation">' + TABS.map(function (t) {
          return '<button class="tabbar__btn" data-tab="' + t.id + '" data-go="' + t.href + '">' +
            U.icon(t.icon) + '<span>' + t.label + '</span></button>';
        }).join('') + '</nav>' +

        /* floating "+" - bottom RIGHT, above the tab bar, like a support bubble */
        '<button class="fab" data-go="#/add" aria-label="Add item">' +
          U.icon('i-plus') + '<span class="fab__label">Add item</span>' +
        '</button>' +
      '</div>';
    shellBuilt = true;
  }

  function paintTopbar(cfg) {
    var l = U.$('[data-tb-left]'), t = U.$('[data-tb-title]'), r = U.$('[data-tb-right]');
    var left = cfg.left || '';
    if (cfg.back) {
      left = '<button class="iconbtn" data-back aria-label="Go back">' + U.icon('i-left') + '</button>' + left;
    }
    l.innerHTML = left;
    t.textContent = cfg.title || '';
    r.innerHTML = cfg.right || '';
  }

  function paintUser() {
    var u = S.user();
    var av = U.$('[data-avatar]'), n = U.$('[data-uname]'), e = U.$('[data-uemail]');
    if (!av) return;
    av.textContent = U.initials(u ? u.name : 'A');
    n.textContent = u ? u.name : 'Guest';
    e.textContent = u ? u.email : '';
  }

  function setActiveTab(id) {
    /* scoped so it cannot clash with .tab[data-tab] inside a screen or sheet */
    U.$$('.tabbar [data-tab], .sidebar [data-tab]').forEach(function (b) {
      b.classList.toggle('is-active', b.dataset.tab === id);
      b.setAttribute('aria-current', b.dataset.tab === id ? 'page' : 'false');
    });
  }

  /* ---------------- render ---------------- */

  /* rewrite the hash without bouncing back through hashchange */
  function redirect(hash) {
    location.replace(location.pathname + location.search + hash);
  }

  function render(depth) {
    depth = depth || 0;
    var route = parse();
    var screen = w.Screens[route.screen];

    /* resolve guards before painting, so no stale frame is ever shown */
    if (depth < 5) {
      var authed = !!S.user();
      var target = null;

      if (!screen) target = '#/home';
      else if (!authed && PUBLIC.indexOf(route.screen) < 0) target = '#/start';
      else if (authed && PUBLIC.indexOf(route.screen) >= 0) target = '#/home';
      else if (authed && route.screen !== 'gender' && ['male', 'female'].indexOf(S.user().gender) < 0) target = '#/gender';
      else if (authed && PRE_ONBOARD.indexOf(route.screen) < 0 && !S.user().onboarded) target = '#/onboarding';
      else if (authed && ADMIN.indexOf(route.screen) >= 0 &&
               !(w.Admin && w.Admin.isAdmin && w.Admin.isAdmin())) target = '#/account';

      if (target) { redirect(target); return render(depth + 1); }
    }
    if (!screen) return;

    var changedRoute = rendered !== location.hash;
    if (goingBack) trail.pop();
    if (!goingBack && rendered && changedRoute) {
      if (trail.length && trail[trail.length - 1] === location.hash) trail.pop();
      else trail.push(rendered);
    }
    if (!S.user()) trail = [];
    goingBack = false;
    rendered = location.hash;

    /* let the outgoing screen release timers and listeners */
    if (active && active.unmount) { try { active.unmount(); } catch (e) { console.error(e); } }
    active = screen;

    var root = U.$('#root');
    if (U.closeDialogs) U.closeDialogs();
    U.Sheet.close(true);

    if (screen.shell === false) {
      shellBuilt = false;
      root.innerHTML = '';
      var node = U.el(screen.render(route.params));
      root.appendChild(node);
      if (screen.mount) screen.mount(root.firstElementChild, route.params);
      window.scrollTo(0, 0);
      w.App.syncThemeButtons();
      return;
    }

    if (!shellBuilt) buildShell();
    paintUser();

    var cfg = screen.topbar ? screen.topbar(route.params) : { title: '' };
    document.title = (cfg.title || 'Your wardrobe') + ' · Aura Fit';
    paintTopbar(cfg);
    setActiveTab(screen.tab || '');

    var oldView = U.$('[data-view]');
    var view = oldView.cloneNode(false);
    oldView.replaceWith(view);
    view.innerHTML = screen.render(route.params);
    if (screen.mount) screen.mount(view, route.params);
    if (view.setAttribute) {
      view.setAttribute('aria-label', cfg.title || 'Aura Fit');
      if (changedRoute && view.focus) view.focus({ preventScroll: true });
    }

    /* hide the "+" on the screen it opens */
    var fab = U.$('.fab');
    if (fab) {
      var createOutfit = route.screen === 'wardrobe' && route.params.mode === 'outfits';
      var fabLabel = createOutfit ? 'Create outfit' : 'Add item';
      var hideFab = ['add', 'item', 'outfit'].indexOf(route.screen) >= 0;
      fab.classList.toggle('is-hidden', hideFab);
      fab.hidden = hideFab;
      fab.setAttribute('data-go', createOutfit ? '#/add?mode=outfit' : '#/add');
      fab.setAttribute('aria-label', fabLabel);
      var label = fab.querySelector('.fab__label');
      if (label) label.textContent = fabLabel;
    }

    window.scrollTo(0, 0);
    U.stickyTopbar();
    w.App.syncThemeButtons();
  }

  function go(hash, replace, discard) {
    var target = hash.charAt(0) === '#' ? hash : '#' + hash;
    if (!discard && active && active.hasUnsavedChanges && active.hasUnsavedChanges()) {
      if (leavePrompt) return;
      leavePrompt = true;
      U.confirmDialog({ title: 'Discard unsaved changes?', text: 'Your changes have not been saved yet.', ok: 'Discard changes', cancel: 'Keep editing', danger: true })
        .then(function (yes) { leavePrompt = false; if (yes) go(target, replace, true); else goingBack = false; });
      return;
    }
    if (location.hash === target) { render(); return; }   // same route -> repaint
    if (replace) redirect(target);
    else location.hash = target;
    render();
  }

  function refresh() { render(); }

  function back() {
    while (trail.length && S.user() && /^#\/(add|login|signup|start|welcome|gender)(?:\?|$)/.test(trail[trail.length - 1])) trail.pop();
    var previous = trail[trail.length - 1];
    var route = parse();
    var fallback = route.screen === 'login' || route.screen === 'signup' ? '#/start' :
      route.screen === 'forgot' ? '#/login' :
      route.screen === 'outfit' ? '#/wardrobe?mode=outfits' :
      route.screen === 'item' || route.screen === 'add' ? '#/wardrobe' : '#/home';
    // Browser history may belong to a different site after a direct deep link.
    goingBack = true;
    go(previous || fallback, true);
  }

  /* Rewrite the address bar for in-place filtering without re-rendering.
     Keeps `rendered` in step so the next hashchange is judged correctly. */
  function syncHash(hash) {
    var target = hash.charAt(0) === '#' ? hash : '#' + hash;
    if (location.hash === target) return;
    history.replaceState(null, '', location.pathname + location.search + target);
    rendered = target;
  }

  window.addEventListener('hashchange', function () {
    if (location.hash === rendered) return;                // already painted this route
    if (active && active.hasUnsavedChanges && active.hasUnsavedChanges()) {
      var target = location.hash;
      history.replaceState(null, '', location.pathname + location.search + rendered);
      go(target, true);
      return;
    }
    render();
  });

  w.Router = { render: render, go: go, back: back, refresh: refresh, syncHash: syncHash, parse: parse, TABS: TABS };
})(window);
