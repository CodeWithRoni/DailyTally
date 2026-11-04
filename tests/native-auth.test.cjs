const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),{harness}=require('./server-harness.cjs');
const authConfig={GOOGLE_CLIENT_ID:'web-client.apps.googleusercontent.com',GOOGLE_CLIENT_SECRET:'test-only-secret',PUBLIC_ORIGIN:'http://localhost:3000'};
for(const backend of ['sqlite','turso'])test(backend+': native device keys require password, session-bound enrollment, valid signature and one-time cookie-bound login',async()=>{
 const h=harness(backend==='turso'?{turso:{url:'file::memory:',allowLocal:true}}:{});try{
  const user=await h.call('register','POST',{name:'Device User',phone:'01711111111',password:'test-password-123'}),other=await h.call('register','POST',{name:'Other User',phone:'01811111111',password:'test-password-123'});
  const {privateKey,publicKey}=crypto.generateKeyPairSync('rsa',{modulusLength:2048}),pub=publicKey.export({format:'der',type:'spki'}).toString('base64'),sign=challenge=>crypto.sign('RSA-SHA256',Buffer.from(challenge),privateKey).toString('base64');
  const options=()=>h.call('native-auth/register/options','POST',{password:'test-password-123'},user.cookie);
  assert.equal((await h.call('native-auth/register/options','POST',{password:'wrong'},user.cookie)).status,401);
  let r=await options();assert.equal(r.status,200);assert(r.data.keyId);assert.equal((await h.call('native-auth/register/verify','POST',{id:r.data.id,publicKey:pub,signature:sign(r.data.challenge)},other.cookie)).status,401);
  r=await options();assert.equal((await h.call('native-auth/register/verify','POST',{id:r.data.id,publicKey:pub,signature:sign('wrong')},user.cookie)).status,401);
  r=await options();const registered=await h.call('native-auth/register/verify','POST',{id:r.data.id,publicKey:pub,signature:sign(r.data.challenge)},user.cookie);assert.equal(registered.status,201);const keyId=registered.data.id;
  const login=()=>h.call('native-auth/login/options','POST',{phone:'01711111111',credentialId:keyId});
  r=await login();assert.equal((await h.call('native-auth/login/verify','POST',{id:r.data.id,signature:sign(r.data.challenge)})).status,401);
  r=await login();assert.equal((await h.call('native-auth/login/verify','POST',{id:r.data.id,signature:sign('different')},r.cookie)).status,401);
  r=await login();const signed=await h.call('native-auth/login/verify','POST',{id:r.data.id,signature:sign(r.data.challenge)},r.cookie);assert.equal(signed.status,200);assert.equal((await h.call('session','GET',undefined,signed.cookie)).data.phone,'01711111111');assert.equal((await h.call('native-auth/login/verify','POST',{id:r.data.id,signature:sign(r.data.challenge)},r.cookie)).status,401);
  await h.call('native-auth/remove','POST',{id:keyId},other.cookie);assert.equal((await login()).status,200);await h.call('native-auth/remove','POST',{id:keyId},user.cookie);assert.equal((await login()).status,401);
 }finally{await h.close()}
});
test('native Google requires matching nonce and requesting WebView cookie, preserves explicit account linking and rejects replay',async()=>{
 let claims;const h=harness({origin:'http://localhost:3000',authConfig,verifyGoogle:async(token,audience)=>{assert.equal(audience,authConfig.GOOGLE_CLIENT_ID);if(token!=='fixture-token')throw Error();return claims}});
 try{
  const options=()=>h.call('native-auth/google/options','POST',{}),verify=(r,cookie=r.cookie)=>h.call('native-auth/google/verify','POST',{id:r.data.id,token:'fixture-token'},cookie);
  let r=await options();claims={sub:'google-user',nonce:r.data.challenge,email:'user@example.com',email_verified:true,name:'Native User'};assert.equal((await verify(r,'')).status,401);
  r=await options();claims.nonce='wrong';assert.equal((await verify(r)).status,401);
  r=await options();claims.nonce=r.data.challenge;let complete=await verify(r);assert.equal(complete.data.complete,true);assert.equal((await verify(r)).status,401);
  const existing=await h.call('register','POST',{phone:'01711111111',name:'Existing',password:'original-password'});assert.equal(existing.status,201);
  assert.equal((await h.call('social/complete','POST',{phone:'01711111111',password:'wrong-password'},complete.cookie)).status,401);
  const linked=await h.call('social/complete','POST',{phone:'01711111111',password:'original-password'},complete.cookie);assert.equal(linked.status,200);
  r=await options();claims.nonce=r.data.challenge;const logged=await verify(r);assert.equal(logged.data.ok,true);assert.equal((await h.call('session','GET',undefined,logged.cookie)).data.phone,'01711111111');
 }finally{await h.close()}
});
test('production Google verifier rejects an unsigned token',async()=>{const h=harness({origin:'http://localhost:3000',authConfig});try{const r=await h.call('native-auth/google/options','POST',{});assert.equal((await h.call('native-auth/google/verify','POST',{id:r.data.id,token:'not-a-signed-token'},r.cookie)).status,401)}finally{await h.close()}});
test('native bridge matches each response to its own request and cancellation cannot authenticate',async()=>{
 const calls=[],c={crypto,window:{DailyTallyFiles:{nativeAuth:(...args)=>calls.push(args)}},setTimeout,clearTimeout,uiLanguage:'en',featureText:s=>s};vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(__dirname,'../dist/device-access.js'),'utf8'),c);
 const first=vm.runInContext("nativeAuthCall('login',{keyId:'first'})",c),second=vm.runInContext("nativeAuthCall('login',{keyId:'second'})",c);c.window.DailyTallyNativeAuth.receive('unrelated',{signature:'bad'});c.window.DailyTallyNativeAuth.receive(calls[1][0],{signature:'second-proof'});assert.equal((await second).signature,'second-proof');c.window.DailyTallyNativeAuth.receive(calls[0][0],{error:'Verification cancelled. You can sign in with your password.'});await assert.rejects(first,/cancelled/);
});
