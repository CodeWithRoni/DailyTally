(() => {
 let pending=null,sequence=0;
 const available=()=>typeof window.DailyTallyFiles?.pickContact==='function';
 function receive(id,payload){if(!pending||pending.id!==id)return;const request=pending;pending=null;clearTimeout(request.timer);if(payload?.cancelled){request.resolve([]);return}if(payload?.error){request.reject(Error('Contact picker unavailable'));return}const contact=payload?.contact;if(!contact||!Array.isArray(contact.name)||!Array.isArray(contact.tel)||typeof contact.name[0]!=='string'||typeof contact.tel[0]!=='string'||!contact.tel[0].trim()){request.reject(Error('Invalid contact'));return}request.resolve([{name:[contact.name[0].slice(0,100)],tel:[contact.tel[0].slice(0,30)]}])}
 function select(){if(!available())return Promise.reject(Error('Native contact picker unavailable'));if(pending)return pending.promise;const id='contact-'+Date.now()+'-'+(++sequence);let resolve,reject;const promise=new Promise((ok,no)=>{resolve=ok;reject=no});pending={id,promise,resolve,reject,timer:setTimeout(()=>{if(pending?.id!==id)return;pending=null;reject(Error('Contact picker timed out'))},180000)};try{window.DailyTallyFiles.pickContact(id)}catch(error){const request=pending;pending=null;clearTimeout(request.timer);request.reject(error)}return promise}
 window.DailyTallyContacts={available,select,receive};
})();
