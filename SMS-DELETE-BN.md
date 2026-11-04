# Send SMS ও permanent user deletion

## Send SMS

ব্যক্তির ledger খুললে WhatsApp share-এর পাশে/নিচে icon-সহ Send SMS button পাওয়া যাবে। এতে contact-এর saved number, সর্বশেষ সংরক্ষিত transaction, তার date/time, সংক্ষিপ্ত description এবং বর্তমান net balance দিয়ে message তৈরি হয়। Form-এ এখনও save না করা নতুন amount/description SMS-এ ধরা হবে না।

App English হলে SMS-এর template English, বাংলা হলে বাংলা হবে। ব্যক্তি/প্রতিষ্ঠানের নাম ও আপনার লেখা description নিজের ভাষাতেই থাকবে। নির্বাচিত currency symbol ব্যবহার হবে। Balance-এর ভাষা recipient-এর দিক থেকে লেখা: আপনার কাছে পাওনা থাকলে Amount due from you, আপনাকে দিতে হলে Amount payable to you।

Android APK-তে native SMS composer খুলবে। সাধারণ browser-এ supported SMS link দিয়ে messaging app খোলার চেষ্টা হবে। ফোনের Messages app-এ number ও message দেখে user নিজে Send চাপবেন। App নিজে সরাসরি SMS পাঠায় না, SEND_SMS permission চায় না এবং delivery সফল হয়েছে বলে দাবি করে না। SMS-এর charge/বিভিন্ন SIM নির্বাচন ফোনের messaging app ও operator অনুযায়ী হবে।

## Permanent delete

Admin → Users → user card → Delete permanently। User-এর exact mobile number ও admin-এর বর্তমান password দিয়ে নিশ্চিত করতে হবে। Cancel করলে কিছু মোছা হবে না। নিজের/অন্য admin account এখানে delete করা যাবে না।

সফল হলে live database থেকে user account, ledger/profile/photos, account snapshots/payloads, sessions, audit/Trash, recovery/OTP তথ্য, social links, passkey ও notification subscription/delivery তথ্য একই transaction-এ মুছে যাবে। Deleted account-এর নাম/নম্বর/ID ধরে রাখা ছাড়াই admin-এর action count/history থাকবে।

পুরোনো session দিয়ে account খোলা যাবে না। একই mobile/email দিয়ে নতুন registration করা যাবে, নতুন ID এবং ফাঁকা হিসাব নিয়ে। পুরোনো pending offline copy ভিন্ন account ID-তে স্বয়ংক্রিয়ভাবে merge হবে না। Legacy/offline copy ডিভাইসে থাকলে আলাদাভাবে download করার notice পাওয়া যেতে পারে; app সেটি server-এ নিজে থেকে ফেরত দেয় না।

এই delete live app database ও app-এর server snapshots মুছে দেয়। User-এর আগে download করা backup/SMS, ফোনের স্থানীয় copy, অথবা hosting/database provider-এর নিজস্ব historical backup/policy এই action দিয়ে remote থেকে মুছে যায় না।

## Update

1. ZIP-এর files GitHub-এ একই path অনুযায়ী replace/upload করুন।
2. Render deploy সফল হওয়ার পর admin permanent delete ও browser interface কাজ করবে। Environment variables বদলানোর দরকার নেই।
3. Android native SMS composer-এর জন্য Build Apps → platform android → android_release চালু করে নতুন signed APK তৈরি করুন। একই signing key দিয়ে আগের app-এর ওপর update দিন।
4. এই source-এর versionCode 4 / versionName 1.0.3। Repository-তে versionCode ইতিমধ্যে 4 বা বেশি হলে আরও বাড়ান।

Automated পরীক্ষায় delete authorization, account dependency purge, clean re-registration, offline identity separation এবং বাংলা/English message যাচাই করা হয়েছে। Actual Android SMS app ও native APK compile এই Windows environment-এ পরীক্ষা হয়নি; GitHub build ও ফোনে compose screen দেখে পরীক্ষা করুন। Real user delete করে test করার প্রয়োজন নেই; দরকার হলে আলাদা disposable test account ব্যবহার করুন।
