/* ==========================================================
   SCREENS - WARDROBE
   Clothes + saved outfits. "All" shows the category grid from
   the reference kit; a category tab shows the item grid.
   ========================================================== */
(function (w) {
  'use strict';
  var U = w.UI, S = w.Store, D = w.Data, G = w.Garments;
  var Screens = w.Screens = w.Screens || {};

  var mode = 'items';     // items | outfits
  var cat = 'all';
  var query = '';
  var searchTimer = null;

  function matches(i) {
    if (cat !== 'all' && i.cat !== cat) return false;
    if (!query) return true;
    var q = query.toLowerCase();
    return [i.name, i.brand, i.colorName, i.style, i.occasion, i.notes]
      .filter(Boolean).some(function (v) { return String(v).toLowerCase().indexOf(q) >= 0; });
  }

  function itemCard(i) {
    return '<button class="itemcard" data-go="#/item/' + i.id + '">' +
      '<span class="itemcard__thumb">' +
        (i.photo
          ? '<img src="' + i.photo + '" alt="' + U.esc(i.name) + '" style="width:100%;height:100%;object-fit:cover">'
          : G.garment({ color: i.color, kind: i.kind, cat: i.cat, label: i.name })) +
      '</span>' +
      '<span class="itemcard__name trunc">' + U.esc(i.name) + '</span>' +
      '<span class="itemcard__meta">' +
        '<i class="itemcard__dot" style="background:' + i.color + '"></i>' +
        U.esc(i.colorName) + (i.brand ? ' · ' + U.esc(i.brand) : '') +
      '</span>' +
    '</button>';
  }

  function outfitCard(o) {
    var parts = S.outfitParts(o);
    var fav = S.isFavOutfit(o.id);
    return '<div class="outfitcard">' +
      '<button class="fav' + (fav ? ' is-on' : '') + '" data-fav="' + o.id + '" aria-pressed="' + (fav ? 'true' : 'false') + '" aria-label="Favourite ' + U.esc(o.name) + '">' + U.icon('i-heart') + '</button>' +
      '<button class="outfitcard__link" data-go="#/outfit/' + o.id + '">' +
        '<span class="outfitcard__thumb">' + G.outfit(parts, { label: o.name }) + '</span>' +
        '<span class="outfitcard__name trunc">' + U.esc(o.name) + '</span>' +
        '<span class="outfitcard__meta">' + U.esc(o.occasion) + ' · ' + o.items.length + ' pieces</span>' +
      '</button>' +
    '</div>';
  }

  function body() {
    if (mode === 'outfits') {
      var outs = S.state.outfits.filter(function (o) {
        if (!query) return true;
        var q = query.toLowerCase();
        return (o.name + ' ' + o.occasion + ' ' + (o.notes || '')).toLowerCase().indexOf(q) >= 0;
      });
      if (!outs.length) return empty(query ? 'No matching outfits' : 'No saved outfits', query ? 'Try another name or occasion.' : 'Build a look from your wardrobe and it will show up here.');
      return '<div class="ideagrid stagger">' + outs.map(outfitCard).join('') + '</div>';
    }

    /* All -> category grid (reference screen 2) */
    if (cat === 'all' && !query) {
      return '<div class="catgrid stagger">' + D.CATEGORIES.map(function (c) {
        var list = S.itemsByCat(c.id);
        var sample = list[0];
        return '<button class="catcard" data-cat="' + c.id + '">' +
          '<span class="catcard__thumb">' +
            (sample ? G.garment({ color: sample.color, kind: sample.kind, cat: c.id, label: c.label })
                    : G.garment({ cat: c.id, label: c.label })) +
          '</span>' +
          '<span class="catcard__body">' +
            '<span class="catcard__name">' + U.esc(c.label) + '</span>' +
            '<span class="catcard__count">' + list.length + ' item' + (list.length === 1 ? '' : 's') + '</span>' +
          '</span>' +
        '</button>';
      }).join('') + '</div>';
    }

    var items = S.state.wardrobe.filter(matches);
    if (!items.length) {
      return empty(query ? 'No matches' : 'Nothing here yet',
        query ? 'Try a different search term.' : 'Tap the + button to add your first piece to this category.');
    }
    return '<div class="itemgrid stagger">' + items.map(itemCard).join('') + '</div>';
  }

  function empty(t, s) {
    return '<div class="empty">' +
      '<div class="empty__ico">' + U.icon('i-hanger', 'ico--lg') + '</div>' +
      '<div class="empty__t">' + U.esc(t) + '</div>' +
      '<div class="empty__s">' + U.esc(s) + '</div>' +
      (query ? '<button class="btn btn--primary btn--sm" data-clear-search>Clear search</button>' :
        '<button class="btn btn--primary btn--sm" data-go="#/add' + (mode === 'outfits' ? '?mode=outfit' : '') + '">' + (mode === 'outfits' ? 'Create an outfit' : 'Add an item') + '</button>') +
    '</div>';
  }

  Screens.wardrobe = {
    shell: true,
    tab: 'wardrobe',
    topbar: function () {
      return {
        left: '',
        title: 'My Wardrobe',
        right: '<button class="iconbtn" data-search-toggle aria-label="Search">' + U.icon('i-search') + '</button>' +
               '<button class="iconbtn" data-go="#/stats" aria-label="Wardrobe stats">' + U.icon('i-sliders') + '</button>'
      };
    },

    render: function (params) {
      cat = D.CATEGORIES.some(function (c) { return c.id === params.cat; }) ? params.cat : 'all';
      query = params.q || '';
      mode = params.mode === 'outfits' ? 'outfits' : 'items';

      var tabs = [{ id: 'all', label: 'All' }].concat(
        D.CATEGORIES.map(function (c) { return { id: c.id, label: c.label }; }));

      return '' +
      '<div class="segment" style="margin:8px 0 16px">' +
        '<button class="segment__btn' + (mode === 'items' ? ' is-active' : '') + '" aria-pressed="' + (mode === 'items') + '" data-mode="items">' +
          U.icon('i-grid', 'ico--sm') + ' Clothes <span class="t-faint">' + S.state.wardrobe.length + '</span></button>' +
        '<button class="segment__btn' + (mode === 'outfits' ? ' is-active' : '') + '" aria-pressed="' + (mode === 'outfits') + '" data-mode="outfits">' +
          U.icon('i-hanger', 'ico--sm') + ' Outfits <span class="t-faint">' + S.state.outfits.length + '</span></button>' +
      '</div>' +

      '<div class="' + (query ? '' : 'hidden') + '" data-searchbox style="margin-bottom:16px">' +
        '<label class="searchbar">' +
          '<span class="searchbar__ico">' + U.icon('i-search') + '</span>' +
          '<input type="search" aria-label="Search your wardrobe" placeholder="Search your wardrobe" value="' + U.esc(query) + '" data-search>' +
        '</label>' +
      '</div>' +

      (mode === 'items'
        ? '<div class="tabs" style="margin-bottom:18px">' + tabs.map(function (t) {
            return '<button class="tab' + (t.id === cat ? ' is-active' : '') + '" aria-pressed="' + (t.id === cat) + '" data-cat="' + t.id + '">' +
              U.esc(t.label) + '</button>';
          }).join('') + '</div>'
        : '') +

      '<div class="sr" role="status" data-results-status></div>' +
      '<div data-body>' + body() + '</div>';
    },

    unmount: function () { clearTimeout(searchTimer); },

    mount: function (view) {
      function repaint() {
        var content = view.querySelector('[data-body]');
        content.innerHTML = body();
        var count = content.querySelectorAll('.outfitcard, .itemcard, .catcard').length;
        var unit = mode === 'outfits' ? 'outfit' : cat === 'all' && !query ? 'category' : 'item';
        view.querySelector('[data-results-status]').textContent = count + ' ' +
          (count === 1 ? unit : unit === 'category' ? 'categories' : unit + 's') + ' shown';
      }
      function sync() {
        var params = [];
        if (mode === 'outfits') params.push('mode=outfits');
        if (query) params.push('q=' + encodeURIComponent(query));
        w.Router.syncHash('#/wardrobe' + (mode === 'items' && cat !== 'all' ? '/' + cat : '') + (params.length ? '?' + params.join('&') : ''));
      }

      U.on(view, 'click', '[data-mode]', function (e, t) {
        mode = t.dataset.mode;
        w.Router.go('#/wardrobe' + (mode === 'outfits' ? '?mode=outfits' : ''), true);
        var selectedMode = document.querySelector('[data-mode="' + mode + '"]');
        if (selectedMode) selectedMode.focus({ preventScroll: true });
      });

      U.on(view, 'click', '[data-cat]', function (e, t) {
        cat = t.dataset.cat;
        U.$$('.tab[data-cat]', view).forEach(function (b) {
          b.classList.toggle('is-active', b.dataset.cat === cat);
          b.setAttribute('aria-pressed', String(b.dataset.cat === cat));
        });
        /* keep the URL truthful so refresh and back restore the category */
        sync();
        repaint();
        var selectedCategory = view.querySelector('.tab[data-cat="' + cat + '"]');
        if (selectedCategory) {
          selectedCategory.focus({ preventScroll: true });
          selectedCategory.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        }
      });

      U.on(view, 'click', '[data-fav]', function (e, t) {
        e.stopPropagation();
        var on = S.toggleFavOutfit(t.dataset.fav);
        t.classList.toggle('is-on', on);
        t.setAttribute('aria-pressed', on ? 'true' : 'false');
        U.toast(on ? 'Added to favourites' : 'Removed from favourites', 'success');
      });

      var box = view.querySelector('[data-searchbox]');
      var input = view.querySelector('[data-search]');
      var toggle = document.querySelector('[data-search-toggle]');
      if (toggle) toggle.setAttribute('aria-expanded', String(!!query));
      function clearSearch() {
        clearTimeout(searchTimer);
        input.value = ''; query = ''; sync(); repaint();
      }
      U.on(view, 'click', '[data-clear-search]', function () { clearSearch(); input.focus(); });
      if (toggle) toggle.onclick = function () {
        box.classList.toggle('hidden');
        toggle.setAttribute('aria-expanded', String(!box.classList.contains('hidden')));
        if (!box.classList.contains('hidden')) input.focus();
        else clearSearch();
      };
      if (input) {
        input.addEventListener('input', function () {
          clearTimeout(searchTimer);
          searchTimer = setTimeout(function () { query = input.value.trim(); sync(); repaint(); }, 160);
        });
      }
    }
  };
})(window);
