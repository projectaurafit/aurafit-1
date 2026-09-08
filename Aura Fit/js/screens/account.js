/* ==========================================================
   SCREENS - ACCOUNT
   Profile management, style preferences, theme switch,
   wishlist and data controls.
   ========================================================== */
(function (w) {
  'use strict';
  var U = w.UI, S = w.Store, D = w.Data, G = w.Garments;
  var Screens = w.Screens = w.Screens || {};

  function prefChips(list, empty) {
    if (!list || !list.length) return '<span class="t-xs t-faint">' + empty + '</span>';
    return list.map(function (x) { return '<span class="badge badge--muted">' + U.esc(x) + '</span>'; }).join('');
  }

  Screens.account = {
    shell: true,
    tab: 'account',
    topbar: function () {
      return { left: '', title: 'Account', right: '' };
    },

    render: function () {
      var u = S.user() || { name: 'Guest', email: '' };
      var p = u.prefs || {};
      var st = S.stats();
      var theme = S.state.theme || 'system';
      var saved = S.state.savedProducts
        .map(function (id) {
          for (var i = 0; i < D.CATALOG.length; i++) if (D.CATALOG[i].id === id) return D.CATALOG[i];
          return null;
        }).filter(Boolean);

      return '' +
      '<div class="profhead">' +
        '<div class="profhead__av">' + U.esc(U.initials(u.name)) + '</div>' +
        '<div class="grow">' +
          '<div class="profhead__n">' + U.esc(u.name) + '</div>' +
          '<div class="profhead__e">' + U.esc(u.email) + '</div>' +
        '</div>' +
        '<button class="iconbtn iconbtn--bordered" data-editprofile aria-label="Edit profile">' + U.icon('i-edit') + '</button>' +
      '</div>' +

      '<div class="stats3">' +
        '<div class="stat"><div class="stat__n">' + st.items + '</div><div class="stat__l">Items</div></div>' +
        '<div class="stat"><div class="stat__n">' + st.outfits + '</div><div class="stat__l">Outfits</div></div>' +
        '<div class="stat"><div class="stat__n">' + saved.length + '</div><div class="stat__l">Wishlist</div></div>' +
      '</div>' +

      /* ---- appearance ---- */
      '<div class="sec">' +
        '<div class="sec__head"><div class="sec__title">Appearance</div></div>' +
        '<div class="card card--pad">' +
          '<div class="segment">' +
            '<button class="segment__btn' + (theme === 'light' ? ' is-active' : '') + '" data-theme="light">' +
              U.icon('i-sun', 'ico--sm') + ' Light</button>' +
            '<button class="segment__btn' + (theme === 'dark' ? ' is-active' : '') + '" data-theme="dark">' +
              U.icon('i-moon', 'ico--sm') + ' Dark</button>' +
            '<button class="segment__btn' + (theme === 'system' ? ' is-active' : '') + '" data-theme="system">' +
              U.icon('i-sliders', 'ico--sm') + ' System</button>' +
          '</div>' +
          '<p class="t-xs t-faint" style="margin-top:12px">Your choice is saved on this device and applies to every screen.</p>' +
        '</div>' +
      '</div>' +

      /* ---- style profile ---- */
      '<div class="sec"><div class="sec__head"><div class="sec__title">Profile details</div></div>' +
        '<div class="card">' + listrow('i-user', 'Gender', u.gender === 'male' ? 'Male' : u.gender === 'female' ? 'Female' : 'Not set', '#/gender?edit=1') + '</div></div>' +
      '<div class="sec">' +
        '<div class="sec__head"><div class="sec__title">Style Preferences</div>' +
          '<button class="sec__link" data-go="#/onboarding">Edit ' + U.icon('i-right') + '</button></div>' +
        '<div class="card card--pad">' +
          '<div class="t-sm t-med">Styles</div>' +
          '<div class="prefchips">' + prefChips(p.styles, 'Not set yet') + '</div>' +
          '<div class="t-sm t-med" style="margin-top:16px">Colours</div>' +
          '<div class="prefchips">' + (p.colours && p.colours.length
            ? p.colours.map(function (c) {
                return '<span class="badge badge--muted"><i class="itemcard__dot" style="background:' +
                  D.colourHex(c) + '"></i>' + U.esc(c) + '</span>';
              }).join('')
            : '<span class="t-xs t-faint">Not set yet</span>') + '</div>' +
          '<div class="t-sm t-med" style="margin-top:16px">Occasions</div>' +
          '<div class="prefchips">' + prefChips(p.occasions, 'Not set yet') + '</div>' +
          '<div class="t-sm t-med" style="margin-top:16px">Preferred fit</div>' +
          '<div class="prefchips">' + prefChips(p.fit ? [p.fit] : null, 'Not set yet') + '</div>' +
        '</div>' +
      '</div>' +

      /* ---- wishlist ---- */
      '<div class="sec">' +
        '<div class="sec__head"><div class="sec__title">Saved Products</div>' +
          '<span class="sec__link">' + saved.length + ' items</span></div>' +
        (saved.length
          ? '<div class="itemgrid stagger">' + saved.map(function (p2) {
              return '<div class="itemcard">' +
                '<a class="itemcard__thumb" href="' + p2.url + '" target="_blank" rel="noopener noreferrer" style="display:block">' +
                  G.garment({ color: p2.color, kind: p2.kind, cat: p2.cat, label: p2.name }) + '</a>' +
                '<span class="itemcard__name trunc">' + U.esc(p2.name) + '</span>' +
                '<span class="itemcard__meta">' + U.money(p2.price) + ' · ' + U.esc(p2.store) + '</span>' +
                '<button class="fav is-on" data-unsave="' + p2.id + '" aria-label="Remove from saved">' + U.icon('i-bookmark') + '</button>' +
              '</div>';
            }).join('') + '</div>'
          : '<div class="card card--pad"><div class="empty" style="padding:24px 0">' +
              '<div class="empty__ico">' + U.icon('i-bookmark', 'ico--lg') + '</div>' +
              '<div class="empty__t">No saved products</div>' +
              '<div class="empty__s">Use Find Similar or Find Pair on any item and save what you like.</div>' +
            '</div></div>') +
      '</div>' +

      /* ---- more ---- */
      '<div class="sec">' +
        '<div class="sec__head"><div class="sec__title">More</div></div>' +
        '<div class="card">' +
          '<button class="listrow" data-row="install" data-pwa-row' +
            ((w.PWA && w.PWA.available()) ? '' : ' hidden') + '>' +
            '<span class="listrow__ico">' + U.icon('i-plus') + '</span>' +
            '<span class="grow">' +
              '<span class="listrow__t" style="display:block">Install Aura Fit</span>' +
              '<span class="listrow__s" style="display:block">Add to your device, works offline</span>' +
            '</span>' +
            '<span class="listrow__chev">' + U.icon('i-right', 'ico--sm') + '</span>' +
          '</button>' +
          listrow('i-sliders', 'Wardrobe stats', 'Usage, categories and style profile', '#/stats') +
          listrow('i-hanger', 'My outfits', 'Every look you have saved', '#/wardrobe?mode=outfits') +
          listrow('i-shield', 'Privacy & data', 'Everything is stored on this device only', null, 'privacy') +
          listrow('i-trash', 'Reset demo data', 'Restore the starter wardrobe', null, 'reset') +
        '</div>' +
      '</div>' +

      '<button class="btn btn--ghost btn--block btn--lg" style="margin-top:24px" data-logout>' +
        U.icon('i-logout') + ' Sign out</button>' +

      '<p class="t-xs t-faint t-center" style="margin-top:20px">Aura Fit · v1.1</p>';
    },

    mount: function (view) {
      U.on(view, 'click', '[data-theme]', function (e, t) {
        var v = t.dataset.theme;
        S.setTheme(v === 'system' ? null : v);
        U.$$('[data-theme]', view).forEach(function (b) {
          b.classList.toggle('is-active', b.dataset.theme === v);
        });
        w.App.syncThemeButtons();
        U.toast('Theme set to ' + v, 'success');
      });

      U.on(view, 'click', '[data-unsave]', function (e, t) {
        S.toggleSavedProduct(t.dataset.unsave);
        U.toast('Removed from wishlist', 'success');
        w.Router.refresh();
      });

      U.on(view, 'click', '[data-row="install"]', function () {
        if (w.PWA && w.PWA.available()) { w.PWA.promptInstall(); return; }
        U.confirmDialog({
          title: 'Install Aura Fit',
          text: w.PWA && w.PWA.isStandalone()
            ? 'Aura Fit is already installed and running as an app.'
            : 'Your browser has not offered an install for this page yet. In Chrome, open the menu and choose "Install page as app"; on iPhone use Share then "Add to Home Screen".',
          ok: 'Got it', cancel: 'Close'
        });
      });

      U.on(view, 'click', '[data-row="privacy"]', function () {
        U.confirmDialog({
          title: 'Privacy & data',
          text: 'Aura Fit stores your wardrobe, photos and preferences in this browser only. Nothing is uploaded to a server. Clearing your browser data will remove it.',
          ok: 'Got it', cancel: 'Close'
        });
      });

      U.on(view, 'click', '[data-row="reset"]', function () {
        U.confirmDialog({
          title: 'Reset demo data?',
          text: 'Your wardrobe, outfits and saved products will be restored to the starter set. Your account stays.',
          ok: 'Reset', danger: true
        }).then(function (yes) {
          if (!yes) return;
          S.resetLibrary();
          U.toast('Demo data restored', 'success');
          w.Router.go('#/home');
        });
      });

      U.on(view, 'click', '[data-editprofile]', function () {
        var u = S.user(); if (!u) return;
        U.promptDialog({
          title: 'Edit profile', text: 'This is the name shown across the app.',
          value: u.name, placeholder: 'Your name', ok: 'Save'
        }).then(function (name) {
          if (name === null) return;
          if (!name.trim()) return U.toast('Name cannot be empty.', 'error');
          S.updateUser({ name: name.trim() });
          U.toast('Profile updated', 'success');
          w.Router.refresh();
        });
      });

      U.on(view, 'click', '[data-logout]', function () {
        U.confirmDialog({ title: 'Sign out?', text: 'Your wardrobe stays saved on this device.', ok: 'Sign out' })
          .then(function (yes) {
            if (!yes) return;
            S.logout();
            w.Router.go('#/login');
          });
      });
    }
  };

  function listrow(ico, title, sub, href, action) {
    var attrs = href ? 'data-go="' + href + '"' : 'data-row="' + action + '"';
    return '<button class="listrow" ' + attrs + '>' +
      '<span class="listrow__ico">' + U.icon(ico) + '</span>' +
      '<span class="grow">' +
        '<span class="listrow__t" style="display:block">' + U.esc(title) + '</span>' +
        '<span class="listrow__s" style="display:block">' + U.esc(sub) + '</span>' +
      '</span>' +
      '<span class="listrow__chev">' + U.icon('i-right', 'ico--sm') + '</span>' +
    '</button>';
  }
})(window);
