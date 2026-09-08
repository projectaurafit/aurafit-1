/* ==========================================================
   SCREENS - ADMIN PANEL
   Dashboard · Users · SMTP · Email templates · App settings

   Front-end only. Every setting lives in Store.state and is
   persisted to localStorage through Store.save(). There is no
   mail server in this build - "send" actions are simulated and
   the UI says so.

   Exposes window.Admin = { isAdmin, isAdminEmail, store }.
   ========================================================== */
(function (w) {
  'use strict';
  var U = w.UI, S = w.Store;
  var Screens = w.Screens = w.Screens || {};

  var APP_VERSION = '1.1';
  var DEMO_EMAIL = 'khush@aurafit.app';
  var STORAGE_QUOTA = 5 * 1024 * 1024;         /* typical localStorage budget */
  var DAY = 86400e3;

  /* ==========================================================
     EXTRA ICONS
     Injected once as a second hidden sprite. Same 24x24 stroke
     style as the sprite in index.html; ids prefixed "i-a-".
     ========================================================== */
  var ICONS = {
    'i-a-server':   '<rect x="3" y="4" width="18" height="6" rx="1.6"/><rect x="3" y="14" width="18" height="6" rx="1.6"/><path d="M6.5 7h1M6.5 17h1"/>',
    'i-a-chart':    '<path d="M5 20v-6M11 20V8M17 20v-10M3 20h18"/>',
    'i-a-users':    '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 13.6a6.5 6.5 0 0 1 3.5 6.4"/>',
    'i-a-send':     '<path d="M21 3 10.5 13.5M21 3l-6.5 18-4-7.5L3 9.5z"/>',
    'i-a-key':      '<circle cx="8" cy="15" r="4.5"/><path d="m11.2 11.8 9.3-9.3M17 5.5l2.5 2.5M14 8.5l2.5 2.5"/>',
    'i-a-activity': '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
    'i-a-filter':   '<path d="M3 5h18l-7 8.5V20l-4-2v-4.5z"/>',
    'i-a-download': '<path d="M12 4v11M7 10l5 5 5-5M4 19h16"/>',
    'i-a-ban':      '<circle cx="12" cy="12" r="8.5"/><path d="m6 6 12 12"/>',
    'i-a-clock':    '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    'i-a-globe':    '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.6 2.6 3.8 5.4 3.8 8.5s-1.2 5.9-3.8 8.5c-2.6-2.6-3.8-5.4-3.8-8.5s1.2-5.9 3.8-8.5z"/>',
    'i-a-settings': '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    'i-a-database': '<ellipse cx="12" cy="5.5" rx="8" ry="3"/><path d="M4 5.5v13c0 1.7 3.6 3 8 3s8-1.3 8-3v-13"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
    'i-a-file':     '<path d="M14 3H6.5a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V7.5z"/><path d="M14 3v4.5h4.5M9 12h6M9 16h6"/>',
    'i-a-alert':    '<circle cx="12" cy="12" r="8.5"/><path d="M12 8v5M12 16.2v.4"/>',
    'i-a-info':     '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 7.6v.4"/>',
    'i-a-userplus': '<circle cx="10" cy="8" r="4"/><path d="M2.5 21a7.5 7.5 0 0 1 15 0"/><path d="M19 8v6M16 11h6"/>'
  };

  var iconsInjected = false;
  function injectIcons() {
    if (iconsInjected || !document.body) return;
    if (document.getElementById('i-a-server')) { iconsInjected = true; return; }
    var defs = Object.keys(ICONS).map(function (id) {
      return '<g id="' + id + '">' + ICONS[id] + '</g>';
    }).join('');
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '0'); svg.setAttribute('height', '0');
    svg.setAttribute('aria-hidden', 'true');
    svg.style.position = 'absolute';
    svg.innerHTML = '<defs>' + defs + '</defs>';
    document.body.insertBefore(svg, document.body.firstChild);
    iconsInjected = true;
  }

  /* ==========================================================
     DEFAULTS
     ========================================================== */
  var SMTP_DEFAULTS = {
    host: '', port: 587, enc: 'tls',
    user: '', pass: '',
    fromName: 'Aura Fit', fromEmail: '', replyTo: '',
    savedAt: null, testedAt: null, testOk: null, testMsg: ''
  };

  var SMTP_PRESETS = [
    { id: 'gmail',    label: 'Gmail',    host: 'smtp.gmail.com',      port: 465, enc: 'ssl' },
    { id: 'outlook',  label: 'Outlook',  host: 'smtp.office365.com',  port: 587, enc: 'tls' },
    { id: 'sendgrid', label: 'SendGrid', host: 'smtp.sendgrid.net',   port: 587, enc: 'tls' },
    { id: 'mailgun',  label: 'Mailgun',  host: 'smtp.mailgun.org',    port: 587, enc: 'tls' }
  ];

  var TEMPLATES = [
    {
      id: 'welcome', label: 'Welcome', sub: 'Sent after a new account is created', ico: 'i-sparkle',
      vars: ['name', 'email', 'app_name', 'support_email'],
      subject: 'Welcome to {{app_name}}, {{name}}!',
      body: 'Hi {{name}},\n\n' +
        'Welcome to {{app_name}} - your wardrobe, styled by AI.\n\n' +
        'Add a few pieces you already own and we will start suggesting outfits, similar products and perfect pairs.\n\n' +
        'Need a hand? Reply to this email or write to {{support_email}}.\n\n' +
        'See you in the app,\nThe {{app_name}} team'
    },
    {
      id: 'verify', label: 'Email verification', sub: 'Confirms a new address', ico: 'i-mail',
      vars: ['name', 'email', 'app_name', 'verify_link'],
      subject: 'Verify your email for {{app_name}}',
      body: 'Hi {{name}},\n\n' +
        'Please confirm that {{email}} belongs to you by opening the link below:\n\n' +
        '{{verify_link}}\n\n' +
        'The link is valid for 24 hours. If you did not create an account, you can safely ignore this email.\n\n' +
        'The {{app_name}} team'
    },
    {
      id: 'reset', label: 'Password reset', sub: 'Sent from Forgot password', ico: 'i-a-key',
      vars: ['name', 'email', 'app_name', 'reset_link', 'support_email'],
      subject: 'Reset your {{app_name}} password',
      body: 'Hi {{name}},\n\n' +
        'We received a request to reset the password for {{email}}. Use the link below to choose a new one:\n\n' +
        '{{reset_link}}\n\n' +
        'This link expires in 30 minutes. If you did not ask for a reset, no action is needed - your password stays the same.\n\n' +
        'Questions? Contact {{support_email}}.\n\n' +
        'The {{app_name}} team'
    },
    {
      id: 'changed', label: 'Password changed', sub: 'Security notice after a change', ico: 'i-shield',
      vars: ['name', 'email', 'app_name', 'date', 'support_email'],
      subject: 'Your {{app_name}} password was changed',
      body: 'Hi {{name}},\n\n' +
        'The password for {{email}} was changed on {{date}}.\n\n' +
        'If this was you, there is nothing else to do. If you did not make this change, please contact {{support_email}} straight away so we can secure your account.\n\n' +
        'The {{app_name}} team'
    }
  ];

  var VAR_HELP = {
    name: 'Recipient first name', email: 'Recipient email address', app_name: 'App name from Settings',
    support_email: 'Support email from Settings', reset_link: 'One-time password reset URL',
    verify_link: 'One-time verification URL', date: 'Date the event happened'
  };

  var SETTINGS_DEFAULTS = {
    appName: 'Aura Fit', supportEmail: 'support@aurafit.app',
    allowSignups: true, requireVerify: false, maintenance: false, socialLogin: false
  };

  /* ==========================================================
     DATA LAYER  (Admin.store)
     Reads / writes Store.state and calls Store.save().
     Keys introduced lazily: smtp, emailTemplates, adminSettings.
     User records are extended with role, status, lastLogin.
     ========================================================== */
  function templateDef(id) {
    for (var i = 0; i < TEMPLATES.length; i++) if (TEMPLATES[i].id === id) return TEMPLATES[i];
    return null;
  }

  function firstEmail() {
    var users = (S.state && S.state.users) || {};
    var best = null;
    Object.keys(users).forEach(function (e) {
      var u = users[e];
      if (!best || (u.createdAt || 0) < (users[best].createdAt || 0)) best = e;
    });
    return best;
  }

  /* Strict: administration is granted by role only, never inferred from
     being the first account. The admin account is provisioned in store.js. */
  function isAdminEmail(email) {
    if (!S.state || !S.state.users) return false;
    var u = S.state.users[email];
    return !!u && u.role === 'admin';
  }
  function isAdmin() {
    var u = S.user();
    return !!u && isAdminEmail(u.email);
  }

  /* create missing keys with defaults; returns true if anything changed */
  function ensure() {
    var st = S.state; if (!st) return false;
    var changed = false;

    if (!st.smtp) { st.smtp = Object.assign({}, SMTP_DEFAULTS); changed = true; }
    if (!st.adminSettings) { st.adminSettings = Object.assign({}, SETTINGS_DEFAULTS); changed = true; }
    if (!st.emailTemplates) st.emailTemplates = {};
    TEMPLATES.forEach(function (t) {
      if (!st.emailTemplates[t.id]) {
        st.emailTemplates[t.id] = { subject: t.subject, body: t.body };
        changed = true;
      }
    });

    Object.keys(st.users || {}).forEach(function (e) {
      var u = st.users[e];
      if (!u.role) { u.role = 'user'; changed = true; }
      if (!u.status) { u.status = 'active'; changed = true; }
      if (typeof u.lastLogin === 'undefined') { u.lastLogin = null; changed = true; }
    });

    if (changed) S.save();
    return changed;
  }

  function users() {
    ensure();
    var map = S.state.users || {};
    return Object.keys(map).map(function (e) { return map[e]; })
      .sort(function (a, b) { return (a.createdAt || 0) - (b.createdAt || 0); });
  }

  function updateUser(email, patch) {
    requireAdmin();
    var u = S.state.users[email]; if (!u) return null;
    if ((isOwner(email) || me().email === email) &&
        (patch.role === 'user' || patch.status === 'suspended')) throw new Error('The owner and your own admin access are protected.');
    Object.assign(u, patch); S.save(); return u;
  }
  function deleteUser(email) {
    requireAdmin();
    if (isOwner(email) || me().email === email) throw new Error('The owner and your own account cannot be deleted.');
    if (!S.state.users[email]) return false;
    delete S.state.users[email];
    if (S.state.libraries) delete S.state.libraries[email];
    if (S.state.session && S.state.session.email === email) S.state.session = null;
    S.save(); return true;
  }

  function smtp() { ensure(); return S.state.smtp; }
  function saveSmtp(patch) {
    requireAdmin();
    ensure();
    Object.assign(S.state.smtp, patch, { savedAt: Date.now(), testedAt: null, testOk: null, testMsg: '' });
    S.save(); return S.state.smtp;
  }
  function recordTest(ok, msg) {
    requireAdmin();
    ensure();
    Object.assign(S.state.smtp, { testedAt: Date.now(), testOk: !!ok, testMsg: msg || '' });
    S.save();
  }
  function smtpConfigured(c) {
    c = c || smtp();
    return !!(c.host && c.port && c.fromEmail && c.savedAt);
  }

  function templates() { ensure(); return S.state.emailTemplates; }
  function template(id) { return templates()[id]; }
  function saveTemplate(id, patch) {
    requireAdmin();
    ensure();
    Object.assign(S.state.emailTemplates[id], patch, { updatedAt: Date.now() });
    S.save();
  }
  function resetTemplate(id) {
    requireAdmin();
    var d = templateDef(id); if (!d) return;
    ensure();
    S.state.emailTemplates[id] = { subject: d.subject, body: d.body };
    S.save();
  }
  function templateModified(id) {
    var d = templateDef(id), t = template(id);
    return !!d && !!t && (t.subject !== d.subject || t.body !== d.body);
  }

  function settings() { ensure(); return S.state.adminSettings; }
  function saveSettings(patch) {
    requireAdmin();
    ensure();
    Object.assign(S.state.adminSettings, patch);
    S.save(); return S.state.adminSettings;
  }

  function storageBytes() {
    try { return (localStorage.getItem('aurafit.v1') || '').length * 2; }   /* UTF-16 */
    catch (e) { return JSON.stringify(S.state || {}).length * 2; }
  }

  function requireAdmin() {
    if (!isAdmin()) throw new Error('Sign in as an administrator to make changes.');
  }
  function attempt(fn) {
    try { fn(); return true; }
    catch (error) { U.toast(error.message || 'Unable to save. Please try again.', 'error'); return false; }
  }
  function createUser(name, email, pass, role) {
    requireAdmin();
    name = String(name || '').trim(); email = String(email || '').trim().toLowerCase();
    if (name.length < 2 || name.length > 80) throw new Error('Name must be between 2 and 80 characters.');
    if (!validEmail(email)) throw new Error('Enter a valid email address.');
    if (S.state.users[email]) throw new Error('An account with this email already exists.');
    if (typeof pass !== 'string' || pass.length < 8) throw new Error('Use a password with at least 8 characters.');
    if (role !== 'user' && role !== 'admin') throw new Error('Choose a valid role.');
    S.state.users[email] = { name: name, email: email, pass: pass, role: role, status: 'active',
      prefs: null, onboarded: false, createdAt: Date.now(), lastLogin: null };
    S.save();
  }
  function setPassword(email, pass, currentPass) {
    requireAdmin();
    if (me().pass !== currentPass) throw new Error('Your current administrator password is incorrect.');
    if (isOwner(email) && me().email !== email) throw new Error('Only the owner can change the owner password.');
    if (typeof pass !== 'string' || pass.length < 8) throw new Error('Use a password with at least 8 characters.');
    if (!S.state.users[email]) throw new Error('This account no longer exists.');
    updateUser(email, { pass: pass, passwordChangedAt: Date.now() });
  }

  /* recent activity, derived from timestamps we already keep */
  function events(limit) {
    var list = [];
    users().forEach(function (u) {
      var n = u.name || u.email;
      if (u.createdAt) list.push({ t: u.createdAt, ico: 'i-a-userplus', text: n + ' created an account', sub: u.email });
      if (u.lastLogin && u.lastLogin - (u.createdAt || 0) > 60e3) list.push({ t: u.lastLogin, ico: 'i-user', text: n + ' signed in', sub: u.email });
      if (u.resetSentAt) list.push({ t: u.resetSentAt, ico: 'i-a-key', text: 'Password reset sent to ' + n, sub: u.email + ' · simulated' });
      if (u.roleChangedAt) list.push({ t: u.roleChangedAt, ico: 'i-shield', text: n + (u.role === 'admin' ? ' was made an admin' : ' had admin access removed'), sub: u.email });
      if (u.passwordChangedAt) list.push({ t: u.passwordChangedAt, ico: 'i-a-key', text: 'Local password changed for ' + n, sub: u.email });
      if (u.statusChangedAt) list.push({ t: u.statusChangedAt, ico: u.status === 'suspended' ? 'i-a-ban' : 'i-check', text: n + (u.status === 'suspended' ? ' was suspended' : ' was reactivated'), sub: u.email });
    });
    var c = smtp();
    if (c.savedAt) list.push({ t: c.savedAt, ico: 'i-a-server', text: 'SMTP configuration saved', sub: c.host + ':' + c.port });
    if (c.testedAt) list.push({ t: c.testedAt, ico: c.testOk ? 'i-check' : 'i-a-alert', text: 'SMTP test ' + (c.testOk ? 'passed' : 'failed'), sub: 'Simulated handshake' });
    Object.keys(templates()).forEach(function (id) {
      var t = templates()[id], d = templateDef(id);
      if (t.updatedAt && d) list.push({ t: t.updatedAt, ico: 'i-a-file', text: d.label + ' template updated', sub: 'Email templates' });
    });
    list.sort(function (a, b) { return b.t - a.t; });
    return list.slice(0, limit || 8);
  }

  var store = {
    ensure: ensure, users: users, updateUser: updateUser, deleteUser: deleteUser, createUser: createUser, setPassword: setPassword,
    firstEmail: firstEmail,
    smtp: smtp, saveSmtp: saveSmtp, recordTest: recordTest, smtpConfigured: smtpConfigured,
    templates: templates, template: template, saveTemplate: saveTemplate,
    resetTemplate: resetTemplate, templateModified: templateModified, templateDef: templateDef,
    settings: settings, saveSettings: saveSettings,
    storageBytes: storageBytes, events: events,
    TEMPLATES: TEMPLATES, SMTP_PRESETS: SMTP_PRESETS, SMTP_DEFAULTS: SMTP_DEFAULTS, SETTINGS_DEFAULTS: SETTINGS_DEFAULTS
  };

  /* ==========================================================
     STORE HOOKS
     Wrap the auth calls so admin decisions actually bite:
     - suspended accounts cannot sign in
     - maintenance mode blocks non-admin sign-in
     - "allow new signups" off blocks register()
     - lastLogin is stamped on every successful sign-in
     ========================================================== */
  var patched = false;
  function patchStore() {
    if (patched) return; patched = true;

    var origLogin = S.login, origDemo = S.demoLogin, origRegister = S.register;

    S.login = function (email, pass) {
      ensure();
      var key = String(email || '').trim().toLowerCase();
      var u = S.state.users[key];
      if (u && u.status === 'suspended') return { ok: false, error: 'This account has been suspended. Please contact support.' };
      if (u && settings().maintenance && !isAdminEmail(key)) return { ok: false, error: 'Aura Fit is in maintenance mode. Please try again later.' };
      var r = origLogin.apply(S, arguments);
      return r;
    };
    S.demoLogin = function () {
      var r = origDemo.apply(S, arguments);
      ensure();
      if (r && r.ok && S.state.users[DEMO_EMAIL]) { S.state.users[DEMO_EMAIL].lastLogin = Date.now(); S.save(); }
      return r;
    };
    S.register = function (name, email, pass) {
      ensure();
      if (!settings().allowSignups) return { ok: false, error: 'New signups are currently closed. Please try again later.' };
      var r = origRegister.apply(S, arguments);
      if (r && r.ok) ensure();
      return r;
    };
  }

  /* ==========================================================
     SHARED HELPERS
     ========================================================== */
  var NAV = [
    { id: 'adminDashboard', label: 'Dashboard', ico: 'i-a-chart',    href: '#/admin' },
    { id: 'adminUsers',     label: 'Users',     ico: 'i-a-users',    href: '#/admin/users' },
    { id: 'adminSmtp',      label: 'SMTP',      ico: 'i-a-server',   href: '#/admin/smtp' },
    { id: 'adminEmails',    label: 'Emails',    ico: 'i-mail',       href: '#/admin/emails' },
    { id: 'adminSettings',  label: 'Settings',  ico: 'i-a-settings', href: '#/admin/settings' }
  ];

  function nav(active) {
    return '<nav class="chips adm-nav" aria-label="Admin sections">' + NAV.map(function (n) {
      return '<button class="chip' + (n.id === active ? ' is-active' : '') + '" data-go="' + n.href + '">' +
        U.icon(n.ico) + U.esc(n.label) + '</button>';
    }).join('') + '</nav>';
  }

  function topbar(title) {
    return function () {
      return { back: true, title: title, right: '<span class="badge adm-topbadge">' + U.icon('i-shield') + 'Admin</span>' };
    };
  }

  function ago(ts) {
    if (!ts) return 'Never';
    var d = Date.now() - ts;
    if (d < 60e3) return 'Just now';
    if (d < 3600e3) return Math.floor(d / 60e3) + 'm ago';
    if (d < DAY) return Math.floor(d / 3600e3) + 'h ago';
    if (d < 7 * DAY) return Math.floor(d / DAY) + 'd ago';
    return U.fmtDate(ts);
  }
  function fmtTime(ts) {
    var d = new Date(ts);
    var h = d.getHours(), m = String(d.getMinutes()).padStart(2, '0');
    var ap = h >= 12 ? 'pm' : 'am'; h = h % 12 || 12;
    return U.fmtDate(d) + ', ' + h + ':' + m + ' ' + ap;
  }
  function fmtBytes(n) {
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
    return (n / (1024 * 1024)).toFixed(2) + ' MB';
  }
  function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); }
  function validHost(v) { return /^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i.test(v) || v === 'localhost'; }

  function me() { return S.user(); }
  function isOwner(email) { return email === 'admin@aurafit.app' && isAdminEmail(email); }

  function roleBadge(u) {
    if (isOwner(u.email)) return '<span class="badge">' + U.icon('i-star') + 'Owner</span>';
    if (u.role === 'admin') return '<span class="badge">' + U.icon('i-shield') + 'Admin</span>';
    return '<span class="badge badge--muted">User</span>';
  }
  function statusBadge(u) {
    return u.status === 'suspended'
      ? '<span class="badge adm-badge--danger">' + U.icon('i-a-ban') + 'Suspended</span>'
      : '<span class="badge badge--success">' + U.icon('i-check') + 'Active</span>';
  }
  function avatar(u, lg) {
    return '<span class="adm-av' + (lg ? ' adm-av--lg' : '') + '">' + U.esc(U.initials(u.name)) + '</span>';
  }

  /* field builders (same markup as auth.js) */
  function field(o) {
    var wrap = o.ico || o.peek;
    var inner = '<input class="input" id="' + o.id + '" type="' + (o.type || 'text') + '" value="' + U.esc(o.val == null ? '' : o.val) + '"' +
      (o.ph ? ' placeholder="' + U.esc(o.ph) + '"' : '') +
      (o.attrs ? ' ' + o.attrs : '') + ' autocomplete="off">';
    if (wrap) {
      inner = '<div class="input-wrap">' +
        (o.ico ? '<span class="input-wrap__ico">' + U.icon(o.ico) + '</span>' : '') +
        inner +
        (o.peek ? '<button type="button" class="input-wrap__act" data-peek="' + o.id + '" aria-label="Show password">' + U.icon('i-eye') + '</button>' : '') +
      '</div>';
    }
    return '<div class="field' + (o.cls ? ' ' + o.cls : '') + '" data-field="' + o.id + '">' +
      '<label class="field__label" for="' + o.id + '">' + U.esc(o.label) + '</label>' +
      inner +
      (o.hint ? '<div class="adm-hint">' + U.esc(o.hint) + '</div>' : '') +
      '<div class="field__err"></div>' +
    '</div>';
  }
  function selectField(o) {
    return '<div class="field" data-field="' + o.id + '">' +
      '<label class="field__label" for="' + o.id + '">' + U.esc(o.label) + '</label>' +
      '<select class="select" id="' + o.id + '">' + o.options.map(function (op) {
        return '<option value="' + U.esc(op.v) + '"' + (op.v === o.val ? ' selected' : '') + '>' + U.esc(op.l) + '</option>';
      }).join('') + '</select>' +
      '<div class="field__err"></div>' +
    '</div>';
  }
  function setErr(root, id, msg) {
    var f = root.querySelector('[data-field="' + id + '"]'); if (!f) return;
    f.classList.toggle('has-err', !!msg);
    var e = f.querySelector('.field__err'); if (e) e.textContent = msg || '';
    var input = f.querySelector('input,select,textarea');
    if (input) {
      input.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (e) {
        e.id = id + '-error'; e.setAttribute('aria-live', 'polite');
        input.setAttribute('aria-describedby', e.id);
      }
    }
  }
  function clearErrs(root) {
    U.$$('.field', root).forEach(function (f) {
      f.classList.remove('has-err');
      var e = f.querySelector('.field__err'); if (e) e.textContent = '';
      var input = f.querySelector('input,select,textarea');
      if (input) input.removeAttribute('aria-invalid');
    });
  }
  function applyErrs(root, errs) {
    var first = null;
    Object.keys(errs).forEach(function (k) { setErr(root, k, errs[k]); if (!first) first = k; });
    if (first) { var inp = root.querySelector('#' + first); if (inp) inp.focus(); }
    return !first;
  }
  function wirePeek(root) {
    U.on(root, 'click', '[data-peek]', function (e, t) {
      var inp = root.querySelector('#' + t.dataset.peek); if (!inp) return;
      var show = inp.type === 'password';
      inp.type = show ? 'text' : 'password';
      t.innerHTML = U.icon(show ? 'i-eye-off' : 'i-eye');
      t.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    });
  }
  function val(root, id) { var n = root.querySelector('#' + id); return n ? String(n.value).trim() : ''; }

  function pill(state, text) {
    return '<span class="adm-pill adm-pill--' + state + '"><i></i>' + U.esc(text) + '</span>';
  }

  function note(ico, title, text) {
    return '<div class="adm-note">' +
      '<span class="adm-note__ico">' + U.icon(ico) + '</span>' +
      '<div class="grow"><div class="adm-note__t">' + U.esc(title) + '</div><div class="adm-note__s">' + text + '</div></div>' +
    '</div>';
  }

  function denied() {
    return '<div class="card card--pad" style="margin-top:24px"><div class="empty">' +
      '<div class="empty__ico">' + U.icon('i-lock', 'ico--lg') + '</div>' +
      '<div class="empty__t">Admins only</div>' +
      '<div class="empty__s">Your account does not have access to the admin panel.</div>' +
      '<button class="btn btn--primary btn--sm" data-go="#/account">Back to account</button>' +
    '</div></div>';
  }

  /* Wrap a screen so it (a) renders the access-denied state for
     non-admins and (b) mounts inside its own root element. The shared
     .view element survives route changes, so delegated listeners bound
     to it would keep firing on later screens; binding to a per-screen
     root means they are discarded with the markup. */
  function guarded(def) {
    var render = def.render, mount = def.mount, unmount = def.unmount;
    var mountedRoot = null;
    def.hasUnsavedChanges = function () {
      return !!mountedRoot && formSnapshot(mountedRoot) !== mountedRoot._savedForm;
    };
    def.unmount = function () {
      closeMenu();
      if (activeDetailClose) activeDetailClose();
      if (stopSmtpTest) { stopSmtpTest(); stopSmtpTest = null; }
      if (unmount) unmount();
      mountedRoot = null;
    };
    def.render = function (params) {
      injectIcons(); patchStore();
      if (!isAdmin()) return denied();
      ensure();
      return '<div class="adm-screen">' + render(params) + '</div>';
    };
    def.mount = function (view, params) {
      if (!isAdmin()) return;
      var root = U.$('.adm-screen', view) || view;
      mountedRoot = root;
      U.on(root, 'input', '.field input,.field select,.field textarea', function (e, input) {
        setErr(root, input.id, '');
      });
      mount(root, params);
      markSaved(root);
    };
    return def;
  }

  function formSnapshot(root) {
    return JSON.stringify(U.$$('input:not([type="search"]),select,textarea', root).map(function (el) {
      return [el.id, el.value, el.type === 'checkbox' ? el.checked : null];
    }));
  }
  function markSaved(root) {
    root = root.closest('.adm-screen') || root;
    root._savedForm = formSnapshot(root);
  }

  function openPassword(email, done) {
    if (activeDetailClose) activeDetailClose();
    var scrim = U.el('<div class="modal-scrim" role="dialog" aria-modal="true" aria-label="Set password"><div class="modal adm-modal">' +
      '<div class="adm-modal__head"><h2 class="grow t-h2">Set password</h2><button class="iconbtn" data-close aria-label="Close">' + U.icon('i-x') + '</button></div>' +
      '<p class="adm-hint">Update the local password for ' + U.esc(email) + '. No email will be sent.</p>' +
      '<form novalidate>' +
      field({id:'admin-current',label:'Your current administrator password',type:'password',peek:true}) +
      field({id:'account-password',label:'New password',type:'password',peek:true,hint:'At least 8 characters.'}) +
      field({id:'account-confirm',label:'Confirm new password',type:'password',peek:true}) +
      '<div class="adm-actions"><button type="button" class="btn btn--ghost" data-cancel>Cancel</button><button class="btn btn--primary" type="submit">Save password</button></div></form></div></div>');
    document.body.appendChild(scrim);
    var release = U.containFocus(scrim, scrim.querySelector('#admin-current'));
    function close() {
      if (activeDetailClose !== close) return;
      activeDetailClose = null; document.removeEventListener('keydown', escape); scrim.remove(); release();
    }
    function escape(e) { if (e.key === 'Escape') { e.preventDefault(); close(); } }
    activeDetailClose = close;
    document.addEventListener('keydown', escape);
    scrim.classList.add('is-open');
    scrim.querySelector('[data-close]').onclick = close;
    scrim.querySelector('[data-cancel]').onclick = close;
    wirePeek(scrim);
    scrim.querySelector('form').onsubmit = function (e) {
      e.preventDefault(); clearErrs(scrim);
      var pass = scrim.querySelector('#account-password').value;
      if (pass.length < 8) return applyErrs(scrim, {'account-password':'Use at least 8 characters.'});
      if (pass !== scrim.querySelector('#account-confirm').value) return applyErrs(scrim, {'account-confirm':'Passwords do not match.'});
      if (!attempt(function () { setPassword(email, pass, scrim.querySelector('#admin-current').value); })) return;
      close(); U.toast('Password updated. Use the new password next time you sign in.', 'success');
      if (done) done();
    };
  }

  /* ---- floating action menu (fixed, so table overflow cannot clip it) ---- */
  var openMenuNode = null, menuAnchor = null, activeDetailClose = null, stopSmtpTest = null;
  function closeMenu() {
    if (!openMenuNode) return;
    var n = openMenuNode; openMenuNode = null;
    if (menuAnchor) {
      menuAnchor.setAttribute('aria-expanded', 'false');
      if (n.contains(document.activeElement) && menuAnchor.isConnected) menuAnchor.focus();
      menuAnchor = null;
    }
    n.classList.remove('is-open');
    setTimeout(function () { n.remove(); }, 140);
    document.removeEventListener('click', outsideMenu, true);
    document.removeEventListener('keydown', escMenu);
    window.removeEventListener('scroll', closeMenu, true);
    window.removeEventListener('resize', closeMenu);
  }
  function outsideMenu(e) { if (openMenuNode && !openMenuNode.contains(e.target)) closeMenu(); }
  function escMenu(e) { if (e.key === 'Escape') closeMenu(); }

  function openMenu(anchor, items, onPick) {
    closeMenu();
    var m = U.el('<div class="adm-menu" role="menu">' + items.map(function (it) {
      return '<button class="adm-menu__item' + (it.danger ? ' is-danger' : '') + (it.disabled ? ' is-disabled' : '') + '" role="menuitem" data-act="' + it.id + '"' + (it.disabled ? ' disabled title="' + U.esc(it.why || '') + '"' : '') + '>' +
        U.icon(it.ico) + '<span>' + U.esc(it.label) + '</span></button>';
    }).join('') + '</div>');
    document.body.appendChild(m);
    openMenuNode = m;
    menuAnchor = anchor;
    anchor.setAttribute('aria-expanded', 'true');
    var first = m.querySelector('button:not(:disabled)');
    if (first) first.focus({ preventScroll: true });
    m.addEventListener('keydown', function (e) {
      var buttons = Array.from(m.querySelectorAll('button:not(:disabled)'));
      var index = buttons.indexOf(document.activeElement);
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        buttons[(index + (e.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length].focus();
      }
      if (e.key === 'Tab') closeMenu();
    });

    var r = anchor.getBoundingClientRect();
    var mw = m.offsetWidth, mh = m.offsetHeight;
    var left = Math.max(8, Math.min(r.right - mw, window.innerWidth - mw - 8));
    var top = r.bottom + 6;
    if (top + mh > window.innerHeight - 8) top = Math.max(8, r.top - mh - 6);
    m.style.left = left + 'px'; m.style.top = top + 'px';
    requestAnimationFrame(function () { m.classList.add('is-open'); });

    m.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
      closeMenu(); onPick(b.dataset.act);
    });
    setTimeout(function () {
      if (openMenuNode !== m) return;
      document.addEventListener('click', outsideMenu, true);
      document.addEventListener('keydown', escMenu);
      window.addEventListener('scroll', closeMenu, true);
      window.addEventListener('resize', closeMenu);
    }, 0);
  }

  /* ==========================================================
     1. DASHBOARD  -  #/admin
     ========================================================== */
  function statCard(n, label, ico) {
    return '<div class="stat"><div class="stat__n">' + n + '</div><div class="stat__l">' + U.esc(label) + '</div>' +
      '<span class="stat__ico">' + U.icon(ico) + '</span></div>';
  }
  function kv(k, v, ico) {
    return '<div class="adm-kv__row">' +
      '<span class="adm-kv__k">' + (ico ? U.icon(ico, 'ico--sm') : '') + '<span>' + U.esc(k) + '</span></span>' +
      '<span class="adm-kv__v">' + v + '</span>' +
    '</div>';
  }

  Screens.adminDashboard = guarded({
    shell: true,
    tab: 'account',
    topbar: topbar('Admin'),

    render: function () {
      var list = users(), cfg = smtp(), st = settings(), u = me();
      var now = Date.now();
      var dayStart = new Date(); dayStart.setHours(0, 0, 0, 0); dayStart = dayStart.getTime();
      var activeToday = list.filter(function (x) { return (x.lastLogin || 0) >= dayStart; }).length;
      var newWeek = list.filter(function (x) { return (x.createdAt || 0) >= now - 7 * DAY; }).length;
      var suspended = list.filter(function (x) { return x.status === 'suspended'; }).length;
      var bytes = storageBytes(), pct = Math.min(100, Math.round((bytes / STORAGE_QUOTA) * 100));
      var feed = events(8);

      return '' +
      nav('adminDashboard') +

      '<div class="adm-intro">' +
        '<div class="adm-intro__t">Overview</div>' +
        '<div class="adm-intro__s">Signed in as ' + U.esc(u.name) + ' · ' + (isOwner(u.email) ? 'Owner' : 'Admin') + ' · Everything here is stored on this device.</div>' +
      '</div>' +

      '<div class="adm-stats stagger">' +
        statCard(list.length, 'Total users', 'i-a-users') +
        statCard(activeToday, 'Active today', 'i-a-activity') +
        statCard(newWeek, 'New this week', 'i-a-userplus') +
        statCard(suspended, 'Suspended', 'i-a-ban') +
      '</div>' +

      '<div class="adm-two">' +
        '<div class="sec">' +
          '<div class="sec__head"><div class="sec__title">System health</div>' +
            '<button class="sec__link" data-go="#/admin/smtp">Configure ' + U.icon('i-right') + '</button></div>' +
          '<div class="card card--pad">' +
            '<div class="adm-kv">' +
              kv('SMTP', smtpConfigured(cfg)
                ? (cfg.testOk ? '<span class="badge badge--success">' + U.icon('i-check') + 'Demo tested</span>' : '<span class="badge">Configured</span>')
                : '<span class="badge badge--muted">Not configured</span>', 'i-a-server') +
              kv('Mail delivery', '<span class="t-xs t-dim">Simulated in this build</span>', 'i-a-send') +
              kv('Storage used', '<span class="t-sm t-med">' + fmtBytes(bytes) + '</span> <span class="t-xs t-faint">of ' + fmtBytes(STORAGE_QUOTA) + '</span>', 'i-a-database') +
              '<div class="bar adm-kv__bar"><div class="bar__fill" style="width:' + Math.max(2, pct) + '%"></div></div>' +
              kv('App version', '<span class="t-sm t-med">v' + APP_VERSION + '</span>', 'i-a-info') +
              kv('Maintenance mode', st.maintenance
                ? '<span class="badge adm-badge--danger">On</span>' : '<span class="badge badge--muted">Off</span>', 'i-a-alert') +
              kv('New signups', st.allowSignups
                ? '<span class="badge badge--success">Open</span>' : '<span class="badge adm-badge--danger">Closed</span>', 'i-a-globe') +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div class="sec">' +
          '<div class="sec__head"><div class="sec__title">Recent activity</div>' +
            '<span class="sec__link">Last ' + feed.length + '</span></div>' +
          '<div class="card">' +
            (feed.length ? '<div class="adm-feed">' + feed.map(function (ev) {
              return '<div class="adm-feed__row">' +
                '<span class="adm-feed__ico">' + U.icon(ev.ico) + '</span>' +
                '<span class="grow">' +
                  '<span class="adm-feed__t">' + U.esc(ev.text) + '</span>' +
                  '<span class="adm-feed__s">' + U.esc(ev.sub) + '</span>' +
                '</span>' +
                '<span class="adm-feed__time" title="' + U.esc(fmtTime(ev.t)) + '">' + U.esc(ago(ev.t)) + '</span>' +
              '</div>';
            }).join('') + '</div>'
            : '<div class="empty" style="padding:24px 0"><div class="empty__ico">' + U.icon('i-a-activity', 'ico--lg') + '</div>' +
              '<div class="empty__t">No activity yet</div><div class="empty__s">Signups, sign-ins and admin actions will show here.</div></div>') +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="sec">' +
        '<div class="sec__head"><div class="sec__title">Quick actions</div></div>' +
        '<div class="adm-quick">' +
          '<button class="actbtn" data-go="#/admin/users">' + U.icon('i-a-users', 'ico--lg') + 'Manage users</button>' +
          '<button class="actbtn" data-go="#/admin/smtp">' + U.icon('i-a-server', 'ico--lg') + 'SMTP setup</button>' +
          '<button class="actbtn" data-go="#/admin/emails">' + U.icon('i-mail', 'ico--lg') + 'Email templates</button>' +
          '<button class="actbtn" data-go="#/admin/settings">' + U.icon('i-a-settings', 'ico--lg') + 'App settings</button>' +
        '</div>' +
      '</div>';
    },

    mount: function () {}
  });

  /* ==========================================================
     2. USERS  -  #/admin/users
     ========================================================== */
  var FILTERS = [
    { id: 'all',       label: 'All' },
    { id: 'active',    label: 'Active' },
    { id: 'suspended', label: 'Suspended' },
    { id: 'admins',    label: 'Admins' }
  ];

  function matchFilter(u, f) {
    if (f === 'active') return u.status !== 'suspended';
    if (f === 'suspended') return u.status === 'suspended';
    if (f === 'admins') return u.role === 'admin' || isOwner(u.email);
    return true;
  }
  function matchQuery(u, q) {
    if (!q) return true;
    return (u.name || '').toLowerCase().indexOf(q) >= 0 || (u.email || '').toLowerCase().indexOf(q) >= 0;
  }

  function userRow(u) {
    return '<tr data-row="' + U.esc(u.email) + '">' +
      '<td class="adm-td-user">' +
        '<div class="adm-user">' + avatar(u) +
          '<span class="grow">' +
            '<span class="adm-user__n trunc">' + U.esc(u.name) + '</span>' +
            '<span class="adm-user__e trunc">' + U.esc(u.email) + '</span>' +
          '</span>' +
        '</div>' +
      '</td>' +
      '<td class="adm-td-email" data-label="Email"><span class="trunc adm-td-email__v">' + U.esc(u.email) + '</span></td>' +
      '<td data-label="Role">' + roleBadge(u) + '</td>' +
      '<td data-label="Status">' + statusBadge(u) + '</td>' +
      '<td data-label="Created"><span class="t-sm t-dim">' + U.esc(u.createdAt ? U.fmtDate(u.createdAt) : '—') + '</span></td>' +
      '<td data-label="Last login"><span class="t-sm t-dim" title="' + U.esc(u.lastLogin ? fmtTime(u.lastLogin) : '') + '">' + U.esc(ago(u.lastLogin)) + '</span></td>' +
      '<td class="adm-td-acts">' +
        '<button class="btn btn--ghost btn--sm adm-rowbtn" data-view="' + U.esc(u.email) + '">' + U.icon('i-eye', 'ico--sm') + 'View</button>' +
        '<button class="iconbtn iconbtn--bordered" data-menu="' + U.esc(u.email) + '" aria-label="More actions" aria-haspopup="menu">' + U.icon('i-dots') + '</button>' +
      '</td>' +
    '</tr>';
  }

  function menuItems(u) {
    var self = me() && me().email === u.email;
    var owner = isOwner(u.email);
    return [
      { id: 'view',   ico: 'i-eye',    label: 'View details' },
      { id: 'role',   ico: 'i-shield', label: u.role === 'admin' ? 'Remove admin' : 'Make admin',
        disabled: owner || self, why: self ? 'You cannot remove your own admin access' : 'The owner account is always an admin' },
      { id: 'status', ico: u.status === 'suspended' ? 'i-check' : 'i-a-ban',
        label: u.status === 'suspended' ? 'Activate account' : 'Suspend account',
        disabled: self || owner, why: 'The owner and your own account cannot be suspended' },
      { id: 'password', ico: 'i-a-key', label: 'Set password', disabled: owner && !self, why: 'Only the owner can change the owner password' },
      { id: 'reset',  ico: 'i-a-key',  label: 'Email reset unavailable', disabled: true, why: 'Email recovery requires a connected authentication service' },
      { id: 'delete', ico: 'i-trash',  label: 'Delete user', danger: true,
        disabled: self || owner, why: self ? 'You cannot delete your own account' : 'The owner account cannot be deleted' }
    ];
  }

  function doAction(email, act, done) {
    var u = S.state.users[email]; if (!u) return;
    var self = me() && me().email === email;
    var n = u.name || email;

    if (act === 'role') {
      if (self) return U.toast('You cannot remove your own admin access.', 'error');
      if (isOwner(email)) return U.toast('The owner account is always an admin.', 'error');
      var toAdmin = u.role !== 'admin';
      if (!attempt(function () { updateUser(email, { role: toAdmin ? 'admin' : 'user', roleChangedAt: Date.now() }); })) return;
      U.toast(toAdmin ? n + ' is now an admin' : 'Admin access removed for ' + n, 'success');
      return done && done();
    }
    if (act === 'status') {
      if (self || isOwner(email)) return U.toast('The owner and your own account cannot be suspended.', 'error');
      var toSusp = u.status !== 'suspended';
      if (!attempt(function () { updateUser(email, { status: toSusp ? 'suspended' : 'active', statusChangedAt: Date.now() }); })) return;
      U.toast(toSusp ? n + ' suspended' : n + ' reactivated', 'success');
      return done && done();
    }
    if (act === 'password') return openPassword(email, done);
    if (act === 'reset') {
      return U.toast('Email recovery is unavailable in this demo.', 'error');
    }
    if (act === 'delete') {
      if (self) return U.toast('You cannot delete your own account.', 'error');
      if (isOwner(email)) return U.toast('The owner account cannot be deleted.', 'error');
      U.confirmDialog({
        title: 'Delete ' + n + '?',
        text: 'The account ' + email + ' will be removed permanently from this device. This cannot be undone.',
        ok: 'Delete', danger: true
      }).then(function (yes) {
        if (!yes) return;
        if (!attempt(function () { deleteUser(email); })) return;
        U.toast('User deleted', 'success');
        done && done();
      });
    }
  }

  function openDetail(email, onChange) {
    if (activeDetailClose) activeDetailClose();
    var u = S.state.users[email]; if (!u) return;
    var p = u.prefs || {};
    var scrim = U.el(
      '<div class="modal-scrim" role="dialog" aria-modal="true" aria-label="User details">' +
        '<div class="modal adm-modal">' +
          '<div class="adm-modal__head">' + avatar(u, true) +
            '<div class="grow" style="min-width:0">' +
              '<div class="adm-modal__n trunc">' + U.esc(u.name) + '</div>' +
              '<div class="adm-modal__e trunc">' + U.esc(u.email) + '</div>' +
            '</div>' +
            '<button class="iconbtn" data-close aria-label="Close">' + U.icon('i-x') + '</button>' +
          '</div>' +
          '<div class="adm-kv adm-kv--tight">' +
            kv('Role', roleBadge(u)) +
            kv('Status', statusBadge(u)) +
            kv('Gender', '<span class="t-sm">' + (u.gender === 'male' ? 'Male' : u.gender === 'female' ? 'Female' : 'Not set') + '</span>') +
            kv('Password changed', '<span class="t-sm">' + U.esc(u.passwordChangedAt ? ago(u.passwordChangedAt) : 'Never') + '</span>') +
            kv('Created', '<span class="t-sm">' + U.esc(u.createdAt ? fmtTime(u.createdAt) : '—') + '</span>') +
            kv('Last login', '<span class="t-sm">' + U.esc(u.lastLogin ? fmtTime(u.lastLogin) : 'Never') + '</span>') +
            kv('Onboarded', u.onboarded ? '<span class="badge badge--success">Yes</span>' : '<span class="badge badge--muted">No</span>') +
            kv('Styles', '<span class="t-sm t-dim">' + U.esc(p.styles && p.styles.length ? p.styles.join(', ') : 'Not set') + '</span>') +
            kv('Fit', '<span class="t-sm t-dim">' + U.esc(p.fit || 'Not set') + '</span>') +
            (u.resetSentAt ? kv('Reset sent', '<span class="t-sm t-dim">' + U.esc(ago(u.resetSentAt)) + ' · simulated</span>') : '') +
          '</div>' +
          '<div class="adm-modal__acts">' + menuItems(u).filter(function (it) { return it.id !== 'view'; }).map(function (it) {
            return '<button class="btn btn--sm ' + (it.danger ? 'btn--danger' : 'btn--ghost') + '" data-act="' + it.id + '"' +
              (it.disabled ? ' disabled title="' + U.esc(it.why || '') + '"' : '') + '>' + U.icon(it.ico, 'ico--sm') + U.esc(it.label) + '</button>';
          }).join('') + '</div>' +
        '</div>' +
      '</div>');
    document.body.appendChild(scrim);
    var releaseFocus = U.containFocus(scrim, scrim.querySelector('[data-close]'));
    requestAnimationFrame(function () { scrim.classList.add('is-open'); });

    function close() {
      if (activeDetailClose !== close) return;
      activeDetailClose = null;
      document.removeEventListener('keydown', esc);
      scrim.classList.remove('is-open');
      setTimeout(function () { scrim.remove(); }, 220);
      releaseFocus();
    }
    activeDetailClose = close;
    function esc(e) {
      if (e.key === 'Escape') { e.preventDefault(); close(); }
    }
    document.addEventListener('keydown', esc);
    scrim.querySelector('[data-close]').onclick = close;
    scrim.onclick = function (e) { if (e.target === scrim) close(); };
    U.on(scrim, 'click', '[data-act]', function (e, t) {
      close();
      doAction(email, t.dataset.act, onChange);
    });
  }

  Screens.adminUsers = guarded({
    shell: true,
    tab: 'account',
    topbar: topbar('Users'),

    render: function (params) {
      var f = params && params.filter && FILTERS.some(function (x) { return x.id === params.filter; }) ? params.filter : 'all';
      return '' +
      nav('adminUsers') +
      '<details class="card card--pad sec" data-create-panel><summary class="t-med">Create account</summary>' +
        '<p class="adm-hint">Create a local user or administrator without signing out. Use test credentials only.</p>' +
        '<form data-create-user class="adm-form" novalidate><div class="adm-form2">' +
        field({ id: 'new-name', label: 'Full name', attrs: 'maxlength="80"' }) +
        field({ id: 'new-email', label: 'Email', type: 'email' }) +
        field({ id: 'new-pass', label: 'Password', type: 'password', peek: true, hint: 'At least 8 characters.' }) +
        selectField({ id: 'new-role', label: 'Role', val: 'user', options: [{v:'user',l:'User'}, {v:'admin',l:'Administrator'}] }) +
        '</div><div class="adm-actions"><button class="btn btn--primary" type="submit">Create account</button></div></form></details>' +
      '<div class="adm-toolbar">' +
        '<div class="searchbar adm-toolbar__search">' +
          '<span class="searchbar__ico">' + U.icon('i-search') + '</span>' +
          '<input type="search" placeholder="Search by name or email" data-q aria-label="Search users">' +
        '</div>' +
        '<div class="chips" data-filters>' + FILTERS.map(function (x) {
          return '<button class="chip' + (x.id === f ? ' is-active' : '') + '" data-filter="' + x.id + '">' + x.label + ' <span data-count="' + x.id + '"></span></button>';
        }).join('') + '</div>' +
      '</div>' +
      '<div class="adm-count t-xs t-faint" data-count-line role="status" aria-live="polite"></div>' +
      '<div data-list></div>';
    },

    mount: function (view, params) {
      var q = '';
      var filter = params && params.filter && FILTERS.some(function (x) { return x.id === params.filter; }) ? params.filter : 'all';
      var listEl = U.$('[data-list]', view);
      wirePeek(view);
      U.$('[data-create-user]', view).addEventListener('submit', function (e) {
        e.preventDefault();
        if (!attempt(function () { createUser(val(view, 'new-name'), val(view, 'new-email'), view.querySelector('#new-pass').value, val(view, 'new-role')); })) return;
        e.currentTarget.reset(); view.querySelector('[data-create-panel]').open = false;
        markSaved(view); paint(); U.toast('Account created. The new user can now sign in.', 'success');
      });

      function paint() {
        U.$$('[data-filter]', view).forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.filter === filter)); });
        var all = users();
        FILTERS.forEach(function (x) {
          var c = U.$('[data-count="' + x.id + '"]', view);
          if (c) c.textContent = all.filter(function (u) { return matchFilter(u, x.id); }).length;
        });
        var rows = all.filter(function (u) { return matchFilter(u, filter) && matchQuery(u, q); });
        U.$('[data-count-line]', view).textContent = rows.length === all.length
          ? all.length + (all.length === 1 ? ' user' : ' users')
          : 'Showing ' + rows.length + ' of ' + all.length + ' users';

        if (!rows.length) {
          listEl.innerHTML = '<div class="card card--pad"><div class="empty" style="padding:24px 0">' +
            '<div class="empty__ico">' + U.icon('i-a-users', 'ico--lg') + '</div>' +
            '<div class="empty__t">No users match</div>' +
            '<div class="empty__s">' + (q ? 'Try a different search or clear the filter.' : 'Nothing in this filter yet.') + '</div>' +
            (q || filter !== 'all' ? '<button class="btn btn--ghost btn--sm" data-clear>' + U.icon('i-x', 'ico--sm') + 'Clear filters</button>' : '') +
          '</div></div>';
          return;
        }
        listEl.innerHTML =
          '<div class="adm-tablewrap"><table class="adm-table">' +
            '<thead><tr>' +
              '<th>User</th><th>Email</th><th>Role</th><th>Status</th><th>Created</th><th>Last login</th><th class="t-right">Actions</th>' +
            '</tr></thead>' +
            '<tbody>' + rows.map(userRow).join('') + '</tbody>' +
          '</table></div>';
      }

      var qi = U.$('[data-q]', view);
      qi.addEventListener('input', function () { q = qi.value.trim().toLowerCase(); paint(); });

      U.on(view, 'click', '[data-filter]', function (e, t) {
        filter = t.dataset.filter;
        U.$$('[data-filter]', view).forEach(function (b) { b.classList.toggle('is-active', b.dataset.filter === filter); });
        paint();
      });
      U.on(view, 'click', '[data-clear]', function () {
        q = ''; qi.value = ''; filter = 'all';
        U.$$('[data-filter]', view).forEach(function (b) { b.classList.toggle('is-active', b.dataset.filter === 'all'); });
        paint();
      });
      U.on(view, 'click', '[data-view]', function (e, t) { openDetail(t.dataset.view, paint); });
      U.on(view, 'click', '[data-menu]', function (e, t) {
        e.stopPropagation();
        var email = t.dataset.menu, u = S.state.users[email]; if (!u) return;
        openMenu(t, menuItems(u), function (act) {
          if (act === 'view') return openDetail(email, paint);
          doAction(email, act, paint);
        });
      });

      paint();
    }
  });

  /* ==========================================================
     3. SMTP  -  #/admin/smtp
     ========================================================== */
  function smtpState(cfg, dirty) {
    if (dirty) return pill('warn', 'Unsaved changes');
    if (!smtpConfigured(cfg)) return pill('muted', 'Not configured');
    if (cfg.testOk === true) return pill('ok', 'Demo test passed');
    if (cfg.testOk === false) return pill('bad', 'Demo test failed');
    return pill('info', 'Saved · not tested');
  }

  function readSmtpForm(view) {
    return {
      host: val(view, 'smtp-host').toLowerCase(),
      port: Number(val(view, 'smtp-port')),
      enc: val(view, 'smtp-enc'),
      user: val(view, 'smtp-user'),
      pass: (view.querySelector('#smtp-pass') || {}).value || '',
      fromName: val(view, 'smtp-fromname'),
      fromEmail: val(view, 'smtp-fromemail').toLowerCase(),
      replyTo: val(view, 'smtp-replyto').toLowerCase()
    };
  }
  function validateSmtp(v) {
    var e = {};
    if (!v.host) e['smtp-host'] = 'Host is required.';
    else if (!validHost(v.host)) e['smtp-host'] = 'Enter a valid hostname, e.g. smtp.example.com';
    if (!Number.isInteger(v.port) || v.port < 1 || v.port > 65535) e['smtp-port'] = 'Port must be a whole number between 1 and 65535.';
    if (v.user && !v.pass) e['smtp-pass'] = 'Password is required when a username is set.';
    if (v.pass && !v.user) e['smtp-user'] = 'Username is required when a password is set.';
    if (!v.fromName) e['smtp-fromname'] = 'From name is required.';
    if (!v.fromEmail) e['smtp-fromemail'] = 'From email is required.';
    else if (!validEmail(v.fromEmail)) e['smtp-fromemail'] = 'Enter a valid email address.';
    if (v.replyTo && !validEmail(v.replyTo)) e['smtp-replyto'] = 'Enter a valid email address.';
    return e;
  }

  /* deterministic pretend handshake - documented in the UI */
  function simulateHandshake(v, onStep, done) {
    var steps = [
      'Resolving ' + v.host + '…',
      'Connecting to ' + v.host + ':' + v.port + (v.enc === 'ssl' ? ' over SSL' : v.enc === 'tls' ? ' with STARTTLS' : '') + '…',
      v.user ? 'Authenticating as ' + v.user + '…' : 'Skipping authentication…',
      'Handing message to the server…'
    ];
    var i = 0, timer;
    function next() {
      if (i < steps.length) { onStep(steps[i++]); timer = setTimeout(next, 420); return; }
      if (v.host === 'localhost') return done(false, 'Connection refused - nothing is listening on localhost:' + v.port + ' (simulated)');
      if (v.user && v.pass.length < 8) return done(false, '535 Authentication failed - password too short for the simulated server');
      done(true, '250 Message accepted for delivery (simulated - no email was sent)');
    }
    next();
    return function () { clearTimeout(timer); };
  }

  Screens.adminSmtp = guarded({
    shell: true,
    tab: 'account',
    topbar: topbar('SMTP'),

    render: function () {
      var c = smtp(), u = me();
      return '' +
      nav('adminSmtp') +

      '<div class="adm-cols">' +
        '<div class="adm-cols__main">' +
          '<div class="sec">' +
            '<div class="sec__head"><div class="sec__title">Mail server</div><span data-pill>' + smtpState(c, false) + '</span></div>' +
            '<div class="card card--pad">' +
              '<div class="adm-presets">' +
                '<span class="adm-presets__l">' + U.icon('i-sparkle', 'ico--sm') + 'Quick fill</span>' +
                '<div class="chips">' + SMTP_PRESETS.map(function (p) {
                  return '<button class="chip" data-preset="' + p.id + '">' + U.esc(p.label) + '</button>';
                }).join('') + '</div>' +
              '</div>' +
              '<form class="adm-form" data-form novalidate>' +
                '<div class="adm-form2">' +
                  field({ id: 'smtp-host', label: 'Host', val: c.host, ph: 'smtp.example.com', ico: 'i-a-server', cls: 'adm-span2' }) +
                  field({ id: 'smtp-port', label: 'Port', val: c.port, ph: '587', type: 'number', attrs: 'min="1" max="65535" inputmode="numeric"' }) +
                  selectField({ id: 'smtp-enc', label: 'Encryption', val: c.enc, options: [
                    { v: 'none', l: 'None' }, { v: 'ssl', l: 'SSL (implicit, port 465)' }, { v: 'tls', l: 'TLS / STARTTLS (port 587)' }] }) +
                  field({ id: 'smtp-user', label: 'Username', val: c.user, ph: 'apikey or mailbox', ico: 'i-user' }) +
                  field({ id: 'smtp-pass', label: 'Password', val: c.pass, ph: '••••••••', type: 'password', ico: 'i-lock', peek: true }) +
                  field({ id: 'smtp-fromname', label: 'From name', val: c.fromName, ph: 'Aura Fit' }) +
                  field({ id: 'smtp-fromemail', label: 'From email', val: c.fromEmail, ph: 'hello@aurafit.app', type: 'email', ico: 'i-mail' }) +
                  field({ id: 'smtp-replyto', label: 'Reply-to (optional)', val: c.replyTo, ph: 'support@aurafit.app', type: 'email', ico: 'i-mail', cls: 'adm-span2' }) +
                '</div>' +
                '<div class="adm-actions">' +
                  '<button type="button" class="btn btn--ghost" data-test>' + U.icon('i-a-send', 'ico--sm') + '<span>Run demo test</span></button>' +
                  '<button type="submit" class="btn btn--primary" data-save>' + U.icon('i-check', 'ico--sm') + '<span>Save configuration</span></button>' +
                '</div>' +
              '</form>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div class="adm-cols__side">' +
          '<div class="sec">' +
            '<div class="sec__head"><div class="sec__title">Connection</div></div>' +
            '<div class="card card--pad">' +
              '<div class="adm-kv adm-kv--tight">' +
                kv('Status', '<span data-pill2>' + smtpState(c, false) + '</span>') +
                kv('Last saved', '<span class="t-sm t-dim" data-saved>' + U.esc(c.savedAt ? ago(c.savedAt) : 'Never') + '</span>') +
                kv('Last test', '<span class="t-sm t-dim" data-tested>' + U.esc(c.testedAt ? ago(c.testedAt) : 'Never') + '</span>') +
              '</div>' +
              '<div class="adm-log" data-log' + (c.testedAt ? '' : ' hidden') + '>' +
                (c.testedAt ? '<div class="adm-log__line ' + (c.testOk ? 'is-ok' : 'is-bad') + '">' + U.esc(c.testMsg) + '</div>' : '') +
              '</div>' +
              '<p class="t-xs t-faint" style="margin-top:12px">Test emails would go to <strong class="t-dim">' + U.esc(u.email) + '</strong>.</p>' +
            '</div>' +
          '</div>' +
          '<div class="sec">' +
            note('i-a-info', 'Front-end only',
              'This build has no mail server. Use test credentials only. <em>Run demo test</em> simulates a connection; it cannot verify a server or send email. Real delivery needs a backend service.') +
          '</div>' +
        '</div>' +
      '</div>';
    },

    mount: function (view) {
      var dirty = false, testing = false;
      wirePeek(view);

      function refreshPills() {
        var c = smtp();
        U.$('[data-pill]', view).innerHTML = smtpState(c, dirty);
        U.$('[data-pill2]', view).innerHTML = smtpState(c, dirty);
        U.$('[data-saved]', view).textContent = c.savedAt ? ago(c.savedAt) : 'Never';
        U.$('[data-tested]', view).textContent = c.testedAt ? ago(c.testedAt) : 'Never';
      }
      function cancelTest() {
        if (!testing) return;
        if (stopSmtpTest) { stopSmtpTest(); stopSmtpTest = null; }
        testing = false;
        var button = view.querySelector('[data-test]');
        button.disabled = false; button.removeAttribute('aria-busy'); button.classList.remove('is-disabled');
        button.innerHTML = U.icon('i-a-send', 'ico--sm') + '<span>Run demo test</span>';
        view.querySelector('[data-log]').textContent = 'Demo test cancelled because the configuration changed.';
      }
      function markDirty() { cancelTest(); if (!dirty) { dirty = true; refreshPills(); } }

      U.on(view, 'input', '.input,.select,.textarea', function (e, t) {
        markDirty();
        var f = t.closest('.field'); if (f) { f.classList.remove('has-err'); }
      });
      U.on(view, 'change', '.select', markDirty);

      U.on(view, 'click', '[data-preset]', function (e, t) {
        var p = null;
        SMTP_PRESETS.forEach(function (x) { if (x.id === t.dataset.preset) p = x; });
        if (!p) return;
        view.querySelector('#smtp-host').value = p.host;
        view.querySelector('#smtp-port').value = p.port;
        view.querySelector('#smtp-enc').value = p.enc;
        ['smtp-host', 'smtp-port', 'smtp-enc'].forEach(function (id) { setErr(view, id, ''); });
        U.$$('[data-preset]', view).forEach(function (b) { b.classList.toggle('is-active', b === t); });
        markDirty();
        U.toast(p.label + ' preset applied - use test credentials only', 'success');
        view.querySelector('#smtp-user').focus();
      });

      function saveNow() {
        clearErrs(view);
        var v = readSmtpForm(view);
        if (!applyErrs(view, validateSmtp(v))) { U.toast('Please fix the highlighted fields.', 'error'); return null; }
        if (!attempt(function () { saveSmtp(v); })) return null;
        dirty = false;
        refreshPills();
        markSaved(view);
        return v;
      }

      U.$('[data-form]', view).addEventListener('submit', function (e) {
        e.preventDefault();
        cancelTest();
        if (saveNow()) U.toast('SMTP configuration saved', 'success');
      });

      U.on(view, 'click', '[data-test]', function (e, t) {
        if (testing) return;
        var v = saveNow(); if (!v) return;
        testing = true;
        t.disabled = true;
        t.setAttribute('aria-busy', 'true');
        var log = U.$('[data-log]', view);
        log.hidden = false; log.innerHTML = '';
        var label = t.querySelector('span');
        t.classList.add('is-disabled');
        t.innerHTML = '<span class="spinner"></span><span>Testing…</span>';

        stopSmtpTest = simulateHandshake(v, function (line) {
          log.appendChild(U.el('<div class="adm-log__line">' + U.esc(line) + '</div>'));
        }, function (ok, msg) {
          stopSmtpTest = null;
          var saved;
          try { saved = attempt(function () { recordTest(ok, msg); }); }
          finally {
            t.disabled = false;
            t.removeAttribute('aria-busy');
            t.classList.remove('is-disabled');
            t.innerHTML = U.icon('i-a-send', 'ico--sm') + '<span>Run demo test</span>';
            testing = false;
          }
          if (!saved) return;
          log.appendChild(U.el('<div class="adm-log__line ' + (ok ? 'is-ok' : 'is-bad') + '">' + U.esc(msg) + '</div>'));
          refreshPills();
          U.toast(ok ? 'Simulated test passed - no email was sent' : 'Simulated test failed', ok ? 'success' : 'error');
        });
      });
    }
  });

  /* ==========================================================
     4. EMAIL TEMPLATES  -  #/admin/emails
     ========================================================== */
  function sampleVars() {
    var u = me() || { name: 'Khush', email: 'khush@aurafit.app' };
    var st = settings();
    return {
      name: (u.name || 'there').split(/\s+/)[0],
      email: u.email,
      app_name: st.appName,
      support_email: st.supportEmail,
      reset_link: 'https://aurafit.app/#/reset?token=8f3a1c9e2b',
      verify_link: 'https://aurafit.app/#/verify?token=5d0b7e4a1f',
      date: fmtTime(Date.now())
    };
  }
  /* escape first, then substitute - unknown variables are flagged, never hidden */
  function renderTemplate(str, vars) {
    return U.esc(str).replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, function (m, k) {
      k = k.toLowerCase();
      return Object.prototype.hasOwnProperty.call(vars, k)
        ? '<span class="adm-var-hit">' + U.esc(vars[k]) + '</span>'
        : '<span class="adm-var-miss" title="Unknown variable">' + U.esc(m) + '</span>';
    });
  }

  function templateListItem(t, active) {
    return '<button class="listrow adm-tpl' + (active ? ' is-active' : '') + '" data-tpl="' + t.id + '">' +
      '<span class="listrow__ico">' + U.icon(t.ico) + '</span>' +
      '<span class="grow">' +
        '<span class="listrow__t adm-tpl__t">' + U.esc(t.label) +
          (templateModified(t.id) ? '<span class="badge adm-tpl__mod">Edited</span>' : '') + '</span>' +
        '<span class="listrow__s" style="display:block">' + U.esc(t.sub) + '</span>' +
      '</span>' +
      '<span class="listrow__chev">' + U.icon('i-right', 'ico--sm') + '</span>' +
    '</button>';
  }

  Screens.adminEmails = guarded({
    shell: true,
    tab: 'account',
    topbar: topbar('Email templates'),

    render: function (params) {
      var cur = params && templateDef(params.t) ? params.t : 'welcome';
      return '' +
      nav('adminEmails') +
      '<div class="adm-split">' +
        '<div class="sec adm-split__list">' +
          '<div class="sec__head"><div class="sec__title">Templates</div><span class="sec__link">' + TEMPLATES.length + '</span></div>' +
          '<div class="card" data-tpl-list>' + TEMPLATES.map(function (t) { return templateListItem(t, t.id === cur); }).join('') + '</div>' +
        '</div>' +
        '<div class="adm-split__main" data-editor></div>' +
      '</div>';
    },

    mount: function (view, params) {
      var cur = params && templateDef(params.t) ? params.t : 'welcome';
      var dirty = false;
      var editor = U.$('[data-editor]', view);
      var listEl = U.$('[data-tpl-list]', view);
      var lastFocus = 'body';

      function paintList() {
        listEl.innerHTML = TEMPLATES.map(function (t) { return templateListItem(t, t.id === cur); }).join('');
      }

      function paintEditor() {
        var d = templateDef(cur), t = template(cur);
        editor.innerHTML =
          '<div class="sec">' +
            '<div class="sec__head"><div class="sec__title">' + U.esc(d.label) + '</div>' +
              '<span data-tpl-state>' + (templateModified(cur) ? pill('info', 'Customised') : pill('muted', 'Default')) + '</span></div>' +
            '<div class="card card--pad">' +
              '<div class="field" data-field="tpl-subject">' +
                '<label class="field__label" for="tpl-subject">Subject</label>' +
                '<input class="input" id="tpl-subject" type="text" value="' + U.esc(t.subject) + '" autocomplete="off">' +
                '<div class="field__err"></div>' +
              '</div>' +
              '<div class="field" data-field="tpl-body">' +
                '<label class="field__label" for="tpl-body">Body</label>' +
                '<textarea class="textarea adm-textarea" id="tpl-body" rows="12" spellcheck="true">' + U.esc(t.body) + '</textarea>' +
                '<div class="field__err"></div>' +
              '</div>' +
              '<div class="adm-vars">' +
                '<div class="adm-vars__l">' + U.icon('i-tag', 'ico--sm') + 'Variables · click to insert</div>' +
                '<div class="adm-vars__list">' + d.vars.map(function (v) {
                  return '<button type="button" class="adm-var" data-var="' + v + '" title="' + U.esc(VAR_HELP[v] || '') + '">{{' + v + '}}</button>';
                }).join('') + '</div>' +
              '</div>' +
              '<div class="adm-actions">' +
                '<button type="button" class="btn btn--ghost" data-reset>' + U.icon('i-refresh', 'ico--sm') + '<span>Reset to default</span></button>' +
                '<button type="button" class="btn btn--primary" data-save>' + U.icon('i-check', 'ico--sm') + '<span>Save template</span></button>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="sec">' +
            '<div class="sec__head"><div class="sec__title">Live preview</div><span class="sec__link">Sample values</span></div>' +
            '<div class="card adm-preview" data-preview></div>' +
          '</div>';
        dirty = false;
        paintPreview();
        markSaved(view);
      }

      function paintPreview() {
        var vars = sampleVars(), c = smtp();
        var subject = editor.querySelector('#tpl-subject').value;
        var body = editor.querySelector('#tpl-body').value;
        var from = c.fromEmail ? (c.fromName ? c.fromName + ' <' + c.fromEmail + '>' : c.fromEmail) : 'Not configured - set up SMTP';
        U.$('[data-preview]', editor).innerHTML =
          '<div class="adm-preview__head">' +
            '<div class="adm-preview__meta"><span>From</span><span class="trunc">' + U.esc(from) + '</span></div>' +
            '<div class="adm-preview__meta"><span>To</span><span class="trunc">' + U.esc(vars.name + ' <' + vars.email + '>') + '</span></div>' +
            '<div class="adm-preview__subject">' + (subject.trim() ? renderTemplate(subject, vars) : '<span class="t-faint">(no subject)</span>') + '</div>' +
          '</div>' +
          '<div class="adm-preview__body">' + (body.trim() ? renderTemplate(body, vars) : '<span class="t-faint">(empty body)</span>') + '</div>';
      }

      function validate() {
        clearErrs(editor);
        var errs = {};
        if (!editor.querySelector('#tpl-subject').value.trim()) errs['tpl-subject'] = 'Subject cannot be empty.';
        if (!editor.querySelector('#tpl-body').value.trim()) errs['tpl-body'] = 'Body cannot be empty.';
        return applyErrs(editor, errs);
      }

      function insertVar(v) {
        var target = editor.querySelector(lastFocus === 'subject' ? '#tpl-subject' : '#tpl-body');
        var token = '{{' + v + '}}';
        var s = target.selectionStart, e = target.selectionEnd, txt = target.value;
        if (typeof s !== 'number') { target.value = txt + token; }
        else {
          target.value = txt.slice(0, s) + token + txt.slice(e);
          target.selectionStart = target.selectionEnd = s + token.length;
        }
        target.focus();
        dirty = true;
        paintPreview();
      }

      function switchTo(id) {
        if (id === cur) return;
        if (dirty) {
          U.confirmDialog({ title: 'Discard changes?', text: 'You have unsaved edits to this template.', ok: 'Discard', danger: true })
            .then(function (yes) { if (yes) { cur = id; paintList(); paintEditor(); } });
          return;
        }
        cur = id; paintList(); paintEditor();
      }

      U.on(view, 'click', '[data-tpl]', function (e, t) { switchTo(t.dataset.tpl); });

      U.on(editor, 'input', '#tpl-subject,#tpl-body', function (e, t) {
        dirty = true;
        t.closest('.field').classList.remove('has-err');
        paintPreview();
      });
      U.on(editor, 'focusin', '#tpl-subject,#tpl-body', function (e, t) { lastFocus = t.id === 'tpl-subject' ? 'subject' : 'body'; });
      U.on(editor, 'click', '[data-var]', function (e, t) { insertVar(t.dataset.var); });

      U.on(editor, 'click', '[data-save]', function () {
        if (!validate()) return U.toast('Please fix the highlighted fields.', 'error');
        if (!attempt(function () { saveTemplate(cur, { subject: editor.querySelector('#tpl-subject').value.trim(), body: editor.querySelector('#tpl-body').value }); })) return;
        dirty = false;
        U.$('[data-tpl-state]', editor).innerHTML = templateModified(cur) ? pill('info', 'Customised') : pill('muted', 'Default');
        markSaved(view);
        paintList();
        U.toast(templateDef(cur).label + ' template saved', 'success');
      });

      U.on(editor, 'click', '[data-reset]', function () {
        if (!templateModified(cur) && !dirty) return U.toast('This template is already the default.');
        U.confirmDialog({ title: 'Reset to default?', text: 'Your edits to the ' + templateDef(cur).label + ' template will be replaced with the original copy.', ok: 'Reset', danger: true })
          .then(function (yes) {
            if (!yes) return;
            if (!attempt(function () { resetTemplate(cur); })) return;
            paintList(); paintEditor();
            U.toast('Template reset to default', 'success');
          });
      });

      paintEditor();
    }
  });

  /* ==========================================================
     5. SETTINGS  -  #/admin/settings
     ========================================================== */
  var TOGGLES = [
    { id: 'allowSignups',  ico: 'i-a-userplus', label: 'Allow new signups',        sub: 'When off, Create account returns a friendly "signups closed" message.' },
    { id: 'requireVerify', ico: 'i-mail', label: 'Email verification unavailable', sub: 'Requires a connected authentication service.', unavailable: true },
    { id: 'maintenance',   ico: 'i-a-alert',    label: 'Maintenance mode',          sub: 'Blocks sign-in for everyone except admins. Existing sessions keep working.' },
    { id: 'socialLogin', ico: 'i-a-globe', label: 'Google sign-in unavailable', sub: 'Requires a connected Google sign-in provider.', unavailable: true }
  ];

  function toggleRow(t, on) {
    if (t.unavailable) on = false;
    return '<div class="adm-toggle">' +
      '<span class="listrow__ico">' + U.icon(t.ico) + '</span>' +
      '<span class="grow">' +
        '<span class="adm-toggle__t">' + U.esc(t.label) + '</span>' +
        '<span class="adm-toggle__s">' + U.esc(t.sub) + '</span>' +
      '</span>' +
      '<button type="button" class="switch' + (on ? ' is-on' : '') + '" role="switch" aria-checked="' + (on ? 'true' : 'false') + '" data-toggle="' + t.id + '" aria-label="' + U.esc(t.label) + '"' + (t.unavailable ? ' disabled' : '') + '></button>' +
    '</div>';
  }

  /* Export the whole store as JSON.
     A plain <a download> works when the app is served normally, but is inert
     inside the Artifact viewer's sandbox - there the host mediates saving
     through the downloads capability. Try that first, fall back to the link,
     and if neither can deliver a file, show the JSON so it can be copied. */
  function exportData() {
    var json = JSON.stringify(S.state, null, 2);
    var d = new Date();
    var name = 'aurafit-export-' + d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0') + '.json';

    function viaLink() {
      try {
        var blob = new Blob([json], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url; a.download = name;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
        U.toast('Export download started', 'success');
        return true;
      } catch (e) { return false; }
    }

    function viaClipboard() {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(json).then(function () {
          U.toast('Export copied to the clipboard', 'success');
        }, function () {
          U.toast('Could not export on this device.', 'error');
        });
      } else {
        U.toast('Could not export on this device.', 'error');
      }
    }

    if (w.claude && typeof w.claude.use === 'function') {
      w.claude.use('downloads').then(function (dl) {
        if (dl && dl.save) {
          dl.save({ filename: name, data: json }).then(function () {
            U.toast('Export saved', 'success');
          }, function () {
            if (!viaLink()) viaClipboard();
          });
        } else if (!viaLink()) {
          viaClipboard();
        }
      }, function () { if (!viaLink()) viaClipboard(); });
    } else if (!viaLink()) {
      viaClipboard();
    }

    return json.length;
  }

  Screens.adminSettings = guarded({
    shell: true,
    tab: 'account',
    topbar: topbar('App settings'),

    render: function () {
      var st = settings();
      var bytes = storageBytes();
      return '' +
      nav('adminSettings') +
      '<div class="sec"><div class="sec__head"><div class="sec__title">Sign-in setup</div></div>' +
        '<div class="card card--pad"><p class="t-sm">Signed in as <strong>' + U.esc(me().email) + '</strong>. Manage local accounts and passwords here.</p>' +
        '<div class="adm-actions"><button class="btn btn--ghost" data-go="#/admin/users">Manage login accounts</button>' +
        '<button class="btn btn--primary" data-own-password>Change my password</button></div>' +
        '<p class="adm-hint">Email and password sign-in works on this browser. Google sign-in, email verification and password recovery require a connected authentication backend; SMTP presets do not enable them.</p></div></div>' +

      '<div class="adm-two">' +
        '<div class="sec">' +
          '<div class="sec__head"><div class="sec__title">General</div></div>' +
          '<div class="card card--pad">' +
            '<form data-general novalidate>' +
              field({ id: 'set-appname', label: 'App name', val: st.appName, ph: 'Aura Fit', ico: 'i-hanger', hint: 'Used in email templates as {{app_name}}.' }) +
              field({ id: 'set-support', label: 'Support email', val: st.supportEmail, ph: 'support@aurafit.app', type: 'email', ico: 'i-mail', hint: 'Used in email templates as {{support_email}}.' }) +
              '<div class="adm-actions">' +
                '<button type="submit" class="btn btn--primary">' + U.icon('i-check', 'ico--sm') + '<span>Save changes</span></button>' +
              '</div>' +
            '</form>' +
          '</div>' +
        '</div>' +

        '<div class="sec">' +
          '<div class="sec__head"><div class="sec__title">Access</div><span class="sec__link">Saved instantly</span></div>' +
          '<div class="card">' + TOGGLES.map(function (t) { return toggleRow(t, !!st[t.id]); }).join('') + '</div>' +
        '</div>' +
      '</div>' +

      '<div class="sec">' +
        '<div class="sec__head"><div class="sec__title adm-danger__title">' + U.icon('i-a-alert') + 'Danger zone</div></div>' +
        '<div class="card adm-danger">' +
          '<div class="adm-danger__row">' +
            '<span class="grow">' +
              '<span class="adm-danger__t">Export all data</span>' +
              '<span class="adm-danger__s">Download everything Aura Fit keeps in this browser (' + fmtBytes(bytes) + ') as a JSON file - accounts, wardrobe, outfits and settings. Includes local passwords; keep the file private.</span>' +
            '</span>' +
            '<button class="btn btn--ghost btn--sm" data-export>' + U.icon('i-a-download', 'ico--sm') + '<span>Export JSON</span></button>' +
          '</div>' +
          '<div class="adm-danger__row">' +
            '<span class="grow">' +
              '<span class="adm-danger__t">Reset all app data</span>' +
              '<span class="adm-danger__s">Deletes every account, wardrobe item, outfit and setting on this device and signs you out. There is no undo.</span>' +
            '</span>' +
            '<button class="btn btn--danger btn--sm" data-reset-all>' + U.icon('i-trash', 'ico--sm') + '<span>Reset everything</span></button>' +
          '</div>' +
        '</div>' +
      '</div>';
    },

    mount: function (view) {
      U.$('[data-general]', view).addEventListener('submit', function (e) {
        e.preventDefault();
        clearErrs(view);
        var name = val(view, 'set-appname'), sup = val(view, 'set-support').toLowerCase();
        var errs = {};
        if (name.length < 2) errs['set-appname'] = 'App name must be at least 2 characters.';
        else if (name.length > 40) errs['set-appname'] = 'Keep the app name under 40 characters.';
        if (!sup) errs['set-support'] = 'Support email is required.';
        else if (!validEmail(sup)) errs['set-support'] = 'Enter a valid email address.';
        if (!applyErrs(view, errs)) return U.toast('Please fix the highlighted fields.', 'error');
        if (!attempt(function () { saveSettings({ appName: name, supportEmail: sup }); })) return;
        markSaved(view);
        U.toast('Settings saved', 'success');
      });
      U.on(view, 'input', '.input', function (e, t) { t.closest('.field').classList.remove('has-err'); });
      U.on(view, 'click', '[data-own-password]', function () { openPassword(me().email); });

      U.on(view, 'click', '[data-toggle]', function (e, t) {
        var id = t.dataset.toggle, on = !t.classList.contains('is-on');
        var patch = {}; patch[id] = on;
        if (!attempt(function () { saveSettings(patch); })) return;
        t.classList.toggle('is-on', on);
        t.setAttribute('aria-checked', on ? 'true' : 'false');
        var label = null;
        TOGGLES.forEach(function (x) { if (x.id === id) label = x.label; });
        U.toast(label + (on ? ' enabled' : ' disabled'), 'success');
      });

      U.on(view, 'click', '[data-export]', function () {
        try {
          exportData();
        } catch (err) {
          U.toast('Export failed in this browser.', 'error');
        }
      });

      U.on(view, 'click', '[data-reset-all]', function () {
        U.confirmDialog({
          title: 'Reset all app data?',
          text: 'Every account, wardrobe item, outfit, saved product and setting on this device will be deleted. You will be signed out. This cannot be undone.',
          ok: 'Delete everything', danger: true
        }).then(function (yes) {
          if (!yes) return;
          var theme = S.state.theme;
          if (!attempt(function () { S.resetAll(); })) return;
          attempt(function () { S.state.theme = theme; S.save(); });
          U.toast('All app data has been reset', 'success');
          w.Router.go('#/login');
        });
      });
    }
  });

  /* ==========================================================
     EXPORT
     ========================================================== */
  w.Admin = {
    isAdmin: isAdmin,
    isAdminEmail: isAdminEmail,
    store: store,
    nav: nav
  };

  if (document.body) injectIcons();
  else document.addEventListener('DOMContentLoaded', injectIcons);
})(window);
