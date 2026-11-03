# DailyTally accounts

Requires Node.js 24 or later. No package installation is required.

From this project directory run:

```sh
node server.cjs
```

Open http://localhost:3000. Register with your name, Bangladesh mobile number, and a password of 8–128 characters. No SMS verification is performed. The phone number is an account identifier, not proof of phone ownership. Password recovery now uses matching profile email and phone plus an emailed OTP, with email-service configuration required. Legacy recovery codes cannot reset passwords. Social login adapters are present but require provider configuration.

The server stores salted scrypt password hashes, hashed session tokens, and each account's data in `data/daily-tally.sqlite`. Sessions use HttpOnly/SameSite cookies; changing a password revokes other sessions. Do not upload the data directory or credentials to GitHub. Back up this database on the server. User-exported JSON backups contain ledger/profile data, never password hashes or sessions.

Existing browser-local prototype records are preserved in browser storage but are not silently assigned to a new account. To transfer them, export a JSON backup from the earlier version, then log in to the intended account and restore it under Profile.

This is now a server application, not a GitHub Pages/static-only website. For public hosting, use a persistent Node service, HTTPS, NODE_ENV=production, PUBLIC_ORIGIN=https://your-domain, and persistent storage for the database. Production startup rejects missing HTTPS origin configuration. Login throttling is per server process and client address. Add managed rate limiting, monitored backups and recovery before broader production rollout. Raw phone ownership is not verified.

Windows/Mac/mobile packaging will need the hosted service URL and platform-specific secure authentication integration. APK/IPA/EXE/DMG build workflows are not included yet.

Run checks with `node --test tests/*.test.cjs`. See FEATURES.md for reminders, audit/Trash, budgets, categories and offline synchronization.
