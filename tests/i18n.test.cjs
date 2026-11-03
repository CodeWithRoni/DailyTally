const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
test('page includes language control and runtime before app startup, with safe locale fallback',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../dist/index.html'),'utf8'),runtime=fs.readFileSync(path.join(__dirname,'../dist/i18n.js'),'utf8');
 assert.equal((html.match(/id="language-switch"/g)||[]).length,1);
 const inline=/<script id="language-runtime">([\s\S]*?)<\/script>/.exec(html);assert(inline);assert.equal(inline[1].trim(),runtime.trim());assert(html.indexOf('id="language-runtime"')<html.indexOf('src="auth.js'));
 const app=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes('let db='));
 const c={Intl,Date,startAuth(){},setInterval(){},window:{addEventListener(){}},document:{addEventListener(){}}};vm.createContext(c);vm.runInContext(app,c);assert(vm.runInContext('money(123)',c).includes('১২৩'));c.uiLocale=()=> 'en-US';assert(vm.runInContext('money(123)',c).includes('123'));
});
test('language selection persists, translates dynamically and preserves personal text and input values',()=>{
 let saved='en';const select={value:''},profile={},header={append(){}},text=(value,personal=false)=>({nodeValue:value,parentElement:{closest:()=>personal?{}:null}}),nodes=[text('লগইন করুন'),text('মোট পাবো'),text('রিপোর্ট',true)];
 const attributes={placeholder:'আপনার পুরো নাম'},input={value:'My original name',hasAttribute:key=>Object.hasOwn(attributes,key),getAttribute:key=>attributes[key],setAttribute:(key,value)=>{attributes[key]=value}};
 const c={localStorage:{getItem:()=>saved,setItem:(key,value)=>{saved=value}},window:{alert(){},confirm(){return true}},NodeFilter:{SHOW_TEXT:4},MutationObserver:class{observe(){}},queueMicrotask:fn=>fn(),document:{documentElement:{},body:{},createElement:()=>({append(){},querySelector:()=>select}),querySelector:key=>key==='header'?header:key==='#user-profile'?profile:select,querySelectorAll:()=>[input],createTreeWalker:()=>{let index=0;return{nextNode:()=>nodes[index++]||null}}}};
 vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(__dirname,'../dist/i18n.js'),'utf8'),c);
 assert.equal(nodes[0].nodeValue,'Sign in');assert.equal(nodes[1].nodeValue,'Total Receivable');assert.equal(nodes[2].nodeValue,'রিপোর্ট');assert.equal(attributes.placeholder,'Your full name');assert.equal(input.value,'My original name');
 assert.equal(vm.runInContext("translateUI('গত মাস · অক্টোবর ২০২৬')",c),'Last month · October 2026');assert.equal(vm.runInContext("translateUI('১টি লেনদেন')",c),'1 transaction');
 select.onchange({target:{value:'bn'}});assert.equal(nodes[0].nodeValue,'লগইন করুন');assert.equal(attributes.placeholder,'আপনার পুরো নাম');assert.equal(saved,'bn');assert.equal(c.document.documentElement.lang,'bn');
 assert.equal(vm.runInContext("translateUI('January')",c),'জানুয়ারি');assert.equal(vm.runInContext("translateUI('2026-11-04 · 10:30 PM')",c),'২০২৬-১১-০৪ · ১০:৩০ পিএম');
 nodes[0].nodeValue='অ্যাকাউন্ট তৈরি করুন';select.onchange({target:{value:'en'}});assert.equal(nodes[0].nodeValue,'Create account');assert.equal(saved,'en');assert.equal(vm.runInContext("translateUI('৩টি খরচ')",c),'3 expenses');
});
