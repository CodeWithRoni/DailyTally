# Phone reminders

Reminders save the selected person, date, time and optional description (up to 500 characters). Times use Asia/Dhaka, consistently with ledger entries. The in-app popup includes the description. Completed/deleted reminders are excluded from the server scheduler.

## Enable on phones

1. Run `npm ci`, then run this Node application continuously behind HTTPS. Set `NODE_ENV=production` and `PUBLIC_ORIGIN` to the actual public HTTPS origin before starting `node server.cjs`. A static host or GitHub Pages cannot run the scheduler. Restart the existing server after installing this update.
2. Log in, open Profile → Reminders and tap Enable notifications. Grant the phone/browser permission.
3. On Android, use a browser supporting Web Push. On iOS/iPadOS 16.4 or later, add the app to the Home Screen and launch it from that icon before enabling notifications. See https://webkit.org/blog/13878/ .
4. Save a future reminder. Pending offline changes must sync to the server before background notifications can be scheduled.

VAPID keys are generated automatically and persisted privately in the SQLite database once an HTTPS public origin is configured. No separate paid notification service or Google/Facebook credentials are required. Keep the database and its keys out of GitHub. Existing subscriptions are re-associated with the current session on successful login. Signed-out, expired and password-revoked sessions do not receive background reminders; log in again to resume.

The server checks every 15 seconds and hands encrypted notifications to the phone's browser push service. OS settings, Focus/Do Not Disturb, network availability and battery management can delay or hide banners; this is not an exact alarm. Failed deliveries retry up to five times, at least one minute apart. Expired device subscriptions are removed. A sent reminder is deduplicated per device and persisted across server restarts. After downtime, reminders up to 24 hours overdue may be delivered. Push messages have a 24-hour TTL. In-app alerts may also appear when reopening the app.

This is Web Push for the current web/PWA app. Native APK/IPA packaging and native local-notification integrations have not been created. Delivery on actual Android/iOS devices still requires an HTTPS deployment and device testing. Automated tests use a stub transport and check scheduling, description payloads, permissions boundaries, retries, duplicate suppression and notification clicks; no real phone notifications were sent in tests.
