(() => {
 const reduced=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 const waves=new WeakMap(),dialogs=new WeakSet();
 document.addEventListener('pointerdown',event=>{
  if(reduced()||event.button!==0)return;
  const target=event.target.closest('button:not(:disabled),[data-entry-id],[data-entry-edit],summary');
  if(!target||!target.animate||event.target.closest('input,textarea,select'))return;
  const previous=waves.get(target);if(previous){previous.animation.cancel();previous.node.remove()}
  const bounds=target.getBoundingClientRect(),size=Math.min(280,Math.max(bounds.width,bounds.height)*1.7),wave=document.createElement('span');wave.className='tap-wave';wave.setAttribute('aria-hidden','true');
  if(getComputedStyle(target).position==='static')target.classList.add('tap-surface');
  wave.style.width=wave.style.height=size+'px';wave.style.left=(event.clientX-bounds.left-size/2)+'px';wave.style.top=(event.clientY-bounds.top-size/2)+'px';target.append(wave);
  const animation=wave.animate([{transform:'scale(.08)',opacity:.2},{transform:'scale(1)',opacity:0}],{duration:480,easing:'cubic-bezier(.2,.7,.2,1)'});waves.set(target,{node:wave,animation});animation.finished.catch(()=>{}).finally(()=>{wave.remove();if(waves.get(target)?.node===wave)waves.delete(target)});
 },{passive:true});
 function enhanceDialog(dialog){if(dialogs.has(dialog))return;dialogs.add(dialog);const close=dialog.close.bind(dialog);let closing=false;
  if(!reduced()&&dialog.animate)dialog.animate([{opacity:0,transform:'translateY(16px) scale(.98)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:280,easing:'cubic-bezier(.16,1,.3,1)'});
  dialog.close=value=>{if(!dialog.open||reduced()||!dialog.animate)return close(value);if(closing)return;closing=true;dialog.getAnimations().forEach(animation=>animation.cancel());const animation=dialog.animate([{opacity:1,transform:'translateY(0) scale(1)'},{opacity:0,transform:'translateY(8px) scale(.985)'}],{duration:150,easing:'cubic-bezier(.4,0,1,1)'});animation.finished.catch(()=>{}).finally(()=>close(value))};
  dialog.addEventListener('cancel',event=>{event.preventDefault();dialog.close()});
 }
 const app=document.querySelector('#app');let pageAnimation;
 new MutationObserver(records=>{
  let pageChanged=false;
  for(const record of records){for(const node of record.addedNodes){if(node.nodeType!==1)continue;if(node.matches('dialog[open]'))enhanceDialog(node);node.querySelectorAll('dialog[open]').forEach(enhanceDialog);if(record.target===app&&node.tagName!=='DIALOG')pageChanged=true}}
  if(pageChanged&&!reduced()&&app.animate&&!app.querySelector('dialog[open]')){pageAnimation?.cancel();pageAnimation=app.animate([{opacity:.45,translate:'0 7px'},{opacity:1,translate:'0 0'}],{duration:220,easing:'cubic-bezier(.2,.75,.25,1)'})}
 }).observe(app,{childList:true,subtree:true});
})();
