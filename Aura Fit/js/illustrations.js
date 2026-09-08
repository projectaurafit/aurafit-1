/* ==========================================================
   AURA FIT - ILLUSTRATIONS
   Every hero image and badge in the auth flow is inline SVG:
   no network requests, crisp at any density, and it re-tints
   with the active theme.
   ========================================================== */
(function (w) {
  'use strict';

  /* ---------------------------------------------------------
     1. Start-screen hero - a wardrobe rail scene
     --------------------------------------------------------- */
  function wardrobeHero() {
    return '' +
    '<svg class="ill-hero" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" role="img" aria-label="A styled wardrobe rail">' +
      '<defs>' +
        '<linearGradient id="ah-bg" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="#2A2521"/><stop offset="1" stop-color="#15120F"/>' +
        '</linearGradient>' +
        '<radialGradient id="ah-glow" cx="72%" cy="18%" r="62%">' +
          '<stop offset="0" stop-color="#E8B99A" stop-opacity=".30"/>' +
          '<stop offset="1" stop-color="#E8B99A" stop-opacity="0"/>' +
        '</radialGradient>' +
        '<linearGradient id="ah-wall" x1="0" y1="0" x2="1" y2="0">' +
          '<stop offset="0" stop-color="#211C18"/><stop offset="1" stop-color="#2E2822"/>' +
        '</linearGradient>' +
        '<linearGradient id="ah-cream" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="#F3EADC"/><stop offset="1" stop-color="#DCCDB8"/>' +
        '</linearGradient>' +
        '<linearGradient id="ah-sand" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="#E3D2B8"/><stop offset="1" stop-color="#C6B092"/>' +
        '</linearGradient>' +
        '<linearGradient id="ah-dark" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="#3B3833"/><stop offset="1" stop-color="#26241F"/>' +
        '</linearGradient>' +
        '<linearGradient id="ah-tan" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="#C79A6B"/><stop offset="1" stop-color="#A57B50"/>' +
        '</linearGradient>' +
      '</defs>' +

      '<rect width="400" height="300" fill="url(#ah-bg)"/>' +
      '<rect x="150" width="250" height="300" fill="url(#ah-wall)" opacity=".55"/>' +
      '<rect width="400" height="300" fill="url(#ah-glow)"/>' +

      /* floor */
      '<path d="M0 244 H400 V300 H0 Z" fill="#100E0C" opacity=".85"/>' +
      '<path d="M0 244 H400 V252 H0 Z" fill="#E8B99A" opacity=".07"/>' +

      /* rail */
      '<rect x="118" y="52" width="268" height="5" rx="2.5" fill="url(#ah-tan)"/>' +
      '<rect x="118" y="52" width="268" height="2" rx="1" fill="#E9C9A6" opacity=".5"/>' +
      '<rect x="376" y="34" width="6" height="24" rx="3" fill="#8A6642"/>' +

      /* hanging garments */
      g_hanger(150, '#EFE6D6') + g_sweater(133, 62, 'url(#ah-cream)') +
      g_hanger(186, '#E7D9C2') + g_shirt(170, 62, 'url(#ah-sand)') +
      g_hanger(222, '#CFCAC2') + g_sweater(205, 62, 'url(#ah-dark)') +
      g_hanger(258, '#EFE6D6') + g_shirt(242, 62, 'url(#ah-cream)') +
      g_hanger(294, '#D8C9B0') + g_dress(276, 62, 'url(#ah-sand)') +
      g_hanger(332, '#CFCAC2') + g_sweater(315, 62, 'url(#ah-dark)') +

      /* plant, left */
      '<path d="M26 244 L34 196 H62 L70 244 Z" fill="#2E2A25"/>' +
      '<path d="M30 200 H66" stroke="#4A443C" stroke-width="3"/>' +
      '<path d="M48 196 C48 168 34 152 24 142 C40 146 50 160 50 178 C54 158 68 146 84 140 C70 156 54 170 50 196 Z" fill="#4C6A4E"/>' +
      '<path d="M48 190 C48 172 60 158 74 150 C64 164 56 176 52 192 Z" fill="#5F8060" opacity=".85"/>' +

      /* bench with folded clothes + bag */
      '<rect x="20" y="216" width="104" height="10" rx="3" fill="#3A322A"/>' +
      '<rect x="28" y="226" width="8" height="18" fill="#2C261F"/>' +
      '<rect x="108" y="226" width="8" height="18" fill="#2C261F"/>' +
      '<rect x="30" y="200" width="46" height="8" rx="2" fill="url(#ah-cream)"/>' +
      '<rect x="33" y="192" width="40" height="8" rx="2" fill="url(#ah-sand)"/>' +
      '<rect x="36" y="184" width="34" height="8" rx="2" fill="#CFC7BB"/>' +
      /* tote */
      '<path d="M88 186 q0-16 12-16 q12 0 12 16" fill="none" stroke="#8A6642" stroke-width="3"/>' +
      '<path d="M84 186 H116 L120 216 H80 Z" fill="url(#ah-tan)"/>' +
      '<path d="M84 192 H116" stroke="#8A6642" stroke-width="1.4" opacity=".6"/>' +

      /* sneakers on floor */
      '<path d="M140 238 q1-11 9-13 h7 l7 6 16 4 q8 2 8 6 v3 q0 2-3 2 h-42 q-2 0-2-3 Z" fill="#F1EBE0"/>' +
      '<path d="M138 244 h48" stroke="#C9C1B4" stroke-width="2.5" stroke-linecap="round"/>' +
      '<path d="M190 240 q1-9 8-11 h6 l6 5 14 4 q7 2 7 5 v2 q0 2-3 2 h-37 q-2 0-2-3 Z" fill="#E4DCCE"/>' +
      '<path d="M188 244 h42" stroke="#BCB4A6" stroke-width="2.2" stroke-linecap="round"/>' +

      /* soft vignette so the headline sits cleanly on top */
      '<rect width="400" height="300" fill="url(#ah-vig)"/>' +
      '<defs><linearGradient id="ah-vig" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="#0F0D0B" stop-opacity=".18"/>' +
        '<stop offset=".55" stop-color="#0F0D0B" stop-opacity="0"/>' +
        '<stop offset="1" stop-color="#0F0D0B" stop-opacity=".55"/>' +
      '</linearGradient></defs>' +
    '</svg>';
  }

  function g_hanger(x, c) {
    return '<g stroke="' + c + '" stroke-width="2" fill="none" stroke-linecap="round">' +
      '<path d="M' + x + ' 46 a4 4 0 1 1 4 4 v4"/>' +
      '<path d="M' + (x + 4) + ' 54 L' + (x - 15) + ' 66 h38 Z"/>' +
    '</g>';
  }
  function g_sweater(x, y, f) {
    return '<path d="M' + x + ' ' + (y + 2) + ' l10-5 q8 7 16 0 l10 5 l12 9 l-5 30 l-8-2 l-2-28 v62 q-18 4-36 0 v-62 l-2 28 l-8 2 l-5-30 Z" fill="' + f + '"/>';
  }
  function g_shirt(x, y, f) {
    return '<path d="M' + x + ' ' + (y + 2) + ' l11-5 l7 8 l7-8 l11 5 l12 9 l-6 12 l-5-4 v58 q-18 4-36 0 v-58 l-5 4 l-6-12 Z" fill="' + f + '"/>' +
      '<path d="M' + (x + 18) + ' ' + (y + 5) + ' v70" stroke="#00000022" stroke-width="1.2"/>';
  }
  function g_dress(x, y, f) {
    return '<path d="M' + x + ' ' + (y + 2) + ' l9-5 q9 7 18 0 l9 5 l7 20 l9 56 q-27 6-54 0 l9-56 Z" fill="' + f + '"/>';
  }

  /* ---------------------------------------------------------
     2. Badges used across the auth flow
     --------------------------------------------------------- */

  /* envelope being sent (Forgot password) */
  function envelopeSend() {
    return '' +
    '<svg class="ill-badge" viewBox="0 0 200 160" role="img" aria-label="Email on its way">' +
      '<defs>' +
        '<linearGradient id="ae-p" x1="0" y1="0" x2="1" y2="1">' +
          '<stop offset="0" stop-color="#F5D9C3"/><stop offset="1" stop-color="#DCB295"/>' +
        '</linearGradient>' +
        '<linearGradient id="ae-f" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="#FBEADB"/><stop offset="1" stop-color="#EBD0BA"/>' +
        '</linearGradient>' +
        '<radialGradient id="ae-halo" cx="50%" cy="55%" r="55%">' +
          '<stop offset="0" stop-color="#E8B99A" stop-opacity=".26"/>' +
          '<stop offset="1" stop-color="#E8B99A" stop-opacity="0"/>' +
        '</radialGradient>' +
      '</defs>' +
      '<ellipse cx="100" cy="86" rx="92" ry="66" fill="url(#ae-halo)"/>' +
      '<ellipse cx="100" cy="140" rx="52" ry="7" fill="#000" opacity=".22"/>' +
      '<path d="M46 58 h108 a6 6 0 0 1 6 6 v58 a6 6 0 0 1-6 6 H46 a6 6 0 0 1-6-6 V64 a6 6 0 0 1 6-6 Z" fill="url(#ae-p)"/>' +
      '<path d="M40 66 L100 106 L160 66 V64 a6 6 0 0 0-6-6 H46 a6 6 0 0 0-6 6 Z" fill="url(#ae-f)"/>' +
      '<path d="M40 122 L82 92 M160 122 L118 92" stroke="#C99B7B" stroke-width="2" opacity=".55"/>' +
      /* paper plane */
      '<path d="M118 92 L166 66 L146 118 L134 102 Z" fill="#FDF3EA"/>' +
      '<path d="M134 102 L166 66 L146 118 Z" fill="#E5C3A8"/>' +
      '<path d="M28 46 h20 M22 62 h12 M34 30 h14" stroke="#E8B99A" stroke-width="3" stroke-linecap="round" opacity=".55"/>' +
    '</svg>';
  }

  /* envelope with a confirmation tick (Check your email) */
  function envelopeCheck() {
    return '' +
    '<svg class="ill-badge" viewBox="0 0 200 160" role="img" aria-label="Email sent">' +
      '<defs>' +
        '<linearGradient id="ac-p" x1="0" y1="0" x2="1" y2="1">' +
          '<stop offset="0" stop-color="#F5D9C3"/><stop offset="1" stop-color="#DCB295"/>' +
        '</linearGradient>' +
        '<linearGradient id="ac-f" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="#FBEADB"/><stop offset="1" stop-color="#EBD0BA"/>' +
        '</linearGradient>' +
        '<radialGradient id="ac-halo" cx="50%" cy="55%" r="55%">' +
          '<stop offset="0" stop-color="#E8B99A" stop-opacity=".26"/>' +
          '<stop offset="1" stop-color="#E8B99A" stop-opacity="0"/>' +
        '</radialGradient>' +
      '</defs>' +
      '<ellipse cx="100" cy="86" rx="92" ry="66" fill="url(#ac-halo)"/>' +
      '<ellipse cx="100" cy="140" rx="52" ry="7" fill="#000" opacity=".22"/>' +
      '<path d="M46 60 h108 a6 6 0 0 1 6 6 v56 a6 6 0 0 1-6 6 H46 a6 6 0 0 1-6-6 V66 a6 6 0 0 1 6-6 Z" fill="url(#ac-p)"/>' +
      '<path d="M40 68 L100 106 L160 68 V66 a6 6 0 0 0-6-6 H46 a6 6 0 0 0-6 6 Z" fill="url(#ac-f)"/>' +
      '<circle cx="150" cy="54" r="20" fill="#E29A6E"/>' +
      '<path d="M141 54 l6 6 l12-13" fill="none" stroke="#FFF7F0" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<circle cx="46" cy="44" r="5" fill="#E8B99A" opacity=".6"/>' +
      '<circle cx="30" cy="70" r="3.5" fill="#E8B99A" opacity=".4"/>' +
    '</svg>';
  }

  /* circular icon badge (lock / tick / hanger) */
  function circleBadge(iconId, tone) {
    var ring = tone === 'success' ? 'ab-succ' : 'ab-warm';
    return '' +
    '<svg class="ill-badge ill-badge--sm" viewBox="0 0 160 160" role="img" aria-hidden="true">' +
      '<defs>' +
        '<radialGradient id="' + ring + '" cx="50%" cy="45%" r="55%">' +
          '<stop offset="0" stop-color="#E8B99A" stop-opacity=".30"/>' +
          '<stop offset="1" stop-color="#E8B99A" stop-opacity="0"/>' +
        '</radialGradient>' +
      '</defs>' +
      '<circle cx="80" cy="80" r="78" fill="url(#' + ring + ')"/>' +
      '<circle cx="80" cy="80" r="52" fill="var(--surface-tint)"/>' +
      '<circle cx="80" cy="80" r="52" fill="none" stroke="var(--accent)" stroke-width="2" opacity=".55"/>' +
      '<g transform="translate(80 80) scale(2.1) translate(-12 -12)">' +
        '<use href="#' + iconId + '" fill="none" stroke="var(--accent)" stroke-width="1.7" ' +
          'stroke-linecap="round" stroke-linejoin="round"/>' +
      '</g>' +
    '</svg>';
  }

  /* big success tick */
  function successCheck() {
    return '' +
    '<svg class="ill-badge ill-badge--sm" viewBox="0 0 160 160" role="img" aria-label="Success">' +
      '<defs><radialGradient id="as-halo" cx="50%" cy="45%" r="55%">' +
        '<stop offset="0" stop-color="#E8B99A" stop-opacity=".32"/>' +
        '<stop offset="1" stop-color="#E8B99A" stop-opacity="0"/>' +
      '</radialGradient></defs>' +
      '<circle cx="80" cy="80" r="78" fill="url(#as-halo)"/>' +
      '<circle cx="80" cy="80" r="54" fill="var(--surface-tint)"/>' +
      '<circle cx="80" cy="80" r="54" fill="none" stroke="var(--accent)" stroke-width="2.5"/>' +
      '<path class="ill-tick" d="M56 81 l16 16 l32-34" fill="none" stroke="var(--accent)" ' +
        'stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>' +
    '</svg>';
  }

  /* welcome badge - hanger in a rounded square with sparkles */
  function welcomeBadge() {
    return '' +
    '<svg class="ill-badge ill-badge--sm" viewBox="0 0 160 160" role="img" aria-label="Welcome">' +
      '<defs>' +
        '<radialGradient id="aw-halo" cx="50%" cy="45%" r="55%">' +
          '<stop offset="0" stop-color="#E8B99A" stop-opacity=".30"/>' +
          '<stop offset="1" stop-color="#E8B99A" stop-opacity="0"/>' +
        '</radialGradient>' +
        '<linearGradient id="aw-sq" x1="0" y1="0" x2="1" y2="1">' +
          '<stop offset="0" stop-color="var(--surface-tint)"/>' +
          '<stop offset="1" stop-color="var(--surface-2)"/>' +
        '</linearGradient>' +
      '</defs>' +
      '<circle cx="80" cy="80" r="78" fill="url(#aw-halo)"/>' +
      '<rect x="34" y="34" width="92" height="92" rx="28" fill="url(#aw-sq)" stroke="var(--accent)" stroke-width="2"/>' +
      '<g transform="translate(80 82) scale(2.4) translate(-12 -12)">' +
        '<use href="#i-hanger" fill="none" stroke="var(--accent)" stroke-width="1.6" ' +
          'stroke-linecap="round" stroke-linejoin="round"/>' +
      '</g>' +
      '<g fill="var(--accent)">' +
        '<path class="ill-spark" d="M22 44 l3 7 l7 3 l-7 3 l-3 7 l-3-7 l-7-3 l7-3 Z"/>' +
        '<path class="ill-spark" style="animation-delay:.5s" d="M138 30 l2.5 6 l6 2.5 l-6 2.5 l-2.5 6 l-2.5-6 l-6-2.5 l6-2.5 Z"/>' +
        '<circle class="ill-spark" style="animation-delay:.9s" cx="132" cy="120" r="4"/>' +
        '<circle class="ill-spark" style="animation-delay:1.3s" cx="30" cy="112" r="3"/>' +
      '</g>' +
    '</svg>';
  }

  /* Google mark - official four-colour G, needs its own fills */
  function googleLogo() {
    return '' +
    '<svg class="ill-google" viewBox="0 0 48 48" aria-hidden="true" focusable="false">' +
      '<path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h11.8c-.5 2.7-2 5-4.4 6.6v5.5h7.1c4.2-3.8 6.6-9.5 6.6-16.1Z"/>' +
      '<path fill="#34A853" d="M24 46c6 0 11-2 14.6-5.4l-7.1-5.5c-2 1.3-4.5 2.1-7.5 2.1-5.7 0-10.6-3.9-12.3-9.1H4.3v5.7C7.9 41.1 15.4 46 24 46Z"/>' +
      '<path fill="#FBBC05" d="M11.7 28.1c-.4-1.3-.7-2.7-.7-4.1s.3-2.8.7-4.1v-5.7H4.3A22 22 0 0 0 2 24c0 3.6.9 6.9 2.3 9.8l7.4-5.7Z"/>' +
      '<path fill="#EA4335" d="M24 9.9c3.2 0 6.2 1.1 8.5 3.3l6.3-6.3C35 3.3 30 1 24 1 15.4 1 7.9 5.9 4.3 13.2l7.4 5.7C13.4 13.8 18.3 9.9 24 9.9Z"/>' +
    '</svg>';
  }

  w.Ill = {
    wardrobeHero: wardrobeHero,
    envelopeSend: envelopeSend,
    envelopeCheck: envelopeCheck,
    circleBadge: circleBadge,
    successCheck: successCheck,
    welcomeBadge: welcomeBadge,
    googleLogo: googleLogo
  };
})(window);
