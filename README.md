# DailyTally

Bangla ledger with mandatory Bangladesh mobile-number/password accounts. No SMS verification. Requires Node.js 24+. Run npm ci to install the Web Push dependency.

Install: npm ci
Start: node server.cjs
Open http://localhost:3000. Opening dist/index.html directly no longer provides a working account service. GitHub Pages alone cannot run this backend.

Includes Google/Facebook adapter interfaces (not configured), registration/login/logout, account-isolated persisted ledgers, name/photo profile, password change, transaction editing, balance-aware deletion, daily expenses, monthly/yearly reports, per-person reports, CSV, print/PDF and JSON backup/restore.

Passwords use salted scrypt hashes. Sessions use HttpOnly/SameSite cookies. Password changes revoke other sessions. Read ACCOUNT-SETUP.md for hosting configuration, migration of earlier browser-local records and limitations. Phone ownership is not verified. Includes email/phone + email OTP password reset, offline queue/sync with conflict review, search/filter, categories, budgets, reminders, WhatsApp sharing, server-side history and Trash restore. See FEATURES.md for usage and limitations. Native packaging and public deployment remain future work.

Checks: node --test tests/*.test.cjs
Tests exercise the HTTP handler and SQLite in-process without network access.

Phone reminders include descriptions and server-scheduled Web Push. See REMINDERS.md for HTTPS deployment, device support and delivery limits.

## Free cloud deployment

Turso/libSQL persistence and a Render Free Blueprint are included. Render binds to 0.0.0.0 and uses its generated HTTPS address automatically. REQUIRE_TURSO=true prevents accidental ephemeral local storage. Read CLOUD-SETUP-BN.md for this repository and the automatic health monitor. Cloud account credentials and a live deployment are still required.
