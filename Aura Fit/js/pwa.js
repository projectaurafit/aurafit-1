/* ==========================================================
   AURA FIT - INSTALL / PWA
   Registers the service worker and owns the "Install app"
   experience: a dismissible banner plus a row in Account.

   Chrome fires `beforeinstallprompt` only when the app is
   served over http(s) with a manifest and a service worker,
   and is not already installed. Inside a sandboxed preview
   frame it never fires - so every affordance here is created
   on the event, never assumed.
   ========================================================== */
(function (w) {
  'use strict';

  var deferred = null;                 // the saved beforeinstallprompt event
  var DISMISS_KEY = 'aurafit.installDismissed';

  function U() { return w.UI; }

  /* ---------------- service worker ---------------- */
  function registerSW() {
    if (!('serviceWorker' in navigator)) return;
    if (location.protocol === 'file:') return;        // SW needs http(s)
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {
        /* not fatal - the app works fine without offline support */
      });
    });
  }

  /* ---------------- state ---------------- */
  function isStandalone() {
    return (w.matchMedia && w.matchMedia('(display-mode: standalone)').matches) ||
           navigator.standalone === true;
  }
  function dismissed() {
    try { return localStorage.getItem(DISMISS_KEY) === '1'; } catch (e) { return false; }
  }
  function dismiss() {
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch (e) {}
  }

  /* Can we actually offer an install? */
  function available() { return !!deferred; }

  /* ---------------- the prompt ---------------- */
  function promptInstall() {
    if (!deferred) return Promise.resolve('unavailable');
    var e = deferred;
    deferred = null;                                  // a prompt can only be used once
    e.prompt();
    return e.userChoice.then(function (choice) {
      hideBanner();
      if (choice && choice.outcome === 'accepted') {
        if (U()) U().toast('Installing Aura Fit…', 'success');
      } else {
        dismiss();
      }
      refreshAffordances();
      return choice ? choice.outcome : 'dismissed';
    });
  }

  /* ---------------- banner ---------------- */
  function showBanner() {
    if (dismissed() || isStandalone() || document.getElementById('pwa-banner')) return;
    if (!U()) return;

    var el = U().el(
      '<div class="pwa-banner" id="pwa-banner" role="region" aria-label="Install Aura Fit">' +
        '<span class="pwa-banner__ico">' + U().icon('i-plus') + '</span>' +
        '<span class="pwa-banner__txt">' +
          '<strong>Install Aura Fit</strong>' +
          '<small>Add to your device, works offline</small>' +
        '</span>' +
        '<button class="btn btn--primary btn--sm" data-pwa-install>Install</button>' +
        '<button class="iconbtn" data-pwa-close aria-label="Not now">' + U().icon('i-x') + '</button>' +
      '</div>');

    document.body.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('is-in'); });

    el.querySelector('[data-pwa-install]').onclick = promptInstall;
    el.querySelector('[data-pwa-close]').onclick = function () {
      dismiss();
      hideBanner();
    };
  }

  function hideBanner() {
    var el = document.getElementById('pwa-banner');
    if (!el) return;
    el.classList.remove('is-in');
    setTimeout(function () { if (el.parentNode) el.remove(); }, 260);
  }

  /* Account screen re-renders often; keep its row in step */
  function refreshAffordances() {
    var rows = document.querySelectorAll('[data-pwa-row]');
    for (var i = 0; i < rows.length; i++) {
      rows[i].hidden = !available();
    }
  }

  /* ---------------- events ---------------- */
  w.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();                                // we drive the timing
    deferred = e;
    refreshAffordances();
    /* give the user a moment to land before offering */
    setTimeout(showBanner, 2500);
  });

  w.addEventListener('appinstalled', function () {
    deferred = null;
    hideBanner();
    refreshAffordances();
    if (U()) U().toast('Aura Fit installed', 'success');
  });

  registerSW();

  w.PWA = {
    available: available,
    isStandalone: isStandalone,
    promptInstall: promptInstall,
    showBanner: showBanner,
    hideBanner: hideBanner,
    refresh: refreshAffordances
  };
})(window);
