/* ==========================================================
   AURA FIT - ICON SPRITE
   Single source of truth for icons, shared by the user app
   (index.html) and the admin console (admin.html).

   Every path is authored on a 24x24 grid; UI.icon() renders it
   into <svg class="ico" viewBox="0 0 24 24"> so it scales
   instead of clipping. To add an icon, add one entry below.
   ========================================================== */
(function (w) {
  'use strict';

  var ICONS = {
    'i-arrow-right': '<path d="M4 12h15M13 6l6 6-6 6"/>',
    'i-bag': '<path d="M5 8h14l1 12H4zM8.5 8V6a3.5 3.5 0 1 1 7 0v2"/>',
    'i-bell': '<path d="M18 8a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7"/><path d="M13.7 20a2 2 0 0 1-3.4 0"/>',
    'i-bookmark': '<path d="M6.5 3.5h11a1 1 0 0 1 1 1v16l-6.5-4.2L5.5 20.5v-16a1 1 0 0 1 1-1Z"/>',
    'i-calendar': '<rect x="3.5" y="5" width="17" height="16" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    'i-camera': '<path d="M4 8h3l1.6-2.4h6.8L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.5"/>',
    'i-check': '<path d="m5 13 4.5 4.5L19 7"/>',
    'i-dots': '<circle cx="12" cy="5" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="19" r="1.6"/>',
    'i-down': '<path d="m6 9 6 6 6-6"/>',
    'i-edit': '<path d="M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 17z"/>',
    'i-eye': '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
    'i-eye-off': '<path d="M4 4l16 16"/><path d="M9.9 5.9A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-3.4 4.1M6.4 7.9A17 17 0 0 0 2.5 12S6 18.5 12 18.5a9.4 9.4 0 0 0 3.3-.6"/><path d="M9.9 10.2a3 3 0 0 0 4 4.1"/>',
    'i-grid': '<rect x="3.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.6"/>',
    'i-hanger': '<path d="M12 3a2.6 2.6 0 0 0-2.6 2.6c0 1.2.8 2.1 1.9 2.5v1.3L3.3 15a2 2 0 0 0 1.2 3.6h15a2 2 0 0 0 1.2-3.6L12.7 9.4V8.1c1.1-.4 1.9-1.3 1.9-2.5"/>',
    'i-heart': '<path d="M12 20.4C6.6 16.1 3 13.1 3 9.4C3 6.6 5.2 4.5 7.9 4.5C9.6 4.5 11.1 5.3 12 6.6C12.9 5.3 14.4 4.5 16.1 4.5C18.8 4.5 21 6.6 21 9.4C21 13.1 17.4 16.1 12 20.4Z"/>',
    'i-home': '<path d="M3 10.2 12 3l9 7.2V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    'i-image': '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.6"/><path d="m4 17 5-4.5 4 3.5 3-2.5 4 3.5"/>',
    'i-left': '<path d="m15 5-7 7 7 7"/>',
    'i-link': '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    'i-lock': '<rect x="4.5" y="10" width="15" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    'i-logout': '<path d="M9.5 4H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h3.5"/><path d="m16 8 4 4-4 4M20 12H9.5"/>',
    'i-mail': '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 7 8.5 6 8.5-6"/>',
    'i-menu': '<path d="M4 7h16M4 12h16M4 17h16"/>',
    'i-moon': '<path d="M20.5 14.5A8.6 8.6 0 0 1 9.5 3.5a8.6 8.6 0 1 0 11 11z"/>',
    'i-pants': '<path d="M6.4 3h11.2l.7 18h-4.5L12 11.4 10.2 21H5.7Z"/><path d="M6.4 6.6h11.2"/>',
    'i-plus': '<path d="M12 5v14M5 12h14"/>',
    'i-refresh': '<path d="M20 12a8 8 0 1 1-2.6-5.9M20 4v4.5h-4.5"/>',
    'i-right': '<path d="m9 5 7 7-7 7"/>',
    'i-search': '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    'i-share': '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4"/>',
    'i-shield': '<path d="M12 3l7.5 3v6c0 4.4-3 7.9-7.5 9.5C7.5 19.9 4.5 16.4 4.5 12V6z"/>',
    'i-shirt': '<path d="M8.6 3 4.7 4.9 3.1 9l3.4 1.4V21h11V10.4L20.9 9l-1.6-4.1L15.4 3a3.4 3.4 0 0 1-6.8 0Z"/>',
    'i-shoe': '<path d="M2.6 18.4v-1.3c0-2.7 1.4-4.6 3.5-4.6h2.2l2.5 2.4 6 1.4c2.1.5 3.3 1.4 3.3 3v.5a.6.6 0 0 1-.6.6H3.2a.6.6 0 0 1-.6-.6Z"/><path d="M2.6 18.2h18.5"/><path d="M6.5 12.7 8.3 15M8.8 12.6 10.6 15"/>',
    'i-sliders': '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h10M18 18h2"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="16" cy="18" r="2"/>',
    'i-sparkle': '<path d="M12 2.5 13.9 8l5.6 1.9-5.6 1.9L12 17.4l-1.9-5.6L4.5 9.9 10.1 8z"/><path d="M18.5 14.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/>',
    'i-star': '<path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1.1 5.9-5.3-2.9-5.3 2.9 1.1-5.9L3.5 9.7l5.9-.8z"/>',
    'i-sun': '<circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8"/>',
    'i-tag': '<path d="M3.5 11.5V4.5a1 1 0 0 1 1-1h7l9 9-8 8z"/><circle cx="8" cy="8" r="1.4"/>',
    'i-trash': '<path d="M4 7h16M9.5 7V5h5v2M6 7l1 13h10l1-13M10 11v6M14 11v6"/>',
    'i-user': '<circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/>',
    'i-x': '<path d="M6 6l12 12M18 6L6 18"/>'
  };

  function markup() {
    var out = '<svg width="0" height="0" aria-hidden="true" focusable="false"><defs>';
    for (var id in ICONS) {
      if (Object.prototype.hasOwnProperty.call(ICONS, id)) {
        out += '<g id="' + id + '">' + ICONS[id] + '</g>';
      }
    }
    return out + '</defs></svg>';
  }

  function inject() {
    if (document.getElementById('aura-sprite')) return;
    var host = document.createElement('div');
    host.id = 'aura-sprite';
    host.setAttribute('aria-hidden', 'true');
    host.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    host.innerHTML = markup();
    (document.body || document.documentElement).appendChild(host);
  }

  if (document.body) inject();
  else document.addEventListener('DOMContentLoaded', inject);

  w.AuraSprite = { icons: ICONS, markup: markup, inject: inject };
})(window);
