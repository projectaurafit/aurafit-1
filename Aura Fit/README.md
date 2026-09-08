# Aura Fit

**Current local release: v1.1, 7 September 2026.** Start with [START-HERE.md](START-HERE.md) for both panels, credentials and admin login setup. See [FINAL-QA.md](FINAL-QA.md) for the latest verification; older reports below document earlier versions.

AI personal wardrobe & outfit assistant. **HTML + CSS + vanilla JavaScript on Bootstrap 5.3**,
installable as a PWA. No backend.

**Demo only:** Local sign-in is not a security boundary. Passwords and account
records remain in browser storage; use test credentials only. Google sign-in and
email password recovery are disabled. A production release needs a backend or
authentication provider with password hashing, server-enforced permissions and
verified, expiring reset tokens. Do not enter real SMTP credentials in this demo.

Wardrobes, outfits, favourites, saved products and plans are now grouped by
account. On migration, legacy shared data is assigned to the last signed-in
account. If no account was signed in, it is preserved as `legacyLibrary` in the
stored document/admin JSON export for manual recovery, rather than assigned to a
new account. This separation prevents accidental sharing through the UI; it
does not protect data from someone who can inspect this browser's storage.

Failed saves show an error and roll back the in-memory change. An older tab must
reload before saving after another tab changes the stored document; copy any
unsaved form input first. This is optimistic conflict detection over localStorage,
not an atomic multi-writer transaction. Truly simultaneous writes and large photo
libraries should be handled by a future IndexedDB/backend storage layer.

**Stack:** Bootstrap 5.3.3 supplies the Reboot base, grid, utilities and JS plugins.
The Aura Fit design system (`css/tokens.css` + the component layer) is the theme on top.

## Reviewed local version

The September 2026 UI/UX and flow review is recorded in [QA-REPORT.md](QA-REPORT.md).
Use the local files below to review these changes; previously published copies may be older.

| Panel | URL | Entry file |
|---|---|---|
| **User app** | http://127.0.0.1:8124/index.html | `index.html` |
| **Admin console** | http://127.0.0.1:8124/admin.html | `admin.html` |

The two panels are separate surfaces with separate URLs. They share the design tokens,
the store and the icon sprite, but each has its own shell, navigation and sign-in.

---

## Run it

Double-click `index.html`, or serve the folder (recommended, so the browser treats it as an origin):

```bash
python -m http.server 8124
# then open http://127.0.0.1:8124
```

Both panels are served from the same folder:

- user app  -> `http://127.0.0.1:8123/index.html`
- console   -> `http://127.0.0.1:8123/admin.html`

## Sign-in credentials

The two accounts below are provisioned automatically on first load, so they work
immediately in any browser. They are seeded in `js/store.js` (`ACCOUNTS`) — change them
there.

### User app — `index.html`
```
Email     user@aurafit.app
Password  User@123
```

### Admin console — `admin.html`
```
Email     admin@aurafit.app
Password  Admin@123
```

The console accepts **admin-role accounts only**; signing in there with the user account is
refused. New sign-ups through the app are always created as ordinary users — administrator
access is provisioned, never inferred.

The user app contains no link to the console and no notification button; the two panels are
entirely separate surfaces.

---

## Screens

### Authentication (matches `Design/start screen .jpeg`)
| Route | Screen |
|---|---|
| `#/start` | Onboarding hero + Get Started |
| `#/login` | Local demo sign-in — email and password; Google sign-in disabled |
| `#/signup` | Create Account — name, email, password, confirm, terms |
| `#/forgot` | Notice that email recovery is unavailable in the demo |
| `#/check-email`, `#/reset` | Legacy recovery routes; no usable recovery flow |
| `#/password-updated` | Legacy screen; not reached through password recovery |
| `#/welcome` | Welcome + feature list |
| `#/gender` | Male / Female profile selection after sign-up or sign-in; saved per account |

### App (matches `Design/WhatsApp Image *.jpeg`)
| Route | Screen |
|---|---|
| `#/onboarding` | One-time style preferences (4 steps) |
| `#/home` | Dashboard — greeting, calendar strip, outfit of the day, stats, ideas rail |
| `#/wardrobe` | Clothes + saved outfits |
| `#/item/:id` | Item detail → **Find Similar** / **Find Pair** |
| `#/add` | Add item, or build a complete outfit |
| `#/outfit/:id` | Outfit details |
| `#/ideas` | AI Ideas + AI Stylist |
| `#/account` | Profile, theme, preferences, wishlist |
| `#/stats` | Wardrobe stats |

### Admin (role-gated)
| Route | Screen |
|---|---|
| `#/admin` | Dashboard — user counts, system health |
| `#/admin/users` | User management — search, filter, role, suspend, reset, delete |
| `#/admin/smtp` | SMTP configuration + provider presets + test connection |
| `#/admin/emails` | Email templates with `{{variable}}` preview |
| `#/admin/settings` | App settings, signup/verification toggles, data export |

---

## Project layout

```
index.html            user app entry
admin.html            admin console entry (separate URL)
manifest.webmanifest  PWA manifest (name, icons, shortcuts)
sw.js                 service worker — offline app shell
icons/                generated PWA + favicon PNGs
vendor/
  bootstrap.min.css        Bootstrap 5.3.3
  bootstrap.bundle.min.js  Bootstrap JS plugins
css/
  tokens.css          design tokens — light + dark palettes (edit colours HERE only)
  base.css            reset, typography, utilities, animation
  components.css      buttons, chips, cards, inputs, bottom sheet, modals, toasts
  layout.css          app shell + responsive breakpoints
  screens.css         per-screen composition
  auth.css            authentication flow
  admin.css           admin panel
  bootstrap-interop.css  MUST load last — see "Bootstrap" below
js/
  sprite.js           the icon sprite, shared by both entry points
  garments.js         procedural SVG garment renderer (all product artwork)
  illustrations.js    SVG heroes and badges for the auth flow
  data.js             catalogue, taxonomy, starter wardrobe & outfits
  store.js            state + localStorage + auth
  ui.js               DOM helpers, toasts, modals, bottom-sheet controller
  recommend.js        scoring engine, Find Similar / Find Pair, AI stylist
  pwa.js              service-worker registration + install prompt
  screens/*.js        one module per screen
  router.js           hash router + shell + guards   (user app)
  app.js              bootstrap                      (user app)
  admin-shell.js      router + shell + sign-in       (admin console)
build.js              bundles both entry points (node build.js [app|admin|both])
                        -> preview.html         (user app)
                        -> admin-preview.html   (admin console)
qa-frames.html        responsive QA harness (dev tool, not part of the product)
REPORT.md             research report: references, decisions, spec, audit findings
```

### Adding a screen
1. Create `js/screens/mine.js` registering
   `window.Screens.mine = { shell, tab, topbar(), render(), mount(), unmount? }`
2. Add a route to `ROUTES` in `js/router.js`
3. Add the `<script>` tag to `index.html` and to the `JS` array in `build.js`

`unmount()` is optional and is called before the next screen paints — use it to clear
timers and intervals.

### Bootstrap
Bootstrap loads **first**, our design system second, `css/bootstrap-interop.css` **last**.

Seven class names exist in both libraries. Our flex helpers `.row`/`.col` were renamed to
`.af-row`/`.af-col`, so **Bootstrap's grid is fully usable**. The other five — `.btn`,
`.card`, `.badge`, `.modal`, `.toast` — are deliberately re-skinned, the way any Bootstrap
theme does. `bootstrap-interop.css` neutralises the specific declarations that would
otherwise leak (Reboot's heading/paragraph margins, `.modal{display:none}`,
`.toast:not(.show){display:none}`) and themes Bootstrap's own components with our tokens.

If you add Bootstrap markup, it will already match the palette in both light and dark.

### Install (PWA)
Served over http(s), Chrome offers "Install app". The prompt is captured in `js/pwa.js` and
surfaced two ways: a dismissible banner, and an **Install Aura Fit** row in Account. Both
only appear when the browser actually fires `beforeinstallprompt`, so nothing is shown when
installation is impossible (inside the hosted preview frame, or when already installed).
`sw.js` caches the app shell, so the installed app opens instantly and works offline —
the wardrobe lives in `localStorage`, so offline is genuinely useful.

Regenerate icons with `python make_icons.py` (see the QA scripts) or replace `icons/*.png`.

### Changing the theme
Every colour lives in `css/tokens.css` under `:root` (light) and `html[data-theme="dark"]`.
Nothing else in the codebase hard-codes a hex value, and the test suite enforces that.

---

## Navigation

Bottom bar carries **four** tabs — Home · Wardrobe · AI Ideas · Account.
The **"+" is a floating button anchored bottom-right**, raised above the bar like a
chat-support bubble — deliberately not centred in the nav. On desktop the bar is replaced by
a left sidebar and the "+" stays bottom-right.

A three-dot menu slot is reserved top-left (`.topbar__future`) but intentionally not
implemented in this version.

---

## Tests

A dependency-free regression suite runs from the project directory with Node.js:

```bash
node --test tests/regression.test.js
```

It checks account isolation, migration, stale-tab conflicts, storage failure
rollback, reset behaviour, disabled authentication shortcuts, router listener
lifecycle and JavaScript syntax. Router tests use a minimal DOM fixture; they do
not replace browser layout or full end-to-end testing. The previously documented
external scratchpad suites are not included in this project.

Two browser harnesses (dev tools, not part of the product):

- `qa-frames.html` renders the app in iframes at exact device widths —
  `?w=390,430&h=830&hash=/home&theme=dark`
- `qa-icons.html` renders every sprite icon at 48px, stroke and filled, with the
  viewport outlined so clipping is obvious
