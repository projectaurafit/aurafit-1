/* ==========================================================
   SCREENS - AI IDEAS / SUGGESTIONS
   Occasion tabs, recommended looks generated from the user's
   own wardrobe, and the AI Stylist natural-language panel.
   ========================================================== */
(function (w) {
  'use strict';
  var U = w.UI, S = w.Store, D = w.Data, R = w.Recommend, G = w.Garments;
  var Screens = w.Screens = w.Screens || {};

  var TABS = [
    { id: 'foryou', label: 'For You',  occ: null },
    { id: 'casual', label: 'Casual',   occ: 'Everyday' },
    { id: 'office', label: 'Office',   occ: 'Office' },
    { id: 'party',  label: 'Party',    occ: 'Party' },
    { id: 'other',  label: 'Other',    occ: 'Travel' }
  ];

  var active = 'foryou';
  var generated = [];
  var salt = 0;            // bumped by Regenerate so results actually change
  var savedByKey = {};     // generated key -> persisted outfit id (prevents duplicates)
  var answerTimer = null;

  function savedLook(o) {
    return S.state.outfits.filter(function (look) {
      return look.items.slice().sort().join('|') === o.key;
    })[0] || null;
  }

  function build(occ, n) {
    var out = [];
    for (var i = 0; i < n; i++) {
      var o = R.buildOutfit(occ, i + salt);
      if (!o) break;
      var key = o.items.slice().sort().join('|');
      if (out.some(function (x) { return x.key === key; })) continue;
      o.key = key;
      o.name = nameFor(occ, i);
      out.push(o);
    }
    return out;
  }

  function nameFor(occ, i) {
    var pool = {
      'Office':     ['Desk to Dinner', 'Monday Sharp', 'Quiet Authority', 'Boardroom Ready',
                     'Deep Work', 'Client Ready', 'Soft Tailoring', 'Inbox Zero'],
      'Party':      ['Evening Out', 'After Hours', 'Night Shift', 'Late Table',
                     'Last Round', 'Neon Hour', 'House Lights', 'Encore'],
      'Everyday':   ['Easy Weekday', 'Coffee Run', 'Slow Sunday', 'Off Duty',
                     'Corner Shop', 'Long Walk', 'Quiet Morning', 'No Plans'],
      'Travel':     ['Airport Layers', 'Long Weekend', 'City Walk', 'Window Seat',
                     'Overnight Bag', 'Platform Nine', 'Coastal Road', 'Late Check-in'],
      'Date night': ['Soft Focus', 'Second Date', 'Golden Hour', 'Close Table',
                     'Slow Dinner', 'Candlelight', 'One More Drink', 'Walk Home']
    }[occ || 'Everyday'] || ['Fresh Pick', 'Balanced Look', 'Everyday Edit', 'Clean Lines',
                             'Quiet Palette', 'Soft Contrast', 'Tonal Study', 'Simple Lines'];
    return pool[i % pool.length];
  }

  function cardFor(o, idx) {
    var saved = savedLook(o), fav = saved && S.isFavOutfit(saved.id);
    return '<div class="outfitcard">' +
      '<button class="fav' + (fav ? ' is-on' : '') + '" data-save-look="' + idx + '" aria-pressed="' + !!fav + '" aria-label="Favourite ' + U.esc(o.name) + '">' + U.icon('i-heart') + '</button>' +
      '<button style="width:100%;text-align:left" data-open-look="' + idx + '">' +
        '<span class="outfitcard__thumb">' + G.outfit(o.parts, { label: o.name }) + '</span>' +
        '<span class="outfitcard__name trunc">' + U.esc(o.name) + '</span>' +
        '<span class="outfitcard__meta">' + U.icon('i-sparkle', 'ico--sm') + ' ' + o.score + '% match</span>' +
      '</button>' +
    '</div>';
  }

  function grid() {
    var tab = TABS.filter(function (t) { return t.id === active; })[0];
    generated = build(tab.occ, 8);

    if (!generated.length) {
      return '<div class="empty">' +
        '<div class="empty__ico">' + U.icon('i-sparkle', 'ico--lg') + '</div>' +
        '<div class="empty__t">Not enough pieces yet</div>' +
        '<div class="empty__s">Add a top and bottom (or a dress), plus shoes, to start composing complete looks.</div>' +
        '<button class="btn btn--primary btn--sm" data-go="#/add">Add an item</button>' +
      '</div>';
    }
    return '<div class="ideagrid stagger">' + generated.map(cardFor).join('') + '</div>';
  }

  Screens.ideas = {
    shell: true,
    tab: 'ideas',
    topbar: function () {
      return {
        left: '',
        title: 'Outfit Ideas',
        right: '<button class="iconbtn" data-regen aria-label="Regenerate">' + U.icon('i-refresh') + '</button>'
      };
    },

    render: function () {
      return '' +
      '<div class="tabs" style="margin:8px 0 20px">' + TABS.map(function (t) {
        return '<button class="tab' + (t.id === active ? ' is-active' : '') + '" data-tab="' + t.id + '">' +
          U.esc(t.label) + '</button>';
      }).join('') + '</div>' +

      '<div class="sec__head">' +
        '<div class="sec__title">Recommended for you</div>' +
        '<button class="sec__link" data-go="#/wardrobe?mode=outfits">My outfits ' + U.icon('i-right') + '</button>' +
      '</div>' +

      '<div data-grid>' + grid() + '</div>' +

      /* ---- AI stylist ---- */
      '<div class="stylist">' +
        '<div class="stylist__head">' + U.icon('i-sparkle') + '<span class="stylist__t">AI Stylist</span></div>' +
        '<p class="stylist__s">Tell me the occasion and I will put a look together from what you already own.</p>' +
        '<div class="stylist__prompts">' + D.PROMPTS.map(function (p) {
          return '<button class="stylist__prompt" data-prompt="' + U.esc(p) + '">' + U.esc(p) + '</button>';
        }).join('') + '</div>' +
        '<div class="searchbar" style="margin-bottom:14px">' +
          '<span class="searchbar__ico">' + U.icon('i-sparkle') + '</span>' +
          '<input type="text" placeholder="What should I wear for…" data-ask aria-label="Ask the AI stylist">' +
        '</div>' +
        '<button class="btn btn--primary btn--block" data-generate>Generate Ideas</button>' +
        '<div data-answer aria-live="polite" aria-atomic="true"></div>' +
      '</div>';
    },

    unmount: function () { clearTimeout(answerTimer); },

    mount: function (view) {
      function repaint() { view.querySelector('[data-grid]').innerHTML = grid(); }

      /* save a generated look once, then reuse it */
      function persist(o) {
        var existing = savedLook(o);
        if (existing) return existing;
        var rec = S.addOutfit({
          name: o.name, items: o.items, occasion: o.occasion,
          season: 'All season', notes: 'Generated by AI Stylist.', fav: false
        });
        savedByKey[o.key] = rec.id;
        return rec;
      }

      U.on(view, 'click', '[data-tab]', function (e, t) {
        active = t.dataset.tab;
        U.$$('.tab[data-tab]', view).forEach(function (b) {
          b.classList.toggle('is-active', b.dataset.tab === active);
        });
        repaint();
      });

      U.on(view, 'click', '[data-open-look]', function (e, t) {
        var o = generated[+t.dataset.openLook];
        if (!o) return;
        w.Router.go('#/outfit/' + persist(o).id);
      });

      U.on(view, 'click', '[data-save-look]', function (e, t) {
        e.stopPropagation();
        var o = generated[+t.dataset.saveLook];
        if (!o) return;
        var rec = persist(o);
        var on = S.toggleFavOutfit(rec.id);
        t.classList.toggle('is-on', on);
        t.setAttribute('aria-pressed', on ? 'true' : 'false');
        U.toast(on ? 'Saved to your outfits' : 'Removed from favourites', 'success');
      });

      var input = view.querySelector('[data-ask]');
      U.on(view, 'click', '[data-prompt]', function (e, t) {
        input.value = t.dataset.prompt;
        run();
      });

      function run() {
        var q = input.value.trim();
        if (!q) return U.toast('Ask me something first.', 'error');
        clearTimeout(answerTimer);
        var button = view.querySelector('[data-generate]');
        button.disabled = true;
        button.setAttribute('aria-busy', 'true');
        button.textContent = 'Creating your look…';
        var box = view.querySelector('[data-answer]');
        box.innerHTML = '<div class="stylist__answer af-row gap2">' +
          '<span class="thinking"><i></i><i></i><i></i></span> <span class="t-dim">Putting a look together…</span></div>';

        answerTimer = setTimeout(function () {
          if (!view.isConnected) return;
          button.disabled = false;
          button.removeAttribute('aria-busy');
          button.textContent = 'Generate Ideas';
          var res = R.ask(q);
          if (!res.outfit) {
            box.innerHTML = '<div class="stylist__answer">I need a few more pieces in your wardrobe before I can build that look.</div>';
            return;
          }
          var o = res.outfit;
          box.innerHTML = '<div class="stylist__answer">' +
            '<div class="t-sm" style="margin-bottom:12px"><strong>' + U.esc(res.occasion) + '.</strong> ' + U.esc(res.line) + '</div>' +
            '<div class="af-row gap3">' +
              '<div class="thumb" style="width:88px;flex:none">' + G.outfit(o.parts, { label: 'Suggested look' }) + '</div>' +
              '<div class="grow">' +
                '<div class="t-med">' + U.esc([o.parts.top, o.parts.bottom, o.parts.shoes]
                    .filter(Boolean).map(function (p) { return p.name; }).join(' + ')) + '</div>' +
                '<div class="score" style="margin-top:8px">' + U.icon('i-sparkle', 'ico--sm') + o.score + '% match</div>' +
              '</div>' +
            '</div>' +
            '<button class="btn btn--primary btn--sm btn--block" style="margin-top:14px" data-try>Save this look</button>' +
          '</div>';

          box.querySelector('[data-try]').onclick = function () {
            o.key = o.items.slice().sort().join('|');
            o.name = res.occasion + ' Look';
            var saved = persist(o);
            U.toast('Look saved', 'success');
            w.Router.go('#/outfit/' + saved.id);
          };
        }, 700);
      }

      view.querySelector('[data-generate]').onclick = function () {
        if (!input.value.trim()) input.value = D.PROMPTS[Math.floor(Math.random() * D.PROMPTS.length)];
        run();
      };
      input.addEventListener('keydown', function (e) { if (e.key === 'Enter') run(); });

      var regen = document.querySelector('.topbar [data-regen]');
      if (regen) regen.onclick = function () { salt += 1; repaint(); U.toast('Fresh ideas generated', 'success'); };
    }
  };
})(window);
