# Aura Fit v1.1 — final QA

Date: 7 September 2026. Scope: local user app, local admin console, both generated previews, shared storage and offline app shell.

## Changes in this release

- Added the Male/Female profile step after account creation or sign-in when no choice is saved. The choice persists per account, appears in admin user details and can be changed from Account.
- Added admin account creation for users and administrators, password management with current-administrator-password validation, and a Settings entry for changing the signed-in administrator's password.
- Added mobile-accessible admin sign-out, keyboard skip navigation and focus on screen changes.
- Protected owner/self access from suspension, demotion and deletion through admin actions; restricted owner password changes to the owner.
- Added unsaved-form navigation protection for admin account creation, SMTP, templates and general settings, including browser Back and page-unload protection.
- Handled admin save failures without success messages or losing drafts; retained the store's rollback behavior.
- Fixed fractional SMTP ports, cancelled stale demo tests when inputs change, and labelled simulated test results explicitly.
- Fixed premature export-success reporting and documented the contents of local exports.
- Made remote font loading nonblocking so an unavailable font service does not delay app startup.
- Rebuilt both preview files and advanced the PWA cache to `aura-fit-v10`.

## Passed checks

| Suite | Result | Coverage |
|---|---|---|
| Node regression | 21/21 passed | Account isolation, migration, storage conflicts/rollback, admin creation, password persistence, owner protections, role checks, auth controls, route listeners and JS parsing |
| Main browser QA | 160 layouts + 12 interaction scenarios passed | Public, user and admin screens at 320/390/768/1440px in light/dark themes; wardrobe CRUD, outfit editing/planning, favourites, sheets/dialogs, search/Back, image rejection, unsaved editing and long content |
| Focused admin QA | 100 layouts + 16 flow groups passed | Source and bundled console, all five tabs, 320/390/768/1024/1440px, both themes; sign-in, account creation, filters, roles, suspension, password changes, access toggles, four SMTP presets, simulated pass/fail, four templates, exports, reset and storage failure |
| Gender QA | Passed on source and bundle; 16 captures | Real sign-up form, both choices, keyboard selection, direct-route guard, saved choice on reload/login, edit/cancel from Account, account isolation and save failure |
| Additional user journeys | 10/10 groups passed | Source and bundle; full onboarding, calendar/shuffle/search, valid photo upload, pair suggestions, deletion, ideas/stylist save, profile name, themes, privacy, stats, reset and returning login |
| Release/offline smoke | 6/6 passed | Both previews at mobile/desktop widths; actual offline user/admin navigation including query strings |

No runtime errors, blank screens, horizontal page overflow or unnamed visible buttons were reported in the layout matrices. Passing these checks does not establish that every possible input, browser or device has been tested.

## Evidence and reproduction

Reports/screenshots are included under:

- `tests/artifacts/final-v1.1/`
- `tests/artifacts/admin-review/`
- `tests/artifacts/gender/`
- `tests/artifacts/user-journey/`
- `tests/artifacts/release/`

Serve the extracted folder on port 8124. With Node.js and Python Playwright/Chromium installed:

```powershell
node --test tests/regression.test.js
python tests/browser_qa.py --phase final-v1.1
python tests/admin_review.py
python tests/gender_flow.py
python tests/user_journey.py
python tests/release_smoke.py
```

All account creation, password changes, deletion and reset tests ran in isolated browser contexts using disposable test data. Existing browser accounts were not modified. Browser QA used Chromium on Windows; external font requests were blocked for deterministic tests, exercising the system-font fallback. Screenshots were also inspected manually.

## Limits

This remains a local-storage demonstration. Authentication is not a server-enforced security boundary, passwords are stored locally, and separate devices do not share accounts. Concurrent tabs may require reload after another tab writes. Google sign-in, verified email recovery and actual SMTP sending are not connected. SMTP tests are simulations, email previews are samples and styling suggestions use local rules.

No production deployment, real email sending, OAuth handshake, native camera hardware, OS installation prompt, Safari/iOS, Firefox or real-device assistive-technology verification was performed. The ZIP is the final tested local build, not a claim of production readiness.
