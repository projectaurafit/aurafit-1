/* ==========================================================
   AURA FIT - PROCEDURAL GARMENT RENDERER
   Every product / wardrobe image in the app is drawn as inline
   SVG from (silhouette + colour). No external image requests,
   instant load, and artwork that adapts to the active theme.
   ========================================================== */
(function (w) {
  'use strict';

  /* ---------- colour helpers ---------- */
  function hex2rgb(h) {
    h = h.replace('#', '');
    if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  function rgb2hex(r, g, b) {
    return '#' + [r, g, b].map(function (v) {
      return Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
    }).join('');
  }
  function shade(hex, amt) {                 // amt < 0 darken, > 0 lighten
    var c = hex2rgb(hex);
    return rgb2hex(
      amt < 0 ? c[0] * (1 + amt) : c[0] + (255 - c[0]) * amt,
      amt < 0 ? c[1] * (1 + amt) : c[1] + (255 - c[1]) * amt,
      amt < 0 ? c[2] * (1 + amt) : c[2] + (255 - c[2]) * amt
    );
  }
  function luma(hex) {
    var c = hex2rgb(hex);
    return (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255;
  }
  /* perceptual-ish distance, used by "Find Similar" ranking */
  function colourDistance(a, b) {
    var x = hex2rgb(a), y = hex2rgb(b);
    var rm = (x[0] + y[0]) / 2;
    var dr = x[0] - y[0], dg = x[1] - y[1], db = x[2] - y[2];
    return Math.sqrt((2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db);
  }

  /* ---------- silhouettes (200 x 200 canvas) ---------- */
  var S = {
    tshirt: function (c, l, d) {
      return '<path d="M62 42 L84 32 Q100 46 116 32 L138 42 L168 62 L154 86 L142 76 L142 168 Q100 175 58 168 L58 76 L46 86 L32 62 Z" fill="' + c + '" stroke="' + d + '" stroke-width="1.6"/>' +
        '<path d="M84 32 Q100 50 116 32" fill="none" stroke="' + d + '" stroke-width="1.6"/>' +
        '<path d="M58 92 Q100 98 142 92" fill="none" stroke="' + l + '" stroke-width="1.2" opacity=".6"/>';
    },
    sweater: function (c, l, d) {
      return '<path d="M64 44 L84 34 Q100 48 116 34 L136 44 L164 64 L174 138 L152 145 L144 84 L144 170 Q100 177 56 170 L56 84 L48 145 L26 138 L36 64 Z" fill="' + c + '" stroke="' + d + '" stroke-width="1.6"/>' +
        '<path d="M84 34 Q100 54 116 34" fill="none" stroke="' + d + '" stroke-width="2"/>' +
        '<path d="M78 36 Q100 58 122 36" fill="none" stroke="' + l + '" stroke-width="1.4" opacity=".7"/>' +
        '<path d="M56 100 Q100 106 144 100 M56 122 Q100 128 144 122 M56 144 Q100 150 144 144" fill="none" stroke="' + d + '" stroke-width=".9" opacity=".35"/>';
    },
    shirt: function (c, l, d) {
      return '<path d="M62 42 L86 32 L100 48 L114 32 L138 42 L166 62 L152 88 L142 78 L142 170 Q100 176 58 170 L58 78 L48 88 L34 62 Z" fill="' + c + '" stroke="' + d + '" stroke-width="1.6"/>' +
        '<path d="M86 32 L100 48 L114 32" fill="none" stroke="' + d + '" stroke-width="1.6"/>' +
        '<path d="M86 32 L78 52 L100 48 M114 32 L122 52 L100 48" fill="' + shade(c, -0.06) + '" stroke="' + d + '" stroke-width="1.3"/>' +
        '<path d="M100 48 L100 172" stroke="' + d + '" stroke-width="1.1" opacity=".55"/>' +
        '<circle cx="100" cy="80" r="1.8" fill="' + d + '"/><circle cx="100" cy="110" r="1.8" fill="' + d + '"/><circle cx="100" cy="140" r="1.8" fill="' + d + '"/>';
    },
    blazer: function (c, l, d) {
      return '<path d="M62 40 L86 30 L100 66 L88 176 L56 176 L52 86 L38 96 L28 62 Z" fill="' + c + '" stroke="' + d + '" stroke-width="1.6"/>' +
        '<path d="M138 40 L114 30 L100 66 L112 176 L144 176 L148 86 L162 96 L172 62 Z" fill="' + c + '" stroke="' + d + '" stroke-width="1.6"/>' +
        '<path d="M86 30 L74 70 L100 66 Z" fill="' + shade(c, -0.1) + '" stroke="' + d + '" stroke-width="1.2"/>' +
        '<path d="M114 30 L126 70 L100 66 Z" fill="' + shade(c, -0.1) + '" stroke="' + d + '" stroke-width="1.2"/>' +
        '<path d="M60 130 L76 130" stroke="' + d + '" stroke-width="1.1" opacity=".5"/>' +
        '<path d="M140 130 L124 130" stroke="' + d + '" stroke-width="1.1" opacity=".5"/>';
    },
    coat: function (c, l, d) {
      return '<path d="M60 38 L86 28 L100 62 L96 184 L54 184 L50 88 L34 98 L24 60 Z" fill="' + c + '" stroke="' + d + '" stroke-width="1.6"/>' +
        '<path d="M140 38 L114 28 L100 62 L104 184 L146 184 L150 88 L166 98 L176 60 Z" fill="' + c + '" stroke="' + d + '" stroke-width="1.6"/>' +
        '<path d="M86 28 L72 74 L100 62 Z" fill="' + shade(c, -0.1) + '" stroke="' + d + '" stroke-width="1.2"/>' +
        '<path d="M114 28 L128 74 L100 62 Z" fill="' + shade(c, -0.1) + '" stroke="' + d + '" stroke-width="1.2"/>' +
        '<rect x="66" y="112" width="20" height="3" rx="1.5" fill="' + d + '" opacity=".45"/>' +
        '<rect x="114" y="112" width="20" height="3" rx="1.5" fill="' + d + '" opacity=".45"/>';
    },
    dress: function (c, l, d) {
      return '<path d="M74 34 L88 26 Q100 40 112 26 L126 34 L140 72 L156 168 Q100 182 44 168 L60 72 Z" fill="' + c + '" stroke="' + d + '" stroke-width="1.6"/>' +
        '<path d="M88 26 Q100 44 112 26" fill="none" stroke="' + d + '" stroke-width="1.6"/>' +
        '<path d="M62 84 Q100 94 138 84" fill="none" stroke="' + d + '" stroke-width="1.2" opacity=".5"/>' +
        '<path d="M84 96 L74 168 M100 96 L100 172 M116 96 L126 168" fill="none" stroke="' + d + '" stroke-width=".9" opacity=".3"/>';
    },
    jeans: function (c, l, d) {
      return '<path d="M60 28 L140 28 L146 178 L112 178 L100 96 L88 178 L54 178 Z" fill="' + c + '" stroke="' + d + '" stroke-width="1.6"/>' +
        '<path d="M60 42 L140 42" stroke="' + d + '" stroke-width="1.4"/>' +
        '<path d="M100 42 L100 96" stroke="' + d + '" stroke-width="1.1" opacity=".55"/>' +
        '<path d="M68 50 Q76 62 86 50" fill="none" stroke="' + d + '" stroke-width="1.1" opacity=".5"/>' +
        '<path d="M114 50 Q124 62 132 50" fill="none" stroke="' + d + '" stroke-width="1.1" opacity=".5"/>' +
        '<rect x="94" y="30" width="12" height="8" rx="1.5" fill="' + shade(c, -0.2) + '" opacity=".5"/>';
    },
    trousers: function (c, l, d) {
      return '<path d="M62 28 L138 28 L142 180 L112 180 L100 92 L88 180 L58 180 Z" fill="' + c + '" stroke="' + d + '" stroke-width="1.6"/>' +
        '<path d="M62 40 L138 40" stroke="' + d + '" stroke-width="1.3"/>' +
        '<path d="M84 46 L80 178 M116 46 L120 178" fill="none" stroke="' + l + '" stroke-width="1.1" opacity=".55"/>';
    },
    shorts: function (c, l, d) {
      return '<path d="M60 34 L140 34 L146 132 L112 132 L100 88 L88 132 L54 132 Z" fill="' + c + '" stroke="' + d + '" stroke-width="1.6"/>' +
        '<path d="M60 46 L140 46" stroke="' + d + '" stroke-width="1.3"/>' +
        '<path d="M100 46 L100 88" stroke="' + d + '" stroke-width="1" opacity=".5"/>';
    },
    skirt: function (c, l, d) {
      return '<path d="M66 36 L134 36 L152 164 Q100 178 48 164 Z" fill="' + c + '" stroke="' + d + '" stroke-width="1.6"/>' +
        '<path d="M66 50 L134 50" stroke="' + d + '" stroke-width="1.3"/>' +
        '<path d="M84 54 L74 166 M100 54 L100 172 M116 54 L126 166" fill="none" stroke="' + d + '" stroke-width=".9" opacity=".32"/>';
    },
    sneaker: function (c, l, d) {
      return '<path d="M26 142 Q28 104 54 98 L76 98 L98 118 L146 128 Q172 133 174 150 L174 158 Q174 164 167 164 L33 164 Q26 164 26 157 Z" fill="' + c + '" stroke="' + d + '" stroke-width="1.6"/>' +
        '<path d="M26 152 L174 152" stroke="' + d + '" stroke-width="1.4"/>' +
        '<path d="M26 158 Q100 162 174 158" fill="' + shade(c, -0.25) + '" opacity=".25"/>' +
        '<path d="M56 100 L74 122 M68 99 L86 121 M80 102 L96 122" stroke="' + l + '" stroke-width="2" opacity=".75"/>' +
        '<path d="M108 122 Q130 128 150 132" fill="none" stroke="' + d + '" stroke-width="1.2" opacity=".5"/>';
    },
    heel: function (c, l, d) {
      return '<path d="M60 52 Q70 52 71 66 L79 126 L146 152 Q154 156 154 164 L154 168 L120 168 L116 152 L106 168 L62 168 Q51 168 49 156 Q42 106 51 60 Q53 52 60 52 Z" fill="' + c + '" stroke="' + d + '" stroke-width="1.6"/>' +
        '<path d="M116 152 L120 168" stroke="' + d + '" stroke-width="1.4"/>' +
        '<path d="M51 90 Q62 96 74 100" fill="none" stroke="' + l + '" stroke-width="1.2" opacity=".55"/>';
    },
    boot: function (c, l, d) {
      return '<path d="M64 40 q24-8 46 0 l-3 76 l40 14 q20 7 20 22 v6 q0 6-7 6 H72 q-10 0-10-10 Z" fill="' + c + '" stroke="' + d + '" stroke-width="1.6"/>' +
        '<path d="M64 40 q24-8 46 0 q-23 9-46 0 Z" fill="' + shade(c, 0.18) + '" stroke="' + d + '" stroke-width="1.4"/>' +
        '<path d="M62 152 q54 6 108 0 l0 6 q-54 6-108 0 Z" fill="' + shade(c, -0.3) + '" opacity=".55"/>' +
        '<path d="M67 74 q22 5 42 0 M67 96 q22 5 41 0" fill="none" stroke="' + d + '" stroke-width="1" opacity=".35"/>';
    },
    bag: function (c, l, d) {
      return '<path d="M74 84 Q74 44 100 44 Q126 44 126 84" fill="none" stroke="' + d + '" stroke-width="4.5" stroke-linecap="round"/>' +
        '<path d="M48 82 L152 82 L162 172 L38 172 Z" fill="' + c + '" stroke="' + d + '" stroke-width="1.6"/>' +
        '<path d="M48 96 L152 96" stroke="' + d + '" stroke-width="1.1" opacity=".4"/>' +
        '<rect x="92" y="118" width="16" height="12" rx="2.5" fill="' + shade(c, -0.22) + '" opacity=".6"/>';
    },
    hat: function (c, l, d) {
      return '<ellipse cx="100" cy="126" rx="66" ry="19" fill="' + c + '" stroke="' + d + '" stroke-width="1.6"/>' +
        '<path d="M66 124 Q64 62 100 62 Q136 62 134 124" fill="' + c + '" stroke="' + d + '" stroke-width="1.6"/>' +
        '<path d="M64 108 Q100 120 136 108 L136 116 Q100 128 64 116 Z" fill="' + shade(c, -0.3) + '" opacity=".7"/>';
    },
    watch: function (c, l, d) {
      return '<rect x="86" y="30" width="28" height="52" rx="7" fill="' + shade(c, -0.15) + '" stroke="' + d + '" stroke-width="1.4"/>' +
        '<rect x="86" y="118" width="28" height="52" rx="7" fill="' + shade(c, -0.15) + '" stroke="' + d + '" stroke-width="1.4"/>' +
        '<circle cx="100" cy="100" r="30" fill="' + c + '" stroke="' + d + '" stroke-width="2"/>' +
        '<circle cx="100" cy="100" r="23" fill="' + shade(c, 0.55) + '"/>' +
        '<path d="M100 100 L100 86 M100 100 L112 104" stroke="' + d + '" stroke-width="2" stroke-linecap="round"/>';
    },
    accessory: function (c, l, d) {
      return '<circle cx="100" cy="100" r="52" fill="none" stroke="' + c + '" stroke-width="9"/>' +
        '<circle cx="100" cy="48" r="11" fill="' + c + '" stroke="' + d + '" stroke-width="1.5"/>';
    }
  };

  /* category -> default silhouette */
  var BY_CAT = { top: 'tshirt', bottom: 'jeans', shoes: 'sneaker', dress: 'dress', outerwear: 'blazer', bag: 'bag', accessory: 'hat' };

  function pick(kind, cat) {
    if (kind && S[kind]) return kind;
    return BY_CAT[cat] || 'tshirt';
  }

  /* ---------- public: single garment ---------- */
  function garment(opts) {
    opts = opts || {};
    var colour = opts.color || '#D9D2CA';
    var kind = pick(opts.kind, opts.cat);
    var light = shade(colour, luma(colour) > 0.75 ? 0.35 : 0.22);
    var dark = shade(colour, luma(colour) < 0.2 ? 0.45 : -0.28);
    var plate = opts.plate === false ? '' :
      '<rect width="200" height="200" fill="var(--plate)"/>';
    var shadow = '<ellipse cx="100" cy="184" rx="56" ry="7" fill="#000" opacity=".07"/>';

    return '<svg viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet" role="img" aria-label="' +
      esc(opts.label || kind) + '">' + plate + shadow +
      '<g>' + S[kind](colour, light, dark) + '</g></svg>';
  }

  /* ---------- public: composed outfit flat-lay ----------
     Mirrors the reference "Outfit Details" hero: top-left garment,
     bottom-right trousers, shoes lower-left, bag lower-right.        */
  function outfit(parts, o) {
    o = o || {};
    parts = parts || {};
    var g = '';
    function place(p, x, y, s) {
      if (!p) return;
      var colour = p.color || '#D9D2CA';
      var kind = pick(p.kind, p.cat);
      var light = shade(colour, luma(colour) > 0.75 ? 0.35 : 0.22);
      var dark = shade(colour, luma(colour) < 0.2 ? 0.45 : -0.28);
      g += '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')">' + S[kind](colour, light, dark) + '</g>';
    }
    /* Balance the flat-lay to the number of pieces, so a three-item look
       does not leave an obvious empty quadrant. */
    var hasBottom = !!parts.bottom, hasExtra = !!parts.extra;

    if (hasBottom) {
      place(parts.top, 2, 2, 0.56);
      place(parts.bottom, 96, -2, 0.55);
    } else {
      /* a dress carries the whole top half */
      place(parts.top, 44, 0, 0.62);
    }

    if (hasExtra) {
      place(parts.shoes, 2, 100, 0.47);
      place(parts.extra, 100, 98, 0.47);
    } else {
      /* one item on the bottom row - centre it and let it breathe */
      place(parts.shoes, 34, 96, 0.58);
    }

    return '<svg viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet" role="img" aria-label="' +
      esc(o.label || 'Outfit') + '">' +
      '<rect width="200" height="200" fill="var(--plate)"/>' + g + '</svg>';
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
  }

  w.Garments = {
    garment: garment,
    outfit: outfit,
    kinds: Object.keys(S),
    shade: shade,
    luma: luma,
    colourDistance: colourDistance
  };
})(window);
