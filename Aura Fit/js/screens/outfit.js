/* ==========================================================
   SCREENS - OUTFIT DETAILS
   Mirrors the reference "Outfit Details" screen: hero flat-lay,
   date + weather line, Edit / Remove / Share, then the
   occasion / season / notes list and the pieces used.
   ========================================================== */
(function (w) {
  'use strict';
  var U = w.UI, S = w.Store, D = w.Data, R = w.Recommend, G = w.Garments;
  var Screens = w.Screens = w.Screens || {};

  Screens.outfit = {
    shell: true,
    tab: 'wardrobe',
    topbar: function (params) {
      var o = S.getOutfit(params.id);
      var fav = o && S.isFavOutfit(o.id);
      return {
        back: true,
        title: 'Outfit Details',
        right: o ? '<button class="iconbtn" data-fav aria-pressed="' + (fav ? 'true' : 'false') + '" aria-label="Favourite ' + U.esc(o.name) + '">' +
                 '<svg class="ico' + (fav ? ' ico--fill' : '') + '" viewBox="0 0 24 24" style="' + (fav ? 'color:var(--danger)' : '') + '"><use href="#i-heart"/></svg>' +
               '</button>' : ''
      };
    },

    render: function (params) {
      var o = S.getOutfit(params.id);
      if (!o) {
        return '<div class="empty"><div class="empty__ico">' + U.icon('i-x', 'ico--lg') + '</div>' +
          '<div class="empty__t">Outfit not found</div>' +
          '<div class="empty__s">It may have been removed.</div>' +
          '<button class="btn btn--primary btn--sm" data-go="#/wardrobe?mode=outfits">Back to outfits</button></div>';
      }
      var parts = S.outfitParts(o);
      var items = o.items.map(S.getItem).filter(Boolean);

      return '' +
      '<div class="detail__grid">' +
        '<div class="detail__hero anim-in">' + G.outfit(parts, { label: o.name }) + '</div>' +

        '<div>' +
          '<h1 class="detail__title">' + U.esc(o.name) + '</h1>' +
          '<div class="detail__meta row-b" style="width:100%">' +
            '<span class="t-sm t-dim">' + U.fmtDate(o.createdAt || Date.now()) + '</span>' +
            '<span class="t-sm t-dim">' + U.esc(o.season || 'All season') + '</span>' +
          '</div>' +

          '<div class="card card--pad card--tint" style="margin-top:16px">' +
            '<div class="t-sm">' + U.esc(R.whyOutfit(o)) + '</div>' +
          '</div>' +

          '<div class="acts3">' +
            '<button class="actbtn" data-edit>' + U.icon('i-edit') + '<span>Edit</span></button>' +
            '<button class="actbtn actbtn--danger" data-remove>' + U.icon('i-trash') + '<span>Remove</span></button>' +
            '<button class="actbtn" data-share>' + U.icon('i-share') + '<span>Share</span></button>' +
          '</div>' +

          '<button class="btn btn--primary btn--block btn--lg" style="margin-top:16px" data-wear>' +
            U.icon('i-calendar') + ' Wear this today</button>' +

          '<div class="deflist">' +
            row('Occasion', o.occasion) +
            row('Season', o.season) +
            row('Notes', o.notes || 'No notes added yet.') +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="sec">' +
        '<div class="sec__head"><div class="sec__title">Pieces in this look</div>' +
          '<span class="sec__link">' + items.length + ' items</span></div>' +
        '<div class="itemgrid stagger">' + items.map(function (i) {
          return '<button class="itemcard" data-go="#/item/' + i.id + '">' +
            '<span class="itemcard__thumb">' +
              (i.photo ? '<img src="' + i.photo + '" alt="" style="width:100%;height:100%;object-fit:cover">'
                       : G.garment({ color: i.color, kind: i.kind, cat: i.cat, label: i.name })) +
            '</span>' +
            '<span class="itemcard__name trunc">' + U.esc(i.name) + '</span>' +
            '<span class="itemcard__meta">' + U.esc(D.catLabel(i.cat)) + '</span>' +
          '</button>';
        }).join('') + '</div>' +
      '</div>';
    },

    mount: function (view, params) {
      var o = S.getOutfit(params.id);
      if (!o) return;

      U.on(view, 'click', '[data-wear]', function () {
        S.setPlan(S.dateKey(), o.id);
        U.toast('Planned for today', 'success');
        w.Router.go('#/home');
      });

      U.on(view, 'click', '[data-edit]', function () {
        w.Router.go('#/add?mode=outfit&edit=' + encodeURIComponent(o.id));
      });

      U.on(view, 'click', '[data-remove]', function () {
        U.confirmDialog({
          title: 'Remove this outfit?',
          text: 'The individual pieces stay in your wardrobe.',
          ok: 'Remove', danger: true
        }).then(function (yes) {
          if (!yes) return;
          S.removeOutfit(o.id);
          U.toast('Outfit removed', 'success');
          w.Router.go('#/wardrobe?mode=outfits');
        });
      });

      function share() {
        var text = o.name + ' — ' + o.occasion + ' look from my Aura Fit wardrobe.';
        U.shareText(text);
      }
      U.on(view, 'click', '[data-share]', share);

      var favBtn = document.querySelector('.topbar [data-fav]');
      if (favBtn) favBtn.onclick = function () {
        var on = S.toggleFavOutfit(o.id);
        var svg = favBtn.querySelector('svg');
        svg.classList.toggle('ico--fill', on);
        svg.style.color = on ? 'var(--danger)' : '';
        favBtn.setAttribute('aria-pressed', String(on));
        U.toast(on ? 'Added to favourites' : 'Removed from favourites', 'success');
      };
    }
  };

  function row(k, v) {
    return '<div class="defrow"><div class="defrow__k">' + U.esc(k) + '</div>' +
           '<div class="defrow__v">' + U.esc(v) + '</div></div>';
  }
})(window);
