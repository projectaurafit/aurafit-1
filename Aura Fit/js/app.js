/* ==========================================================
   AURA FIT - BOOTSTRAP
   ========================================================== */
(function (w) {
  'use strict';
  var U = w.UI, S = w.Store;

  function splash() {
    var node = U.el(
      '<div class="splash">' +
        '<div class="splash__mark">' + U.icon('i-hanger', 'ico--xl') + '</div>' +
        '<div class="splash__name">Aura<em>Fit</em></div>' +
        '<div class="splash__tag">Your wardrobe, styled by AI.</div>' +
      '</div>');
    document.body.appendChild(node);
    setTimeout(function () {
      node.classList.add('is-out');
      setTimeout(function () { node.remove(); }, 460);
    }, 900);
  }

  /* keep every theme button in sync with the active theme */
  function syncThemeButtons() {
    var dark = S.effectiveTheme() === 'dark';
    U.$$('[data-theme-toggle]').forEach(function (b) {
      b.innerHTML = U.icon(dark ? 'i-sun' : 'i-moon');
      b.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    });
  }

  function init() {
    S.load();
    S.applyTheme();
    splash();

    /* ---- global delegated handlers ---- */
    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-skip-main]')) {
        e.preventDefault();
        var content = document.getElementById('main-content');
        if (content) content.focus();
        return;
      }
      var go = e.target.closest('[data-go]');
      if (go) {
        e.preventDefault();
        w.Router.go(go.dataset.go);
        return;
      }
      var back = e.target.closest('[data-back]');
      if (back) {
        e.preventDefault();
        w.Router.back();
        return;
      }
      var th = e.target.closest('[data-theme-toggle]');
      if (th) {
        e.preventDefault();
        var t = S.toggleTheme();
        syncThemeButtons();
        U.toast(t === 'dark' ? 'Dark mode on' : 'Light mode on', 'success');
      }
    });

    /* follow the OS while the user has not made an explicit choice */
    if (w.matchMedia) {
      var mq = w.matchMedia('(prefers-color-scheme: dark)');
      var onChange = function () {
        if (!S.state.theme) { S.applyTheme(); syncThemeButtons(); }
      };
      if (mq.addEventListener) mq.addEventListener('change', onChange);
      else if (mq.addListener) mq.addListener(onChange);
    }

    if (!location.hash) location.replace(location.pathname + location.search + '#/home');
    w.Router.render();
  }

  w.App = { init: init, syncThemeButtons: syncThemeButtons };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window);
