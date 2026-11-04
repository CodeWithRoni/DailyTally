# Language, remembered mobile number ও device sign-in

## GitHub-এ আপডেট

এই প্যাকেজের ফাইলগুলো একই নামে repository-তে upload/replace করে commit করুন। `dist`, `scripts`, `tests` folder-এর ভেতরের ফাইলগুলো সঠিক folder-এ দিতে হবে। Render-এর deployment সফল হওয়া পর্যন্ত অপেক্ষা করুন। `package.json` এবং `package-lock.json` দুটোই দিন—নতুন passkey library লাগবে। আগের server-backup update-টিও এই প্যাকেজে রয়েছে। কোনো token বা `.env` upload করবেন না।

## ব্যবহার

- Profile → Account tools → Language: English / বাংলা। Login পেজের language switch-ও থাকবে। নতুনভাবে app খুললে আগের সিদ্ধান্ত অনুযায়ী default English থাকে।
- সর্বশেষ সফল লগইনের মোবাইল নম্বর এই browser/device-এ মনে থাকবে। পাসওয়ার্ড অ্যাপ localStorage-এ রাখে না। পুরোনো browser password-manager entry-তে email username থাকলে সেটি একবার mobile number দিয়ে update করুন। Browser-এর নিজস্ব autofill-এর ওপর অ্যাপের সম্পূর্ণ নিয়ন্ত্রণ নেই।
- Profile → Account tools → Device sign-in থেকে বর্তমান password দিয়ে চালু করুন, তারপর ফোনের system verification সম্পন্ন করুন। পরের বার app খুলে Device sign-in চাপলে system verification শেষে সরাসরি account খুলবে। Password login বিকল্প হিসেবে থাকবে।
- Device sign-in একই device/browser-এর জন্য। বন্ধ করতে একই option খুলে Disable on this device চাপুন। Browser storage মুছে গেলে shortcut-টি আর মনে থাকবে না; password দিয়ে login করা যাবে।

## আসল ডিভাইসের প্রয়োজনীয়তা

HTTPS-এ Chrome/Safari-এর মতো WebAuthn/passkey সমর্থিত browser এবং screen lock থাকা প্রয়োজন। সিস্টেম Face ID, Touch ID, fingerprint অথবা device PIN ব্যবহার করতে পারে; অ্যাপ নির্দিষ্ট biometric বাধ্য করতে পারে না। Internet ছাড়া passkey দিয়ে server login হবে না। Browser-এর অনুমতি অনুযায়ী user-কে Device sign-in button চাপতে হবে।

বর্তমান APK/IPA-এর সাধারণ WebView-এ এই সুবিধা নিশ্চিত নয়। সেগুলোতে native biometric/credential bridge এবং platform configuration আলাদাভাবে যোগ ও আসল ফোনে পরীক্ষা করতে হবে। এই update-টি unsupported device-এ সফলতার ভান করবে না; password login রাখবে। APK/IPA-তে native biometric কাজ করছে বলে এই প্যাকেজ দাবি করে না।

Server শুধু public key ও signature counter রাখে, biometric ছবি/template রাখে না। Enrollment-এ password ও device verification প্রয়োজন। Login-এ signature, challenge, domain/origin এবং user verification যাচাই হয়। Challenge একবারই ব্যবহারযোগ্য ও ৫ মিনিটে expire হয়। Credential বদলানো/মোছা অন্য account থেকে করা যায় না। Passkey চালু থাকলে startup-এ cached account সরাসরি খোলে না।

Reference: https://simplewebauthn.dev/docs/packages/server

## যাচাই

`npm test` দিয়ে tests চালানো যায়। আসল Face ID/fingerprint prompt-এর জন্য live HTTPS app-এ supported phone দিয়ে enable → close/reopen → unlock → cancel → password fallback → disable পরীক্ষা করুন। Local automated test-এ বাস্তব cryptographic key দিয়ে signature/origin/user-verification/replay/counter ও account isolation পরীক্ষা হয়; এটি physical phone test-এর বিকল্প নয়।
