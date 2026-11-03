/* Theme is applied before the first paint; account settings sync after sign-in. */
(()=>{const key='dailytally-theme',allowed=['light','dark','system'],root=document.documentElement,media=typeof window.matchMedia==='function'?window.matchMedia('(prefers-color-scheme: dark)'):null;let preference='system';try{const saved=localStorage.getItem(key);if(allowed.includes(saved))preference=saved}catch{}
 function apply(){const resolved=preference==='system'?(media?.matches?'dark':'light'):preference;root.setAttribute?.('data-theme',resolved);root.setAttribute?.('data-theme-preference',preference);const meta=document.querySelector('meta[name="theme-color"]');meta?.setAttribute?.('content',resolved==='dark'?'#11231d':'#104b3d');return resolved}
 function sync(value){preference=allowed.includes(value)?value:'system';try{localStorage.setItem(key,preference)}catch{}apply()}
 const changed=()=>{if(preference==='system')apply()};if(media?.addEventListener)media.addEventListener('change',changed);else media?.addListener?.(changed);
 window.addEventListener?.('storage',event=>{if(event.key===key){preference=allowed.includes(event.newValue)?event.newValue:'system';apply()}});
 window.DailyTallyTheme={sync,preference:()=>preference,resolved:apply};apply();
})();
