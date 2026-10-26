/* Sharing & Copying visual contract v1.0. No public publishing, token creation or copy commits. */
(() => {
'use strict';
const $=id=>document.getElementById(id);
const shareButton=$('shareAgentButton'),transferButton=$('transferAgentButton');
if(!shareButton||!transferButton)return;
const share=$('shareAgentDialog'),transfer=$('transferAgentDialog');
const agent=new URLSearchParams(location.search).get('agent')||'a1';
const permitted=['guide','faq','policy'];
function safeChecked(root){return [...root.querySelectorAll('input[type="checkbox"]:checked')].map(x=>x.value).filter(v=>permitted.includes(v))}
function buildPreview(){
 const target=new URL('./agent-public.html',location.href);
 target.searchParams.set('agent',agent);
 target.searchParams.set('materials',safeChecked($('shareMaterialChecklist')).join(','));
 target.searchParams.set('preview','1');
 return target.href;
}
function updateSharePreview(){
 const url=buildPreview();
 $('sharePreviewLink').value=url;
 $('openSharePreview').href=url;
 $('shareStatus').textContent='Только предпросмотр. Публикация ссылки на сервере ещё не выполнена; публичного доступа нет.';
}
function closeIfOpen(dialog){if(dialog.open)dialog.close()}
shareButton.addEventListener('click',()=>{
 $('shareAgentName').textContent=$('agentName')?.textContent||'Агент';
 updateSharePreview();closeIfOpen(transfer);share.showModal();
});
for(const b of document.querySelectorAll('[data-close-share]'))b.addEventListener('click',()=>closeIfOpen(share));
$('shareMaterialChecklist').addEventListener('change',updateSharePreview);
$('copySharePreview').addEventListener('click',async()=>{
 const url=buildPreview();let copied=false;
 try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(url);copied=true}}catch(_){}
 if(!copied){
   const input=$('sharePreviewLink');input.focus();input.select();
   try{copied=document.execCommand('copy')}catch(_){}
 }
 $('shareStatus').textContent=copied?'Ссылка на предпросмотр скопирована. Это не публичная публикация.':'Не удалось скопировать автоматически — выделите ссылку и скопируйте вручную.';
});
transferButton.addEventListener('click',()=>{
 closeIfOpen(share);
 $('transferPreview').hidden=true;
 $('transferStatus').textContent='Перенос создаёт независимую копию. Оригинал останется на месте; для создания понадобится серверная проверка.';
 transfer.showModal();
});
for(const b of document.querySelectorAll('[data-close-transfer]'))b.addEventListener('click',()=>closeIfOpen(transfer));
for(const el of transfer.querySelectorAll('select,input'))el.addEventListener('change',()=>{
 $('transferPreview').hidden=true;
 $('transferStatus').textContent='Целевое пространство изменено. План необходимо проверить заново.';
});
$('transferPreviewButton').addEventListener('click',()=>{
 $('transferPreview').hidden=false;
 $('transferStatus').textContent='Предпросмотр интерфейса проверки. Права, квоты и повторное использование подтвердит сервер после подключения API.';
});
})();