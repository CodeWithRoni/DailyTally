# Android login ও keyboard আপডেট — 1.0.4

## কী পরিবর্তন হয়েছে

- APK-এর Google বাটন Android Credential Manager খুলবে। যাচাই শেষে একই APK-তে লগইন সম্পন্ন হবে; WebView থেকে Chrome-এ cookie স্থানান্তর করতে হবে না।
- সার্ভার Google-এর official library দিয়ে ID token-এর signature, audience, issuer ও expiry যাচাই করে। অতিরিক্ত একবার ব্যবহারযোগ্য nonce ও WebView cookie দিয়ে অনুরোধটি বাঁধা থাকে।
- আগে যুক্ত না থাকা Google account-এর ক্ষেত্রে আগের মতো মোবাইল নম্বর ও পাসওয়ার্ড দিয়ে account link করতে হবে। শুধু ইমেইল মিলিয়ে অন্যের account খুলে যাবে না।
- Android-এ browser passkey-এর পরিবর্তে Android BiometricPrompt ও Android Keystore key ব্যবহার হবে। Private key সার্ভারে বা সাধারণ app storage-এ পাঠানো হয় না।
- Android 11+ এ শক্তিশালী biometric অথবা device PIN/pattern/password ব্যবহার করা যাবে। Android 7–10 এ শক্তিশালী fingerprint প্রয়োজন। দুর্বল face unlock সব ফোনে গ্রহণযোগ্য নয়।
- Keyboard খোলার সময় একই সঙ্গে দুইভাবে screen resize বন্ধ করা হয়েছে। Back চাপলে আগে keyboard বন্ধ হবে।

## ১. GitHub ও Render আপডেট

এই ZIP-এর ভেতরের ফাইল ও ফোল্ডার repository-এর root-এ আগেরগুলোর উপর আপলোড করুন। ZIP-টিকে একটি ফাইল হিসেবে repository-তে রাখলে আপডেট হবে না। নতুন `native-auth.cjs`, `package.json`, `package-lock.json`, `auth-services.cjs`, `server.cjs`, `admin.cjs`, `dist`, `apps/android` ও পরীক্ষার ফাইলগুলোও দিতে হবে।

Render-এ নতুন commit deploy করুন। আগের `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `PUBLIC_ORIGIN` ও Turso environment variables থাকবে। Android client secret প্রয়োজন নেই; সার্ভারে আগের **Web application client ID** ব্যবহার হয়। নতুন database tables অ্যাপ নিজে তৈরি করে।

## ২. Google Console-এ Android client যোগ করুন — একবার

আপনার আগের Google Cloud project `dailytally-513705`-এর **Google Auth Platform → Clients → Create client** খুলুন।

- Application type: **Android**
- Name: **DailyTally Android**
- Package name: **io.ahroni.dailytally**
- SHA-1 certificate fingerprint: নিচের command দিয়ে আপনার release keystore থেকে পাওয়া SHA-1।

Windows Command Prompt-এ চালান:

```bat
keytool -list -v -keystore "%USERPROFILE%\Documents\DailyTally-Signing\DailyTally-release.jks" -alias dailytally
```

নিজের keystore password লিখুন। ফলাফলে **SHA1:**-এর পরের fingerprint কপি করে Console-এ দিন। Password বা keystore আমাকে পাঠাতে হবে না। Android client তৈরি হওয়ার পরে আগের **Web application** client মুছবেন না বা তার ID দিয়ে Android client-এর ID প্রতিস্থাপন করবেন না। দুই client একই Google Cloud project-এ থাকবে।

যে signing key দিয়ে APK build হবে, সেই key-এর SHA-1 লাগবে। Debug APK ও release APK-এর key আলাদা। ভবিষ্যতে Google Play App Signing ব্যবহার করলে Play Console-এর App signing certificate-এর SHA-1 দিয়েও Android client যোগ করতে হবে। Console-এর পরিবর্তন কার্যকর হতে কিছু সময় লাগতে পারে।

Google-এর নির্দেশনা: https://developer.android.com/identity/sign-in/credential-manager-siwg

## ৩. নতুন signed APK বানান

GitHub → Actions → Build Apps → Run workflow:

- platform: **android**
- android_release: **true / checked**
- আগের একই release signing secrets ব্যবহার করুন।

Artifact থেকে APK বের করে পুরোনো APK-এর উপর update install করুন। নতুন version **1.0.4**, versionCode **5**। কেবল Render deploy করলে ফোনে ইনস্টল করা পুরোনো APK-এর native অংশ বদলাবে না।

## ৪. ফোনে পরীক্ষা

১. Sign in এবং registration screen-এ প্রতিটি input-এ কয়েকটি শব্দ/সংখ্যা লিখুন; keyboard স্থির থাকা উচিত। Keyboard খোলা থাকলে Back-এ আগে keyboard বন্ধ হবে।

২. Google বাটনে চাপুন। Android-এর account chooser আসবে। Account বেছে নিয়ে APK-তে ফিরে হিসাব দেখুন। বাতিল করলেও পাসওয়ার্ড login চালু থাকবে। ফোনে Google Play services ও একটি Google account থাকা প্রয়োজন।

৩. ফোনের Settings থেকে fingerprint বা secure screen lock চালু রাখুন। DailyTally → Profile → Account tools → Device login-এ বর্তমান password দিয়ে চালু করুন। এরপর sign out করে Device login চাপুন এবং fingerprint/PIN দিয়ে যাচাই করুন।

৪. আগে browser passkey চালু থাকলে সেটি বন্ধ করে APK থেকে নতুন করে Device login চালু করুন। Browser passkey ও Android Keystore key আলাদা। ফোনের biometric বা screen lock বদলালে key বাতিল হতে পারে; তখন password দিয়ে login করে আবার চালু করতে হবে।

## যাচাইয়ের সীমা

Server/client automated tests এবং Android Java syntax পরীক্ষা করা হয়েছে। এই কম্পিউটারে Android SDK ও সংযুক্ত ফোন নেই; APK compile এবং ফোনের Google chooser, keyboard ও biometric prompt-এর বাস্তব পরীক্ষা GitHub build ও আপনার ফোনে করতে হবে।
