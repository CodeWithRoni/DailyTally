const crypto=require('node:crypto');
function createPasskeys(db,{body,fail,send,phone,matches,cookie,origin}){
 db.exec('CREATE TABLE IF NOT EXISTS passkeys(id TEXT PRIMARY KEY,user_id TEXT NOT NULL,public_key TEXT NOT NULL,counter INTEGER NOT NULL,transports TEXT NOT NULL); CREATE TABLE IF NOT EXISTS passkey_challenges(id TEXT PRIMARY KEY,user_id TEXT NOT NULL,session_token TEXT,purpose TEXT NOT NULL,challenge TEXT NOT NULL,expires INTEGER NOT NULL);');
 const expectedOrigin=origin||'http://localhost:3000',rpID=new URL(expectedOrigin).hostname,limits=new Map();
 function challenge(user,purpose,options){if(!db.prepare("SELECT id FROM users WHERE id=? AND account_status='active'").get(user.id))fail(401,'আবার লগইন করুন।');db.prepare('DELETE FROM passkey_challenges WHERE expires<?').run(Date.now());const id=crypto.randomBytes(32).toString('hex');db.prepare('INSERT INTO passkey_challenges VALUES(?,?,?,?,?,?)').run(id,user.id,user.session_token||'',purpose,options.challenge,Date.now()+300000);return {id,options}}
 function consume(id,purpose,user){if(typeof id!=='string')fail(400,'ডিভাইস যাচাই আবার শুরু করুন।');const c=db.prepare('DELETE FROM passkey_challenges WHERE id=? RETURNING *').get(id);if(!c||c.purpose!==purpose||c.expires<Date.now()||(purpose==='register'&&(!user||user.id!==c.user_id||user.session_token!==c.session_token)))fail(400,'ডিভাইস যাচাই আবার শুরু করুন।');return c}
 async function route(req,res,path,user){if(!path.startsWith('/api/passkeys/'))return false;
  const key=req.socket.remoteAddress,now=Date.now();for(const[k,v]of limits)if(v.until<now)limits.delete(k);const limit=limits.get(key)||{until:now+900000,count:0};limits.set(key,limit);if(++limit.count>90)fail(429,'অনেকবার চেষ্টা হয়েছে। পরে চেষ্টা করুন।');
  if(path==='/api/passkeys/status'&&req.method==='GET'){if(!user)fail(401,'আগে লগইন করুন।');return send(res,200,{credentials:db.prepare('SELECT id FROM passkeys WHERE user_id=?').all(user.id).map(c=>c.id)}),true}
  if(req.method!=='POST')fail(405,'অনুমোদিত নয়।');const input=await body(req);
  if(path==='/api/passkeys/remove'){if(!user)fail(401,'আগে লগইন করুন।');db.prepare('DELETE FROM passkeys WHERE id=? AND user_id=?').run(String(input.id||''),user.id);return send(res,200,{ok:true}),true}
  const webauthn=await import('@simplewebauthn/server');
  if(path==='/api/passkeys/register/options'){
   if(!user)fail(401,'আগে লগইন করুন।');if(!await matches(input.password,user))fail(401,'বর্তমান পাসওয়ার্ড সঠিক নয়।');const existing=db.prepare('SELECT id FROM passkeys WHERE user_id=?').all(user.id);if(existing.length>=10)fail(400,'ডিভাইসের সীমা পূর্ণ হয়েছে।');
   const options=await webauthn.generateRegistrationOptions({rpName:'DailyTally',rpID,userName:user.phone,userID:Buffer.from(user.id),attestationType:'none',excludeCredentials:existing,authenticatorSelection:{authenticatorAttachment:'platform',residentKey:'preferred',userVerification:'required'}});return send(res,200,challenge(user,'register',options)),true;
  }
  if(path==='/api/passkeys/register/verify'){
   if(!user)fail(401,'আগে লগইন করুন।');const c=consume(input.id,'register',user);let result;try{result=await webauthn.verifyRegistrationResponse({response:input.response,expectedChallenge:c.challenge,expectedOrigin,expectedRPID:rpID,requireUserVerification:true})}catch{fail(400,'ডিভাইস যাচাই হয়নি। আবার চেষ্টা করুন।')}if(!result.verified)fail(400,'ডিভাইস যাচাই হয়নি। আবার চেষ্টা করুন।');
   if(!db.prepare("SELECT id FROM users WHERE id=? AND account_status='active'").get(user.id))fail(401,'আবার লগইন করুন।');const credential=result.registrationInfo.credential;if(db.prepare('SELECT id FROM passkeys WHERE id=?').get(credential.id))fail(409,'এই ডিভাইস আগেই যোগ করা হয়েছে।');const transports=(input.response.response.transports||[]).filter(t=>['internal','hybrid','usb','ble','nfc'].includes(t));db.prepare('INSERT INTO passkeys VALUES(?,?,?,?,?)').run(credential.id,user.id,Buffer.from(credential.publicKey).toString('base64'),credential.counter,JSON.stringify(transports));return send(res,201,{id:credential.id,phone:user.phone}),true;
  }
  if(path==='/api/passkeys/login/options'){
   const number=phone(input.phone),account=db.prepare('SELECT * FROM users WHERE phone=?').get(number),credential=account&&db.prepare('SELECT * FROM passkeys WHERE id=? AND user_id=?').get(String(input.credentialId||''),account.id);if(!credential)fail(401,'এই ডিভাইসে লগইন চালু নেই। পাসওয়ার্ড দিয়ে লগইন করুন।');
   const options=await webauthn.generateAuthenticationOptions({rpID,userVerification:'required',allowCredentials:[{id:credential.id,transports:JSON.parse(credential.transports)}]});return send(res,200,challenge(account,'login',options)),true;
  }
  if(path==='/api/passkeys/login/verify'){
   const c=consume(input.id,'login'),credential=db.prepare('SELECT * FROM passkeys WHERE id=? AND user_id=?').get(String(input.response?.id||''),c.user_id);if(!credential)fail(401,'ডিভাইস যাচাই হয়নি। আবার চেষ্টা করুন।');let result;
   try{result=await webauthn.verifyAuthenticationResponse({response:input.response,expectedChallenge:c.challenge,expectedOrigin,expectedRPID:rpID,requireUserVerification:true,credential:{id:credential.id,publicKey:new Uint8Array(Buffer.from(credential.public_key,'base64')),counter:credential.counter,transports:JSON.parse(credential.transports)}})}catch{fail(401,'ডিভাইস যাচাই হয়নি। আবার চেষ্টা করুন।')}if(!result.verified)fail(401,'ডিভাইস যাচাই হয়নি। আবার চেষ্টা করুন।');
   const changed=db.prepare('UPDATE passkeys SET counter=? WHERE id=? AND counter=?').run(result.authenticationInfo.newCounter,credential.id,credential.counter);if(Number(changed.changes)!==1)fail(401,'ডিভাইস যাচাই আবার শুরু করুন।');cookie(res,c.user_id);return send(res,200,{ok:true}),true;
  }
  fail(404,'পাওয়া যায়নি।');
 }
 return {route};
}
module.exports={createPasskeys};
