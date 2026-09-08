/* ==========================================================
   AURA FIT - COLOUR DETECTION
   Works out the dominant garment colour in an uploaded photo
   and snaps it to the nearest swatch in the app's palette, so
   "Add item" pre-selects the colour that is actually in the
   picture instead of a default.

   Kept free of DOM access so it can be unit-tested directly.
   ========================================================== */
(function (w) {
  'use strict';

  /* perceptual-ish RGB distance (same weighting as the garment renderer) */
  function distance(a, b) {
    var rm = (a[0] + b[0]) / 2;
    var dr = a[0] - b[0], dg = a[1] - b[1], db = a[2] - b[2];
    return Math.sqrt((2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db);
  }

  function hex(rgb) {
    return '#' + [rgb[0], rgb[1], rgb[2]].map(function (v) {
      return Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
    }).join('');
  }

  /* Product shots are typically a garment on a plain ground.
     Estimate the background from the corners, discard anything close to it,
     then take the most common remaining colour from the middle of the frame.
       data : RGBA Uint8ClampedArray
       W, H : pixel dimensions                                            */
  function dominant(data, W, H) {
    if (!data || !W || !H) return null;

    function at(x, y) {
      var i = ((y * W) + x) * 4;
      return [data[i], data[i + 1], data[i + 2], data[i + 3]];
    }

    var corners = [at(1, 1), at(W - 2, 1), at(1, H - 2), at(W - 2, H - 2)];
    var bg = [0, 0, 0];
    corners.forEach(function (c) {
      bg[0] += c[0] / 4; bg[1] += c[1] / 4; bg[2] += c[2] / 4;
    });

    var x0 = Math.floor(W * 0.15), x1 = Math.ceil(W * 0.85);
    var y0 = Math.floor(H * 0.12), y1 = Math.ceil(H * 0.88);
    var step = Math.max(1, Math.floor(Math.min(W, H) / 110));

    var buckets = {}, best = null, bestN = 0, kept = 0;

    for (var y = y0; y < y1; y += step) {
      for (var x = x0; x < x1; x += step) {
        var p = at(x, y);
        if (p[3] < 200) continue;                  // transparent
        if (distance(p, bg) < 48) continue;        // background
        kept++;
        var key = (p[0] >> 4) + '|' + (p[1] >> 4) + '|' + (p[2] >> 4);
        var b = buckets[key];
        if (!b) b = buckets[key] = { n: 0, r: 0, g: 0, b: 0 };
        b.n++; b.r += p[0]; b.g += p[1]; b.b += p[2];
        if (b.n > bestN) { bestN = b.n; best = b; }
      }
    }

    /* nearly everything looked like background - trust the centre pixel */
    if (!best || kept < 40) {
      var c = at(Math.floor(W / 2), Math.floor(H / 2));
      return c[3] < 200 ? null : [c[0], c[1], c[2]];
    }
    return [Math.round(best.r / best.n), Math.round(best.g / best.n), Math.round(best.b / best.n)];
  }

  /* snap a colour to the closest entry the app actually offers */
  function nearest(rgb, palette) {
    if (!rgb || !palette || !palette.length) return null;
    var h = hex(rgb), best = null, bd = Infinity;
    palette.forEach(function (c) {
      var d = distance(hexToRgb(h), hexToRgb(c.hex));
      if (d < bd) { bd = d; best = c; }
    });
    return best ? best.name : null;
  }

  function hexToRgb(h) {
    h = String(h).replace('#', '');
    if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }

  /* convenience: canvas -> swatch name */
  function fromCanvas(cv, palette) {
    try {
      var d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
      return nearest(dominant(d, cv.width, cv.height), palette);
    } catch (e) {
      return null;                                 // tainted or unreadable
    }
  }

  w.Colour = {
    dominant: dominant,
    nearest: nearest,
    fromCanvas: fromCanvas,
    hex: hex,
    distance: distance
  };
})(typeof window !== 'undefined' ? window : globalThis);
