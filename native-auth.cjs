const crypto=require('node:crypto');
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
function createNativeAuth(db,{body,fail,send,matches,cookie,secure,googleClientId,finishGoogle,verifyGoogle}){
 db.exec('CREATE TABLE IF NOT EXISTS native_device_keys(id TEXT PRIMARY KEY,user_id TEXT NOT NULL,public_key TEXT NOT NULL);CREATE TABLE IF NOT EXISTS native_auth_challenges(id TEXT PRIMARY KEY,user_id TEXT NOT NULL,session_token TEXT NOT NULL,purpose TEXT NOT NULL,credential_id TEXT NOT NULL,challenge TEXT NOT NULL,expires INTEGER NOT NULL);');
 const limits=new Map();
 function active(id){return db.prepare("SELECT * FROM users WHERE id=? AND account_status='active'").get(id)}
 function issue(res,user,purpose,credentialId=''){
  db.prepare('DELETE FROM native_auth_challenges WHERE expires<?').run(Date.now());
  const id=crypto.randomBytes(32).toString('hex'),challenge=crypto.randomBytes(32).toString('base64url'),binding=crypto.randomBytes(32).toString('hex');
  db.prepare('INSERT INTO native_auth_challenges VALUES(?,?,?,?,?,?,?)').run(id,user?.id||'',user?.session_token||hash(binding),purpose,credentialId,challenge,Date.now()+300000);
  if(!user)res.setHeader('Set-Cookie',`dt_native=${binding}; Path=/; HttpOnly; SameSite=Strict; Max-Age=300${secure?'; Secure':''}`);
  return {id,challenge,...(credentialId?{keyId:credentialId}:{})};
 }
 function consume(req,input,purpose,user){
  const c=db.prepare('DELETE FROM native_auth_challenges WHERE id=? RETURNING *').get(String(input.id||''));
  const binding=/\bdt_native=([a-f0-9]{64})\b/.exec(req.headers.cookie||'')?.[1];
  if(!c||c.purpose!==purpose||c.expires<=Date.now()||(purpose==='register'?(!user||c.user_id!==user.id||c.session_token!==user.session_token):(!binding||c.session_token!==hash(binding))))fail(401,'ডিভাইস যাচাই আবার শুরু করুন।');
  if(c.user_id&&!active(c.user_id))fail(401,'আবার লগইন করুন।');return c;
 }
 function signature(key,challenge,signature){try{if(typeof signature!=='string'||signature.length>1500)return false;return crypto.verify('RSA-SHA256',Buffer.from(challenge),{key,padding:crypto.constants.RSA_PKCS1_PADDING},Buffer.from(signature,'base64'))}catch{return false}}
 async function route(req,res,path,user){
  if(!path.startsWith('/api/native-auth/'))return false;
  const now=Date.now(),ip=req.socket.remoteAddress;for(const[k,v]of limits)if(v.until<now)limits.delete(k);const limit=limits.get(ip)||{until:now+900000,count:0};limits.set(ip,limit);if(++limit.count>80)fail(429,'অনেকবার চেষ্টা হয়েছে। পরে চেষ্টা করুন।');
  if(req.method!=='POST')fail(405,'অনুমোদিত নয়।');const input=await body(req);
  if(path==='/api/native-auth/google/options'){const clientId=googleClientId();if(!clientId)fail(503,'এই লগইন সেবা এখনও চালু হয়নি।');send(res,200,{...issue(res,null,'google'),clientId});return true}
  if(path==='/api/native-auth/google/verify'){
   const c=consume(req,input,'google');let profile;
   try{if(typeof input.token!=='string'||input.token.length>20000)throw Error();if(verifyGoogle)profile=await verifyGoogle(input.token,googleClientId());else{const {OAuth2Client}=require('google-auth-library');const ticket=await new OAuth2Client().verifyIdToken({idToken:input.token,audience:googleClientId()});profile=ticket.getPayload()}}
   catch{fail(401,'Google লগইন যাচাই হয়নি। আবার চেষ্টা করুন।')}
   if(!profile?.sub||typeof profile.sub!=='string'||profile.nonce!==c.challenge)fail(401,'Google লগইন যাচাই হয়নি। আবার চেষ্টা করুন।');
   const result=finishGoogle(res,{provider:'google',subject:profile.sub,name:String(profile.name||'').slice(0,100),email:profile.email_verified===true?String(profile.email||'').toLowerCase():''});send(res,200,result);return true;
  }
  if(path==='/api/native-auth/register/options'){
   if(!user)fail(401,'আগে লগইন করুন।');if(!await matches(input.password,user))fail(401,'বর্তমান পাসওয়ার্ড সঠিক নয়।');
   if(active(user.id)?.password!==user.password)fail(401,'আবার লগইন করুন।');if(db.prepare('SELECT id FROM native_device_keys WHERE user_id=?').all(user.id).length>=10)fail(400,'ডিভাইসের সীমা পূর্ণ হয়েছে।');send(res,200,issue(res,user,'register',crypto.randomUUID()));return true;
  }
  if(path==='/api/native-auth/register/verify'){
   const c=consume(req,input,'register',user);let key;
   try{if(typeof input.publicKey!=='string'||input.publicKey.length>2000)throw Error();key=crypto.createPublicKey({key:Buffer.from(input.publicKey,'base64'),format:'der',type:'spki'});if(key.asymmetricKeyType!=='rsa'||key.asymmetricKeyDetails.modulusLength<2048)throw Error()}catch{fail(400,'ডিভাইস যাচাই হয়নি। আবার চেষ্টা করুন।')}
   if(!signature(key,c.challenge,input.signature))fail(401,'ডিভাইস যাচাই হয়নি। আবার চেষ্টা করুন।');db.prepare('INSERT INTO native_device_keys VALUES(?,?,?)').run(c.credential_id,user.id,input.publicKey);send(res,201,{id:c.credential_id,phone:user.phone});return true;
  }
  if(path==='/api/native-auth/login/options'){
   const account=db.prepare("SELECT * FROM users WHERE phone=? AND account_status='active'").get(String(input.phone||'')),key=account&&db.prepare('SELECT id FROM native_device_keys WHERE id=? AND user_id=?').get(String(input.credentialId||''),account.id);
   if(!key)fail(401,'এই ডিভাইসে লগইন চালু নেই। পাসওয়ার্ড দিয়ে লগইন করুন।');const c=issue(res,null,'login',key.id);db.prepare('UPDATE native_auth_challenges SET user_id=? WHERE id=?').run(account.id,c.id);send(res,200,c);return true;
  }
  if(path==='/api/native-auth/login/verify'){
   const c=consume(req,input,'login'),record=db.prepare('SELECT * FROM native_device_keys WHERE id=? AND user_id=?').get(c.credential_id,c.user_id);let key;try{key=crypto.createPublicKey({key:Buffer.from(record.public_key,'base64'),format:'der',type:'spki'})}catch{fail(401,'ডিভাইস যাচাই হয়নি। আবার চেষ্টা করুন।')}
   if(!signature(key,c.challenge,input.signature))fail(401,'ডিভাইস যাচাই হয়নি। আবার চেষ্টা করুন।');cookie(res,c.user_id);send(res,200,{ok:true});return true;
  }
  if(path==='/api/native-auth/remove'){if(!user)fail(401,'আগে লগইন করুন।');db.prepare('DELETE FROM native_device_keys WHERE id=? AND user_id=?').run(String(input.id||''),user.id);send(res,200,{ok:true});return true}
  fail(404,'পাওয়া যায়নি।');
 }
 return {route};
}
module.exports={createNativeAuth};
