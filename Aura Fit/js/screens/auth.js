/* ==========================================================
   SCREENS - AUTHENTICATION FLOW
   Start · Sign In · Create Account · Forgot Password ·
   Check Your Email · Reset Password · Password Updated ·
   Welcome.
   Layout and geometry follow the reference kit exactly.
   ========================================================== */
(function (w) {
  'use strict';
  var U = w.UI, S = w.Store;
  var Screens = w.Screens = w.Screens || {};

  /* flow state that must survive a screen change */
  var flow = { email: '', token: '', name: '' };

  /* timers owned by a screen, cleared on unmount */
  var timers = [];
  function later(fn, delay) { return own(setTimeout(fn, delay)); }
  function own(id) { timers.push(id); return id; }
  function clearTimers() {
    timers.forEach(function (t) { clearInterval(t); clearTimeout(t); });
    timers = [];
  }

  /* ---------------- shared chrome ---------------- */

  function topbar(opts) {
    opts = opts || {};
    var left = opts.back === false
      ? '<span class="a-top__spacer"></span>'
      : '<button class="iconbtn" data-nav="' + (opts.backTo || 'back') + '" aria-label="Go back">' + U.icon('i-left') + '</button>';
    var right = opts.skip
      ? '<button class="a-skip" data-nav="' + opts.skip + '">Skip</button>'
      : '<span class="a-top__spacer"></span>';
    return '<div class="a-top">' + left + right + '</div>';
  }

  function brand() {
    return '<p class="t-sm t-dim" role="note">Local demo only. Use a test password; accounts are stored on this device and are not secure authentication.</p><div class="a-brand">' +
      '<div class="a-brand__mark">' + U.icon('i-hanger') + '</div>' +
      '<div class="a-brand__name">Aura <em>Fit</em></div>' +
    '</div>';
  }

  function head(t, s) {
    return '<div class="a-head">' +
      '<h1 class="a-head__t">' + U.esc(t) + '</h1>' +
      (s ? '<p class="a-head__s">' + s + '</p>' : '') +
    '</div>';
  }

  function field(o) {
    return '<label class="a-field" data-field="' + o.id + '">' +
      '<span class="a-field__box">' +
        '<span class="a-field__ico">' + U.icon(o.icon) + '</span>' +
        '<input id="' + o.id + '" type="' + (o.type || 'text') + '" ' +
          'placeholder="' + U.esc(o.placeholder) + '" ' +
          'autocomplete="' + (o.autocomplete || 'off') + '" ' +
          (o.value ? 'value="' + U.esc(o.value) + '" ' : '') +
          'aria-describedby="' + o.id + '-error" aria-label="' + U.esc(o.placeholder) + '">' +
        (o.type === 'password'
          ? '<button type="button" class="a-field__eye" data-peek="' + o.id + '" aria-label="Show password">' + U.icon('i-eye') + '</button>'
          : '') +
      '</span>' +
      '<span class="a-field__err" id="' + o.id + '-error" aria-live="polite"></span>' +
    '</label>';
  }

  /* Google only - Apple intentionally omitted */
  function socialBlock(label) {
    return '<div class="a-div">' + U.esc(label) + '</div>' +
      '<button type="button" class="a-social" disabled>' +
        '<span class="a-social__ico">' + w.Ill.googleLogo() + '</span>' +
        '<span>Google sign-in unavailable in demo</span>' +
      '</button>';
  }

  function screen(inner, opts) {
    opts = opts || {};
    return '<div class="a-screen">' +
      (opts.aside === false ? '' : aside(opts)) +
      '<div class="a-wrap">' + inner + '</div>' +
    '</div>';
  }

  /* desktop-only left panel */
  function aside(opts) {
    return '<div class="a-aside only-desktop">' +
      w.Ill.wardrobeHero() +
      '<div class="a-aside__scrim"></div>' +
      '<div class="a-aside__copy">' +
        '<div class="a-aside__t">' + (opts.asideTitle || 'Your wardrobe, <em>styled by AI</em>.') + '</div>' +
        '<div class="a-aside__s">' + U.esc(opts.asideText || 'Organise what you own, discover what pairs with it, and never stare at a full wardrobe with nothing to wear again.') + '</div>' +
      '</div>' +
    '</div>';
  }

  /* ---------------- validation ---------------- */
  function setErr(root, id, msg) {
    var f = root.querySelector('[data-field="' + id + '"]');
    if (!f) return;
    f.classList.toggle('has-err', !!msg);
    f.querySelector('.a-field__err').textContent = msg || '';
    var input = f.querySelector('input');
    if (input) input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (msg) {
      var i = f.querySelector('input');
      if (i) i.focus();
    }
  }
  function clearErrs(root) {
    U.$$('.a-field', root).forEach(function (f) {
      f.classList.remove('has-err');
      var e = f.querySelector('.a-field__err');
      if (e) e.textContent = '';
      var input = f.querySelector('input');
      if (input) input.removeAttribute('aria-invalid');
    });
  }
  function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); }
  function val(root, id) {
    var i = root.querySelector('#' + id);
    return i ? i.value.trim() : '';
  }

  /* ---------------- shared wiring ---------------- */
  function wire(root) {
    U.on(root, 'input', '.a-field input', function (e, input) {
      setErr(root, input.id, '');
    });
    root.addEventListener('submit', function (e) {
      if (e.target.querySelector('.a-btn.is-busy')) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    }, true);
    /* password visibility */
    U.on(root, 'click', '[data-peek]', function (e, t) {
      e.preventDefault();
      var inp = root.querySelector('#' + t.dataset.peek);
      if (!inp) return;
      var show = inp.type === 'password';
      inp.type = show ? 'text' : 'password';
      t.innerHTML = U.icon(show ? 'i-eye-off' : 'i-eye');
      t.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    });

    /* nav */
    U.on(root, 'click', '[data-nav]', function (e, t) {
      e.preventDefault();
      var to = t.dataset.nav;
      if (to === 'back') {
        if (history.length > 1) history.back(); else w.Router.go('#/start');
      } else w.Router.go(to);
    });

    /* Continue with Google */
    U.on(root, 'click', '[data-google]', function (e, t) {
      e.preventDefault();
      if (t.classList.contains('is-busy')) return;
      t.classList.add('is-busy');
      var original = t.innerHTML;
      t.innerHTML = '<span class="spinner"></span><span style="margin-left:10px">Connecting…</span>';
      later(function () {
        var r = S.socialLogin('google');
        t.innerHTML = original;
        t.classList.remove('is-busy');
        if (!r.ok) { U.toast(r.error, 'error'); return; }
        U.toast('Signed in with Google', 'success');
        w.Router.go(S.user().onboarded ? '#/home' : '#/onboarding');
      }, 900);
    });
  }

  function busy(btn, label) {
    btn.disabled = true;
    btn.setAttribute('aria-busy', 'true');
    btn.classList.add('is-busy');
    btn.dataset.label = btn.innerHTML;
    btn.innerHTML = '<span class="spinner"></span><span style="margin-left:10px">' + U.esc(label) + '</span>';
  }
  function unbusy(btn) {
    btn.disabled = false;
    btn.removeAttribute('aria-busy');
    btn.classList.remove('is-busy');
    if (btn.dataset.label) btn.innerHTML = btn.dataset.label;
  }
  function authAttempt(fn) {
    try { return fn(); }
    catch (error) { return { ok: false, error: error.message || 'Unable to save. Please try again.' }; }
  }

  /* ==========================================================
     1. START
     ========================================================== */
  var SLIDES = [
    { tag: 'Organize. Style. Be You.', sub: 'Your personal wardrobe, smarter outfit ideas, every day.' },
    { tag: 'Everything you own, in one place.', sub: 'Photograph a piece once and Aura Fit remembers the colour, cut and occasion.' },
    { tag: 'Never wonder what pairs with what.', sub: 'Find Similar shops the look. Find Pair completes it from your own wardrobe.' }
  ];

  Screens.start = {
    shell: false,
    render: function () {
      return '<div class="a-start">' +
        '<div class="a-start__media">' +
          w.Ill.wardrobeHero() +
          '<div class="a-start__fade"></div>' +
        '</div>' +
        '<div class="a-start__body">' +
          '<div class="a-start__mark">' + U.icon('i-hanger') + '</div>' +
          '<h1 class="a-start__name">Aura <em>Fit</em></h1>' +
          '<p class="a-start__tag" data-tag>' + U.esc(SLIDES[0].tag) + '</p>' +
          '<p class="a-start__sub" data-sub>' + U.esc(SLIDES[0].sub) + '</p>' +
          '<div class="a-start__dots" data-dots>' + SLIDES.map(function (_, i) {
            return '<i class="' + (i === 0 ? 'is-on' : '') + '" data-dot="' + i + '" role="button" tabindex="0" aria-label="Show introduction ' + (i + 1) + ' of ' + SLIDES.length + '" aria-pressed="' + (i === 0 ? 'true' : 'false') + '"></i>';
          }).join('') + '</div>' +
          '<div class="a-start__cta">' +
            '<button class="a-btn" data-nav="#/signup">Get Started ' + U.icon('i-arrow-right') + '</button>' +
            '<p class="a-foot">Already have an account?<button data-nav="#/login">Sign In</button></p>' +
          '</div>' +
        '</div>' +
      '</div>';
    },
    mount: function (root) {
      wire(root);
      var i = 0;
      var tag = root.querySelector('[data-tag]');
      var sub = root.querySelector('[data-sub]');
      var dots = U.$$('[data-dot]', root);

      function show(n) {
        i = (n + SLIDES.length) % SLIDES.length;
        tag.textContent = SLIDES[i].tag;
        sub.textContent = SLIDES[i].sub;
        tag.style.animation = 'none'; sub.style.animation = 'none';
        void tag.offsetWidth;
        tag.style.animation = sub.style.animation = 'fadeUp 380ms var(--ease-out) both';
        dots.forEach(function (d, k) {
          d.classList.toggle('is-on', k === i);
          d.setAttribute('aria-pressed', k === i ? 'true' : 'false');
        });
      }
      dots.forEach(function (d) {
        d.addEventListener('click', function () { show(+d.dataset.dot); });
        d.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(+d.dataset.dot); }
        });
      });
    },
    unmount: clearTimers
  };

  /* ==========================================================
     2. SIGN IN
     ========================================================== */
  Screens.login = {
    shell: false,
    render: function () {
      return screen(
        topbar({ backTo: '#/start', skip: '#/start' }) +
        brand() +
        head('Welcome Back!', 'Sign in to continue your style journey.') +
        '<form class="a-form" novalidate>' +
          field({ id: 'email', icon: 'i-user', type: 'email', placeholder: 'Email address', autocomplete: 'email', value: flow.email }) +
          field({ id: 'pass', icon: 'i-lock', type: 'password', placeholder: 'Password', autocomplete: 'current-password' }) +
          '<div class="a-row" style="justify-content:flex-end;margin-top:-2px">' +
            '<button type="button" class="a-link" data-nav="#/forgot">Forgot Password?</button>' +
          '</div>' +
          '<p class="t-xs t-dim">Your demo session stays signed in on this browser until you sign out.</p>' +
          '<button class="a-btn" type="submit">Sign In</button>' +
        '</form>' +
        socialBlock('or continue with') +
        '<div class="a-grow"></div>' +
        '<p class="a-foot">Don\'t have an account?<button data-nav="#/signup">Create Account</button></p>',
        { asideTitle: 'Welcome <em>back</em>.', asideText: 'Your wardrobe, your outfits and your saved looks are exactly where you left them.' }
      );
    },
    mount: function (root) {
      wire(root);
      var form = root.querySelector('form');
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        clearErrs(root);
        var email = val(root, 'email'), pass = root.querySelector('#pass').value;

        if (!email) return setErr(root, 'email', 'Please enter your email address.');
        if (!validEmail(email)) return setErr(root, 'email', 'That does not look like a valid email address.');
        if (!pass) return setErr(root, 'pass', 'Please enter your password.');

        var btn = form.querySelector('.a-btn');
        busy(btn, 'Signing in…');
        later(function () {
          var r = authAttempt(function () { return S.login(email, pass); });
          unbusy(btn);
          if (!r.ok) {
            setErr(root, /email/i.test(r.error) ? 'email' : 'pass', r.error);
            return;
          }
          flow.email = '';
          U.toast('Welcome back!', 'success');
          w.Router.go(S.user().onboarded ? '#/home' : '#/onboarding');
        }, 550);
      });
    }
  };

  /* ==========================================================
     3. CREATE ACCOUNT
     ========================================================== */
  Screens.signup = {
    shell: false,
    render: function () {
      return screen(
        topbar({ backTo: '#/start' }) +
        brand() +
        head('Create Account', 'Join now and start organizing your style.') +
        '<form class="a-form" novalidate>' +
          field({ id: 'name', icon: 'i-user', placeholder: 'Full Name', autocomplete: 'name' }) +
          field({ id: 'email', icon: 'i-mail', type: 'email', placeholder: 'Email address', autocomplete: 'email' }) +
          field({ id: 'pass', icon: 'i-lock', type: 'password', placeholder: 'Password', autocomplete: 'new-password' }) +
          field({ id: 'pass2', icon: 'i-lock', type: 'password', placeholder: 'Confirm Password', autocomplete: 'new-password' }) +
          '<label class="a-check" data-field="terms" style="align-items:flex-start;margin:4px 0 6px">' +
            '<input type="checkbox" id="terms" aria-describedby="terms-error">' +
            '<span class="a-check__box">' + U.icon('i-check') + '</span>' +
            '<span>I agree to the <a href="#/signup" data-terms>Terms &amp; Conditions</a> and <a href="#/signup" data-privacy>Privacy Policy</a></span>' +
          '</label>' +
          '<span class="a-field__err" id="terms-error" data-terms-err aria-live="polite"></span>' +
          '<button class="a-btn" type="submit">Create Account</button>' +
        '</form>' +
        socialBlock('or sign up with') +
        '<div class="a-grow"></div>' +
        '<p class="a-foot">Already have an account?<button data-nav="#/login">Sign In</button></p>',
        { asideTitle: 'Start your <em>style profile</em>.', asideText: 'Tell us what you like once, and every suggestion afterwards is tuned to you.' }
      );
    },
    mount: function (root) {
      wire(root);

      U.on(root, 'click', '[data-terms],[data-privacy]', function (e, t) {
        e.preventDefault();
        e.stopPropagation();
        var isTerms = t.hasAttribute('data-terms');
        U.confirmDialog({
          title: isTerms ? 'Terms & Conditions' : 'Privacy Policy',
          text: isTerms
            ? 'Aura Fit is provided as-is for personal wardrobe management. You are responsible for the images and information you add. Product suggestions link to third-party retailers whose own terms apply.'
            : 'Your wardrobe, photos, preferences and account details are stored locally in this browser. Nothing is uploaded to a server, and no data is shared with third parties. Clearing your browser data removes everything.',
          ok: 'Close', cancel: 'Back'
        });
      });

      var form = root.querySelector('form');
      var termsErr = root.querySelector('[data-terms-err]');
      root.querySelector('#terms').addEventListener('change', function (e) {
        termsErr.style.display = 'none';
        e.target.removeAttribute('aria-invalid');
      });

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        clearErrs(root);
        termsErr.style.display = 'none';

        var name = val(root, 'name'), email = val(root, 'email');
        var p1 = root.querySelector('#pass').value, p2 = root.querySelector('#pass2').value;

        if (name.length < 2) return setErr(root, 'name', 'Please enter your full name.');
        if (!validEmail(email)) return setErr(root, 'email', 'Enter a valid email address.');
        if (p1.length < 8) return setErr(root, 'pass', 'Password must be at least 8 characters.');
        if (p1 !== p2) return setErr(root, 'pass2', 'Passwords do not match.');
        if (!root.querySelector('#terms').checked) {
          termsErr.textContent = 'Please accept the Terms & Conditions to continue.';
          termsErr.style.display = 'block';
          root.querySelector('#terms').setAttribute('aria-invalid', 'true');
          root.querySelector('#terms').focus();
          return;
        }

        var btn = form.querySelector('.a-btn');
        busy(btn, 'Creating account…');
        later(function () {
          var r = authAttempt(function () { return S.register(name, email, p1); });
          unbusy(btn);
          if (!r.ok) return setErr(root, 'email', r.error);
          flow.name = name;
          w.Router.go('#/gender');
        }, 650);
      });
    }
  };

  /* ==========================================================
     4. FORGOT PASSWORD
     ========================================================== */
  Screens.forgot = {
    shell: false,
    render: function () {
      return screen(
        topbar({ backTo: '#/login' }) +
        brand() +
        head('Forgot Password?', 'Email recovery is unavailable in this local demo. No reset email will be sent.') +
        '<form class="a-form" novalidate>' +
          field({ id: 'email', icon: 'i-mail', type: 'email', placeholder: 'Email address', autocomplete: 'email', value: flow.email }) +
          '<button class="a-btn" type="submit" disabled>Email recovery unavailable</button>' +
        '</form>' +
        '<div class="a-ill">' + w.Ill.envelopeSend() + '</div>' +
        '<div class="a-grow"></div>' +
        '<p class="a-foot">Remember your password?<button data-nav="#/login">Sign In</button></p>',
        { asideTitle: 'We\'ll get you <em>back in</em>.', asideText: 'This demo cannot send email or verify account ownership.' }
      );
    },
    mount: function (root) {
      wire(root);
      var form = root.querySelector('form');
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        clearErrs(root);
        U.toast('Email recovery is unavailable in this local demo.', 'error');
      });
    }
  };

  /* ==========================================================
     5. CHECK YOUR EMAIL
     ========================================================== */
  Screens.checkEmail = {
    shell: false,
    render: function () {
      if (!flow.email) { later(function () { w.Router.go('#/forgot'); }, 0); return '<div class="a-screen"></div>'; }
      return screen(
        topbar({ backTo: '#/forgot' }) +
        '<div class="a-ill a-ill--tight">' + w.Ill.envelopeCheck() + '</div>' +
        head('Check Your Email', 'We\'ve sent a password reset link to your email address.') +
        '<div class="a-mailbox">' +
          U.icon('i-mail') +
          '<span class="a-mailbox__val">' + U.esc(flow.email) + '</span>' +
          '<button class="a-mailbox__edit" data-nav="#/forgot">Edit</button>' +
        '</div>' +
        '<div class="a-resend">' +
          'Didn\'t receive the email?<br>' +
          '<button class="a-resend__btn" data-resend>' + U.icon('i-refresh') + 'Resend Email</button>' +
        '</div>' +
        '<button class="a-btn" data-nav="#/reset" style="background:var(--surface);color:var(--text);border-color:var(--border);box-shadow:none">' +
          U.icon('i-link') + 'Open reset link' +
        '</button>' +
        '<p class="t-xs t-faint t-center" style="margin-top:12px">' +
          'This build has no mail server, so the link opens directly.' +
        '</p>' +
        '<div class="a-grow"></div>' +
        '<button class="a-btn" data-nav="#/login">Back to Login</button>',
        { asideTitle: 'Check your <em>inbox</em>.', asideText: 'The link is valid for one use. If it expires, request a fresh one from the forgot-password screen.' }
      );
    },
    mount: function (root) {
      wire(root);
      var btn = root.querySelector('[data-resend]');
      if (!btn) return;
      btn.addEventListener('click', function () {
        btn.disabled = true;
        var n = 30;
        var label = btn.innerHTML;
        function tick() {
          if (!btn.isConnected) return;              // navigated away
          btn.innerHTML = U.icon('i-refresh') + 'Resend in ' + n + 's';
          if (n-- <= 0) { btn.disabled = false; btn.innerHTML = label; return; }
          own(setTimeout(tick, 1000));
        }
        U.toast('Reset email sent again', 'success');
        tick();
      });
    },
    unmount: clearTimers
  };

  /* ==========================================================
     6. RESET PASSWORD
     ========================================================== */
  var RULES = [
    { id: 'len',   label: 'At least 8 characters',  test: function (v) { return v.length >= 8; } },
    { id: 'upper', label: 'One uppercase letter',   test: function (v) { return /[A-Z]/.test(v); } },
    { id: 'num',   label: 'One number',             test: function (v) { return /[0-9]/.test(v); } },
    { id: 'sym',   label: 'One special character',  test: function (v) { return /[^A-Za-z0-9]/.test(v); } }
  ];

  Screens.reset = {
    shell: false,
    render: function () {
      if (!flow.email) { later(function () { w.Router.go('#/forgot'); }, 0); return '<div class="a-screen"></div>'; }
      return screen(
        topbar({ backTo: '#/check-email' }) +
        '<div class="a-ill a-ill--tight">' + w.Ill.circleBadge('i-lock') + '</div>' +
        head('Reset Your Password', 'Enter your new password below.') +
        '<form class="a-form" novalidate>' +
          field({ id: 'pass', icon: 'i-lock', type: 'password', placeholder: 'New Password', autocomplete: 'new-password' }) +
          field({ id: 'pass2', icon: 'i-lock', type: 'password', placeholder: 'Confirm New Password', autocomplete: 'new-password' }) +
          '<div class="a-strength" data-strength>' +
            '<i></i><i></i><i></i><i></i>' +
          '</div>' +
          '<div class="a-rules" data-rules>' + RULES.map(function (r) {
            return '<div class="a-rule" data-rule="' + r.id + '">' +
              '<span class="a-rule__dot">' + U.icon('i-check') + '</span>' +
              '<span>' + U.esc(r.label) + '</span>' +
            '</div>';
          }).join('') + '</div>' +
          '<button class="a-btn" type="submit" style="margin-top:8px">Update Password</button>' +
        '</form>' +
        '<div class="a-grow"></div>',
        { asideTitle: 'Choose something <em>strong</em>.', asideText: 'A long passphrase beats a short complicated one. Aim for four unrelated words plus a number.' }
      );
    },
    mount: function (root) {
      wire(root);
      var input = root.querySelector('#pass');
      var meter = root.querySelector('[data-strength]');
      /* render() bails to #/forgot when there is no reset in progress */
      if (!input || !meter) return;

      function evaluate() {
        var v = input.value, passed = 0;
        RULES.forEach(function (r) {
          var ok = r.test(v);
          if (ok) passed++;
          var el = root.querySelector('[data-rule="' + r.id + '"]');
          if (el) el.classList.toggle('is-ok', ok);
        });
        U.$$('i', meter).forEach(function (bar, i) { bar.classList.toggle('is-on', i < passed); });
        meter.classList.toggle('is-weak', passed > 0 && passed <= 2);
        meter.classList.toggle('is-strong', passed === 4);
        return passed;
      }
      input.addEventListener('input', evaluate);
      evaluate();

      root.querySelector('form').addEventListener('submit', function (e) {
        e.preventDefault();
        clearErrs(root);
        var p1 = input.value, p2 = root.querySelector('#pass2').value;

        if (evaluate() < 4) return setErr(root, 'pass', 'Your password does not meet all four requirements yet.');
        if (p1 !== p2) return setErr(root, 'pass2', 'Passwords do not match.');

        var btn = root.querySelector('.a-btn');
        busy(btn, 'Updating…');
        later(function () {
          var r = S.resetPassword(flow.email, p1);
          unbusy(btn);
          if (!r.ok) return setErr(root, 'pass', r.error);
          flow.token = '';
          w.Router.go('#/password-updated');
        }, 650);
      });
    }
  };

  /* ==========================================================
     7. PASSWORD UPDATED
     ========================================================== */
  Screens.passwordUpdated = {
    shell: false,
    render: function () {
      return screen(
        topbar({ backTo: '#/login' }) +
        '<div class="a-grow"></div>' +
        '<div class="a-ill">' + w.Ill.successCheck() + '</div>' +
        head('Password recovery unavailable', 'This local demo cannot reset your password by email. Return to sign in with your existing test credentials.') +
        '<div class="a-grow"></div>' +
        '<button class="a-btn" data-nav="#/login">Go to Login</button>',
        { asideTitle: 'Your local <em>demo</em>.', asideText: 'Email recovery requires a connected authentication service.' }
      );
    },
    mount: function (root) {
      wire(root);
      flow.email = '';
    }
  };

  /* ==========================================================
     8. WELCOME (after sign-up)
     ========================================================== */
  var FEATURES = [
    'Organize your wardrobe',
    'Get outfit ideas',
    'Save your favorite looks',
    'Stay stylish every day'
  ];

  Screens.gender = {
    shell: false,
    render: function (params) {
      var selected = S.user().gender;
      var editing = params && params.edit === '1' && ['male', 'female'].indexOf(selected) >= 0;
      return screen(
        topbar({ back: !!editing, backTo: '#/account' }) +
        '<div class="a-grow"></div>' +
        '<div class="a-brand"><div class="a-brand__mark">' + U.icon('i-hanger') + '</div><div class="a-brand__name">Aura <em>Fit</em></div></div>' +
        '<div class="a-head"><h1 class="a-head__t" id="gender-title">A little about you</h1>' +
          '<p class="a-head__s">Select your gender to complete your profile.</p></div>' +
        '<div class="a-gender" role="group" aria-labelledby="gender-title">' +
          ['male', 'female'].map(function (value) {
            var on = selected === value;
            return '<button type="button" class="a-gender__option" data-gender="' + value + '" aria-pressed="' + on + '">' +
              '<span class="a-gender__check" aria-hidden="true">' + U.icon('i-check') + '</span>' +
              '<span class="a-gender__symbol" aria-hidden="true">' + (value === 'male' ? '♂' : '♀') + '</span>' +
              '<span>' + (value === 'male' ? 'Male' : 'Female') + '</span></button>';
          }).join('') + '</div>' +
        '<button type="button" class="a-btn" data-gender-next' + (['male', 'female'].indexOf(selected) < 0 ? ' disabled' : '') + '>Continue ' + U.icon('i-arrow-right') + '</button>' +
        '<div class="a-grow"></div>',
        { asideTitle: 'Your wardrobe.<br>Your <em>way</em>.', asideText: 'A few details to make your Aura Fit profile feel like you.' }
      );
    },
    mount: function (root, params) {
      wire(root);
      var selected = S.user().gender;
      var next = root.querySelector('[data-gender-next]');
      U.on(root, 'click', '[data-gender]', function (e, button) {
        selected = button.dataset.gender;
        U.$$('[data-gender]', root).forEach(function (option) {
          option.setAttribute('aria-pressed', String(option.dataset.gender === selected));
        });
        next.disabled = false;
      });
      next.onclick = function () {
        if (['male', 'female'].indexOf(selected) < 0) return;
        try { S.updateUser({ gender: selected }); }
        catch (e) { U.toast('Your choice could not be saved. Please try again.', 'error'); return; }
        w.Router.go(params && params.edit === '1' && S.user().onboarded ? '#/account' : S.user().onboarded ? '#/home' : '#/welcome');
      };
    }
  };

  Screens.welcome = {
    shell: false,
    render: function () {
      var u = S.user();
      return screen(
        topbar({ back: false }) +
        '<div class="a-grow"></div>' +
        '<div class="a-ill a-ill--tight">' + w.Ill.welcomeBadge() + '</div>' +
        '<div class="a-head">' +
          '<h1 class="a-head__t">Welcome to<br>Aura Fit' + (u ? ', ' + U.esc(String(u.name).split(' ')[0]) : '') + '!</h1>' +
          '<p class="a-head__s">Your account has been created successfully.</p>' +
        '</div>' +
        '<div class="a-feats">' + FEATURES.map(function (f) {
          return '<div class="a-feat">' +
            '<span class="a-feat__tick">' + U.icon('i-check') + '</span>' +
            '<span>' + U.esc(f) + '</span>' +
          '</div>';
        }).join('') + '</div>' +
        '<div class="a-grow"></div>' +
        '<button class="a-btn" data-nav="#/onboarding">Explore App ' + U.icon('i-arrow-right') + '</button>',
        { asideTitle: 'You\'re <em>in</em>.', asideText: 'Next we will ask four quick questions so your suggestions start out useful rather than generic.' }
      );
    },
    mount: function (root) { wire(root); }
  };

  ['login', 'signup', 'forgot', 'checkEmail', 'reset', 'passwordUpdated', 'welcome'].forEach(function (name) {
    Screens[name].unmount = clearTimers;
  });
})(window);
