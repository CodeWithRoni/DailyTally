# DailyTally — Offline-only PWA

This folder is a standalone, static Progressive Web App. It reuses DailyTally's ledger, expense, report, budget, reminder, language and appearance UI while saving the complete account state locally in IndexedDB.

## Deploy

GitHub Actions publishes this folder to GitHub Pages from the `offline-pwa` branch. The original `main` branch and Render backend are intentionally untouched.

## Storage and privacy

- All ledger data is stored in IndexedDB on this browser/device.
- No registration, sign-in, server API, cloud sync, server backup or push subscription is used by this app.
- JSON backup and restore are available from Profile. Export a backup regularly and before clearing browser data.
- Browser storage is not encrypted by this app. Use a trusted device and protect it with the device lock.
- Reminders are evaluated while the app is open. Background push and guaranteed scheduled delivery are not available in this static version.

## Device use

Install from the browser's Install app / Add to Home Screen command. Android and Windows device-specific acceptance tests must still be run manually after Pages deployment.

## Existing data migration

The old server account is not automatically copied. On the old app, download its JSON account backup first. Then open this PWA and use Profile → JSON backup restore. Check the restored people, transactions and balances before relying on it.

## Local checks

Run `node tests/smoke.cjs` from this folder. It validates script syntax, relative paths, manifest scope and absence of direct fetch/API usage in the offline runtime.
