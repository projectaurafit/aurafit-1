/* ==========================================================
   SCREENS - ITEM DETAIL / OUTFIT SELECTION
   Shows the uploaded photo, lets the user confirm the clothing
   category (Top / Bottom / Shoes) and offers the two primary
   actions: Find Similar and Find Pair. Both open the
   bottom-sheet product panel.
   ========================================================== */
(function (w) {
  'use strict';
  var U = w.UI, S = w.Store, D = w.Data, R = w.Recommend, G = w.Garments;
  var Screens = w.Screens = w.Screens || {};

  var PICKS = [
    { id: 'top',    label: 'Top',    icon: 'i-shirt' },
    { id: 'bottom', label: 'Bottom', icon: 'i-pants' },
    { id: 'shoes',  label: 'Shoes',  icon: 'i-shoe'  }
  ];

  /* dresses / layers / bags behave as a "top" for pairing purposes */
  function normalise(cat) {
    if (cat === 'bottom') return 'bottom';
    if (cat === 'shoes') return 'shoes';
    return 'top';
  }

  var pick = 'top';
  var current = null;

  function heroArt(i) {
    return i.photo
      ? '<img src="' + i.photo + '" alt="' + U.esc(i.name) + '" style="width:100%;height:100%;object-fit:cover">'
      : G.garment({ color: i.color, kind: i.kind, cat: i.cat, label: i.name });
  }

  /* ---------- Find Similar ---------- */
  function openSimilar(item) {
    var probe = Object.assign({}, item, { cat: pickToCat(item) });
    var all = R.findSimilar(probe, 24);
    U.Sheet.open({
      title: 'Similar to ' + item.name,
      sub: 'Matched on colour, cut and style from the sample catalogue.',
      tabs: [
        { id: 'close', label: 'Closest Match', items: all.slice(0, 8) },
        { id: 'more',  label: 'More Like This', items: all.slice(8, 24) }
      ]
    });
  }

  /* ---------- Find Pair ---------- */
  function openPair(item) {
    var base = normalise(pick);
    var targets = R.pairTargets(base);
    var probe = Object.assign({}, item);
    U.Sheet.open({
      title: 'Pairs with your ' + (item.name || 'item'),
      sub: 'Selected ' + PICKS.filter(function (p) { return p.id === base; })[0].label.toLowerCase() +
           ' → matching ' + targets.map(function (t) { return D.catLabel(t).toLowerCase(); }).join(' and ') + '.',
      tabs: targets.map(function (t) {
        return { id: t, label: D.catLabel(t), items: R.findPair(probe, t, 14) };
      })
    });
  }

  /* the category the user picked drives what "similar" means */
  function pickToCat(item) {
    if (pick === 'bottom') return 'bottom';
    if (pick === 'shoes') return 'shoes';
    /* keep the true category when it is already a top-family item */
    return (item.cat === 'dress' || item.cat === 'outerwear' || item.cat === 'top') ? item.cat : 'top';
  }

  Screens.item = {
    shell: true,
    tab: 'wardrobe',
    topbar: function (params) {
      var i = S.getItem(params.id);
      return {
        back: true,
        title: i ? i.name : 'Item',
        right: '<button class="iconbtn" data-share aria-label="Share">' + U.icon('i-share') + '</button>'
      };
    },

    render: function (params) {
      var i = S.getItem(params.id);
      current = i;
      if (!i) {
        return '<div class="empty"><div class="empty__ico">' + U.icon('i-x', 'ico--lg') + '</div>' +
          '<div class="empty__t">Item not found</div>' +
          '<div class="empty__s">It may have been removed from your wardrobe.</div>' +
          '<button class="btn btn--primary btn--sm" data-go="#/wardrobe">Back to wardrobe</button></div>';
      }
      pick = normalise(i.cat);

      return '' +
      '<div class="detail__grid">' +
        '<div class="detail__hero anim-in">' + heroArt(i) + '</div>' +

        '<div>' +
          '<h1 class="detail__title">' + U.esc(i.name) + '</h1>' +
          '<div class="detail__meta">' +
            '<span class="badge"><i class="itemcard__dot" style="background:' + i.color + '"></i>' + U.esc(i.colorName) + '</span>' +
            '<span class="badge badge--muted">' + U.esc(D.catLabel(i.cat)) + '</span>' +
            (i.brand ? '<span class="badge badge--muted">' + U.esc(i.brand) + '</span>' : '') +
          '</div>' +

          /* ---- category selection ---- */
          '<div class="sec">' +
            '<div class="sec__head"><div class="sec__title">Clothing category</div></div>' +
            '<div class="catpick">' + PICKS.map(function (p) {
              return '<button class="catpick__btn' + (p.id === pick ? ' is-active' : '') + '" aria-pressed="' + (p.id === pick) + '" data-pick="' + p.id + '">' +
                U.icon(p.icon) + '<span>' + p.label + '</span></button>';
            }).join('') + '</div>' +
            '<p class="t-xs t-faint" style="margin-top:10px" data-pickhint></p>' +
          '</div>' +

          /* ---- the two primary actions ---- */
          '<div class="finder">' +
            '<button class="btn btn--ghost btn--lg" data-similar>' + U.icon('i-search') + ' Find Similar</button>' +
            '<button class="btn btn--primary btn--lg" data-pair>' + U.icon('i-sparkle') + ' Find Pair</button>' +
          '</div>' +

          /* ---- details ---- */
          '<div class="deflist">' +
            row('Colour', i.colorName) +
            row('Style', i.style) +
            row('Occasion', i.occasion) +
            row('Season', i.season) +
            (i.brand ? row('Brand', i.brand) : '') +
            row('Notes', i.notes || 'No notes added yet.') +
          '</div>' +

          '<div class="acts3">' +
            '<button class="actbtn" data-go="#/add?edit=' + i.id + '">' + U.icon('i-edit') + '<span>Edit</span></button>' +
            '<button class="actbtn actbtn--danger" data-remove>' + U.icon('i-trash') + '<span>Remove</span></button>' +
            '<button class="actbtn" data-share>' + U.icon('i-share') + '<span>Share</span></button>' +
          '</div>' +
        '</div>' +
      '</div>';
    },

    mount: function (view, params) {
      var i = S.getItem(params.id);
      if (!i) return;

      function hint() {
        var t = view.querySelector('[data-pickhint]');
        if (!t) return;
        var targets = R.pairTargets(normalise(pick));
        t.textContent = 'Find Pair will suggest matching ' +
          targets.map(function (x) { return D.catLabel(x).toLowerCase(); }).join(' and ') + '.';
      }
      hint();

      U.on(view, 'click', '[data-pick]', function (e, t) {
        pick = t.dataset.pick;
        U.$$('[data-pick]', view).forEach(function (b) {
          b.classList.toggle('is-active', b.dataset.pick === pick);
          b.setAttribute('aria-pressed', String(b.dataset.pick === pick));
        });
        hint();
      });

      U.on(view, 'click', '[data-similar]', function () { openSimilar(i); });
      U.on(view, 'click', '[data-pair]', function () { openPair(i); });

      U.on(view, 'click', '[data-remove]', function () {
        U.confirmDialog({
          title: 'Remove this item?',
          text: 'It will be taken out of your wardrobe and any outfits that use it.',
          ok: 'Remove', danger: true
        }).then(function (yes) {
          if (!yes) return;
          S.removeItem(i.id);
          U.toast('Item removed', 'success');
          w.Router.go('#/wardrobe');
        });
      });

      function share() {
        var text = i.name + ' — ' + i.colorName + ' ' + D.catLabel(i.cat).toLowerCase() + ' in my Aura Fit wardrobe.';
        U.shareText(text);
      }
      U.on(view, 'click', '[data-share]', share);
      var top = document.querySelector('.topbar [data-share]');
      if (top) top.onclick = share;
    }
  };

  function row(k, v) {
    return '<div class="defrow"><div class="defrow__k">' + U.esc(k) + '</div>' +
           '<div class="defrow__v">' + U.esc(v) + '</div></div>';
  }
})(window);
