(() => {
 const indicator=document.createElement('div');indicator.id='pull-refresh';indicator.setAttribute('role','status');indicator.setAttribute('aria-live','polite');indicator.innerHTML='<span class="refresh-spinner" aria-hidden="true"></span><span class="refresh-message"></span>';document.body.append(indicator);
 let tracking=null,hideTimer,suppressClickUntil=0;
 function positionIndicator(){const header=document.querySelector('header');if(!indicator.style||!header?.getBoundingClientRect)return;const bottom=header.getBoundingClientRect().bottom;indicator.style.top=Math.max(16,bottom+12)+'px'}
 function display(text,loading=false,state='pull'){positionIndicator();clearTimeout(hideTimer);indicator.querySelector('.refresh-message').textContent=text;indicator.classList.toggle('is-loading',loading);indicator.classList.toggle('is-success',state==='success');indicator.classList.toggle('is-error',state==='error');indicator.classList.add('is-visible')}
 function hide(){indicator.classList.remove('is-visible','is-loading','is-success','is-error')}
 async function reloadData(){if(typeof offlineState!=='undefined'&&offlineState?.pending){await syncOfflineChanges();if(offlineState?.pending){display('আগে অফলাইন তথ্য সিঙ্ক করুন।',false,'error');hideTimer=setTimeout(hide,2400);return}}if(accountBusy||!accountPhone)return hide();accountBusy=true;document.body.classList.add('account-saving');const personId=document.querySelector('#report-back')?.dataset.personId;display('তথ্য লোড হচ্ছে…',true);
  try{const result=await accountAPI('data');if(!valid(result.data))throw Error('তথ্য পড়া যায়নি।');db=result.data;accountRevision=result.revision;render();if(personId){const button=Array.from(document.querySelectorAll('[data-person-report]')).find(b=>b.dataset.personReport===personId);if(button)button.click()}display('তথ্য আপডেট হয়েছে',false,'success');}
  catch(error){if(error.status===401){authScreen(false,'আবার লগইন করুন।');display('আবার লগইন করুন।',false,'error')}else display('রিফ্রেশ হয়নি। আবার চেষ্টা করুন।',false,'error');}
  finally{accountBusy=false;document.body.classList.remove('account-saving');hideTimer=setTimeout(hide,2200)}
 }
 const atTop=()=>Math.max(window.scrollY||0,document.scrollingElement?.scrollTop||0)<=0;
 document.addEventListener('touchstart',event=>{tracking=null;if(!accountPhone||accountBusy||event.touches.length!==1||!atTop()||document.querySelector('dialog[open]')||event.target.closest('input,textarea,select,button,a'))return;const t=event.touches[0];tracking={x:t.clientX,y:t.clientY,distance:0};},{passive:true});
 document.addEventListener('touchmove',event=>{if(!tracking)return;if(event.touches.length!==1||!atTop()){tracking=null;hide();return}const t=event.touches[0],dy=t.clientY-tracking.y,dx=Math.abs(t.clientX-tracking.x);if(dy<=0||dx>Math.max(20,dy)){tracking=null;hide();return}tracking.distance=dy;if(dy>12){suppressClickUntil=Date.now()+700;if(event.cancelable)event.preventDefault();display(dy>=85?'ছেড়ে দিলে রিফ্রেশ হবে':'রিফ্রেশ করতে নিচে টানুন');}},{passive:false});
 document.addEventListener('touchend',()=>{const shouldReload=tracking&&tracking.distance>=85;tracking=null;if(shouldReload)void reloadData();else if(!accountBusy)hide();},{passive:true});
 document.addEventListener('click',event=>{if(Date.now()<suppressClickUntil){event.preventDefault();event.stopImmediatePropagation()}},true);
 document.addEventListener('touchcancel',()=>{tracking=null;if(!accountBusy)hide();},{passive:true});
})();
