# Back, exit confirmation ও header spacing update

## কী বদলেছে

- Android app-এর Back button/gesture খোলা dialog আগে বন্ধ করে। অন্য tab থেকে Back করলে Home খুলবে। Admin workspace হলে অন্য admin tab থেকে Overview খুলবে।
- Home/Overview থেকে Back দিলে modern exit confirmation আসবে। No, stay চাপলে app থাকবে; Yes, exit চাপলে Android app বন্ধ হবে। Account logout হবে না।
- হিসাব server-এ save হওয়ার সময় exit আটকানো থাকবে।
- Android status bar, display cutout এবং নিচের system navigation/keyboard-এর জায়গা native container থেকে আলাদা করে রাখা হয়েছে। WebView-এর নিজস্ব padding-এর ওপর আর নির্ভর করছে না।
- Header-এ একটু বাড়তি breathing space এবং pull-refresh message header-এর নিচে রাখা হয়েছে।
- Android 13+ back callback ও পুরোনো Android back button—দুটোর handler আছে। APK versionCode 2 / versionName 1.0.1 করা হয়েছে।
- পরীক্ষায় ধরা পড়া database shutdown/reconnect সমস্যার জন্য libSQL worker-কে স্বাভাবিকভাবে connection বন্ধ করে exit করার ব্যবস্থা করা হয়েছে। `database.cjs` ও `turso-worker.cjs`-ও এই প্যাকেজে রয়েছে।

## আপডেট দেওয়ার নিয়ম

1. ZIP-এর `dist`, `scripts`, `apps`, `tests` folder-এর ফাইলগুলো GitHub-এর একই path-এ upload/replace করুন। বাইরের folder বা ZIP সরাসরি upload করবেন না।
2. Render deploy শেষ হলে app-এর web interface নতুন হবে।
3. Back handling, native exit ও status-bar spacing-এর জন্য **নতুন APK build/install করা প্রয়োজন**। পুরোনো APK-তে শুধু Render deploy করে native পরিবর্তন আসবে না।
4. Actions → Build Apps → Run workflow → platform `android`, android_release চালু করুন। আগে তৈরি করা signing secrets ও একই keystore ব্যবহার করুন।
5. Artifacts → DailyTally-Android-APK থেকে ZIP নামিয়ে release APK ইনস্টল করুন। একই signing key হলে existing app-এর update হিসেবে ইনস্টল হবে। Uninstall করে পুরোনো local/offline data হারানোর দরকার নেই। যদি আপনার repo-তে versionCode ইতিমধ্যে 2 বা বেশি করা থাকে, build.gradle-এ সেটি আরও বাড়ান।

## ফোনে পরীক্ষা

- Reports → Back → Home। Profile → Back → Home।
- Home → Back → No → app খোলা থাকবে। আবার Back → Yes → app বন্ধ হবে।
- Dialog খোলা থাকলে Back শুধু dialog বন্ধ করবে।
- Admin Settings → Back → Overview → Back → exit confirmation।
- Home-এর একদম উপরে থেকে pull-refresh করলে message header-এর নিচে থাকবে। Logo ও profile যেন status bar/camera hole-এর নিচে থাকে তা portrait/landscape-এ দেখুন।

JavaScript navigation ও refresh-এর automated পরীক্ষা করা হয়েছে। এই computer-এ Android SDK দিয়ে native APK compile অথবা actual phone-এ layout/gesture পরীক্ষা হয়নি; GitHub build ও নতুন APK-তে পরীক্ষা সম্পন্ন করতে হবে। Browser tab, iPhone বা PWA-কে জোর করে বন্ধ করার পরিবর্তন করা হয়নি। এই native exit সংযোগ Android APK-এর জন্য।
