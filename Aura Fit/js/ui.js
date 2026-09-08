/* ==========================================================
   AURA FIT - UI KIT
   DOM helpers, toasts, modals, and the bottom-sheet product
   panel (slide-up, ~2/3 screen, single-select).
   ========================================================== */
(function (w) {
  'use strict';

  /* ---------------- DOM ---------------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function el(html) {
    var t = document.createElement('template');
    t.innerHTML = String(html).trim();
    return t.content.firstElementChild;
  }
  function frag(html) {
    var t = document.createElement('template');
    t.innerHTML = String(html).trim();
    return t.content;
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
  }

  function icon(name, cls) {
    return '<svg class="ico ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true">' +
             '<use href="#' + name + '"/></svg>';
  }

  function money(n) {
    return '₹' + Number(n || 0).toLocaleString('en-IN');
  }

  function on(root, evt, sel, fn) {
    root.addEventListener(evt, function (e) {
      var t = e.target.closest(sel);
      if (t && root.contains(t)) fn(e, t);
    });
  }

  /* ---------------- date ---------------- */
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  function fmtDate(d) {
    d = d instanceof Date ? d : new Date(d);
    return MONTHS[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
  }
  function greeting() {
    var h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  }

  /* ---------------- toast ----------------
     One at a time. Repeatedly tapping Save, or flipping the theme back and
     forth, used to stack a new toast on every press; now the existing toast
     is reused and its timer restarted, so notifications never pile up. */
  var toastNode = null, toastTimer = null, toastExitTimer = null;

  function toast(msg, type) {
    var layer = $('#toast-layer');
    if (!layer) return;
    var ic = type === 'error' ? 'i-x' : type === 'success' ? 'i-check' : 'i-sparkle';

    clearTimeout(toastTimer);
    clearTimeout(toastExitTimer);

    if (!toastNode || !toastNode.isConnected) {
      toastNode = el('<div class="toast"><span data-t-ico></span><span data-t-msg></span></div>');
      layer.innerHTML = '';
      layer.appendChild(toastNode);
    } else {
      /* replay the entrance so a repeat press still reads as feedback */
      toastNode.classList.remove('is-out');
      toastNode.style.animation = 'none';
      void toastNode.offsetWidth;
      toastNode.style.animation = '';
    }

    toastNode.className = 'toast toast--' + (type || 'info');
    toastNode.querySelector('[data-t-ico]').innerHTML = icon(ic);
    toastNode.querySelector('[data-t-msg]').textContent = msg;

    var node = toastNode;
    toastTimer = setTimeout(function () {
      node.classList.add('is-out');
      toastExitTimer = setTimeout(function () {
        if (node.parentNode) node.remove();
        if (toastNode === node) toastNode = null;
      }, 200);
    }, 2400);
  }

  /* Shared keyboard and scroll lifecycle for dialogs and product sheets. */
  var overlayStack = [];
  var dialogClosers = [];
  function closeDialogs() { dialogClosers.slice().forEach(function (close) { close(); }); }
  function containFocus(node, initial) {
    var previous = document.activeElement;
    var overflow = document.body.style.overflow;
    var root = $('#root'), wasInert = root && root.inert;
    if (root) root.inert = true;
    document.body.style.overflow = 'hidden';
    overlayStack.push(node);
    function keys(e) {
      if (e.key !== 'Tab' || overlayStack[overlayStack.length - 1] !== node) return;
      var controls = $$('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]', node)
        .filter(function (x) { return x.getClientRects().length && !x.closest('[hidden], [inert]'); });
      var first = controls[0], last = controls[controls.length - 1];
      if (!first) { e.preventDefault(); node.focus(); return; }
      if (!node.contains(document.activeElement) || (e.shiftKey && document.activeElement === first)) {
        e.preventDefault(); (e.shiftKey ? last : first).focus();
      } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    node.setAttribute('tabindex', '-1');
    document.addEventListener('keydown', keys);
    requestAnimationFrame(function () { if (node.isConnected) (initial || node).focus({ preventScroll: true }); });
    return function () {
      document.removeEventListener('keydown', keys);
      overlayStack = overlayStack.filter(function (x) { return x !== node; });
      document.body.style.overflow = overflow;
      if (root) root.inert = wasInert;
      if (previous && previous.isConnected && !previous.closest('[inert]')) previous.focus({ preventScroll: true });
    };
  }

  /* ---------------- confirm modal ---------------- */
  function confirmDialog(opts) {
    return new Promise(function (resolve) {
      var scrim = el(
        '<div class="modal-scrim" role="dialog" aria-modal="true" aria-label="' + esc(opts.title || 'Are you sure?') + '">' +
          '<div class="modal">' +
            '<div class="modal__title">' + esc(opts.title || 'Are you sure?') + '</div>' +
            '<div class="modal__text">' + esc(opts.text || '') + '</div>' +
            '<div class="modal__acts">' +
              '<button class="btn btn--ghost" data-no>' + esc(opts.cancel || 'Cancel') + '</button>' +
              '<button class="btn ' + (opts.danger ? 'btn--danger' : 'btn--primary') + '" data-yes>' + esc(opts.ok || 'Confirm') + '</button>' +
            '</div>' +
          '</div>' +
        '</div>');
      document.body.appendChild(scrim);
      var release = containFocus(scrim, scrim.querySelector('[data-no]')), closed = false;
      requestAnimationFrame(function () { scrim.classList.add('is-open'); });

      function esckey(e) { if (e.key === 'Escape') close(false); }
      function close(v) {
        if (closed) return;
        closed = true;
        dialogClosers = dialogClosers.filter(function (fn) { return fn !== dismiss; });
        document.removeEventListener('keydown', esckey);
        release();
        scrim.classList.remove('is-open');
        setTimeout(function () { scrim.remove(); }, 220);
        resolve(v);
      }
      function dismiss() { close(false); }
      dialogClosers.push(dismiss);
      scrim.querySelector('[data-yes]').onclick = function () { close(true); };
      scrim.querySelector('[data-no]').onclick = function () { close(false); };
      scrim.onclick = function (e) { if (e.target === scrim) close(false); };
      document.addEventListener('keydown', esckey);
    });
  }

  /* ---------------- prompt modal (replaces window.prompt) ---------------- */
  function promptDialog(opts) {
    return new Promise(function (resolve) {
      var scrim = el(
        '<div class="modal-scrim" role="dialog" aria-modal="true" aria-label="' + esc(opts.title || 'Edit') + '">' +
          '<div class="modal">' +
            '<div class="modal__title">' + esc(opts.title || '') + '</div>' +
            (opts.text ? '<div class="modal__text">' + esc(opts.text) + '</div>' : '') +
            '<input class="input" aria-label="' + esc(opts.placeholder || opts.title || 'Value') + '" maxlength="120" value="' + esc(opts.value || '') + '" ' +
              'placeholder="' + esc(opts.placeholder || '') + '" style="margin-bottom:var(--s5)">' +
            '<div class="modal__acts">' +
              '<button class="btn btn--ghost" data-no>Cancel</button>' +
              '<button class="btn btn--primary" data-yes>' + esc(opts.ok || 'Save') + '</button>' +
            '</div>' +
          '</div>' +
        '</div>');
      document.body.appendChild(scrim);
      var input = scrim.querySelector('.input');
      var release = containFocus(scrim, input), closed = false;
      requestAnimationFrame(function () {
        scrim.classList.add('is-open');
        input.focus(); input.select();
      });

      function esckey(e) {
        if (e.key === 'Escape') close(null);
        else if (e.key === 'Enter' && document.activeElement === input) close(input.value);
      }
      function close(v) {
        if (closed) return;
        closed = true;
        dialogClosers = dialogClosers.filter(function (fn) { return fn !== dismiss; });
        document.removeEventListener('keydown', esckey);
        release();
        scrim.classList.remove('is-open');
        setTimeout(function () { scrim.remove(); }, 220);
        resolve(v);
      }
      function dismiss() { close(null); }
      dialogClosers.push(dismiss);
      scrim.querySelector('[data-yes]').onclick = function () { close(input.value); };
      scrim.querySelector('[data-no]').onclick = function () { close(null); };
      scrim.onclick = function (e) { if (e.target === scrim) close(null); };
      document.addEventListener('keydown', esckey);
    });
  }

  /* ==========================================================
     BOTTOM SHEET - PRODUCT PANEL
     - slides up to ~2/3 of the viewport
     - page stays visible behind a scrim
     - two product lists (tabs)
     - single selection only, highlighted, with a View / Buy bar
     ========================================================== */
  var Sheet = (function () {
    var scrim = null, sheet = null, cur = null, selected = null;
    var releaseFocus = null, releaseDrag = null;

    function productCard(p, isSel) {
      var saved = w.Store.isSavedProduct(p.id);
      return '' +
        '<button class="prodcard' + (isSel ? ' is-selected' : '') + '" aria-pressed="' + !!isSel + '" data-pid="' + p.id + '">' +
          '<span class="prodcard__tick">' + icon('i-check') + '</span>' +
          (saved ? '<span class="prodcard__saved" aria-hidden="true">' + icon('i-bookmark') + '</span>' : '') +
          '<span class="thumb">' + w.Garments.garment({ color: p.color, kind: p.kind, cat: p.cat, label: p.name }) + '</span>' +
          '<span class="prodcard__body">' +
            '<span class="prodcard__name clamp2">' + esc(p.name) + '</span>' +
            '<span class="prodcard__brand">' + esc(p.brand) + ' · ' + esc(p.colorName) + '</span>' +
            '<span class="prodcard__price">' + money(p.price) +
              (p.mrp ? '<span class="prodcard__old">' + money(p.mrp) + '</span>' : '') +
            '</span>' +
          '</span>' +
        '</button>';
    }

    function renderList(list) {
      if (!list || !list.length) {
        return '<div class="empty"><div class="empty__ico">' + icon('i-bag', 'ico--lg') + '</div>' +
               '<div class="empty__t">Nothing to show</div>' +
               '<div class="empty__s">We could not find matching products for this selection.</div></div>';
      }
      return '<div class="itemgrid stagger">' + list.map(function (p) {
        return productCard(p, selected && selected.id === p.id);
      }).join('') + '</div>';
    }

    function paint(keepScroll) {
      var body = sheet.querySelector('.sheet__body');
      var scroll = body.scrollTop;
      var tab = cur.tabs[cur.active];
      body.innerHTML = renderList(tab && tab.items);
      body.scrollTop = keepScroll ? scroll : 0;

      $$('.sheet__tabs .tab', sheet).forEach(function (b, i) {
        b.classList.toggle('is-active', i === cur.active);
        b.setAttribute('aria-pressed', String(i === cur.active));
      });
      paintBar();
    }

    function paintBar() {
      var bar = sheet.querySelector('.sheet__bar');
      bar.inert = !selected;
      if (!selected) { bar.classList.remove('is-visible'); return; }
      bar.querySelector('.sheet__bar-name').textContent = selected.name;
      /* brand and store are often the same name - do not print it twice */
      bar.querySelector('.sheet__bar-price').textContent =
        [selected.brand, money(selected.price),
         selected.store === selected.brand ? null : selected.store]
          .filter(Boolean).join(' · ');
      bar.querySelector('[data-buy]').href = selected.url;
      var sv = bar.querySelector('[data-save]');
      var on = w.Store.isSavedProduct(selected.id);
      sv.innerHTML = icon('i-bookmark', on ? 'ico--sm ico--fill' : 'ico--sm') +
                     '<span data-save-label>' + (on ? 'Saved' : 'Save') + '</span>';
      sv.classList.toggle('is-saved', on);
      sv.setAttribute('aria-pressed', on ? 'true' : 'false');
      bar.classList.add('is-visible');
    }

    function open(opts) {
      close(true);
      cur = { tabs: opts.tabs || [], active: 0, title: opts.title, sub: opts.sub };
      selected = null;

      scrim = el('<div class="sheet-scrim"></div>');
      sheet = el('' +
        '<section class="sheet" role="dialog" aria-modal="true" aria-label="' + esc(opts.title || 'Products') + '">' +
          '<div class="sheet__grip"><span></span></div>' +
          '<div class="sheet__head">' +
            '<div>' +
              '<div class="sheet__title">' + esc(opts.title || '') + '</div>' +
              '<div class="sheet__sub">' + esc(opts.sub || '') + '</div>' +
            '</div>' +
            '<button class="iconbtn" data-close aria-label="Close">' + icon('i-x') + '</button>' +
          '</div>' +
          '<div class="sheet__tabs"><div class="tabs">' +
            cur.tabs.map(function (t, i) {
              return '<button class="tab' + (i === 0 ? ' is-active' : '') + '" data-tab="' + i + '">' +
                     esc(t.label) + ' <span class="t-faint">' + (t.items ? t.items.length : 0) + '</span></button>';
            }).join('') +
          '</div></div>' +
          '<div class="sheet__body"></div>' +
          '<div class="sheet__bar">' +
            '<div class="sheet__bar-info">' +
              '<div class="sheet__bar-name"></div>' +
              '<div class="sheet__bar-price"></div>' +
            '</div>' +
            '<button class="btn btn--ghost btn--sm sheet__save" data-save>' +
              icon('i-bookmark', 'ico--sm') + '<span data-save-label>Save</span></button>' +
            '<a class="btn btn--primary btn--sm" data-buy target="_blank" rel="noopener noreferrer">' +
              'View store ' + icon('i-link', 'ico--sm') + '</a>' +
          '</div>' +
        '</section>');

      var layer = $('#sheet-layer');
      layer.appendChild(scrim);
      layer.appendChild(sheet);

      paint();
      releaseFocus = containFocus(sheet, sheet.querySelector('[data-close]'));

      var openingSheet = sheet, openingScrim = scrim;
      requestAnimationFrame(function () {
        if (sheet !== openingSheet) return;
        openingScrim.classList.add('is-open');
        openingSheet.classList.add('is-open');
      });

      document.body.classList.add('is-sheet-open');

      /* interactions */
      scrim.onclick = function () { close(); };
      sheet.querySelector('[data-close]').onclick = function () { close(); };

      on(sheet, 'click', '[data-tab]', function (e, t) {
        cur.active = +t.dataset.tab;
        selected = null;
        paint();
      });

      /* single selection only - selecting one clears any other */
      on(sheet, 'click', '[data-pid]', function (e, t) {
        var id = t.dataset.pid;
        var p = null, all = [];
        cur.tabs.forEach(function (tab) { all = all.concat(tab.items || []); });
        all.forEach(function (x) { if (x.id === id) p = x; });
        if (!p) return;

        if (selected && selected.id === id) { selected = null; }
        else { selected = p; }

        $$('.prodcard', sheet).forEach(function (c) {
          c.classList.toggle('is-selected', !!selected && c.dataset.pid === selected.id);
          c.setAttribute('aria-pressed', String(!!selected && c.dataset.pid === selected.id));
        });
        paintBar();
      });

      sheet.querySelector('[data-save]').onclick = function () {
        if (!selected) return;
        var added = w.Store.toggleSavedProduct(selected.id);
        toast(added ? 'Saved to your wishlist' : 'Removed from wishlist', 'success');
        paint(true);
      };
      sheet.querySelector('[data-buy]').addEventListener('click', function () {
        if (selected) toast('Opening ' + selected.store + '…');
      });

      releaseDrag = dragToDismiss();
      document.addEventListener('keydown', keyHandler);
    }

    function keyHandler(e) { if (e.key === 'Escape') close(); }

    /* grab handle -> drag down to dismiss */
    function dragToDismiss() {
      var grip = sheet.querySelector('.sheet__grip');
      var startY = 0, dy = 0, dragging = false;

      function down(e) {
        dragging = true; dy = 0;
        startY = (e.touches ? e.touches[0].clientY : e.clientY);
        sheet.classList.add('is-dragging');
        document.addEventListener('mousemove', move);
        document.addEventListener('touchmove', move, { passive: false });
        document.addEventListener('mouseup', up);
        document.addEventListener('touchend', up);
        document.addEventListener('touchcancel', up);
      }
      function move(e) {
        if (!dragging) return;
        var y = (e.touches ? e.touches[0].clientY : e.clientY);
        dy = Math.max(0, y - startY);
        if (e.cancelable) e.preventDefault();
        sheet.style.transform = 'translateY(' + dy + 'px)';
        if (w.matchMedia('(min-width:1024px)').matches) {
          sheet.style.transform = 'translate(-50%,' + dy + 'px)';
        }
        scrim.style.opacity = String(Math.max(0, 1 - dy / 360));
      }
      function up() {
        dragging = false;
        cleanup();
        if (!sheet) return;
        sheet.classList.remove('is-dragging');
        sheet.style.transform = '';
        scrim.style.opacity = '';
        if (dy > 130) close();
      }
      function cleanup() {
        dragging = false;
        document.removeEventListener('mousemove', move);
        document.removeEventListener('touchmove', move);
        document.removeEventListener('mouseup', up);
        document.removeEventListener('touchend', up);
        document.removeEventListener('touchcancel', up);
      }
      grip.addEventListener('mousedown', down);
      grip.addEventListener('touchstart', down, { passive: true });
      return cleanup;
    }

    function close(immediate) {
      document.removeEventListener('keydown', keyHandler);
      if (!sheet) return;
      if (releaseDrag) { releaseDrag(); releaseDrag = null; }
      if (releaseFocus) { releaseFocus(); releaseFocus = null; }
      var s = sheet, sc = scrim;
      sheet = null; scrim = null; selected = null; cur = null;
      document.body.classList.remove('is-sheet-open');
      if (immediate) { s.remove(); if (sc) sc.remove(); return; }
      s.classList.remove('is-open');
      if (sc) sc.classList.remove('is-open');
      setTimeout(function () { s.remove(); if (sc) sc.remove(); }, 420);
    }

    return { open: open, close: close };
  })();

  /* ---------------- donut ---------------- */
  function donut(pct, size, stroke) {
    size = size || 72; stroke = stroke || 8;
    var r = (size - stroke) / 2;
    var c = 2 * Math.PI * r;
    var off = c * (1 - Math.max(0, Math.min(100, pct)) / 100);
    return '<div class="donut" style="width:' + size + 'px;height:' + size + 'px">' +
      '<svg width="' + size + '" height="' + size + '">' +
        '<circle class="donut__track" cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" stroke-width="' + stroke + '"/>' +
        '<circle class="donut__arc" cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" stroke-width="' + stroke + '" ' +
          'stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '"/>' +
      '</svg>' +
      '<div class="donut__val">' + pct + '%</div>' +
    '</div>';
  }

  /* ---------------- misc ---------------- */
  function initials(name) {
    return String(name || 'A').trim().split(/\s+/).slice(0, 2)
      .map(function (p) { return p[0]; }).join('').toUpperCase();
  }

  function shareText(text) {
    function failed(error) {
      if (!error || error.name !== 'AbortError') toast('Sharing was unavailable. Please try again or copy the details manually.', 'error');
    }
    if (navigator.share) {
      return navigator.share({ title: 'Aura Fit', text: text }).catch(failed);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(function () { toast('Copied to clipboard', 'success'); }).catch(failed);
    }
    failed();
  }

  var stickyListener = null;
  function stickyTopbar() {
    var bar = $('.topbar');
    if (!bar || bar.dataset.sticky) return;
    if (stickyListener) window.removeEventListener('scroll', stickyListener);
    bar.dataset.sticky = '1';
    var scroller = document.querySelector('.main') || window;
    function chk() {
      var y = window.scrollY || document.documentElement.scrollTop;
      bar.classList.toggle('is-stuck', y > 6);
    }
    window.addEventListener('scroll', chk, { passive: true });
    stickyListener = chk;
    chk();
  }

  w.UI = {
    $: $, $$: $$, el: el, frag: frag, esc: esc, icon: icon, money: money, on: on,
    fmtDate: fmtDate, greeting: greeting, MONTHS: MONTHS, DAYS: DAYS,
    toast: toast, confirmDialog: confirmDialog, promptDialog: promptDialog, containFocus: containFocus, closeDialogs: closeDialogs, Sheet: Sheet,
    donut: donut, initials: initials, shareText: shareText, stickyTopbar: stickyTopbar
  };
})(window);
