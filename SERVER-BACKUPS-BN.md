# Server backup update

Profile → Back up your records-এ Server backup button যুক্ত হয়েছে। Server নিশ্চিতভাবে copy সংরক্ষণ করার পর button পূর্ণ সবুজ ও checkmark দেখায়। ব্যর্থ বা offline backup-কে successful বলা হয় না। Last backup-এর তারিখ ও সময় দেখায়।

Online login/app open এবং app foreground-এ ফিরলে automatic backup চেষ্টা হয়। Offline/unsynced entry থাকলে আগে sync হতে হয়; conflict থাকলে সেটি সমাধান না হওয়া পর্যন্ত server backup অপেক্ষা করে। Server backup শুধু ইতিমধ্যে server-এ সংরক্ষিত, revision-matched হিসাবের snapshot নেয়।

প্রতিটি account-এর last 48 hours-এর snapshots আলাদা থাকে। Profile → View server backups থেকে সেই সময়ের copies download করা যায়; আগের JSON restore control দিয়ে সচেতনভাবে ফিরিয়ে আনা যায়। Snapshots-এ password hash, login session, OAuth বা mail secrets রাখা হয় না। Ledger/profile/settings/reminders থাকে।

48 ঘণ্টা পূর্ণ হলেই app API থেকে snapshot পাওয়া যায় না। Expired rows ও unreferenced payload app startup, backup requests এবং server চলাকালে প্রতি পাঁচ মিনিটে পরিষ্কার হয়। Server বন্ধ থাকলে physical deletion পরের startup/request-এ হয়। Unchanged data-এর snapshot payload একই account-এর মধ্যে reuse হয়, যাতে প্রতি open-এ একই ছবি/হিসাব আবার জমিয়ে জায়গা নষ্ট না করে।

এগুলো একই Turso/SQLite database-এ application snapshots, অন্য provider-এ রাখা disaster-recovery copy নয়। Download backup এখনও ব্যবহার করা যায়।

## GitHub-এ এই update বসানো

ZIP Extract করে একই নামের file-গুলো repository-র একই জায়গায় upload/replace করুন:

- root: server.cjs এবং নতুন server-backups.cjs
- dist: index.html, auth.js, features.js, offline.js, i18n.js, mobile.css এবং নতুন backups.js
- scripts: sync-client.cjs
- tests: backups.test.cjs

Commit হলে Render auto-deploy শেষ হতে দিন। নতুন table নিজে তৈরি হবে; আগের হিসাব মুছবে না। Turso-তে নতুন token বা manual SQL setup লাগবে না। Live deploy-এর পর Profile-এর Server backup চাপুন এবং View server backups-এ copy দেখা যাচ্ছে কি না যাচাই করুন।
