# DailyTally Admin panel

একই app ও একই link-এ admin login করলে admin interface খুলবে। সাধারণ user নিজের হিসাবের interface-ই পাবেন। Admin পরিচয় server-এর database role দিয়ে যাচাই হয়; কোনো frontend email/number comparison দিয়ে অধিকার দেওয়া হয় না।

## Owner account

- Admin email: ahroni.usa@gmail.com
- Admin mobile: 01913354321
- Password: আপনার নিজের গোপন password। কোডে বা ZIP-এ কোনো password নেই।

## GitHub-এ আপডেট

ZIP-এর ফাইলগুলো একই folder/path বজায় রেখে repository-তে upload/replace করুন। `dist`, `scripts`, `tests` folder-এর ভেতরের ফাইলগুলো সেই folder-এই রাখুন। `admin.cjs` ও `server.cjs` repository-এর root-এ থাকবে। Render redeploy হবে।

## প্রথমবার Render-এ admin চালু করা

Render dashboard → DailyTally → Environment → Edit থেকে নিচের variables যোগ করুন:

| Key | Value |
| --- | --- |
| ADMIN_PHONE | 01913354321 |
| ADMIN_EMAIL | ahroni.usa@gmail.com |
| ADMIN_BOOTSTRAP_PASSWORD | আপনার ১২–১২৮ অক্ষরের গোপন password |

এই নম্বরে account আগে থেকেই থাকলে অবশ্যই সেই account-এর **বর্তমান password** দিতে হবে। কোনো existing password overwrite হবে না। Password ছোট হলে আগে Profile থেকে ১২ বা তার বেশি অক্ষরের password সেট করুন। Password না মিললে deploy fail করবে এবং owner account পরিবর্তন করবে না।

এই নম্বরে account না থাকলে deployment-এর সময় owner admin account তৈরি হবে। একই email/number দিয়ে public registration করলে admin হওয়া যায় না। পুরোনো account admin হিসেবে promote করা হলে আগের sessions বাতিল হবে; নতুন করে login করতে হবে।

Save ও redeploy করুন। সফলভাবে login পরীক্ষা করার পর ADMIN_BOOTSTRAP_PASSWORD Environment থেকে মুছে আবার deploy করুন। Database-এ admin role থাকবে; প্রতিবার নতুন admin বা password তৈরি হবে না। Database কখনও public GitHub-এ upload করবেন না।

## Login

1. আগের একই DailyTally URL খুলুন।
2. Mobile: 01913354321 এবং password দিন।
3. সঠিক admin password দিলে Admin email field দেখা যাবে। সেখানে ahroni.usa@gmail.com দিয়ে আবার Sign in করুন।
4. Server সব তথ্য যাচাই করে admin panel খুলবে। Browser role বা localStorage বদলে server-এর admin API ব্যবহার করা যাবে না।

একই owner account-এ Google/passkey আগে যুক্ত থাকলে সেই যাচাইকৃত account দিয়েও admin role পাওয়া যাবে। শুধু Google email মিললেই অন্য account admin হবে না।

## সুবিধা

- Overview: মোট user, চালু/বন্ধ account, চলমান server sessions।
- Users: নাম/mobile/email দিয়ে search, status filter ও pagination।
- User card: account চালু/বন্ধ, সব session revoke। অন্য user-এর admin role দেওয়া/মোছা বা admin account block করার সুবিধা রাখা হয়নি।
- Recent admin activity: block/unblock/session revoke history।
- Settings: নিজের profile name/photo, password, language, appearance ও sign-out।
- My personal records: নিজের হিসাবের স্বাভাবিক interface। Profile → Account tools → Admin panel থেকে ফেরত আসা যায়।

User list-এ password/hash, session token বা কারও ledger details দেওয়া হয় না। Account block করলে server access ও sync বন্ধ হয়; ফোনে আগে cache হওয়া নিজের হিসাব remote থেকে মুছে যায় না। Revoke sessions মানে logout; user সঠিক credentials দিয়ে আবার login করতে পারবেন। Block করলে পুনরায় server login হবে না।

## পরীক্ষা ও সীমা

SQLite ও Turso/libSQL adapter-এ authorization ও account controls-এর automated tests আছে। এই Windows computer-এ Android/iOS native UI build বা live Render account দিয়ে admin flow এখনও পরীক্ষা হয়নি। ফাইল upload, owner variables ও সফল deploy ছাড়া live app-এ admin panel চালু হবে না।

Admin password, keystore বা token chat-এ পাঠাবেন না। এগুলো শুধু নিজের Render-এর Environment-এ রাখুন।
