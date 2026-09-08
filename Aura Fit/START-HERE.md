# Aura Fit v1.1 — final local build

Both the user app and administrator console are included. Extract the ZIP into one folder.

## Open the app

For shared browser storage and offline support, run from that folder:

```powershell
python -m http.server 8124 --bind 127.0.0.1
```

- User app: http://127.0.0.1:8124/index.html
- Admin console: http://127.0.0.1:8124/admin.html

Standalone versions are `preview.html` and `admin-preview.html`. Keep both in the same folder. Serving the folder is recommended; separate `file://` pages may not share browser storage consistently.

## Default sign-in

| Panel | Email | Password |
|---|---|---|
| Admin | admin@aurafit.app | Admin@123 |
| User | user@aurafit.app | User@123 |

These are demo credentials. Existing accounts retain their saved passwords; the update does not overwrite them.

## Set up logins from the admin console

1. Open **Users → Create account**. Enter a name, email, password and role. Creating an account keeps you signed in as the administrator.
2. To change an account password, open its **More actions → Set password**. Enter your current administrator password, then the new password twice.
3. To change your own administrator password, use **Settings → Sign-in setup → Change my password**.
4. Use **Settings → Access** to allow or pause public sign-ups and enable maintenance mode. Administrators can still sign in during maintenance. Existing sessions continue working.
5. Sign out using the top-right icon, available on mobile and desktop.

The owner account cannot be deleted, demoted or suspended. Only the owner can change its password. Other accounts can be promoted, demoted, suspended, reactivated or deleted through Users.

## User profile

New accounts choose Male or Female before continuing to the welcome screen and four style-preference steps. Existing accounts without a saved choice are asked once at sign-in. Users can update this choice under **Account → Profile details → Gender**. Administrators can see the saved choice in user details.

## What this build supports

Local email/password sign-in, local account and password management, wardrobes, photo uploads, outfits, favourites, planning, rule-based outfit suggestions, profile preferences, themes, browser storage, JSON exports and offline app access.

Google sign-in, email verification, email password recovery and actual SMTP delivery require a connected backend and are not enabled in this build. SMTP tests are explicitly labelled simulations. Email templates can be edited and previewed but are not sent.

Accounts, passwords and configuration are stored in this browser. This is a tested local demonstration, not production authentication. Use test credentials only. An admin export contains local passwords as well as other app data.

## QA and source

See `FINAL-QA.md` for test coverage and limits. Source is in `js/` and `css/`. Rebuild the standalone previews after editing source:

```powershell
node build.js
```
