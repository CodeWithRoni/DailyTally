# Admin overview design update

চিহ্নিত overview অংশে পরিবর্তন:

- চারটি compact summary card-এ পৃথক semantic accent, stroke icon, পরিষ্কার সংখ্যা, border ও হালকা shadow।
- Total users, Active accounts এবং Blocked accounts কার্ডে চাপলে সংশ্লিষ্ট account list খোলে। Active sessions বর্তমান session count দেখায়।
- Refresh icon দিয়ে সার্ভার থেকে সর্বশেষ overview আনা যায়।
- Manage users-এ account health bar বাস্তব active/total অনুপাত দেখায়; এটি কোনো বানানো trend নয়।
- Recent admin activity-তে action অনুযায়ী icon ও timestamp-সহ timeline। খালি থাকলে পরিপাটি empty state।
- বাংলা/English, light/dark mode, ছোট screen ও reduced-motion পছন্দের জন্য styling।

ZIP extract করে ভেতরের ফাইল ও ফোল্ডার GitHub repository-এর root-এ আগেরগুলোর উপর আপলোড করুন। Render deploy শেষ হলে অ্যাপ refresh/reopen করুন। শুধু এই design update-এর জন্য নতুন APK build প্রয়োজন নেই। আগের Android Google/fingerprint update-এর নতুন APK প্রয়োজনীয়তা অপরিবর্তিত।

সংশ্লিষ্ট ৭টি automated test পাস করেছে: admin access control, SQLite/Turso, interface rendering, filter navigation, refresh, activity ও client startup। এই সেশনে browser preview চালু করা যায়নি; ফোনে final visual layout এখনও যাচাই করতে হবে।
