/* ==========================================================
   AURA FIT - RECOMMENDATION ENGINE
   Implements the explainable scoring model from the proposal
   (section 8):

     Score = Colour(25) + Style(25) + Occasion(20)
           + Preference(20) + Wardrobe(10)      -> 0..100

   Deliberately rule-based, not a trained model, so every
   suggestion can be explained back to the user.
   ========================================================== */
(function (w) {
  'use strict';

  var G = w.Garments;

  /* ---------------- colour maths ---------------- */
  function rgb(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(function (c) { return c + c; }).join('');
    return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
  }
  function hsl(hex) {
    var c = rgb(hex).map(function (v) { return v / 255; });
    var max = Math.max.apply(null, c), min = Math.min.apply(null, c);
    var l = (max + min) / 2, h = 0, s = 0;
    if (max !== min) {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === c[0]) h = ((c[1] - c[2]) / d + (c[1] < c[2] ? 6 : 0));
      else if (max === c[1]) h = (c[2] - c[0]) / d + 2;
      else h = (c[0] - c[1]) / d + 4;
      h *= 60;
    }
    return { h: h, s: s, l: l };
  }
  function isNeutral(hex) {
    var x = hsl(hex);
    return x.s < 0.18 || x.l > 0.88 || x.l < 0.14;
  }

  /* how well two colours sit together in one outfit (0..1) */
  function harmony(a, b) {
    if (!a || !b) return 0.5;
    if (isNeutral(a) || isNeutral(b)) return 0.92;         // neutrals go with anything
    var A = hsl(a), B = hsl(b);
    var d = Math.abs(A.h - B.h); if (d > 180) d = 360 - d;
    if (d < 28) return 0.86;                                // analogous / tonal
    if (d > 150) return 0.82;                               // complementary
    if (d > 95 && d <= 150) return 0.62;                    // split complementary
    return 0.44;                                            // muddy middle
  }

  /* visual similarity for "Find Similar" (0..1) */
  function similarity(a, b) {
    var dist = G.colourDistance(a.color, b.color);          // 0 .. ~765
    var colour = Math.max(0, 1 - dist / 420);
    var kind = a.kind === b.kind ? 1 : 0.55;
    var style = a.style === b.style ? 1 : 0.6;
    var occ = a.occasion === b.occasion ? 1 : 0.7;
    return colour * 0.5 + kind * 0.24 + style * 0.16 + occ * 0.10;
  }

  /* ---------------- user preference ---------------- */
  function prefs() {
    var u = w.Store.user();
    return (u && u.prefs) || { styles: [], colours: [], occasions: [], fit: '' };
  }
  function prefScore(x) {
    var p = prefs(), s = 0, n = 0;
    if (p.styles && p.styles.length) { n++; if (p.styles.indexOf(x.style) >= 0) s++; }
    if (p.colours && p.colours.length) { n++; if (p.colours.indexOf(x.colorName) >= 0) s++; }
    if (p.occasions && p.occasions.length) { n++; if (p.occasions.indexOf(x.occasion) >= 0) s++; }
    return n ? s / n : 0.6;
  }

  /* does this product pair with things the user already owns? */
  function wardrobeScore(p) {
    var owned = w.Store.state.wardrobe;
    if (!owned.length) return 0.5;
    var best = 0;
    owned.forEach(function (it) {
      if (it.cat === p.cat) return;                      // pairing, not duplicating
      best = Math.max(best, harmony(p.color, it.color));
    });
    return best;
  }

  /* ---------------- the score ---------------- */
  function score(p, ctx) {
    ctx = ctx || {};
    var base = ctx.base || null;                          // item being matched against

    var colour = base ? harmony(p.color, base.color) : (isNeutral(p.color) ? 0.85 : 0.7);
    var style = base ? (p.style === base.style ? 1 : 0.62) : 0.75;
    var occ = ctx.occasion ? (p.occasion === ctx.occasion ? 1 : 0.55) : 0.75;
    var pref = prefScore(p);
    var ward = wardrobeScore(p);

    var total = colour * 25 + style * 25 + occ * 20 + pref * 20 + ward * 10;
    return Math.round(Math.max(38, Math.min(99, total)));
  }

  /* human-readable justification - the proposal insists recommendations
     are explained rather than presented as arbitrary judgements */
  function explain(p, ctx) {
    ctx = ctx || {};
    var base = ctx.base, bits = [];
    if (base) {
      var hRaw = harmony(p.color, base.color);
      if (hRaw > 0.8) bits.push(esc(p.colorName) + ' works cleanly with your ' + esc(base.colorName.toLowerCase()) + ' ' + catWord(base.cat));
      else if (hRaw > 0.6) bits.push('a considered contrast against your ' + esc(base.colorName.toLowerCase()) + ' ' + catWord(base.cat));
    }
    var p2 = prefs();
    if (p2.styles && p2.styles.indexOf(p.style) >= 0) bits.push('matches your ' + esc(p.style.toLowerCase()) + ' style');
    if (ctx.occasion && p.occasion === ctx.occasion) bits.push('suited to ' + esc(ctx.occasion.toLowerCase()));
    if (!bits.length) bits.push('a versatile ' + esc(p.style.toLowerCase()) + ' piece that fits your wardrobe');
    return bits.slice(0, 2).join(', and ') + '.';
  }

  function catWord(cat) {
    return { top: 'top', bottom: 'bottom', shoes: 'shoes', dress: 'dress',
             outerwear: 'layer', bag: 'bag', accessory: 'accessory' }[cat] || 'piece';
  }
  function esc(s) { return w.UI ? w.UI.esc(s) : s; }

  /* ==========================================================
     FIND SIMILAR - visually similar products, same category
     ========================================================== */
  function findSimilar(item, limit) {
    var pool = w.Data.CATALOG.filter(function (p) { return p.cat === item.cat; });
    return pool.map(function (p) {
        return { p: p, s: similarity(item, p) };
      })
      .sort(function (a, b) { return b.s - a.s; })
      .slice(0, limit || 12)
      .map(function (x) {
        x.p = Object.assign({}, x.p, { match: Math.round(x.s * 100) });
        return x.p;
      });
  }

  /* ==========================================================
     FIND PAIR - what goes WITH the selected item
       Top    -> Bottoms + Shoes
       Bottom -> Tops    + Shoes
       Shoes  -> Tops    + Bottoms
     ========================================================== */
  var PAIR_MAP = {
    top:       ['bottom', 'shoes'],
    dress:     ['shoes', 'outerwear'],
    bottom:    ['top', 'shoes'],
    shoes:     ['top', 'bottom'],
    outerwear: ['top', 'bottom'],
    bag:       ['top', 'shoes'],
    accessory: ['top', 'bottom']
  };

  function pairTargets(cat) { return PAIR_MAP[cat] || ['top', 'bottom']; }

  function findPair(item, cat, limit) {
    var pool = w.Data.CATALOG.filter(function (p) { return p.cat === cat; });
    return pool.map(function (p) {
        return { p: p, s: score(p, { base: item, occasion: item.occasion }) };
      })
      .sort(function (a, b) { return b.s - a.s; })
      .slice(0, limit || 12)
      .map(function (x) {
        x.p = Object.assign({}, x.p, { match: x.s });
        return x.p;
      });
  }

  /* ==========================================================
     OUTFIT SUGGESTIONS - built from the user's own wardrobe
     ========================================================== */
  function buildOutfit(occasion, seedIndex) {
    var wr = w.Store.state.wardrobe;
    function pool(cat) {
      return wr.filter(function (i) { return i.cat === cat; });
    }
    var bottoms = pool('bottom');
    var tops = (bottoms.length ? pool('top') : []).concat(pool('dress'));
    var shoes = pool('shoes');
    if (!tops.length || !shoes.length) return null;

    function pickBest(list, base, offset) {
      if (!list.length) return null;
      var ranked = list.map(function (i) {
        var s = (base ? harmony(i.color, base.color) : 0.8) * 60 +
                (occasion && i.occasion === occasion ? 25 : 8) +
                prefScore(i) * 15;
        return { i: i, s: s };
      }).sort(function (a, b) { return b.s - a.s; });
      return ranked[(offset || 0) % ranked.length].i;
    }

    var top = pickBest(tops, null, seedIndex);
    var bottom = top.cat === 'dress' ? null : pickBest(bottoms, top, seedIndex);
    var shoe = pickBest(shoes, top, seedIndex);

    var items = [top.id];
    if (bottom) items.push(bottom.id);
    if (shoe) items.push(shoe.id);

    return {
      items: items,
      parts: { top: top, bottom: bottom, shoes: shoe },
      occasion: occasion || top.occasion,
      score: Math.round(
        harmony(top.color, shoe.color) * 40 +
        (bottom ? harmony(top.color, bottom.color) * 35 : 35) +
        prefScore(top) * 25
      )
    };
  }

  /* deterministic "outfit of the day" for a given date key */
  function outfitForDate(key) {
    var planned = w.Store.planFor(key);
    if (planned) return { outfit: planned, planned: true };

    var list = w.Store.state.outfits;
    if (!list.length) return null;
    var seed = 0;
    for (var i = 0; i < key.length; i++) seed = (seed * 31 + key.charCodeAt(i)) >>> 0;
    return { outfit: list[seed % list.length], planned: false };
  }

  function whyOutfit(o) {
    var parts = w.Store.outfitParts(o);
    var bits = [];
    if (parts.top && parts.bottom) {
      var hRaw = harmony(parts.top.color, parts.bottom.color);
      bits.push(hRaw > 0.8
        ? parts.top.colorName + ' and ' + parts.bottom.colorName.toLowerCase() + ' sit well together'
        : parts.top.colorName + ' balances the ' + parts.bottom.colorName.toLowerCase());
    }
    var p = prefs();
    if (p.styles && parts.top && p.styles.indexOf(parts.top.style) >= 0) {
      bits.push('it leans ' + parts.top.style.toLowerCase() + ', which is your usual');
    } else if (o.occasion) {
      bits.push('it suits ' + o.occasion.toLowerCase());
    }
    return 'Suggested because ' + bits.slice(0, 2).join(', and ') + '.';
  }

  /* ==========================================================
     AI STYLIST - maps a natural-language request to an outfit
     ========================================================== */
  var INTENTS = [
    { re: /(present|interview|office|work|meeting|formal)/i, occasion: 'Office',     line: 'Keep it sharp and simple. A crisp top with tailored bottoms reads confident without effort.' },
    { re: /(college|class|campus|lecture|uni)/i,             occasion: 'College',    line: 'Comfortable but considered — an easy top, relaxed denim and clean sneakers.' },
    { re: /(party|club|night ?out|birthday)/i,               occasion: 'Party',      line: 'Go darker and a little sharper. One statement piece, everything else quiet.' },
    { re: /(date|dinner|romantic)/i,                         occasion: 'Date night', line: 'Soft textures and a warm palette. Understated always beats overdressed.' },
    { re: /(travel|trip|airport|flight|vacation)/i,          occasion: 'Travel',     line: 'Layers you can add or drop, and shoes you can walk all day in.' },
    { re: /(wedding|festive|function|ceremony)/i,            occasion: 'Wedding',    line: 'Structure and a richer colour. Let one piece carry the occasion.' },
    { re: /(gym|workout|run|training|sport)/i,               occasion: 'Workout',    line: 'Breathable, light and built to move.' },
    { re: /(brunch|coffee|weekend|casual|everyday)/i,        occasion: 'Everyday',   line: 'Relaxed and tonal — the kind of outfit you forget you are wearing.' }
  ];

  function ask(text) {
    var hit = null;
    for (var i = 0; i < INTENTS.length; i++) {
      if (INTENTS[i].re.test(text)) { hit = INTENTS[i]; break; }
    }
    if (!hit) hit = { occasion: 'Everyday', line: 'Here is a balanced everyday look pulled from your wardrobe.' };

    var built = buildOutfit(hit.occasion, Math.floor(Math.random() * 5));
    return { occasion: hit.occasion, line: hit.line, outfit: built };
  }

  w.Recommend = {
    score: score, explain: explain, harmony: harmony, similarity: similarity,
    isNeutral: isNeutral,
    findSimilar: findSimilar, findPair: findPair, pairTargets: pairTargets,
    buildOutfit: buildOutfit, outfitForDate: outfitForDate, whyOutfit: whyOutfit,
    ask: ask
  };
})(window);
