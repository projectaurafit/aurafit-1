/* ==========================================================
   SCREENS - HOME / DASHBOARD
   Personalised outfit for the selected day, wardrobe overview,
   outfit ideas rail and style stats.
   ========================================================== */
(function (w) {
  'use strict';
  var U = w.UI, S = w.Store, D = w.Data, R = w.Recommend, G = w.Garments;
  var Screens = w.Screens = w.Screens || {};

  var selectedKey = null;

  /* 7-day strip centred on today */
  function days() {
    var out = [], today = new Date();
    for (var i = -2; i <= 4; i++) {
      var d = new Date(today);
      d.setDate(today.getDate() + i);
      out.push({ date: d, key: S.dateKey(d), isToday: i === 0 });
    }
    return out;
  }

  function ootdCard() {
    var res = R.outfitForDate(selectedKey);
    if (!res) {
      return '<div class="card card--pad"><div class="empty">' +
        '<div class="empty__ico">' + U.icon('i-hanger', 'ico--lg') + '</div>' +
        '<div class="empty__t">No outfit yet</div>' +
        '<div class="empty__s">Add a few pieces and Aura Fit will start suggesting looks.</div>' +
        '<button class="btn btn--primary btn--sm" data-go="#/add">Add your first item</button>' +
      '</div></div>';
    }
    var o = res.outfit;
    var parts = S.outfitParts(o);
    var d = new Date(selectedKey + 'T00:00:00');

    return '<div class="card ootd">' +
      '<button class="ootd__thumb" data-go="#/outfit/' + o.id + '" aria-label="Open ' + U.esc(o.name) + '">' +
        G.outfit(parts, { label: o.name }) +
      '</button>' +
      '<div class="ootd__body">' +
        '<div class="ootd__meta">' +
          '<span class="badge">' + U.icon('i-sparkle') + (res.planned ? 'Planned' : 'Suggested') + '</span>' +
          '<span class="badge badge--muted">' + U.esc(o.occasion) + '</span>' +
        '</div>' +
        '<div class="ootd__name">' + U.esc(o.name) + '</div>' +
        '<div class="ootd__why">' + U.esc(R.whyOutfit(o)) + '</div>' +
        '<div class="ootd__acts">' +
          '<button class="btn btn--primary btn--sm grow" data-go="#/outfit/' + o.id + '">View outfit</button>' +
          '<button class="btn btn--ghost btn--sm" data-shuffle aria-label="Suggest another">' + U.icon('i-refresh', 'ico--sm') + '</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  Screens.home = {
    shell: true,
    tab: 'home',
    topbar: function () {
      var u = S.user();
      return {
        left: '<div class="brand only-mobile">' +
                '<span class="brand__mark">' + U.icon('i-hanger') + '</span>' +
              '</div>' +
              /* reserved for a future three-dot menu - intentionally inert */
              '<div class="topbar__future" data-future-menu></div>',
        title: 'Aura Fit',
        right: '<button class="iconbtn" data-theme-toggle aria-label="Switch theme">' +
                 U.icon(S.effectiveTheme() === 'dark' ? 'i-sun' : 'i-moon') + '</button>'
      };
    },

    render: function () {
      var u = S.user() || { name: 'there' };
      var st = S.stats();
      if (!days().some(function (d) { return d.key === selectedKey; })) selectedKey = S.dateKey();

      var chips = ['All'].concat(D.CATEGORIES.slice(0, 4).map(function (c) { return c.label; }));

      return '' +
      '<div class="greet">' +
        '<h1 class="greet__hi">' + U.esc(U.greeting()) + ', ' + U.esc(String(u.name).split(' ')[0]) +
          U.icon('i-sun') + '</h1>' +
        '<p class="greet__sub">Make every outfit your best outfit.</p>' +
      '</div>' +

      '<div class="home__search">' +
        '<label class="searchbar">' +
          '<span class="searchbar__ico">' + U.icon('i-search') + '</span>' +
          '<input type="search" placeholder="Search in wardrobe" data-search aria-label="Search wardrobe">' +
        '</label>' +
        '<button class="iconbtn iconbtn--bordered" data-go="#/wardrobe" aria-label="Filters">' + U.icon('i-sliders') + '</button>' +
      '</div>' +

      '<div class="chips">' + chips.map(function (c, i) {
        var target = i === 0 ? '#/wardrobe' : '#/wardrobe/' + D.CATEGORIES[i - 1].id;
        return '<button class="chip' + (i === 0 ? ' is-active' : '') + '" data-go="' + target + '">' + U.esc(c) + '</button>';
      }).join('') + '</div>' +

      /* ---- calendar strip ---- */
      '<div class="calstrip">' +
        '<div class="sec__head">' +
          '<div class="sec__title">Your day</div>' +
          '<span class="sec__link" data-today-label>' + U.fmtDate(new Date(selectedKey + 'T00:00:00')) + '</span>' +
        '</div>' +
        '<div class="calstrip__days">' + days().map(function (d) {
          return '<button class="calday' + (d.key === selectedKey ? ' is-active' : '') + (d.isToday ? ' is-today' : '') + '" data-day="' + d.key + '">' +
            '<div class="calday__d">' + U.DAYS[d.date.getDay()] + '</div>' +
            '<div class="calday__n">' + d.date.getDate() + '</div>' +
          '</button>';
        }).join('') + '</div>' +
      '</div>' +

      '<div class="sec" data-ootd>' + ootdCard() + '</div>' +

      /* ---- wardrobe overview ---- */
      '<div class="sec">' +
        '<div class="card card--pad">' +
          '<div class="sec__head" style="margin-bottom:14px">' +
            '<div class="sec__title">Wardrobe Overview</div>' +
            '<button class="sec__link" data-go="#/wardrobe">See All ' + U.icon('i-right') + '</button>' +
          '</div>' +
          '<div class="stats3">' +
            '<div class="stat"><div class="stat__n">' + st.items + '</div><div class="stat__l">Items</div>' +
              '<span class="stat__ico">' + U.icon('i-bag') + '</span></div>' +
            '<div class="stat"><div class="stat__n">' + st.outfits + '</div><div class="stat__l">Outfits</div>' +
              '<span class="stat__ico">' + U.icon('i-hanger') + '</span></div>' +
            '<div class="stat"><div class="stat__n">' + st.categories + '</div><div class="stat__l">Categories</div>' +
              '<span class="stat__ico">' + U.icon('i-grid') + '</span></div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      /* ---- outfit ideas rail ---- */
      '<div class="sec">' +
        '<div class="sec__head">' +
          '<div class="sec__title">Outfit Ideas</div>' +
          '<button class="sec__link" data-go="#/ideas">See All ' + U.icon('i-right') + '</button>' +
        '</div>' +
        (S.state.outfits.length ? '' :
          '<div class="card card--pad"><div class="empty" style="padding:20px 0">' +
            '<div class="empty__ico">' + U.icon('i-hanger', 'ico--lg') + '</div>' +
            '<div class="empty__t">No outfits yet</div>' +
            '<div class="empty__s">Combine a few pieces and your looks will appear here.</div>' +
            '<button class="btn btn--primary btn--sm" data-go="#/add?mode=outfit">Build an outfit</button>' +
          '</div></div>') +
        '<div class="scroll-x ideas-rail stagger"' + (S.state.outfits.length ? '' : ' hidden') + '>' +
        S.state.outfits.slice(0, 8).map(function (o) {
          var parts = S.outfitParts(o);
          return '<button class="ideacard" data-go="#/outfit/' + o.id + '">' +
            '<span class="ideacard__thumb">' + G.outfit(parts, { label: o.name }) + '</span>' +
            '<span class="ideacard__name">' + U.esc(o.name) + '</span>' +
            '<span class="ideacard__meta">' + U.esc(o.occasion) + ' · ' + o.items.length + ' pieces</span>' +
          '</button>';
        }).join('') + '</div>' +
      '</div>' +

      /* ---- style stats ---- */
      '<div class="sec">' +
        '<div class="card card--pad">' +
          '<div class="sec__head" style="margin-bottom:14px">' +
            '<div class="sec__title">Style Stats</div>' +
            '<button class="sec__link" data-go="#/stats">View stats ' + U.icon('i-right') + '</button>' +
          '</div>' +
          '<div class="styleStat">' +
            U.donut(st.usagePct, 76, 9) +
            '<div class="grow">' +
              '<div class="styleStat__t">Wardrobe Used</div>' +
              '<div class="styleStat__s">' + st.usagePct + '% of your wardrobe appears in saved outfits.</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    },

    mount: function (view) {
      /* day selection re-renders only the outfit block */
      U.on(view, 'click', '[data-day]', function (e, t) {
        selectedKey = t.dataset.day;
        U.$$('.calday', view).forEach(function (b) {
          b.classList.toggle('is-active', b.dataset.day === selectedKey);
        });
        var host = view.querySelector('[data-ootd]');
        host.innerHTML = ootdCard();
        var lbl = view.querySelector('[data-today-label]');
        if (lbl) lbl.textContent = U.fmtDate(new Date(selectedKey + 'T00:00:00'));
      });

      /* shuffle -> plan a different outfit for this day */
      U.on(view, 'click', '[data-shuffle]', function () {
        var list = S.state.outfits;
        if (list.length < 2) return U.toast('Add more outfits to shuffle.', 'error');
        var cur = R.outfitForDate(selectedKey);
        var pick;
        do { pick = list[Math.floor(Math.random() * list.length)]; }
        while (cur && pick.id === cur.outfit.id);
        S.setPlan(selectedKey, pick.id);
        view.querySelector('[data-ootd]').innerHTML = ootdCard();
        U.toast('Switched to ' + pick.name, 'success');
      });

      var search = view.querySelector('[data-search]');
      if (search) {
        search.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' && search.value.trim()) {
            w.Router.go('#/wardrobe?q=' + encodeURIComponent(search.value.trim()));
          }
        });
      }
    }
  };
})(window);
