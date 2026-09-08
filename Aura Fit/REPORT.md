# Aura Fit — Research & Build Report

**Product:** Aura Fit — AI Personal Wardrobe & Outfit Assistant
**Stack:** HTML + CSS + Vanilla JavaScript (no framework, no build step required)
**Reference:** `Proposal/FITVISION AI.pdf`, `Design/*.jpeg` (dark + light UI kit)
**Date:** 2026-09-05

---

## 1. Research — what the references actually specify

### 1.1 From the proposal (FitVision AI)
The proposal is an Android/Kotlin + FastAPI + PyTorch VTON project. Aura Fit reuses its
**product logic**, not its stack. The transferable parts:

| Proposal concept | Aura Fit equivalent |
|---|---|
| Style profile from preferences | One-time onboarding (§Feature 2) |
| My Wardrobe | Wardrobe tab — items + saved outfits |
| Shop catalog (50–100 tagged products) | Seeded e-commerce catalog for Find Similar / Find Pair |
| Recommendation score (explainable) | Same scoring formula, run client-side |
| AI Stylist (natural language) | AI Ideas tab + "Generate Ideas" |
| Wishlist / history | Saved outfits + saved products |
| Dark mode / settings | Theme switch, persisted |
| 2D virtual try-on (GPU) | **Out of scope** — replaced by Find Similar / Find Pair |

**Recommendation formula carried over verbatim** (proposal §8):

```
Score = Color(25%) + Style(25%) + Occasion(20%) + Preference(20%) + Wardrobe(10%)
```
Normalised to 0–100 and shown as an explainable "why this was suggested" line.

### 1.2 From the design screenshots
Six screens supplied in **both** dark and light — confirming a strict two-theme token system.

Screens: Home/My Wardrobe · Wardrobe grid · Outfit Details · Add New Item · Outfit Ideas · Wardrobe Stats

Extracted design language:
- **Radius:** 16px cards, 12px inputs/tiles, 999px chips & pills
- **Accent:** peach `#F0C1A7` (hue 21°, sat 30%) — used for FAB, active chip, donut arc
- **Primary action inverts by theme:** peach button on dark, near-black button on light
- **Cards:** flat, hairline border, no heavy shadow — shadow only on sheets/FAB
- **Product imagery:** flat-lay garments on a light neutral plate
- **Typography:** geometric sans; 22–24px screen titles, 15px body, 12px meta/labels
- **Density:** generous 16px gutters, 12px stack rhythm

### 1.3 Deviation requested by you (important)
The screenshots place the **+ button in the centre of the bottom nav**.
You explicitly asked for the opposite:

> "we want this plus button in upper side ... like chat support button ... in right side not in center"

**Decision:** bottom nav carries **4 evenly-spaced tabs** (Home · Wardrobe · AI Ideas · Account).
The **+ is a floating action button anchored bottom-right, raised above the nav bar** —
the same affordance as an intercom/chat-support bubble. On desktop it stays bottom-right
above the content area. This is implemented, and the centre slot is removed entirely.

---

## 2. Feature specification (from your brief)

### A. Authentication
- Login · Create Account · Forgot Password (3-step: email → code → new password)
- Session persisted; guest/demo entry available
- Profile & account management under Account tab

### B. One-time user input (onboarding)
Runs **once** after first sign-up, never again. Collected:
style preferences, favourite colours, typical occasions, fit preference.
Stored to profile and consumed by the recommendation engine. Editable later from Account.

### C. Home / Dashboard
- Greeting + date, horizontal **calendar strip** (7 days, today selected)
- **Outfit of the day** card tied to the selected date
- Wardrobe overview stats · Outfit ideas carousel · Style stats donut

### D. Bottom navigation — 4 sections
`Home` · `Wardrobe` (clothes + saved outfits) · `AI Ideas` · `Account`

### E. Add Item / Clothing — FAB (bottom-right)
Photo upload **or camera capture**, category, type, colour swatch, brand,
occasion, style, personal notes. Saves as item **or** complete outfit.

### F. Outfit selection
Uploaded photo shown large → category selector `Top | Bottom | Shoes`
→ two primary actions: **Find Similar** and **Find Pair**.

### G. Find Similar
Visually similar catalogue products — image, name, brand, price, buy link.
Ranked by colour distance + category + style match.

### H. Find Pair
| Selected | Suggests |
|---|---|
| Top | Bottoms + Shoes |
| Bottom | Tops + Shoes |
| Shoes | Tops + Bottoms |

### I. Bottom-sheet product panel
- Slides up on Find Similar / Find Pair
- Height **2/3 of viewport (66vh)**, background page stays visible behind a scrim
- Smooth translateY slide-up, spring easing, drag-to-dismiss handle
- **Two product lists** (two category tabs) depending on selection
- **Single selection only** — selecting one clears the other; selected card is highlighted
  with accent ring + check, and a sticky action bar reveals *View / Buy*

### J. Theme
Light ⇄ Dark switch in the header and in Account. Every surface —
cards, nav, FAB, forms, chips, sheets, donuts, scrims — is token-driven so both
themes are pixel-consistent. Preference persisted to `localStorage`.

### K. Future navigation
Three-dot menu placeholder reserved top-left in the shell markup —
**rendered but inert / hidden in this version**, so features can be dropped in later
without touching layout.

---

## 3. Architecture

```
index.html          single shell — SPA, hash router, no build step
css/
  tokens.css        design tokens: colour, radius, spacing, type, motion (light+dark)
  base.css          reset, typography, utilities
  components.css    buttons, chips, cards, inputs, sheet, nav, FAB, toast
  layout.css        app shell + responsive (mobile / tablet / desktop)
  screens.css       per-screen composition
js/
  data.js           seeded catalogue, wardrobe, outfits, taxonomy
  store.js          state + localStorage persistence + pub/sub
  garments.js       procedural SVG garment renderer (no external images)
  recommend.js      scoring engine (proposal §8 formula)
  ui.js             DOM helpers, toast, sheet controller, theme controller
  router.js         hash routing + view lifecycle
  screens/*.js      one module per screen
  app.js            bootstrap
```

**Why no external images:** all garment/product artwork is generated as inline SVG from
a palette + silhouette definition. The app is fully offline, loads instantly, and every
product recolours correctly in both themes.

**Responsive strategy**
| Breakpoint | Layout |
|---|---|
| `< 720px` | Mobile app — bottom nav, FAB bottom-right, full-bleed sheets |
| `720–1023px` | Two-column content, bottom nav retained |
| `≥ 1024px` | Desktop — left sidebar nav, centred content column, FAB stays bottom-right, sheet becomes a right-docked panel |

---

## 4. Build order
1. Tokens + theme engine + shell (nav, FAB, router) ✅ prerequisite for everything
2. Auth → Onboarding → Home
3. Wardrobe → Item detail → Add Item
4. Find Similar / Find Pair + bottom-sheet panel
5. AI Ideas + recommendation engine
6. Account + stats + theme persistence
7. Responsive pass, motion pass, a11y pass
8. Single-file bundle → preview URL

---

## 5. Explicitly out of scope
- Real AI/VTON inference (proposal §6) — needs a GPU backend
- Real e-commerce checkout — buy links point to catalogue entries
- Three-dot menu contents — reserved, not implemented, per your instruction

---

# Addendum — v2 (auth flow, admin panel, UI/UX audit)

## 6. New reference: `Design/start screen .jpeg`
Eight further frames supplied, covering the complete authentication journey.
All eight are implemented:

| # | Reference frame | Route |
|---|---|---|
| 1 | Onboarding / hero + Get Started | `#/start` |
| 2 | Welcome Back (Sign In) | `#/login` |
| 3 | Create Account | `#/signup` |
| 4 | Forgot Password | `#/forgot` |
| 5 | Check Your Email | `#/check-email` |
| 6 | Reset Your Password | `#/reset` |
| 7 | Password Updated | `#/password-updated` |
| 8 | Welcome to … | `#/welcome` |

### Geometry sampled from the reference
| Element | Value |
|---|---|
| Text input | height 52, radius 14, leading icon in a 52px gutter |
| Primary button | height 54, radius 20 |
| Social button | height 52, radius 14, icon absolutely placed at left 22 |
| Checkbox | 21×21, radius 6 |
| Accent (button peach) | `#ECB99E` — 8,532-pixel sample, hue 21°, sat 33% |
| Input surface (dark) | `#1B1C1E` |
| Page ground (dark) | `#111312` |

### Deviations from the reference, and why
- **"Continue with Apple" removed, "Continue with Google" kept** — per your instruction.
- **Brand wordmark is "Aura Fit"**, using the reference's two-tone treatment
  (first word in foreground colour, second in accent).
- **Photographic hero replaced with an SVG illustration.** The app ships with zero
  external image requests; a bitmap would have been the only exception. The scene
  reproduces the reference composition (rail, hanging garments, plant, bench, tote, sneakers).
- **Reset link opens in-app.** There is no mail server in a front-end build, so the
  Check Your Email screen exposes the link directly and says so in plain copy rather
  than pretending mail was sent.

## 7. Admin panel
Routes `#/admin`, `/users`, `/smtp`, `/emails`, `/settings`. Gated on `role === 'admin'`;
the first registered account and the demo account are admins. Covers SMTP configuration
with provider presets and a test-connection action, user management (search, filter,
role, suspend, reset, delete), editable email templates with live preview, and app
settings including a data export.

## 8. Front-end audit
A full read-only audit produced 6 P1, 19 P2 and ~30 P3 findings. Every P1 and P2 is fixed.
The two most consequential:

1. **Card sub-elements were inline `<span>`s.** `aspect-ratio`, `overflow:hidden`,
   `margin-top`, `transform` and `text-overflow` are all ignored on inline boxes, so
   every wardrobe / outfit / product card silently lost its rounded thumbnail clipping,
   its 3:4 ratio, its hover lift and its text truncation, and ran name and meta together
   on one line. Fixed by blockifying card internals in `screens.css`.

2. **Theme tokens leaked onto the theme buttons.** `[data-theme="light"]` matched the
   Account screen's `<button data-theme="light">` as well as the document root, so those
   buttons resolved the *opposite* theme's palette and their labels disappeared on hover.
   Fixed by scoping the token blocks to `html[data-theme=…]`.

Also fixed: `#/reset` crashed when opened directly; the start-screen carousel leaked a
`setInterval` on every navigation (screens now have an `unmount` lifecycle hook);
the FAB's pulse ring was clipped by its own `overflow:hidden` and its icon sat 4px
off-centre; the bottom sheet reserved a blank strip for its hidden action bar;
AI Ideas persisted a duplicate outfit on every tap; `--text-3` failed contrast in light
mode; and `window.prompt` was replaced with a themed `UI.promptDialog`.

---

# Addendum — v3 (browser QA, icon fix, split panels)

Verified in a real Chrome session at 390 / 430 / 1289px, in both themes.

## The icon defect — root cause
`UI.icon()` emitted `<svg class="ico"><use href="#i-x"/></svg>` with **no `viewBox`**.
Without one an SVG uses a 1:1 pixel coordinate system, so sprite artwork authored on a
24×24 grid was drawn at 24px inside a 20px box — the right and bottom edges were clipped,
and at larger sizes (`.ico--xl`, the 44px brand mark) the glyph shrank into the top-left
corner instead of scaling. Measured in-page: artwork extent `maxX 21.5` inside a `20px` box.

Fixed by adding `viewBox="0 0 24 24"` at the two construction sites (`js/ui.js`,
`js/screens/outfit.js`). This was a single systemic cause behind every "cut out" icon.

## Also fixed this round
- **Favourite button** rendered as a dark blob on the light product plate. Now a translucent
  glass chip using new constant tokens (`--plate-chip*`), since the plate is light in both themes.
- **Outfit flat-lay** left an empty quadrant for three-piece looks; the composite now balances
  to the number of pieces, and a dress spans the top half.
- **Boot silhouette** read as a rectangle; redrawn with a shaft opening, sole and stitching.
- **Tap targets**: underline tabs were as narrow as 18px, stylist chips 32px, admin row buttons
  34px — all now ≥36px.
- **Admin tab bar** had five sections in a four-column grid, so Settings wrapped out of view.
- **FAB** now stands down while a bottom sheet is open.
- **Bottom padding** under every scroll trimmed from 164px to 146px.
- **Small-phone type scale** (≤400px) for the greeting, outfit and heading sizes.

## Measured, not assumed
- No page-level horizontal scroll on any screen at 390px, user app or console.
- Bottom sheet renders at exactly **66% of viewport height** (548px of 830px).
- Theme choice persists to `localStorage` and survives reload.

## "Saved" feature
Tested end to end in the browser and could not reproduce a failure: selecting a product in the
Find Similar sheet and pressing Save writes to `Store.state.savedProducts`, persists to
`localStorage`, flips the button to "Saved" with a filled heart, and the item appears under
Account → Saved Products with a working remove. Profile rename, theme choice and outfit
favouriting all persist too. The most likely explanation is the earlier build, where the Save
button gave no visual confirmation — that feedback now exists.

## Two panels, two URLs
`index.html` and `admin.html` are separate entry points with separate bundles and separate
published URLs. They share `css/tokens.css`, the store, the icon sprite and the component
layer, but each has its own shell, navigation and sign-in. The icon sprite moved out of
`index.html` into `js/sprite.js` so there is one source of truth for both.

---

# Addendum — v4 (Bootstrap, PWA, icon redraw)

## Bootstrap 5.3.3 — added, and made to coexist
Vendored locally (`vendor/`) rather than linked from a CDN, because the hosted preview's
CSP blocks external stylesheets — a CDN link would have failed silently there.

I did not add it blind. A script diffed both stylesheets: Bootstrap defines 2,029 class
names, Aura Fit 447, and exactly **seven collide** — `badge, btn, card, col, modal, row, toast`.
Two of those would have broken the app outright:

- `.toast:not(.show){display:none}` — specificity (0,2,0), beats our `.toast`. **Every toast
  would have been invisible.**
- `.modal{display:none;position:fixed}` — we never set `display`, so **every dialog would
  have been hidden.**

Plus Reboot's `h1–h6 / p / ul` margins, which the whole layout was built without.

Resolution:
- `.row`/`.col` renamed to `.af-row`/`.af-col` (7 call sites) so **Bootstrap's grid stays
  fully usable** rather than being clobbered.
- The other five are re-skinned deliberately, as any Bootstrap theme does.
- `css/bootstrap-interop.css` loads last and neutralises exactly the leaking declarations,
  then themes Bootstrap's own components (`.table`, `.form-control`, `.dropdown-menu`,
  focus ring, link colours) with Aura Fit tokens.

Verified by sweeping **28 route × theme combinations** in a real browser: zero regressions,
no horizontal scroll, toast/modal/bottom-sheet all still render.

## Icons — the sprite is now maintainable, and five were redrawn
`js/sprite.js` was a generated blob of escaped markup. It is now a plain
`{'i-name': '<path …>'}` object, so a single icon can be fixed without regenerating anything.

Audited all 41 at 48px against an outlined viewport (`qa-icons.html`). Nothing clipped after
the earlier `viewBox` fix, but five were badly drawn and were redrawn:
- **`i-heart`** — the "Saved" icon, and visibly lopsided because it was built from SVG arc
  flags. Rebuilt from explicit cubic curves, symmetric about x=12.
- **`i-shoe`** — was a flat wedge; now a side-profile trainer with laces and a sole.
- **`i-logout`** — the arrow pointed *into* the door, i.e. sign-*in*. Reversed.
- **`i-pants`**, **`i-shirt`** — clearer silhouettes at small sizes.
- Added **`i-bookmark`**.

## Installable app (PWA)
`manifest.webmanifest` + `sw.js` + `js/pwa.js`, with generated PNG icons (192/512/maskable/
apple-touch). Verified live in Chrome: manifest parsed, **service worker active**, and
`beforeinstallprompt` fired — so the install is genuinely offered, not just declared.

The prompt is surfaced as a dismissible banner and an Account row, both created *from the
event*, so they never appear where installation is impossible. Offline caching is
cache-first on the app shell; since the wardrobe lives in `localStorage`, the installed app
is fully usable with no network.

**Caveat:** installation works from a real origin (local server or hosting). It does not
work inside the hosted preview link, which runs in a sandboxed frame — there the button
correctly stays hidden.

---

# Addendum — v5 (final: credentials, separation, saved control)

## Provisioned accounts, no demo shortcuts
Both "demo" sign-in buttons were removed. Two accounts are now seeded on every load
(idempotent, never overwriting an existing record), so the documented credentials work in a
fresh browser:

| Panel | Email | Password | Role |
|---|---|---|---|
| User app | `user@aurafit.app` | `User@123` | user |
| Admin console | `admin@aurafit.app` | `Admin@123` | admin |

**Security fix found while doing this:** `isAdminEmail()` granted administration to the
*first-registered account* and to a hard-coded demo address, as well as by role. With two
seeded accounts that fallback could have promoted the ordinary user. It is now a strict
`role === 'admin'` check, and `register()` always creates ordinary users — admin access is
provisioned, never inferred.

Verified from a cleared browser: both accounts seed, the user signs in and is **not** admin,
the admin signs in and **is** admin, and a wrong password is rejected.

## The two panels are now fully separate
- The user app's Account screen no longer links to the admin panel.
- The notification bell is gone from the user header.
- The console remains on its own URL with its own sign-in.

## Saved control — the real defect
The Save button was built as `icon + " Save"`, where the label was a **bare text node**.
Inside a flex button that becomes an anonymous flex item, so the icon/label spacing was
inconsistent on top of the 8px gap, and the button's width changed between "Save" (87px) and
"Saved" — making the action bar jump.

Fixed by giving the label its own element, pinning the control to `min-width:104px`
(measured 104px in both states, zero jitter) and moving it to a bookmark glyph with a proper
saved state. Semantics are now consistent across the app: **bookmark = saved product,
heart = favourited outfit**. The product card carries a matching saved marker.

Also: the action bar printed "Uniqlo · ₹2,990 · Uniqlo" whenever brand and store matched;
the store is now omitted when it duplicates the brand.

---

# Addendum — v6 (icon centring, toast flooding, colour from photo)

## The heart was genuinely off-centre — measured, not guessed
`.fav` set `display:flex; align-items:center; justify-content:center`, yet the glyph
rendered **8.33px left of the chip's centre** (and `align-items` resolved to `stretch`).
Rather than keep chasing why the flex centring was being ignored, the chip now positions its
glyph explicitly:

```css
.fav{ display:block; position:absolute; }
.fav .ico{ position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); }
```

Re-measured after the fix: **offset 0.00 / 0.00**, icon 17px. The same treatment was applied
to `.prodcard__saved`, so every round chip in the app is now centred by construction and
cannot drift.

## Toast flooding
Every call appended a new node, so tapping Save repeatedly or flipping the theme back and
forth stacked notifications down the screen (the screenshot showed seven at once).

`UI.toast()` now keeps a single node: a repeat call reuses it, swaps the text and icon,
replays the entrance animation and restarts the timer. Verified: **7 rapid save toasts → 1**,
**6 theme toasts → 1**.

## Colour detected from the uploaded photo
Adding an item used to leave the colour on its default. It now reads the actual garment
colour out of the photo.

The logic lives in `js/colour.js`, deliberately free of DOM access so it is unit-testable:
estimate the background from the four corners, discard pixels close to it, histogram the rest
of the central region in a coarse RGB space, then snap the dominant bucket to the nearest
palette swatch. The swatch is selected automatically and labelled "detected from your photo".

`colour-test.js` drives it with synthetic garment photos — **14/14 pass**, covering the eight
palette colours, off-palette near-misses (a washed denim, a warm off-maroon), a shaded
garment, a light garment on a dark backdrop, and a small garment in the frame. Confirmed
end-to-end in the browser: a maroon photo selects **Maroon**.

## Service-worker staleness (found while testing)
The cached shell kept serving an old `index.html` after a rebuild — the class of bug that
leaves users on a stale build after a deploy. Assets are now stale-while-revalidate, and
navigations fetch with `cache: 'no-store'` so a new deploy lands on the very next load.
The cache name is versioned (`aura-fit-v4`); bump it when shipping.
