const {createAdmin}=require('./admin.cjs');
const {createServerBackups}=require('./server-backups.cjs');
const {createPasskeys}=require('./passkeys.cjs');
const {createDatabase}=require('./database.cjs');
const {createReminderPush}=require('./reminder-push.cjs');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{promisify}=require('node:util');
const {createFeatures,validExtras}=require('./account-features.cjs');
const {createAuthServices}=require('./auth-services.cjs');
const derive=promisify(crypto.scrypt),hash=s=>crypto.createHash('sha256').update(s).digest('hex');
function createApp({database=path.join(__dirname,'data','daily-tally.sqlite'),secure=process.env.NODE_ENV==='production',origin=process.env.PUBLIC_ORIGIN||(process.env.RENDER_EXTERNAL_URL||''),authConfig={},deliverEmail,providerRequest,pushConfig={},sendPush,reminderNow,turso={},backupNow,adminConfig={}}={}){
 if(secure&&!origin?.startsWith('https://'))throw Error('Production requires HTTPS PUBLIC_ORIGIN');
 if(database!==':memory:')fs.mkdirSync(path.dirname(database),{recursive:true});
 const db=createDatabase({database,turso});if(db.kind==='sqlite')db.exec('PRAGMA journal_mode=WAL');db.exec('CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,phone TEXT UNIQUE NOT NULL,salt TEXT NOT NULL,password TEXT NOT NULL,data TEXT NOT NULL,revision INTEGER NOT NULL DEFAULT 0); CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id TEXT NOT NULL,expires INTEGER NOT NULL);');
 const limits=new Map(),dummySalt=crypto.randomBytes(16).toString('hex');
 function session(req){const token=/\bdt_session=([a-f0-9]{64})\b/.exec(req.headers.cookie||'')?.[1];if(!token)return null;return db.prepare("SELECT users.*,sessions.token AS session_token FROM sessions JOIN users ON users.id=sessions.user_id WHERE token=? AND expires>? AND users.account_status='active'").get(hash(token),Date.now())}
 function cookie(res,userId){if(db.prepare('SELECT account_status FROM users WHERE id=?').get(userId)?.account_status!=='active')fail(403,'এই অ্যাকাউন্টটি বন্ধ আছে। অ্যাডমিনের সঙ্গে যোগাযোগ করুন।');const token=crypto.randomBytes(32).toString('hex');db.prepare('DELETE FROM sessions WHERE expires<?').run(Date.now());db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(hash(token),userId,Date.now()+604800000);res.setHeader('Set-Cookie',`dt_session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800${secure?'; Secure':''}`)}
 function send(res,status,value){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(value))}
 function fail(status,message){throw Object.assign(Error(message),{status})}
 async function body(req){let chunks=[],size=0;for await(const chunk of req){size+=chunk.length;if(size>(req.url.startsWith('/api/data')?20000000:3000000))fail(413,'তথ্যের আকার বেশি।');chunks.push(chunk)}let input;try{input=JSON.parse(Buffer.concat(chunks).toString())}catch{fail(400,'সঠিক তথ্য দিন।')}if(req.accountUserId&&db.prepare('SELECT account_status FROM users WHERE id=?').get(req.accountUserId)?.account_status!=='active')fail(401,'আবার লগইন করুন।');return input}
 function phone(value){const n=String(value||'').replace(/[০-৯]/g,d=>'০১২৩৪৫৬৭৮৯'.indexOf(d)).replace(/[\s()+-]/g,'').replace(/^(00880|880)/,'0');if(!/^01[3-9]\d{8}$/.test(n))fail(400,'সঠিক বাংলাদেশি মোবাইল নম্বর দিন।');return n}
 function password(value){if(typeof value!=='string'||value.length<8||value.length>128)fail(400,'পাসওয়ার্ড ৮ থেকে ১২৮ অক্ষরের হতে হবে।');return value}
 async function matches(value,user){const result=await derive(String(value||'').slice(0,128),user?.salt||dummySalt,64);return !!user&&crypto.timingSafeEqual(result,Buffer.from(user.password,'hex'))}
 function validPhoto(photo){return photo===undefined||photo===''||(typeof photo==='string'&&photo.length<=350000&&/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(photo))}
 function validData(d){const kinds=['expense','given','received','due','settle','sale','purchase','income'];return d&&Array.isArray(d.people)&&Array.isArray(d.entries)&&d.people.length<=50000&&d.entries.length<=100000&&new Set(d.people.map(p=>p.id)).size===d.people.length&&new Set(d.entries.map(e=>e.id)).size===d.entries.length&&d.people.every(p=>validPhoto(p.photo)&&typeof p.id==='string'&&/^[\w-]+$/.test(p.id)&&typeof p.name==='string'&&p.name.length<=100&&typeof p.phone==='string'&&['customer','supplier'].includes(p.role))&&d.entries.every(e=>validPhoto(e.photo)&&typeof e.id==='string'&&/^[\w-]+$/.test(e.id)&&kinds.includes(e.kind)&&Number.isFinite(e.amount)&&e.amount>0&&e.amount<=999999999&&typeof e.note==='string'&&e.note.length<=500&&/^\d{4}-\d{2}-\d{2}$/.test(e.date)&&(!e.time||/^([01]\d|2[0-3]):[0-5]\d$/.test(e.time))&&(!e.person||d.people.some(p=>p.id===e.person))&&(!['given','received','due','settle'].includes(e.kind)||!!e.person))&&validExtras(d)&&(!d.profile||(typeof d.profile.name==='string'&&d.profile.name.length<=50&&typeof d.profile.photo==='string'&&d.profile.photo.length<=1500000&&(!d.profile.photo||/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(d.profile.photo))))}
 const features=createFeatures(db,{body,fail,send,phone,password,matches,validData});
 const authServices=createAuthServices(db,{body,fail,send,phone,password,matches,cookie,secure,config:{...authConfig,...(origin?{PUBLIC_ORIGIN:origin}:{})},deliver:deliverEmail,request:providerRequest||fetch});
 let admin;try{admin=createAdmin(db,{body,fail,send,phone,email:authServices.email,matches,config:adminConfig})}catch(error){db.close();throw error}
 const passkeys=createPasskeys(db,{body,fail,send,phone,matches,cookie,origin});
 const serverBackups=createServerBackups(db,{body,fail,send,now:backupNow});
 const backupCleanupTimer=setInterval(()=>{try{serverBackups.prune()}catch{}},300000);backupCleanupTimer.unref();
 const reminderPush=createReminderPush(db,{body,fail,send,origin,config:pushConfig,sendPush,now:reminderNow});
 const reminderTimer=setInterval(()=>{void reminderPush.tick().catch(()=>{})},15000);reminderTimer.unref();
 const server=http.createServer(async(req,res)=>{res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Frame-Options','DENY');res.setHeader('Referrer-Policy','same-origin');try{
 const pathname=new URL(req.url,'http://localhost').pathname;
 if(pathname==='/healthz'){if(!['GET','HEAD'].includes(req.method))return send(res,405,{});return send(res,200,{status:'ok',app:'DailyTally'})}
 if(pathname==='/readyz'&&req.method==='GET'){try{db.prepare('SELECT 1 AS ok').get();return send(res,200,{status:'ready'})}catch{return send(res,503,{status:'unavailable'})}}
 if(!pathname.startsWith('/api/')){if(!['GET','HEAD'].includes(req.method))return send(res,405,{});const files={'/':'index.html','/index.html':'index.html','/mobile.css':'mobile.css','/theme.css':'theme.css','/sw.js':'sw.js','/auth.js':'auth.js','/i18n.js':'i18n.js','/refresh.js':'refresh.js','/assets/icon.png':'assets/icon.png','/site.webmanifest':'site.webmanifest','/assets/favicon.ico':'assets/favicon.ico','/assets/apple-touch-icon.png':'assets/apple-touch-icon.png','/assets/android-chrome-192x192.png':'assets/android-chrome-192x192.png','/assets/android-chrome-512x512.png':'assets/android-chrome-512x512.png','/assets/maskable-192.png':'assets/maskable-192.png','/assets/maskable-512.png':'assets/maskable-512.png'};const file=files[pathname];if(!file)return send(res,404,{});res.writeHead(200,{'Content-Type':file.endsWith('.webmanifest')?'application/manifest+json':file.endsWith('.ico')?'image/x-icon':file.endsWith('.png')?'image/png':file.endsWith('.css')?'text/css':file.endsWith('.js')?'text/javascript':'text/html; charset=utf-8','Cache-Control':'no-cache'});return res.end(req.method==='HEAD'?'':fs.readFileSync(path.join(__dirname,'dist',file)))}
 if(!['GET','POST','PUT'].includes(req.method))fail(405,'অনুমোদিত নয়।');
 if(req.method!=='GET'&&req.headers.origin!==(origin||`http://${req.headers.host}`))fail(403,'অনুমোদিত উৎস নয়।');
 if(req.method!=='GET'&&!req.headers['content-type']?.startsWith('application/json'))fail(415,'JSON প্রয়োজন।');
 const user=session(req);req.accountUserId=user?.id;
 if(['/api/register','/api/login'].includes(pathname)&&req.method==='POST'){
 const now=Date.now(),key=req.socket.remoteAddress;for(const [k,v]of limits)if(now-v.start>900000)limits.delete(k);const limit=limits.get(key)||{start:now,count:0};limits.set(key,limit);if(++limit.count>30)fail(429,'অনেকবার চেষ্টা হয়েছে। ১৫ মিনিট পরে চেষ্টা করুন।');
 const input=await body(req),number=phone(input.phone),pass=password(input.password);
 if(pathname==='/api/register'){const name=String(input.name||'').trim();if(!name||name.length>50)fail(400,'আপনার নাম দিন।');const email=input.email?authServices.email(input.email):'';const photo=input.photo===undefined?'':input.photo;if(typeof photo!=='string'||photo.length>1500000||(photo&&!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(photo)))fail(400,'প্রোফাইল ছবিটি সঠিক নয়।');const salt=crypto.randomBytes(16).toString('hex'),derived=await derive(pass,salt,64),id=crypto.randomUUID();try{db.prepare('INSERT INTO users(id,phone,salt,password,data) VALUES(?,?,?,?,?)').run(id,number,salt,derived.toString('hex'),JSON.stringify({people:[],entries:[],profile:{name,photo}}))}catch(error){if(String(error.code).includes('CONSTRAINT')||String(error.message).includes('UNIQUE'))fail(409,'এই নম্বরে অ্যাকাউন্ট আছে। লগইন করুন।');throw error}if(email)db.prepare('UPDATE users SET email=? WHERE id=?').run(email,id);db.prepare('UPDATE users SET created_at=? WHERE id=?').run(Date.now(),id);cookie(res,id);return send(res,201,{phone:number})}
 const account=db.prepare('SELECT * FROM users WHERE phone=?').get(number);if(!await matches(pass,account))fail(401,'নম্বর বা পাসওয়ার্ড সঠিক নয়।');admin.loginCheck(account,input);cookie(res,account.id);return send(res,200,{phone:number});}
 if(await admin.route(req,res,pathname,user))return;
 if(await passkeys.route(req,res,pathname,user))return;
 if(await authServices.route(req,res,pathname,user))return;
 if(await features.route(req,res,pathname,user))return;
 if(await serverBackups.route(req,res,pathname,user))return;
 if(await reminderPush.route(req,res,pathname,user))return;
 if(!user)fail(401,'আগে লগইন করুন।');
 if(pathname==='/api/session'&&req.method==='GET')return send(res,200,admin.identity(user));
 if(pathname==='/api/data'&&req.method==='GET')return send(res,200,{data:JSON.parse(user.data),revision:user.revision,accountId:user.id});
 if(pathname==='/api/data'&&req.method==='PUT'){const input=await body(req);return send(res,200,features.writeData(user,input))}
 if(pathname==='/api/password'&&req.method==='POST'){const input=await body(req),pass=password(input.newPassword);if(!await matches(input.currentPassword,user))fail(400,'বর্তমান পাসওয়ার্ড সঠিক নয়।');const salt=crypto.randomBytes(16).toString('hex'),derived=await derive(pass,salt,64);db.exec('BEGIN');try{db.prepare('UPDATE users SET salt=?,password=? WHERE id=?').run(salt,derived.toString('hex'),user.id);db.prepare('DELETE FROM sessions WHERE user_id=?').run(user.id);db.prepare('DELETE FROM email_challenges WHERE user_id=?').run(user.id);db.exec('COMMIT')}catch(e){db.exec('ROLLBACK');throw e}cookie(res,user.id);return send(res,200,{ok:true})}
 if(pathname==='/api/logout'&&req.method==='POST'){db.prepare('DELETE FROM sessions WHERE token=?').run(user.session_token);res.setHeader('Set-Cookie',`dt_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure?'; Secure':''}`);return send(res,200,{ok:true})}
 fail(404,'পাওয়া যায়নি।');
 }catch(error){send(res,error.status||500,{error:error.status?error.message:'সার্ভারে সমস্যা হয়েছে। আবার চেষ্টা করুন।',...(error.adminEmailRequired?{adminEmailRequired:true}:{})})}});
 return {server,reminderPush,close:async()=>{clearInterval(reminderTimer);clearInterval(backupCleanupTimer);await reminderPush.stop();await new Promise(resolve=>server.close(()=>{Promise.resolve(db.close()).then(resolve,resolve)}))}};
}
if(require.main===module){require('./scripts/sync-client.cjs').syncClient();const app=createApp();app.server.listen(Number(process.env.PORT)||3000,process.env.HOST||(process.env.RENDER?'0.0.0.0':'127.0.0.1'),()=>console.log('DailyTally: http://localhost:'+(process.env.PORT||3000)))}
module.exports={createApp};
