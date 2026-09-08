/* ==========================================================
   SCREENS - WARDROBE STATS
   Mirrors the reference "Wardrobe Stats" screen: usage donut,
   most-used categories, and the derived style profile.
   ========================================================== */
(function (w) {
  'use strict';
  var U = w.UI, S = w.Store, D = w.Data;
  var Screens = w.Screens = w.Screens || {};

  /* derive a dominant style from the wardrobe + stated preferences */
  function styleProfile() {
    var counts = {};
    S.state.wardrobe.forEach(function (i) { counts[i.style] = (counts[i.style] || 0) + 1; });
    var u = S.user();
    if (u && u.prefs && u.prefs.styles) {
      u.prefs.styles.forEach(function (s) { counts[s] = (counts[s] || 0) + 3; });
    }
    var best = null, total = 0;
    Object.keys(counts).forEach(function (k) {
      total += counts[k];
      if (!best || counts[k] > counts[best]) best = k;
    });
    if (!best) return { name: 'Not set yet', pct: 0, blurb: 'Add a few items to reveal your style profile.' };

    var blurbs = {
      'Minimal': 'Clean, simple and elegant.',
      'Casual': 'Relaxed and easy to live in.',
      'Aesthetic': 'Soft tones with considered detail.',
      'Streetwear': 'Relaxed silhouettes with attitude.',
      'Professional': 'Sharp, structured and workplace-ready.',
      'Formal': 'Classic tailoring, quietly confident.',
      'Party': 'Statement pieces made for evenings.',
      'Sporty': 'Practical and built to move.',
      'College': 'Everyday comfort with personality.',
      'Traditional': 'Occasion-led and timeless.'
    };
    return {
      name: best,
      pct: Math.round((counts[best] / total) * 100),
      blurb: blurbs[best] || 'A blend of several directions.'
    };
  }

  function colourSpread() {
    var counts = {};
    S.state.wardrobe.forEach(function (i) { counts[i.colorName] = (counts[i.colorName] || 0) + 1; });
    return Object.keys(counts)
      .map(function (k) { return { name: k, n: counts[k], hex: D.colourHex(k) }; })
      .sort(function (a, b) { return b.n - a.n; })
      .slice(0, 8);
  }

  Screens.stats = {
    shell: true,
    tab: 'account',
    topbar: function () {
      return { back: true, title: 'Wardrobe Stats', right: '' };
    },

    render: function () {
      var st = S.stats();
      var sp = styleProfile();
      var cols = colourSpread();
      var dots = 10, on = Math.round(sp.pct / 10);

      return '' +
      '<div class="sec" style="margin-top:12px">' +
        '<div class="sec__head"><div class="sec__title">Wardrobe Usage</div>' +
          '<span class="t-xs t-dim">Saved outfits</span></div>' +
        '<div class="card card--pad">' +
          '<div class="usage">' +
            U.donut(st.usagePct, 96, 11) +
            '<div class="grow">' +
              '<div class="usage__t">' + (st.usagePct >= 70 ? 'Great going!' : st.usagePct >= 40 ? 'Getting there' : 'Room to explore') + '</div>' +
              '<div class="usage__s">You are using ' + st.usagePct + '% of your wardrobe across ' + st.outfits + ' saved outfits.</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="sec">' +
        '<div class="sec__head"><div class="sec__title">Items by category</div></div>' +
        '<div class="card card--pad">' +
          (st.byCat.length
            ? '<div class="barlist">' + st.byCat.map(function (r) {
                return '<div class="barrow">' +
                  '<div class="barrow__k">' + U.esc(r.label) + '</div>' +
                  '<div class="bar"><div class="bar__fill" style="width:' + Math.max(4, r.pct) + '%"></div></div>' +
                  '<div class="barrow__v">' + r.pct + '%</div>' +
                '</div>';
              }).join('') + '</div>'
            : '<p class="t-sm t-dim">Nothing to measure yet.</p>') +
        '</div>' +
      '</div>' +

      '<div class="sec">' +
        '<div class="sec__head"><div class="sec__title">Your Style Profile</div></div>' +
        '<div class="card">' +
          '<div class="profileStyle">' +
            '<div class="grow">' +
              '<div class="profileStyle__t">' + U.esc(sp.name) + '</div>' +
              '<div class="dots" style="margin-top:10px">' + Array.apply(null, Array(dots)).map(function (_, i) {
                return '<i class="' + (i < on ? 'is-on' : '') + '"></i>';
              }).join('') + '</div>' +
              '<div class="profileStyle__s">' + U.esc(sp.blurb) + '</div>' +
            '</div>' +
            '<div class="profileStyle__ring">' + U.icon('i-hanger') + '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="sec">' +
        '<div class="sec__head"><div class="sec__title">Colour Palette</div>' +
          '<span class="sec__link">' + cols.length + ' shades</span></div>' +
        '<div class="card card--pad">' +
          (cols.length
            ? '<div class="barlist">' + cols.map(function (c) {
                var pct = Math.round((c.n / (S.state.wardrobe.length || 1)) * 100);
                return '<div class="barrow">' +
                  '<div class="barrow__k af-row gap2"><i class="itemcard__dot" style="background:' + c.hex + '"></i>' +
                    '<span class="trunc">' + U.esc(c.name) + '</span></div>' +
                  '<div class="bar"><div class="bar__fill" style="width:' + Math.max(4, pct) + '%;background:' + c.hex + '"></div></div>' +
                  '<div class="barrow__v">' + c.n + '</div>' +
                '</div>';
              }).join('') + '</div>'
            : '<p class="t-sm t-dim">Add items to see your palette.</p>') +
        '</div>' +
      '</div>';
    },

    mount: function () {}
  };
})(window);
