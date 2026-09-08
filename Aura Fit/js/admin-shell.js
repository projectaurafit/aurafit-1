/* ==========================================================
   AURA FIT - ADMIN CONSOLE SHELL
   Standalone entry point (admin.html). Reuses the same design
   tokens, Store and screen modules as the user app, but ships
   its own navigation, its own sign-in and its own URL so the
   two panels are completely separate surfaces.
   ========================================================== */
(function (w) {
  'use strict';
  var U = w.UI, S = w.Store;

  var NAV = [
    { id: 'adminDashboard', label: 'Dashboard',       icon: 'i-grid',    href: '#/admin' },
    { id: 'adminUsers',     label: 'Users',           icon: 'i-user',    href: '#/admin/users' },
    { id: 'adminSmtp',      label: 'SMTP',            icon: 'i-a-server',href: '#/admin/smtp' },
    { id: 'adminEmails',    label: 'Emails',          icon: 'i-mail',    href: '#/admin/emails' },
    { id: 'adminSettings',  label: 'Settings',        icon: 'i-sliders', href: '#/admin/settings' }
  ];

  var ROUTES = [
    { re: /^\/?$/,               screen: 'adminDashboard' },
    { re: /^\/admin$/,           screen: 'adminDashboard' },
    { re: /^\/admin\/users$/,    screen: 'adminUsers' },
    { re: /^\/admin\/smtp$/,     screen: 'adminSmtp' },
    { re: /^\/admin\/emails$/,   screen: 'adminEmails' },
    { re: /^\/admin\/settings$/, screen: 'adminSettings' },
    /* short aliases, so /users works as well as /admin/users */
    { re: /^\/users$/,           screen: 'adminUsers' },
    { re: /^\/smtp$/,            screen: 'adminSmtp' },
    { re: /^\/emails$/,          screen: 'adminEmails' },
    { re: /^\/settings$/,        screen: 'adminSettings' },
    { re: /^\/login$/,           screen: 'adminLogin' }
  ];

  /* Overridable so a hosted bundle can point at the deployed user app.
     Falls back to the sibling file when served from the project folder. */
  var USER_APP = w.AURA_USER_APP_URL || 'index.html';
  var shellBuilt = false, rendered = null, active = null, leavePrompt = false;

  function parse() {
    var h = location.hash.replace(/^#/, '') || '/admin';
    var qi = h.indexOf('?');
    var path = qi >= 0 ? h.slice(0, qi) : h;
    var qs = qi >= 0 ? h.slice(qi + 1) : '';
    var params = {};
    qs.split('&').forEach(function (kv) {
      if (!kv) return;
      var p = kv.split('=');
      try { params[decodeURIComponent(p[0])] = decodeURIComponent(p.slice(1).join('=') || ''); }
      catch (e) { /* Ignore malformed links instead of blanking the console. */ }
    });
    for (var i = 0; i < ROUTES.length; i++) {
      if (path.match(ROUTES[i].re)) return { screen: ROUTES[i].screen, params: params, path: path };
    }
    return { screen: 'adminDashboard', params: params, path: path };
  }

  /* ---------------- sign-in ---------------- */
  w.Screens = w.Screens || {};
  w.Screens.adminLogin = {
    shell: false,
    render: function () {
      return '' +
      '<div class="a-screen">' +
        '<div class="a-aside only-desktop">' +
          w.Ill.wardrobeHero() +
          '<div class="a-aside__scrim"></div>' +
          '<div class="a-aside__copy">' +
            '<div class="a-aside__t">Aura Fit <em>Console</em></div>' +
            '<div class="a-aside__s">Manage accounts, mail delivery and application settings. ' +
              'Administrator access only.</div>' +
          '</div>' +
        '</div>' +
        '<div class="a-wrap">' +
          '<div class="a-top"><span class="a-top__spacer"></span>' +
            '<a class="a-skip" href="' + USER_APP + '">Open user app</a></div>' +
          '<div class="a-brand">' +
            '<div class="a-brand__mark">' + U.icon('i-shield') + '</div>' +
            '<div class="a-brand__name">Aura <em>Console</em></div>' +
          '</div>' +
          '<div class="a-head">' +
            '<h1 class="a-head__t">Administrator sign in</h1>' +
            '<p class="a-head__s">Local demo console only. Accounts and settings are stored on this device. Do not enter production credentials.</p>' +
          '</div>' +
          '<form class="a-form" novalidate>' +
            '<label class="a-field" data-field="email">' +
              '<span class="a-field__box">' +
                '<span class="a-field__ico">' + U.icon('i-mail') + '</span>' +
                '<input id="email" type="email" placeholder="Admin email" autocomplete="email" aria-label="Admin email">' +
              '</span><span class="a-field__err"></span>' +
            '</label>' +
            '<label class="a-field" data-field="pass">' +
              '<span class="a-field__box">' +
                '<span class="a-field__ico">' + U.icon('i-lock') + '</span>' +
                '<input id="pass" type="password" placeholder="Password" autocomplete="current-password" aria-label="Password">' +
                '<button type="button" class="a-field__eye" data-peek aria-label="Show password">' + U.icon('i-eye') + '</button>' +
              '</span><span class="a-field__err"></span>' +
            '</label>' +
            '<button class="a-btn" type="submit">' + U.icon('i-shield') + ' Sign in to console</button>' +
          '</form>' +

          '<div class="a-grow"></div>' +
          '<p class="a-foot">Not an administrator? <a href="' + USER_APP + '" style="color:var(--accent);font-weight:700">Go to Aura Fit</a></p>' +
        '</div>' +
      '</div>';
    },
    mount: function (root) {
      var eye = root.querySelector('[data-peek]');
      eye.onclick = function () {
        var i = root.querySelector('#pass');
        var show = i.type === 'password';
        i.type = show ? 'text' : 'password';
        eye.innerHTML = U.icon(show ? 'i-eye-off' : 'i-eye');
        eye.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
      };
      function err(id, msg) {
        var f = root.querySelector('[data-field="' + id + '"]');
        f.classList.toggle('has-err', !!msg);
        f.querySelector('.a-field__err').textContent = msg || '';
        var input = f.querySelector('input');
        var error = f.querySelector('.a-field__err');
        error.id = id + '-error';
        error.setAttribute('aria-live', 'polite');
        input.setAttribute('aria-describedby', error.id);
        input.setAttribute('aria-invalid', msg ? 'true' : 'false');
        if (msg) input.focus();
      }
      U.$$('input', root).forEach(function (input) {
        input.addEventListener('input', function () { err(input.id, ''); });
      });
      root.querySelector('form').addEventListener('submit', function (e) {
        e.preventDefault();
        err('email', ''); err('pass', '');
        var email = root.querySelector('#email').value.trim();
        var pass = root.querySelector('#pass').value;
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return err('email', 'Enter a valid email address.');
        if (!pass) return err('pass', 'Enter your password.');

        var r;
        try {
          if (!w.Admin.isAdminEmail(email.toLowerCase())) return err('email', 'Use an administrator account to sign in to the console.');
          r = S.login(email, pass);
        }
        catch (error) { return err('pass', error.message || 'Unable to save. Please try again.'); }
        if (!r.ok) return err('pass', r.error);
        if (!w.Admin.isAdmin()) {
          S.logout();
          return err('email', 'That account does not have administrator access.');
        }
        U.toast('Signed in to the console', 'success');
        go('#/admin');
      });
    }
  };

  /* ---------------- shell ---------------- */
  function buildShell() {
    U.$('#root').innerHTML =
      '<a class="skip-link" href="#main-content" data-skip-main>Skip to main content</a><div class="app adm-app">' +
        '<aside class="sidebar">' +
          '<div class="sidebar__brand">' +
            '<span class="brand__mark">' + U.icon('i-shield') + '</span>' +
            '<span class="brand__name">Aura<em>Console</em></span>' +
          '</div>' +
          '<nav class="sidebar__nav" aria-label="Console navigation">' +
            '<div class="sidebar__lbl">Administration</div>' +
            NAV.map(function (n) {
              return '<button class="sidebar__btn" data-nav="' + n.id + '" data-go="' + n.href + '">' +
                U.icon(n.icon) + '<span>' + n.label + '</span></button>';
            }).join('') +
            '<div class="sidebar__lbl">Application</div>' +
            '<a class="sidebar__btn" href="' + USER_APP + '">' + U.icon('i-arrow-right') + '<span>Open user app</span></a>' +
          '</nav>' +
          '<div class="sidebar__foot">' +
            '<button class="sidebar__user" data-signout>' +
              '<span class="sidebar__avatar" data-avatar>A</span>' +
              '<span class="grow" style="min-width:0">' +
                '<span class="t-sm t-med trunc" style="display:block" data-uname>Admin</span>' +
                '<span class="t-xs t-faint trunc" style="display:block">Sign out</span>' +
              '</span>' + U.icon('i-logout') +
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
        '<nav class="tabbar adm-tabbar" aria-label="Console navigation">' + NAV.map(function (n) {
          return '<button class="tabbar__btn" data-nav="' + n.id + '" data-go="' + n.href + '">' +
            U.icon(n.icon) + '<span>' + n.label + '</span></button>';
        }).join('') + '</nav>' +
      '</div>';
    shellBuilt = true;

  }

  function signOut() {
    U.confirmDialog({ title: 'Sign out of the console?', text: hasUnsavedChanges() ? 'Unsaved changes will be discarded. You will need to sign in again.' : 'You will need to sign in again to manage the app.', ok: 'Sign out' })
      .then(function (yes) {
        if (!yes) return;
        try { S.logout(); } catch (error) { return; }
        go('#/login', true, true);
      });
  }
  function hasUnsavedChanges() { return !!(active && active.hasUnsavedChanges && active.hasUnsavedChanges()); }

  function paintTopbar(cfg, screenId) {
    var l = U.$('[data-tb-left]'), t = U.$('[data-tb-title]'), r = U.$('[data-tb-right]');
    l.innerHTML = screenId !== 'adminDashboard'
      ? '<button class="iconbtn" data-go="#/admin" aria-label="Back to dashboard">' + U.icon('i-left') + '</button>'
      : '';
    t.textContent = cfg.title || 'Console';
    r.innerHTML = '<button class="iconbtn" data-theme-toggle aria-label="Switch theme">' +
      U.icon(S.effectiveTheme() === 'dark' ? 'i-sun' : 'i-moon') + '</button>' +
      '<button class="iconbtn" data-signout aria-label="Sign out of console">' + U.icon('i-logout') + '</button>';
  }

  /* ---------------- render ---------------- */
  function redirect(h) { location.replace(location.pathname + location.search + h); }

  function render(depth) {
    depth = depth || 0;
    var route = parse();
    var screen = w.Screens[route.screen];

    if (depth < 5) {
      var ok = !!S.user() && w.Admin.isAdmin();
      var target = null;
      if (!screen) target = '#/admin';
      else if (!ok && route.screen !== 'adminLogin') target = '#/login';
      else if (ok && route.screen === 'adminLogin') target = '#/admin';
      if (target) { redirect(target); return render(depth + 1); }
    }
    if (!screen) return;

    var changedRoute = rendered !== location.hash;
    rendered = location.hash;
    if (active && active.unmount) { try { active.unmount(); } catch (e) { console.error(e); } }
    active = screen;

    var root = U.$('#root');
    if (U.closeDialogs) U.closeDialogs();

    if (screen.shell === false) {
      shellBuilt = false;
      root.innerHTML = '';
      root.appendChild(U.el(screen.render(route.params)));
      if (screen.mount) screen.mount(root.firstElementChild, route.params);
      window.scrollTo(0, 0);
      syncThemeButtons();
      return;
    }

    if (!shellBuilt) buildShell();

    var u = S.user();
    U.$('[data-avatar]').textContent = U.initials(u ? u.name : 'A');
    U.$('[data-uname]').textContent = u ? u.name : 'Admin';

    paintTopbar(screen.topbar ? screen.topbar(route.params) : {}, route.screen);
    document.title = (screen.topbar ? screen.topbar(route.params).title : 'Console') + ' · Aura Fit';

    U.$$('[data-nav]').forEach(function (b) {
      b.classList.toggle('is-active', b.dataset.nav === route.screen);
      if (b.dataset.nav === route.screen) b.setAttribute('aria-current', 'page');
      else b.removeAttribute('aria-current');
    });

    var oldView = U.$('[data-view]');
    var view = oldView.cloneNode(false);
    oldView.replaceWith(view);
    view.innerHTML = screen.render(route.params);
    if (screen.mount) screen.mount(view, route.params);
    if (changedRoute && view.focus) view.focus({ preventScroll: true });

    window.scrollTo(0, 0);
    U.stickyTopbar();
    syncThemeButtons();
  }

  function go(hash, replace, discard) {
    var target = hash.charAt(0) === '#' ? hash : '#' + hash;
    if (!discard && hasUnsavedChanges()) {
      if (leavePrompt) return;
      leavePrompt = true;
      U.confirmDialog({ title: 'Discard unsaved changes?', text: 'Your edits have not been saved yet.', ok: 'Discard changes', cancel: 'Keep editing', danger: true })
        .then(function (yes) { leavePrompt = false; if (yes) go(target, replace, true); });
      return;
    }
    /* the admin screens link back to the user app */
    if (target === '#/account' || target === '#/home') { location.href = USER_APP + target; return; }
    if (location.hash === target) { render(); return; }
    if (replace) redirect(target); else location.hash = target;
    render();
  }

  function syncThemeButtons() {
    var dark = S.effectiveTheme() === 'dark';
    U.$$('[data-theme-toggle]').forEach(function (b) {
      b.innerHTML = U.icon(dark ? 'i-sun' : 'i-moon');
      b.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    });
  }

  w.Router = {
    render: render, go: go, refresh: render,
    syncHash: function (h) {
      var t = h.charAt(0) === '#' ? h : '#' + h;
      if (location.hash === t) return;
      history.replaceState(null, '', location.pathname + location.search + t);
      rendered = t;
    },
    parse: parse, TABS: NAV
  };

  window.addEventListener('hashchange', function () {
    if (location.hash === rendered) return;
    if (hasUnsavedChanges()) {
      var target = location.hash;
      history.replaceState(null, '', location.pathname + location.search + rendered);
      go(target, true); return;
    }
    render();
  });
  window.addEventListener('beforeunload', function (e) {
    if (hasUnsavedChanges()) { e.preventDefault(); e.returnValue = ''; }
  });

  /* ---------------- boot ---------------- */
  function init() {
    S.load();
    S.applyTheme();

    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-skip-main]')) {
        e.preventDefault(); document.getElementById('main-content').focus(); return;
      }
      if (e.target.closest('[data-signout]')) { e.preventDefault(); signOut(); return; }
      var g = e.target.closest('[data-go]');
      if (g) { e.preventDefault(); go(g.dataset.go); return; }
      var th = e.target.closest('[data-theme-toggle]');
      if (th) {
        e.preventDefault();
        var t;
        try { t = S.toggleTheme(); } catch (error) { return; }
        syncThemeButtons();
        U.toast(t === 'dark' ? 'Dark mode on' : 'Light mode on', 'success');
      }
    });

    if (w.matchMedia) {
      var mq = w.matchMedia('(prefers-color-scheme: dark)');
      var onChange = function () { if (!S.state.theme) { S.applyTheme(); syncThemeButtons(); } };
      if (mq.addEventListener) mq.addEventListener('change', onChange);
      else if (mq.addListener) mq.addListener(onChange);
    }

    if (!location.hash) location.replace(location.pathname + location.search + '#/admin');
    render();
  }

  w.App = { init: init, syncThemeButtons: syncThemeButtons };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window);
