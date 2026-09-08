/* ==========================================================
   AURA FIT - STATE STORE
   Single source of truth + localStorage persistence + pub/sub.
   ========================================================== */
(function (w) {
  'use strict';

  var KEY = 'aurafit.v1';

  var DEFAULTS = {
    theme: null,                 // 'light' | 'dark' | null (follow OS)
    session: null,               // { email, name }
    users: {},                   // email -> { name, email, pass, prefs, onboarded }
    wardrobe: [],
    outfits: [],
    savedProducts: [],           // product ids
    favOutfits: [],
    planner: {},                 // 'YYYY-MM-DD' -> outfitId
    seeded: false
  };

  var state = null;
  var subs = [];
  var persisted = null;
  var committed = null;
  var owner = null;
  var LIBRARY = ['wardrobe', 'outfits', 'savedProducts', 'favOutfits', 'planner', 'seeded'];
  function copy(v) { return JSON.parse(JSON.stringify(v)); }
  function captureLibrary() {
    var result = {};
    LIBRARY.forEach(function (key) { result[key] = copy(state[key]); });
    return result;
  }
  function switchLibrary(email) {
    if (owner && state.users[owner]) state.libraries[owner] = captureLibrary();
    owner = email || null;
    var library = owner && state.libraries[owner];
    if (!library) {
      state.wardrobe = []; state.outfits = []; state.savedProducts = [];
      state.favOutfits = []; state.planner = {}; state.seeded = false;
      if (owner) seed();
    } else LIBRARY.forEach(function (key) { state[key] = copy(library[key]); });
  }

  /* ---------------- persistence ---------------- */
  function safeGet() {
    try { return JSON.parse(localStorage.getItem(KEY) || 'null'); }
    catch (e) { return null; }
  }
  function safeSet(v) {
    localStorage.setItem(KEY, JSON.stringify(v));
  }

  function load() {
    try { persisted = localStorage.getItem(KEY); } catch (e) { persisted = null; }
    var saved = safeGet();
    state = Object.assign(copy(DEFAULTS), saved || {});
    if (!state.seeded) seed();
    seedAccounts();
    if (!state.libraries) {
      state.libraries = {};
      // Legacy shared data belongs only to the last signed-in account.
      // When signed out, retain it separately for explicit recovery.
      var legacyOwner = state.session && state.session.email;
      if (saved) {
        if (legacyOwner) state.libraries[legacyOwner] = captureLibrary();
        else state.legacyLibrary = captureLibrary();
      }
    }
    owner = null;
    switchLibrary(state.session && state.session.email);
    committed = copy(state);
    return state;
  }

  function seed() {
    state.wardrobe = w.Data.WARDROBE.map(function (x) { return Object.assign({}, x); });
    state.outfits  = copy(w.Data.OUTFITS);
    state.favOutfits = state.outfits.filter(function (o) { return o.fav; }).map(function (o) { return o.id; });
    state.seeded = true;
  }

  /* The two shipped accounts. Re-created on every load (never overwritten)
     so the documented credentials always work, even on a fresh browser. */
  var ACCOUNTS = [
    {
      email: 'admin@aurafit.app', pass: 'Admin@123', name: 'Aura Admin',
      role: 'admin', createdAt: 1735689600000
    },
    {
      email: 'user@aurafit.app', pass: 'User@123', name: 'Khush',
      role: 'user', createdAt: 1735776000000,
      prefs: {
        styles: ['Minimal', 'Casual', 'Aesthetic'],
        colours: ['Ivory', 'Black', 'Camel', 'Denim blue'],
        occasions: ['Everyday', 'College', 'Office'],
        fit: 'Relaxed'
      }
    }
  ];

  function seedAccounts() {
    ACCOUNTS.forEach(function (a) {
      if (state.users[a.email]) return;
      state.users[a.email] = {
        name: a.name, email: a.email, pass: a.pass,
        role: a.role, status: 'active', onboarded: true,
        prefs: a.prefs ? copy(a.prefs) : null,
        createdAt: a.createdAt, lastLogin: null
      };
    });
  }

  function save() {
    try {
      if (localStorage.getItem(KEY) !== persisted) {
        throw new Error('Another tab changed your data. Reload this page before saving again.');
      }
      var nextOwner = state.session && state.session.email;
      if ((nextOwner || null) !== owner) switchLibrary(nextOwner);
      if (owner) state.libraries[owner] = captureLibrary();
      // Keep the active session in this demo, but never duplicate private
      // collections at the top level of the persisted document.
      var disk = copy(state);
      LIBRARY.forEach(function (key) { delete disk[key]; });
      safeSet(disk);
      persisted = JSON.stringify(disk);
      committed = copy(state);
    } catch (cause) {
      state = copy(committed);
      owner = state.session && state.session.email || null;
      var error = new Error(cause.message.indexOf('Another tab') === 0 ? cause.message :
        'Could not save your changes. Storage may be full or unavailable. Free space and try again.');
      if (w.UI) w.UI.toast(error.message, 'error');
      // Throw so callers cannot show success or navigate after a failed save.
      throw error;
    }
    emit();
    return true;
  }

  function emit() {
    subs.forEach(function (fn) { try { fn(state); } catch (e) { console.error(e); } });
  }

  /* ---------------- theme ---------------- */
  function prefersDark() {
    return w.matchMedia && w.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  function effectiveTheme() {
    return state.theme || (prefersDark() ? 'dark' : 'light');
  }
  function applyTheme() {
    var t = effectiveTheme();
    document.documentElement.setAttribute('data-theme', t);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'dark' ? '#111312' : '#FBF7F4');
    return t;
  }
  function setTheme(t) { state.theme = t; save(); applyTheme(); }
  function toggleTheme() { setTheme(effectiveTheme() === 'dark' ? 'light' : 'dark'); return effectiveTheme(); }

  /* ---------------- auth ---------------- */
  function normalise(e) { return String(e || '').trim().toLowerCase(); }

  function register(name, email, pass) {
    if (state.adminSettings && state.adminSettings.allowSignups === false) {
      return { ok: false, error: 'New accounts are paused. Please try again later.' };
    }
    if (state.adminSettings && state.adminSettings.maintenance) {
      return { ok: false, error: 'Aura Fit is under maintenance. Please try again later.' };
    }
    email = normalise(email);
    if (state.users[email]) return { ok: false, error: 'An account with this email already exists.' };
    state.users[email] = {
      name: name.trim(), email: email, pass: pass,
      prefs: null, onboarded: false,
      role: 'user',
      status: 'active', lastLogin: Date.now(), createdAt: Date.now()
    };
    state.session = { email: email };
    save();
    return { ok: true };
  }

  function login(email, pass) {
    email = normalise(email);
    var u = state.users[email];
    if (!u) return { ok: false, error: 'No account found for that email.' };
    if (u.pass !== pass) return { ok: false, error: 'Incorrect password. Please try again.' };
    if (state.adminSettings && state.adminSettings.maintenance && u.role !== 'admin') {
      return { ok: false, error: 'Aura Fit is under maintenance. Please try again later.' };
    }
    if (u.status === 'suspended') return { ok: false, error: 'This account has been suspended. Contact support.' };
    u.lastLogin = Date.now();
    state.session = { email: email };
    save();
    return { ok: true };
  }

  /* Social sign-in. There is no OAuth server in this build, so this
     links a provider-scoped local account rather than pretending to
     complete a real Google handshake. */
  function socialLogin(provider) {
    return { ok: false, error: 'Google sign-in is unavailable in this local demo.' };
  }

  function resetPassword(email, pass) {
    return { ok: false, error: 'Email password recovery requires a connected authentication service and is unavailable in this demo.' };
  }

  /* Kept for automated tests: signs into the shipped user account. */
  function demoLogin() {
    return login('user@aurafit.app', 'User@123');
  }

  function adminLogin() {
    return { ok: false, error: 'Use the console sign-in form.' };
  }

  function logout() { state.session = null; save(); }

  function user() {
    if (!state.session) return null;
    var u = state.users[state.session.email];
    return u && u.status !== 'suspended' ? u : null;
  }
  function updateUser(patch) {
    var u = user(); if (!u) return;
    Object.assign(u, patch); save();
  }

  /* ---------------- wardrobe ---------------- */
  function uid(p) { return p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  function addItem(item) {
    item.id = uid('w');
    item.createdAt = Date.now();
    state.wardrobe.unshift(item);
    save();
    return item;
  }
  function updateItem(id, patch) {
    var it = getItem(id); if (!it) return null;
    Object.assign(it, patch); save(); return it;
  }
  function removeItem(id) {
    state.wardrobe = state.wardrobe.filter(function (x) { return x.id !== id; });
    state.outfits.forEach(function (o) {
      o.items = o.items.filter(function (i) { return i !== id; });
    });
    state.outfits = state.outfits.filter(function (o) { return o.items.length; });
    var remaining = state.outfits.map(function (o) { return o.id; });
    state.favOutfits = state.favOutfits.filter(function (outfitId) { return remaining.indexOf(outfitId) >= 0; });
    Object.keys(state.planner).forEach(function (day) {
      if (remaining.indexOf(state.planner[day]) < 0) delete state.planner[day];
    });
    save();
  }
  function getItem(id) {
    for (var i = 0; i < state.wardrobe.length; i++) if (state.wardrobe[i].id === id) return state.wardrobe[i];
    return null;
  }
  function itemsByCat(cat) {
    return state.wardrobe.filter(function (x) { return !cat || cat === 'all' || x.cat === cat; });
  }
  function countByCat(cat) { return itemsByCat(cat).length; }

  /* ---------------- outfits ---------------- */
  function addOutfit(o) {
    o.id = uid('o'); o.createdAt = Date.now();
    state.outfits.unshift(o); save(); return o;
  }
  function updateOutfit(id, patch) {
    var o = getOutfit(id); if (!o) return null;
    Object.assign(o, patch); save(); return o;
  }
  function removeOutfit(id) {
    state.outfits = state.outfits.filter(function (x) { return x.id !== id; });
    state.favOutfits = state.favOutfits.filter(function (x) { return x !== id; });
    Object.keys(state.planner).forEach(function (d) {
      if (state.planner[d] === id) delete state.planner[d];
    });
    save();
  }
  function getOutfit(id) {
    for (var i = 0; i < state.outfits.length; i++) if (state.outfits[i].id === id) return state.outfits[i];
    return null;
  }
  function outfitParts(o) {
    if (!o) return {};
    var parts = {}, extras = [];
    o.items.forEach(function (id) {
      var it = getItem(id); if (!it) return;
      if (it.cat === 'top' && !parts.top) parts.top = it;
      else if (it.cat === 'dress' && !parts.top) parts.top = it;
      else if (it.cat === 'bottom' && !parts.bottom) parts.bottom = it;
      else if (it.cat === 'shoes' && !parts.shoes) parts.shoes = it;
      else extras.push(it);
    });
    if (!parts.extra && extras.length) parts.extra = extras[0];
    return parts;
  }

  function toggleFavOutfit(id) {
    var i = state.favOutfits.indexOf(id);
    if (i >= 0) state.favOutfits.splice(i, 1); else state.favOutfits.push(id);
    save();
    return i < 0;
  }
  function isFavOutfit(id) { return state.favOutfits.indexOf(id) >= 0; }

  /* ---------------- saved products ---------------- */
  function toggleSavedProduct(id) {
    var i = state.savedProducts.indexOf(id);
    if (i >= 0) state.savedProducts.splice(i, 1); else state.savedProducts.push(id);
    save();
    return i < 0;
  }
  function isSavedProduct(id) { return state.savedProducts.indexOf(id) >= 0; }

  /* ---------------- planner ---------------- */
  function dateKey(d) {
    d = d || new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function planFor(key) {
    var id = state.planner[key];
    return id ? getOutfit(id) : null;
  }
  function setPlan(key, outfitId) { state.planner[key] = outfitId; save(); }

  /* ---------------- stats ---------------- */
  function stats() {
    var cats = {};
    state.wardrobe.forEach(function (i) { cats[i.cat] = (cats[i.cat] || 0) + 1; });
    var total = state.wardrobe.length || 1;

    var used = {};
    state.outfits.forEach(function (o) { o.items.forEach(function (i) { used[i] = true; }); });
    var usedCount = Object.keys(used).filter(function (id) { return getItem(id); }).length;

    return {
      items: state.wardrobe.length,
      outfits: state.outfits.length,
      categories: Object.keys(cats).length,
      usagePct: Math.round((usedCount / total) * 100),
      byCat: w.Data.CATEGORIES.map(function (c) {
        return { id: c.id, label: c.label, n: cats[c.id] || 0, pct: Math.round(((cats[c.id] || 0) / total) * 100) };
      }).filter(function (r) { return r.n > 0; }).sort(function (a, b) { return b.n - a.n; })
    };
  }

  function resetLibrary() {
    state.savedProducts = []; state.favOutfits = []; state.planner = {};
    seed(); save();
  }

  function resetAll() {
    state = copy(DEFAULTS);
    state.libraries = {};
    owner = null;
    seedAccounts();
    save();
  }

  // Do not repaint an open form or silently switch its account. A stale tab
  // keeps its draft visible, but must reload before it can commit changes.
  w.addEventListener('storage', function (event) {
    if ((event.key === KEY || event.key === null) && w.UI) {
      w.UI.toast('Data changed in another tab. Reload before saving; keep a copy of any unsaved input.', 'error');
    }
  });

  function authResult(fn) {
    return function () {
      try { return fn.apply(null, arguments); }
      catch (error) { return { ok: false, error: error.message }; }
    };
  }

  w.Store = {
    load: load, save: save, get state() { return state; },
    subscribe: function (fn) { subs.push(fn); return function () { subs = subs.filter(function (f) { return f !== fn; }); }; },

    effectiveTheme: effectiveTheme, applyTheme: applyTheme, setTheme: setTheme, toggleTheme: toggleTheme,

    register: authResult(register), login: authResult(login), logout: logout, resetPassword: resetPassword,
    socialLogin: socialLogin,
    demoLogin: demoLogin, adminLogin: adminLogin, user: user, updateUser: updateUser,

    addItem: addItem, updateItem: updateItem, removeItem: removeItem,
    getItem: getItem, itemsByCat: itemsByCat, countByCat: countByCat,

    addOutfit: addOutfit, updateOutfit: updateOutfit, removeOutfit: removeOutfit,
    getOutfit: getOutfit, outfitParts: outfitParts,
    toggleFavOutfit: toggleFavOutfit, isFavOutfit: isFavOutfit,

    toggleSavedProduct: toggleSavedProduct, isSavedProduct: isSavedProduct,

    dateKey: dateKey, planFor: planFor, setPlan: setPlan,
    stats: stats, resetAll: resetAll, resetLibrary: resetLibrary, uid: uid
  };
})(window);
