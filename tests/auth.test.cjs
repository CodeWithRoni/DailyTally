const {test}=require('node:test'),assert=require('node:assert/strict'),{createApp}=require('../server.cjs');
test('registration, account isolation, persistence, session protection and password change',async()=>{
 const app=createApp({database:':memory:'});const origin='http://localhost:3000';
 async function request(route,method='GET',data,cookie='',requestOrigin=origin){return await new Promise(resolve=>{const req=require('node:stream').Readable.from(data===undefined?[]:[Buffer.from(JSON.stringify(data))]);req.url=route;req.method=method;req.headers={host:'localhost:3000',origin:requestOrigin,...(method==='GET'?{}:{'content-type':'application/json'}),...(cookie?{cookie}:{})};req.socket={remoteAddress:'127.0.0.1'};const headers={};const res={setHeader:(key,value)=>{headers[key.toLowerCase()]=value},writeHead:(status,extra)=>{res.status=status;Object.assign(headers,extra)},end:body=>{const text=String(body);resolve({status:res.status,data:headers['Content-Type']?.includes('application/json')?JSON.parse(text):null,text,cookie:headers['set-cookie']?.split(';')[0]})}};app.server.emit('request',req,res)})}
 async function call(route,...args){return request('/api/'+route,...args)}

 try{
 assert.equal((await call('data')).status,401);
 const photo='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l1sAAAAASUVORK5CYII=';
 assert.equal((await call('register','POST',{name:'Invalid photo',phone:'01912345678',password:'valid-pass-123',photo:'data:image/svg+xml;base64,YQ=='})).status,400);
 let result=await call('register','POST',{name:'First',phone:'01712345678',password:'first-pass-123',photo});assert.equal(result.status,201);const first=result.cookie;assert(first);
 result=await call('register','POST',{name:'Duplicate',phone:'+8801712345678',password:'first-pass-123'});assert.equal(result.status,409);
 assert.equal((await call('login','POST',{phone:'01712345678',password:'wrong-password'})).status,401);
 result=await call('data','GET',undefined,first);assert.equal(result.data.data.profile.name,'First');assert.equal(result.data.data.profile.photo,photo);let data=result.data.data;data.entries.push({id:'e1',kind:'expense',person:'',amount:50,date:'2026-11-03',time:'10:00',note:'Private',photo});
 assert.equal((await call('data','PUT',{data,revision:0},first)).status,200);
 assert.equal((await call('data','PUT',{data,revision:0},first)).status,409);
 result=await call('register','POST',{name:'Second',phone:'01812345678',password:'second-pass-123'});const second=result.cookie;assert.equal(result.status,201);
 assert.equal((await call('data','GET',undefined,second)).data.data.entries.length,0);
 assert.equal((await call('data','GET',undefined,first)).data.data.entries.length,1);assert.equal((await call('data','GET',undefined,first)).data.data.entries[0].photo,photo);
 assert.equal((await call('logout','POST',{},first,'https://foreign.example')).status,403);
 assert.equal((await call('password','POST',{currentPassword:'incorrect',newPassword:'updated-pass-123'},first)).status,400);
 result=await call('login','POST',{phone:'01712345678',password:'first-pass-123'});const otherSession=result.cookie;
 result=await call('password','POST',{currentPassword:'first-pass-123',newPassword:'updated-pass-123'},first);assert.equal(result.status,200);const updated=result.cookie;
 assert.equal((await call('session','GET',undefined,otherSession)).status,401);
 assert.equal((await call('login','POST',{phone:'01712345678',password:'first-pass-123'})).status,401);
 assert.equal((await call('login','POST',{phone:'01712345678',password:'updated-pass-123'})).status,200);
 assert.equal((await call('logout','POST',{},updated)).status,200);assert.equal((await call('data','GET',undefined,updated)).status,401);
 const staticResponse=await request('/');assert.equal(staticResponse.status,200);assert(staticResponse.text.includes('auth.js'));
 }finally{await app.close()}
});
