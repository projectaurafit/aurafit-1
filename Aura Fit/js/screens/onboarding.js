/* ==========================================================
   SCREENS - ONE-TIME PREFERENCES
   Collected once, right after sign-up. Feeds the recommendation
   engine so the user never re-enters the same information.
   ========================================================== */
(function (w) {
  'use strict';
  var U = w.UI, S = w.Store, D = w.Data;
  var Screens = w.Screens = w.Screens || {};

  var STYLE_META = {
    'Minimal':      { ico: 'i-grid',    s: 'Clean, simple and elegant.' },
    'Casual':       { ico: 'i-shirt',   s: 'Easy everyday comfort.' },
    'Aesthetic':    { ico: 'i-sparkle', s: 'Soft tones, considered detail.' },
    'Streetwear':   { ico: 'i-shoe',    s: 'Relaxed, bold, layered.' },
    'Professional': { ico: 'i-bag',     s: 'Sharp and workplace-ready.' },
    'Party':        { ico: 'i-star',    s: 'Statement pieces, evening ready.' },
    'Sporty':       { ico: 'i-refresh', s: 'Built to move.' },
    'Traditional':  { ico: 'i-tag',     s: 'Classic and occasion-led.' }
  };
  var STYLE_LIST = Object.keys(STYLE_META);
  var COLOUR_LIST = ['Ivory', 'Cream', 'Beige', 'Camel', 'Brown', 'Black', 'Charcoal', 'Grey',
                     'Navy', 'Denim blue', 'Sky', 'Olive', 'Sage', 'Blush', 'Rose', 'Maroon',
                     'Mustard', 'Rust', 'Lavender', 'Plum'];
  var OCC_LIST = ['Everyday', 'College', 'Office', 'Party', 'Date night', 'Travel', 'Wedding', 'Workout'];
  var FITS = [
    { id: 'Fitted',  s: 'Close to the body.' },
    { id: 'Regular', s: 'True to size.' },
    { id: 'Relaxed', s: 'Loose and easy.' },
    { id: 'Oversized', s: 'Deliberately roomy.' }
  ];

  var draft = null, step = 0, editing = false;

  var STEPS = [
    {
      q: 'How would you describe your style?',
      hint: 'Pick up to three. This shapes every suggestion you get.',
      key: 'styles', multi: true, max: 3,
      render: function () {
        return '<div class="optgrid">' + STYLE_LIST.map(function (s) {
          var m = STYLE_META[s];
          var on = draft.styles.indexOf(s) >= 0;
          return '<button class="opt' + (on ? ' is-active' : '') + '" data-val="' + U.esc(s) + '">' +
            '<span class="opt__ico">' + U.icon(m.ico) + '</span>' +
            '<span class="opt__t">' + U.esc(s) + '</span>' +
            '<span class="opt__s">' + U.esc(m.s) + '</span>' +
          '</button>';
        }).join('') + '</div>';
      }
    },
    {
      q: 'Which colours do you actually wear?',
      hint: 'Choose the shades you reach for most. Pick at least three.',
      key: 'colours', multi: true, max: 8,
      render: function () {
        return '<div class="swatches" style="gap:14px">' + COLOUR_LIST.map(function (c) {
          var hex = D.colourHex(c);
          var on = draft.colours.indexOf(c) >= 0;
          var check = w.Garments.luma(hex) > 0.6 ? '#222' : '#fff';
          return '<button class="swatch' + (on ? ' is-active' : '') + '" data-val="' + U.esc(c) + '" ' +
            'title="' + U.esc(c) + '" aria-label="' + U.esc(c) + '" ' +
            'style="background:' + hex + ';--swatch-check:' + check + '"></button>';
        }).join('') + '</div>' +
        '<p class="t-xs t-faint" style="margin-top:16px" data-picked></p>';
      }
    },
    {
      q: 'Where do you need outfits most?',
      hint: 'Select every occasion that applies.',
      key: 'occasions', multi: true, max: 6,
      render: function () {
        return '<div class="chips" style="flex-wrap:wrap;overflow:visible">' + OCC_LIST.map(function (o) {
          var on = draft.occasions.indexOf(o) >= 0;
          return '<button class="chip' + (on ? ' is-active' : '') + '" data-val="' + U.esc(o) + '">' +
            U.esc(o) + '</button>';
        }).join('') + '</div>';
      }
    },
    {
      q: 'How do you like things to fit?',
      hint: 'One choice. You can change this later in your account.',
      key: 'fit', multi: false,
      render: function () {
        return '<div class="optgrid">' + FITS.map(function (f) {
          var on = draft.fit === f.id;
          return '<button class="opt' + (on ? ' is-active' : '') + '" data-val="' + U.esc(f.id) + '">' +
            '<span class="opt__t">' + U.esc(f.id) + '</span>' +
            '<span class="opt__s">' + U.esc(f.s) + '</span>' +
          '</button>';
        }).join('') + '</div>';
      }
    }
  ];

  Screens.onboarding = {
    shell: false,
    render: function () {
      var u = S.user();
      editing = !!(u && u.onboarded);
      draft = (u && u.prefs) ? JSON.parse(JSON.stringify(u.prefs))
                             : { styles: [], colours: [], occasions: [], fit: '' };
      draft.styles = draft.styles || []; draft.colours = draft.colours || [];
      draft.occasions = draft.occasions || []; draft.fit = draft.fit || '';
      step = 0;

      return '<div class="onb">' +
        '<div class="onb__top">' +
          '<button class="iconbtn" data-prev aria-label="Back">' + U.icon('i-left') + '</button>' +
          '<div class="stepper grow">' + STEPS.map(function (_, i) {
            return '<i class="' + (i === 0 ? 'is-on' : '') + '"></i>';
          }).join('') + '</div>' +
          '<button class="btn btn--quiet btn--sm" data-skip>' + (editing ? 'Cancel' : 'Skip') + '</button>' +
        '</div>' +
        '<div class="onb__body" data-body></div>' +
        '<div class="onb__foot">' +
          '<button class="btn btn--primary btn--block btn--lg" data-next>Continue</button>' +
        '</div>' +
      '</div>';
    },

    mount: function (root) {
      var body = root.querySelector('[data-body]');
      var next = root.querySelector('[data-next]');
      var dots = U.$$('.stepper i', root);

      function valid() {
        var s = STEPS[step];
        if (s.key === 'fit') return !!draft.fit;
        if (s.key === 'colours') return draft.colours.length >= 3;
        return draft[s.key].length >= 1;
      }

      function paint() {
        var s = STEPS[step];
        body.innerHTML =
          '<div class="anim-in">' +
            '<h1 class="onb__q">' + U.esc(s.q) + '</h1>' +
            '<p class="onb__hint">' + U.esc(s.hint) + '</p>' +
            s.render() +
          '</div>';
        dots.forEach(function (d, i) { d.classList.toggle('is-on', i <= step); });
        /* step 0 has nowhere to go back to for a signed-in user */
        var prevBtn = root.querySelector('[data-prev]');
        if (prevBtn) prevBtn.style.visibility = step === 0 ? 'hidden' : '';
        next.textContent = step === STEPS.length - 1 ? 'Finish setup' : 'Continue';
        next.classList.toggle('is-disabled', !valid());
        next.disabled = !valid();
        U.$$('[data-val]', body).forEach(function (button) { button.setAttribute('aria-pressed', String(button.classList.contains('is-active'))); });
        paintPicked();
      }

      function paintPicked() {
        var t = body.querySelector('[data-picked]');
        if (!t) return;
        t.textContent = draft.colours.length
          ? draft.colours.length + ' selected · ' + draft.colours.join(', ')
          : 'Pick at least three colours to continue.';
      }

      U.on(body, 'click', '[data-val]', function (e, t) {
        var s = STEPS[step], v = t.dataset.val;
        if (!s.multi) {
          draft[s.key] = v;
        } else {
          var arr = draft[s.key];
          var i = arr.indexOf(v);
          if (i >= 0) arr.splice(i, 1);
          else {
            if (arr.length >= s.max) { U.toast('You can pick up to ' + s.max + '.', 'error'); return; }
            arr.push(v);
          }
        }
        paint();
        var focused = U.$$('[data-val]', body).filter(function (button) { return button.dataset.val === v; })[0];
        if (focused) focused.focus({ preventScroll: true });
      });

      next.onclick = function () {
        if (!valid()) { U.toast('Make a selection to continue.', 'error'); return; }
        if (step < STEPS.length - 1) { step++; paint(); return; }
        S.updateUser({ prefs: draft, onboarded: true });
        U.toast('Your style profile is ready', 'success');
        w.Router.go(editing ? '#/account' : '#/home');
      };

      root.querySelector('[data-prev]').onclick = function () {
        if (step === 0) return;
        step--; paint();
      };

      root.querySelector('[data-skip]').onclick = function () {
        if (editing) { w.Router.go('#/account'); return; }
        S.updateUser({
          prefs: { styles: ['Casual'], colours: ['Black', 'White', 'Denim blue'], occasions: ['Everyday'], fit: 'Regular' },
          onboarded: true
        });
        w.Router.go('#/home');
      };

      paint();
    }
  };
})(window);
