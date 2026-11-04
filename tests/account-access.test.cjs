const {test}=require('node:test'),assert=require('node:assert/strict'),{harness}=require('./server-harness.cjs');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const mailConfig={OTP_SECRET:'test-only-secret-'.repeat(4)};
test('email+phone reset uses emailed OTP, enforces verification and consumes permission once',async()=>{
 const messages=[],{call,close}=harness({authConfig:mailConfig,deliverEmail:async m=>messages.push(m)});try{
 const registered=await call('register','POST',{name:'User',phone:'01711111111',email:'Owner@Example.com',password:'password-123'});assert.equal(registered.status,201);const cookie=registered.cookie;assert.equal((await call('session','GET',undefined,cookie)).data.email,'owner@example.com');
 const wrong=await call('email-reset/request','POST',{phone:'01711111111',email:'wrong@example.com'});assert.equal(wrong.status,200);assert.equal(messages.length,0);
 assert.equal((await call('email-reset/request','POST',{phone:'01811111111',email:'owner@example.com'})).status,200);assert.equal(messages.length,0);
 const start=await call('email-reset/request','POST',{phone:'01711111111',email:'OWNER@example.com'});assert.equal(start.status,200);assert.equal(messages.length,1);assert.equal(messages[0].to,'owner@example.com');assert(!Object.hasOwn(start.data,'code'));
 assert.equal((await call('email-reset/complete','POST',{challenge:start.data.challenge,token:'guess',newPassword:'new-password-123'})).status,400);
 assert.equal((await call('email-reset/verify','POST',{challenge:start.data.challenge,code:'000000'})).status,400);
 const verified=await call('email-reset/verify','POST',{challenge:start.data.challenge,code:messages[0].code});assert.equal(verified.status,200);assert(verified.data.token);
 assert.equal((await call('email-reset/request','POST',{phone:'01711111111',email:'owner@example.com'})).status,200);
 const completed=await call('email-reset/complete','POST',{challenge:start.data.challenge,token:verified.data.token,newPassword:'new-password-123'});assert.equal(completed.status,200);assert.equal((await call('session','GET',undefined,cookie)).status,401);
 assert.equal((await call('email-reset/complete','POST',{challenge:start.data.challenge,token:verified.data.token,newPassword:'another-password'})).status,400);
 assert.equal((await call('login','POST',{phone:'01711111111',password:'password-123'})).status,401);assert.equal((await call('login','POST',{phone:'01711111111',password:'new-password-123'})).status,200);
 }finally{await close()}
});
test('email OTP attempts are capped; profile email changes require password and code',async()=>{
 const messages=[],{call,close}=harness({authConfig:mailConfig,deliverEmail:async m=>messages.push(m)});try{
 const a=await call('register','POST',{name:'User',phone:'01711111111',email:'owner@example.com',password:'password-123'}),b=await call('register','POST',{name:'Other',phone:'01811111111',password:'password-123'});
 const start=await call('email-reset/request','POST',{phone:'01711111111',email:'owner@example.com'});for(let i=0;i<5;i++)assert.equal((await call('email-reset/verify','POST',{challenge:start.data.challenge,code:'000000'})).status,400);assert.equal((await call('email-reset/verify','POST',{challenge:start.data.challenge,code:messages[0].code})).status,400);
 assert.equal((await call('email/request','POST',{email:'new@example.com',password:'incorrect'},a.cookie)).status,400);
 const change=await call('email/request','POST',{email:'new@example.com',password:'password-123'},a.cookie);assert.equal(change.status,200);assert.equal(messages.at(-1).purpose,'email');
 assert.equal((await call('email/verify','POST',{challenge:change.data.challenge,code:messages.at(-1).code},b.cookie)).status,400);
 assert.equal((await call('email/verify','POST',{challenge:change.data.challenge,code:messages.at(-1).code},a.cookie)).status,200);const session=await call('session','GET',undefined,a.cookie);assert.equal(session.data.email,'new@example.com');assert.equal(session.data.emailVerified,true);
 const count=messages.length;await call('email-reset/request','POST',{phone:'01711111111',email:'owner@example.com'});assert.equal(messages.length,count);
 }finally{await close()}
});
test('missing mail/social configuration is explicitly unavailable, never fake success',async()=>{
 const {call,close}=harness({authConfig:{GOOGLE_CLIENT_ID:'',GOOGLE_CLIENT_SECRET:'',FACEBOOK_APP_ID:'',FACEBOOK_APP_SECRET:'',RESEND_API_KEY:'',OTP_SECRET:''}});try{const config=await call('auth-config');assert.deepEqual(config.data,{google:false,facebook:false,emailOTP:false});assert.equal((await call('email-reset/request','POST',{phone:'01711111111',email:'user@example.com'})).status,503);assert.equal((await call('oauth/google/start')).status,503)}finally{await close()}
});
test('Google OAuth checks state/PKCE, completes phone registration, then reuses the linked identity',async()=>{
 const providerCalls=[];const {call,close}=harness({origin:'http://localhost:3000',authConfig:{GOOGLE_CLIENT_ID:'test-client',GOOGLE_CLIENT_SECRET:'test-secret'},providerRequest:async(url,options)=>{providerCalls.push({url,options});return {ok:true,json:async()=>url.includes('/token')?{access_token:'provider-token'}:{sub:'google-subject',name:'Google User',email:'google@example.com',email_verified:true}}}});try{
 const start=await call('oauth/google/start'),authorization=new URL(start.headers.Location),state=authorization.searchParams.get('state');assert.equal(authorization.hostname,'accounts.google.com');assert.equal(authorization.searchParams.get('code_challenge_method'),'S256');
 assert.equal((await call('oauth/google/callback?state='+state+'&code=code','GET',undefined,'dt_oauth_state=wrong')).status,400);
 const callback=await call('oauth/google/callback?state='+state+'&code=code','GET',undefined,start.cookie);assert.equal(callback.headers.Location,'/?social=complete');assert.equal(providerCalls.length,2);assert(new URLSearchParams(providerCalls[0].options.body).get('code_verifier'));assert.equal(providerCalls[1].options.headers.Authorization,'Bearer provider-token');
 const completed=await call('social/complete','POST',{name:'Google User',phone:'01711111111',password:'password-123'},callback.cookie);assert.equal(completed.status,200);assert.equal((await call('session','GET',undefined,completed.cookie)).data.email,'google@example.com');
 assert.equal((await call('oauth/google/callback?state='+state+'&code=code','GET',undefined,start.cookie)).status,400);
 const next=await call('oauth/google/start'),nextState=new URL(next.headers.Location).searchParams.get('state'),linked=await call('oauth/google/callback?state='+nextState+'&code=code','GET',undefined,next.cookie);assert.equal(linked.headers.Location,'/?social=success');assert.equal((await call('session','GET',undefined,linked.cookie)).status,200);
 }finally{await close()}
});
test('Facebook cannot silently link an existing account; correct account password is required',async()=>{
 const providerCalls=[],{call,close}=harness({origin:'http://localhost:3000',authConfig:{FACEBOOK_APP_ID:'test-app',FACEBOOK_APP_SECRET:'test-secret',FACEBOOK_GRAPH_VERSION:'v23.0'},providerRequest:async(url,options)=>{providerCalls.push({url,options});return{ok:true,json:async()=>url.includes('/oauth/access_token')?{access_token:'fb-token'}:{id:'fb-subject',name:'Facebook User',email:'owner@example.com'}}}});try{
 await call('register','POST',{name:'Existing User',phone:'01711111111',email:'owner@example.com',password:'password-123'});const start=await call('oauth/facebook/start'),state=new URL(start.headers.Location).searchParams.get('state'),callback=await call('oauth/facebook/callback?state='+state+'&code=code','GET',undefined,start.cookie);assert.equal(callback.headers.Location,'/?social=complete');assert(callback.cookie.startsWith('dt_social_pending='));assert(providerCalls[1].url.includes('appsecret_proof='));assert.equal(providerCalls[1].options.headers.Authorization,'Bearer fb-token');assert.equal((await call('social/complete','POST',{phone:'01711111111',password:'incorrect-password'},callback.cookie)).status,401);const linked=await call('social/complete','POST',{phone:'01711111111',password:'password-123'},callback.cookie);assert.equal(linked.status,200);assert.equal((await call('data','GET',undefined,linked.cookie)).data.data.profile.name,'Existing User');
 }finally{await close()}
});
test('expired OTPs and failed email delivery never allow password reset',async()=>{
 const messages=[],{call,close}=harness({authConfig:mailConfig,deliverEmail:async m=>messages.push(m)}),originalNow=Date.now;try{await call('register','POST',{name:'User',phone:'01711111111',email:'owner@example.com',password:'password-123'});const start=await call('email-reset/request','POST',{phone:'01711111111',email:'owner@example.com'});Date.now=()=>originalNow()+601000;assert.equal((await call('email-reset/verify','POST',{challenge:start.data.challenge,code:messages[0].code})).status,400)}finally{Date.now=originalNow;await close()}
 const failed=harness({authConfig:mailConfig,deliverEmail:async()=>{throw Error('Unavailable')}});try{await failed.call('register','POST',{name:'User',phone:'01711111111',email:'owner@example.com',password:'password-123'});assert.equal((await failed.call('email-reset/request','POST',{phone:'01711111111',email:'owner@example.com'})).status,503)}finally{await failed.close()}
});
test('Google-only login shows provider availability and reset progress has three distinct steps',async()=>{
 const buttons=[{dataset:{social:'google'}}],notice={},wrapper={querySelectorAll:()=>buttons,querySelector:()=>notice},form={nextElementSibling:wrapper,insertAdjacentHTML(position,markup){assert(markup.includes('data-social="google"'));assert(!markup.includes('data-social="facebook"'))}};let config={google:false,facebook:false};
 const c={document:{querySelector:()=>form},window:{location:{href:''}},accountAPI:async()=>config,authIcon:()=>'<svg></svg>'};vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(__dirname,'../dist/account-access.js'),'utf8'),c);await vm.runInContext('addSocialSignIn(false)',c);assert(buttons.every(b=>b.disabled));assert.equal(notice.hidden,false);config={google:true,facebook:false};await vm.runInContext('addSocialSignIn(false)',c);assert.equal(buttons[0].disabled,false);buttons[0].onclick();assert.equal(c.window.location.href,'/api/oauth/google/start');for(let step=1;step<=3;step++)assert.equal((vm.runInContext('resetStepHeader('+step+')',c).match(/class="current"/g)||[]).length,step);
});
