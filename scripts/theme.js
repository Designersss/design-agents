/* AIMock: stable cross-page theme preference. */
(() => {
 'use strict';
 const key='aimock-theme-v1',root=document.documentElement;
 const normalized=v=>v==='light'?'light':'dark';
 const read=()=>{try{return normalized(localStorage.getItem(key))}catch(_){return 'dark'}};
 function render(value){
  const theme=normalized(value);root.dataset.theme=theme;root.style.colorScheme=theme;
  const meta=document.querySelector('meta[name="theme-color"]');
  if(meta)meta.content=theme==='light'?'#f6f7f8':'#0f1012';
  document.querySelectorAll('[data-theme-toggle]').forEach(button=>{
   const light=theme==='light';
   button.setAttribute('aria-pressed',String(light));
   button.setAttribute('aria-label',light?'Включить тёмную тему':'Включить светлую тему');
   button.title=light?'Тёмная тема':'Светлая тема';
  });
 }
 render(read()); // Load in the document head before styles are painted.
 document.addEventListener('DOMContentLoaded',()=>{
  render(read());
  document.querySelectorAll('[data-theme-toggle]').forEach(button=>{
   button.addEventListener('click',()=>{
    const next=root.dataset.theme==='light'?'dark':'light';
    try{localStorage.setItem(key,next)}catch(_){}
    render(next);
   });
  });
 });
 window.addEventListener('storage',event=>{if(event.key===key||event.key===null)render(read())});
})();
