const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
test('pull refresh threshold, top-only gesture, current view and network failure',async()=>{
 const events={},classes=new Set(),message={},indicator={setAttribute(){},querySelector:()=>message,classList:{add:x=>classes.add(x),remove:(...xs)=>xs.forEach(x=>classes.delete(x)),toggle:(x,on)=>on?classes.add(x):classes.delete(x)}};let calls=0,fail=false,renders=0;
 const c={Date,Array,clearTimeout(){},setTimeout(){return 0},accountPhone:'01712345678',accountBusy:false,accountRevision:1,db:{saved:'old'},tab:'রিপোর্ট',reportDate:'2026-11-03',valid:()=>true,render:()=>renders++,accountAPI:async()=>{calls++;if(fail)throw Error('Offline');return {data:{saved:'new'},revision:2}},window:{scrollY:0},document:{body:{append(){},classList:{add(){},remove(){}}},scrollingElement:{scrollTop:0},createElement:()=>indicator,querySelector:()=>null,querySelectorAll:()=>[],addEventListener:(type,fn)=>events[type]=fn}};
 vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(__dirname,'../dist/refresh.js'),'utf8'),c);
 const target={closest:()=>null},start=()=>events.touchstart({target,touches:[{clientX:10,clientY:10}]}),move=y=>events.touchmove({touches:[{clientX:10,clientY:y}],cancelable:true,preventDefault(){}}),settle=()=>new Promise(resolve=>setImmediate(resolve));
 start();move(40);events.touchend();await settle();assert.equal(calls,0);
 c.window.scrollY=40;start();move(140);events.touchend();await settle();assert.equal(calls,0);c.window.scrollY=0;
 start();move(140);events.touchend();assert(classes.has('is-loading'));await settle();assert(classes.has('is-success'));assert(!classes.has('is-loading'));assert.equal(calls,1);assert.equal(c.db.saved,'new');assert.equal(c.accountRevision,2);assert.equal(c.tab,'রিপোর্ট');assert.equal(c.reportDate,'2026-11-03');assert.equal(renders,1);assert.equal(c.accountBusy,false);
 fail=true;start();move(140);events.touchend();await settle();assert.equal(c.db.saved,'new');assert.equal(c.accountBusy,false);assert(message.textContent.includes('রিফ্রেশ হয়নি'));
 c.accountBusy=true;start();move(140);events.touchend();await settle();assert.equal(calls,2);
});
