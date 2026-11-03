# DailyTally — ফ্রি Cloud Setup

Repository: https://github.com/CodeWithRoni/DailyTally

এই কোডে GitHub → Render Free → Turso সংযোগের ব্যবস্থা প্রস্তুত আছে। শুধু ফাইল আপলোড করলে live হবে না; আপনার নিজের account-এ নিচের সংযোগগুলো একবার দিতে হবে।

## 1. GitHub

ZIP Extract করে ভিতরের প্রকল্প ফাইলগুলো repository-র root-এ রাখুন। `server.cjs`, `package.json`, `render.yaml` ও `.github` একই root-এ থাকবে। ZIP ফাইলটি একা upload করবেন না। `.github` ও `.env.example`-ও প্রকল্পের অংশ। ব্যক্তিগত `data`, `.env`, `node_modules` বা database ফাইল upload করবেন না।

GitHub Actions-এর App checks চালু হয়ে Node 24-এ পরীক্ষাগুলো চালাবে।

## 2. Turso

Turso-তে libSQL database তৈরি করুন অথবা আগের SQLite database-এর একটি নিরাপদ backup copy import করুন। এই adapter `@libsql/client` ব্যবহার করে; URL সাধারণত `libsql://...turso.io`। নতুন Turso Database engine-এর `turso://` URL এই adapter-এ দেওয়া যাবে না।

Database-এর URL ও database authentication token সংগ্রহ করুন। Token শুধু Render-এর Environment settings-এ দেবেন। এই চ্যাটে বা GitHub-এর code-এ দেবেন না। একটি নতুন খালি database দিলে প্রয়োজনীয় tables অ্যাপ নিজেই তৈরি করবে; পুরোনো স্থানীয় হিসাব নিজে থেকে সেখানে চলে যাবে না। স্থানীয় database বদলানো বা মুছে ফেলা হয় না।

## 3. Render Free

Render-এ GitHub account যুক্ত করে New → Blueprint বাছুন এবং CodeWithRoni/DailyTally repository নির্বাচন করুন। `render.yaml` থেকে একটি Free web service তৈরি হবে। Paid upgrade বা paid database লাগবে না।

দুটি মান দিতে হবে:

- TURSO_DATABASE_URL: Turso database-এর URL
- TURSO_AUTH_TOKEN: সেই database-এর গোপন Token

Node 24, Free plan, public host এবং health-check path আগে থেকেই দেওয়া আছে। Render-এর RENDER_EXTERNAL_URL থেকে অ্যাপ নিজের HTTPS ঠিকানা নেবে; আলাদা domain কিনতে হবে না। সার্ভার চালু হলে বাস্তবে দেওয়া `.onrender.com` লিংক ব্যবহার করবেন।

একই repository থেকে ভবিষ্যতে push করলে Render নতুন code deploy করবে। Free service-এর স্থানীয় file স্থায়ী নয়, তাই REQUIRE_TURSO=true সেট করা আছে: Turso না পেলে অ্যাপ local database-এ চুপচাপ হিসাব জমাবে না।

## 4. অটোমেটিক health-check

Render deploy সম্পন্ন হলে GitHub repository-তে যান:

Settings → Secrets and variables → Actions → Variables → New repository variable

Name: RENDER_HEALTHCHECK_URL
Value: আপনার Render লিংকের শেষে /healthz

উদাহরণ: https://আপনার-আসল-সার্ভিস.onrender.com/healthz

এটি public health-check URL; Turso token নয়। URL সেট না হওয়া পর্যন্ত monitor workflow skip থাকবে।

Actions → Render health monitor → Run workflow একবার চালিয়ে সবুজ চিহ্ন দেখুন। এরপর প্রতি ঘণ্টার 03, 13, 23, 33, 43, 53 মিনিটে নিজে থেকে health-check চলবে। আপনার PC চালু রাখতে হবে না। Job-এ কোনো login বা database token ব্যবহৃত হয় না।

## 5. Live যাচাই

- /healthz খুললে {"status":"ok","app":"DailyTally"} দেখা যাবে। এটি অতি হালকা check; database query করে না।
- /readyz database সংযোগ যাচাই করে। প্রয়োজন হলে এটি নিজে খুলে পরীক্ষা করুন।
- নতুন account দিয়ে login করুন, একটি ছোট entry দিন। Render-এ service restart করার পরও একই account দিয়ে entry দেখা গেলে cloud persistence কাজ করছে।
- Theme, রিপোর্ট, CSV ও backup দেখে নিন। ফোনে HTTPS লিংক থেকে Reminders → Enable notifications চাপুন। iPhone-এ আগে Home Screen-এ যোগ করুন।

## বাস্তব সীমা

Render Free-তে 15 মিনিট inbound request না থাকলে service ঘুমায়; মাসে workspace-এ মোট 750 free instance hours। GitHub schedule দেরি হতে পারে; public repository-তে 60 দিন activity না থাকলে scheduled workflow বন্ধ হয়। তাই এই monitor বন্ধ না হওয়ার বা reminder ঠিক সেকেন্ডে পৌঁছানোর নিশ্চয়তা নয়। প্রয়োজন হলে UptimeRobot-এর মতো external monitor-এ একই /healthz URL দিয়ে পাঁচ মিনিট অন্তর check যুক্ত করতে পারেন; তার নিজস্ব account setup লাগবে।

নোটিফিকেশনের জন্য server চালু থাকা, network ও ফোনের permission দরকার। Free-tier সীমা মানতে হবে। কোনো paid service বা paid upgrade এই ফাইলে চালু করা নেই।

Google/Facebook login এবং বাস্তব email OTP চালু করতে সংশ্লিষ্ট service credentials এখনও আলাদাভাবে লাগবে। স্থানীয় registration/login ও account settings-এর সঙ্গে এই adapter কাজ করে। Live Turso/Render credentials ছাড়া বাস্তব cloud delivery যাচাই করা সম্ভব নয়।

## স্থানীয়ভাবে চালাতে

Node.js 24+ ইনস্টল করে `npm ci`, তারপর `npm start`। `.env.example` দেখে নিজের `.env` তৈরি করলে npm start তা পড়বে। Cloud credentials না দিলে সাধারণ স্থানীয় mode আগের মতো চলে; Render Blueprint-এ cloud database বাধ্যতামূলক।

## রেফারেন্স

- https://render.com/docs/free
- https://render.com/docs/blueprint-spec
- https://docs.turso.tech/sdk/ts/quickstart
- https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows

Database bridge: বর্তমান SQLite transaction-গুলোর আচরণ বজায় রাখতে dedicated worker-এ libSQL network I/O চলে। Request timeout হলে অনিশ্চিত write নিজে থেকে retry বা local fallback করে না। স্বয়ংক্রিয় পরীক্ষা local libSQL backend-এ account persistence, transaction rollback, revision conflict ও Trash restore পরীক্ষা করে; বাস্তব Turso round trip পরীক্ষার বিকল্প নয়।
