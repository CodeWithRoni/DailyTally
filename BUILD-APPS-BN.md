# DailyTally — APK / EXE / DMG / IPA build

এই প্যাকেজে বর্তমান live web app-এর জন্য Android ও iOS WebView client এবং Windows/macOS Electron client আছে। App URL: https://dailytally-aaqk.onrender.com । Database বা secret token installer-এ রাখা হয় না। সব client একই HTTPS backend ব্যবহার করে।

## GitHub-এ যোগ করুন

1. এই ZIP Extract করুন।
2. Repository-র root-এ নতুন `apps` ফোল্ডারটি upload করুন (ভিতরে ৫১টি source/icon ফাইল; node_modules দেবেন না)। পুরোনো resources ফোল্ডার দরকার নেই।
3. Repository-র `scripts` ফোল্ডার খুলে `prepare-apps.cjs` upload করুন। আগের sync-client.cjs রাখবেন।
4. Repository-র `.github/workflows` ফোল্ডার খুলে `build-apps.yml` upload করুন। আগের ci.yml ও render-health.yml রাখবেন। `.github` ফোল্ডার টেনে upload না হলে সরাসরি ফোল্ডারের ভেতরে এই একটি ফাইল দিন।
5. root-এর `.gitignore` নতুনটি দিয়ে update করুন। এটি build output ও signing files Git-এ যাওয়া আটকায়; browser upload নিজে থেকে .gitignore মেনে চলে না।
6. Commit করার পর Actions → Build Apps → Run workflow। Branch main রাখুন।

## আগে Android পরীক্ষা করুন

Platform: android
Android release: বন্ধ
Signed iOS: বন্ধ

Workflow সফল হলে run-এর নিচে Artifacts → DailyTally-Android-APK download করুন। Artifact ZIP Extract করলে app-debug.apk পাবেন। এটি পরীক্ষার APK। প্রতি clean build-এর debug signing key আলাদা হতে পারে, তাই পুরোনো test APK-এর ওপর নতুনটি install না হলে আগে পুরোনো test app uninstall করতে হতে পারে; unsynced local data হারাতে পারে। নিয়মিত আপডেটের জন্য নিজের স্থায়ী release key দিয়ে sign করতে হবে।

## Windows ও Mac

Platform: windows → EXE installer। Platform: macos → Intel x64 ও Apple Silicon arm64 DMG। নিজের CPU অনুযায়ী DMG নিন। সব output বর্তমান configuration-এ unsigned। Windows/macOS publisher/signing বা Apple notarization দেওয়া নেই; OS trust warning আসতে পারে। এগুলো store submission-এর নিশ্চয়তা নয়।

## iPhone

Platform: ios এবং Signed iOS বন্ধ থাকলে iOS Simulator-এর .app ZIP হবে; এটি iPhone-এ install করার IPA নয়।

ইনস্টলযোগ্য signed IPA পেতে Apple Developer distribution certificate (.p12), তার password এবং `io.ahroni.dailytally` App ID-এর সঠিক provisioning profile দরকার। GitHub → Settings → Secrets and variables → Actions → Repository secrets-এ দিন:

- IOS_CERTIFICATE_BASE64: .p12 ফাইলের base64
- IOS_CERTIFICATE_PASSWORD
- IOS_PROFILE_BASE64: .mobileprovision ফাইলের base64
- IOS_TEAM_ID

তারপর Signed iOS চালু করুন। নিবন্ধিত test device-এর জন্য matching profile দিয়ে `release-testing`, TestFlight/App Store-এর জন্য matching distribution profile দিয়ে `app-store-connect` বাছুন। Device registration, Apple membership ও App Store Connect setup স্বয়ংক্রিয়ভাবে করা হয়নি। প্রয়োজনীয় secret না থাকলে signed build পরিষ্কার error দিয়ে থামবে। কোনো unsigned file-কে installable IPA বলা হয় না।

## Android release signing

নিজের স্থায়ী keystore তৈরি করে এই Repository secrets দিন:

- ANDROID_KEYSTORE_BASE64
- ANDROID_KEYSTORE_PASSWORD
- ANDROID_KEY_ALIAS
- ANDROID_KEY_PASSWORD

Android release চালু করলে signed release APK হবে। Keystore হারাবেন না বা repository-তে upload করবেন না। versionCode/versionName ভবিষ্যৎ release-এ apps/android/app/build.gradle-এ বাড়াতে হবে।

## এই সংস্করণের সীমা

এগুলো online app clients। Login ও server data-এর জন্য live Render backend দরকার; server-এর Free-tier cold start বা outage installer দিয়েও দূর হয় না। Web UI/server update হলে clients নতুন online UI দেখবে; native code, permissions বা installer বদলালে নতুন build লাগবে। OAuth providers এখনও configure না থাকলে Google/Facebook login disabled-ই থাকবে; system browser OAuth-এর session handoff এখানে তৈরি হয়নি।

Native contact picker ও Android/iOS closed-app push/local notifications এই প্যাকেজে যুক্ত হয়নি। Web Push/PWA-এর সমর্থনকে native app notification হিসেবে ধরে নেবেন না। Contact access না থাকলে বর্তমান app manual name/number entry দেয়। Android-এ camera/gallery file chooser, CSV/JSON export এবং system Print/PDF bridge আছে। iOS-এ WebKit photo/file chooser, download share sheet ও print bridge আছে; এগুলোর বাস্তব phone testing বাকি। Desktop-এ file download ও File → Save report as PDF / Print আছে।

এই কম্পিউটারে desktop schema, workflow YAML, icon references, dependency lock এবং JavaScript syntax যাচাই করা হয়েছে। Android/iOS toolchain build, EXE/DMG generation এবং বাস্তব device test এখনও GitHub Actions-এ চালাতে হবে। GitHub-এর run successful না হওয়া পর্যন্ত installer তৈরি হয়েছে ধরে নেবেন না।

Native app-এর প্রয়োজনীয় platform integration, signing ও store review আলাদা কাজ। কেবল একটি ওয়েবসাইট wrapper হওয়ায় Apple App Store minimum-functionality review-এর অনুমোদন নিশ্চয়তা দেওয়া যায় না।

## URL বদলানো

apps/app-config.json-এ HTTPS origin দিন। scripts/prepare-apps.cjs iOS-এর URL update করে; Android ও Electron একই configuration ব্যবহার করে। App ID বদলালে Android namespace, Java package, iOS bundle ID, signing profile mapping ও Electron appId-ও মিলিয়ে বদলাতে হবে।
