# Add new button ও Android contact picker fix

## পরিবর্তন

- Home-এ ফেরার সময় পুরো `#app`-এ translate animation চলত। এতে ভেতরের fixed Add new button-ও সাময়িকভাবে অন্য অবস্থান থেকে আসত। এখন page transition শুধু opacity বদলায়, button-এর viewport position বদলায় না।
- Android APK এখন ফোনের নিজস্ব contact/phone-number picker খোলে। নির্বাচিত contact-এর saved name ও নির্বাচিত mobile number নতুন লেনদেনের form-এ আসে।
- শুধু user যে contact/number বাছেন সেটি পড়া হয়। পুরো address book-এর READ_CONTACTS permission চাওয়া হচ্ছে না। ফোনের Contact app-এ একাধিক নম্বর থাকলে সেখান থেকে নির্দিষ্ট নম্বর বেছে নিন।
- Cancel করলে আগে লেখা নাম/নম্বর থাকে। Picker error হলে manual entry করা যায়। আগে যোগ করা contact-এর duplicate check বজায় আছে।
- সমর্থিত browser-এ আগের browser contact picker fallback থাকবে। iPhone বা unsupported browser-এ contact নির্বাচন এই Android bridge দিয়ে চালু হবে না; manual entry থাকবে।

## Upload ও install

1. ZIP-এর ফাইলগুলো GitHub-এ একই folder/path-এ upload/replace করুন। `dist`, `scripts`, `apps`, `tests` folder-এর ভেতরের ফাইলগুলো সঠিক জায়গায় দিন।
2. Render deployment সফল হলে Home button-এর web fix আসবে।
3. Android contact picker-এর জন্য Actions → Build Apps → Run workflow → platform `android`, android_release চালু করে নতুন signed APK বানান।
4. একই keystore দিয়ে তৈরি APK আগের app-এর ওপর update হিসেবে install করুন। পুরোনো app uninstall করার দরকার নেই।
5. এই source-এর Android versionCode 3 / versionName 1.0.2। আপনার repository-তে versionCode ইতিমধ্যে 3 বা বেশি হলে আরও বাড়িয়ে দিন।

ফোনে Home → Reports → Home কয়েকবার করে button-এর অবস্থান দেখুন। নতুন লেনদেনে contact বাছুন, cancel করুন এবং আগে থাকা contact আবার বেছে duplicate check দেখুন।

JavaScript bridge/form flow ও animation regression automated পরীক্ষায় যাচাই হয়েছে। এই Windows environment-এ Android SDK compile বা actual contact picker চালানো হয়নি। নতুন GitHub build ও ফোনে APK update দিয়ে আসল device test সম্পন্ন করতে হবে।
