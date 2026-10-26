
/* Visual-only interactions for AIMock / Agents; no server operations. */
(() => {
'use strict';
const root=document.querySelector('.agents-page');
if(!root)return;
const byId=id=>document.getElementById(id);
const rows=[...root.querySelectorAll('.agent-record')];
const rowsHost=byId('agentsRows');
const tabs=[...root.querySelectorAll('[data-tab]')];
const search=byId('agentSearch'),role=byId('roleFilter'),tag=byId('tagFilter'),sort=byId('sortAgents');
const pagePrev=byId('agentsPrev'),pageNext=byId('agentsNext'),pageIndex=byId('agentsPage'),pagesTotal=byId('agentsPages'),count=byId('agentsCount');
const empty=byId('agentsEmpty');
const menu=byId('agentContextMenu');
const tagsPopover=byId('agentTagsPopover'),tagsHeading=byId('agentTagsHeading'),tagsItems=byId('agentTagsItems');
let activeTagButton=null;
const availableTags=[...new Set(rows.flatMap(row=>row.dataset.tags.split(',').map(s=>s.trim()).filter(Boolean)))].sort((a,b)=>a.localeCompare(b,'ru'));
tag.replaceChildren(new Option('Все теги','all'),...availableTags.map(s=>new Option(s,s)));
function closeTags(refocus=false){
 if(!activeTagButton)return;
 tagsPopover.hidden=true;activeTagButton.setAttribute('aria-expanded','false');
 if(refocus)activeTagButton.focus();
 activeTagButton=null;
}
function openTags(button){
 if(activeTagButton===button){closeTags();return}
 closeMenu();closeTags();
 const row=button.closest('.agent-record');if(!row)return;
 const extras=row.dataset.tags.split(',').map(s=>s.trim()).filter(Boolean).slice(2);if(!extras.length)return;
 activeTagButton=button;button.setAttribute('aria-expanded','true');
 tagsHeading.textContent='Остальные теги · '+row.querySelector('.agent-name').textContent;
 tagsItems.replaceChildren();
 for(const tag of extras){const chip=document.createElement('span');chip.className='soft-chip agent-tag';chip.textContent=tag;tagsItems.append(chip)}
 tagsPopover.hidden=false;
 const bounds=button.getBoundingClientRect(),w=tagsPopover.offsetWidth,h=tagsPopover.offsetHeight;
 tagsPopover.style.left=Math.max(8,Math.min(innerWidth-w-8,bounds.left))+'px';
 tagsPopover.style.top=(bounds.bottom+h+8<=innerHeight?bounds.bottom+8:Math.max(8,bounds.top-h-8))+'px';
}
const perPage=8;
let activeTab='all',currentPage=0,visible=[],currentMenuButton=null;
const normalize=s=>String(s||'').trim().toLocaleLowerCase('ru-RU');
function filtered(){
 const query=normalize(search.value);
 return rows.filter(row=>(activeTab==='all'||row.dataset.status===activeTab)
  &&(role.value==='all'||row.dataset.role===role.value)
  &&(tag.value==='all'||row.dataset.tags.split(',').includes(tag.value))
  &&normalize(row.textContent+' '+row.dataset.tags).includes(query))
  .sort((a,b)=>sort.value==='name'?a.dataset.sortName.localeCompare(b.dataset.sortName,'ru')
   :Number(b.dataset.stamp)-Number(a.dataset.stamp));
}
function render(){
 closeTags();
 visible=filtered();
 const total=Math.max(1,Math.ceil(visible.length/perPage));
 currentPage=Math.min(currentPage,total-1);
 rows.forEach(row=>{row.hidden=true});
 const shown=visible.slice(currentPage*perPage,(currentPage+1)*perPage);
 for(const row of shown){row.hidden=false;rowsHost.append(row)}
 empty.hidden=visible.length!==0;
 const start=visible.length?currentPage*perPage+1:0;
 count.textContent='Показано '+start+'–'+Math.min((currentPage+1)*perPage,visible.length)+' из '+visible.length;
 pageIndex.textContent=String(currentPage+1);pagesTotal.textContent=String(total);
 pagePrev.disabled=currentPage===0;pageNext.disabled=currentPage>=total-1;
 tabs.forEach(tab=>{const on=tab.dataset.tab===activeTab;tab.classList.toggle('selected',on);tab.setAttribute('aria-selected',String(on))});
}
function closeMenu(){
 menu.hidden=true;
 currentMenuButton?.setAttribute('aria-expanded','false');
 currentMenuButton=null;
}
function openMenu(btn){
 closeTags();
 if(currentMenuButton===btn){closeMenu();return}
 closeMenu();
 currentMenuButton=btn;btn.setAttribute('aria-expanded','true');
 const id=btn.dataset.more;
 byId('agentMenuOpen').href='./agent-detail.html?agent='+encodeURIComponent(id);
 byId('agentMenuDialog').href='./dialogs.html?agent='+encodeURIComponent(id);
 byId('agentMenuJournal').href='./journal.html?agent='+encodeURIComponent(id);
 menu.hidden=false;
 const r=btn.getBoundingClientRect(),w=menu.offsetWidth,h=menu.offsetHeight;
 menu.style.left=Math.max(8,Math.min(innerWidth-w-8,r.right-w))+'px';
 menu.style.top=(r.bottom+h+6>innerHeight?Math.max(8,r.top-h-6):r.bottom+6)+'px';
}
tabs.forEach(tab=>tab.addEventListener('click',()=>{activeTab=tab.dataset.tab;currentPage=0;closeMenu();render()}));
for(const input of [search,role,tag,sort])input.addEventListener(input===search?'input':'change',()=>{currentPage=0;closeMenu();render()});
pagePrev.addEventListener('click',()=>{if(currentPage>0){currentPage--;render()}});
pageNext.addEventListener('click',()=>{if(currentPage+1<Math.ceil(visible.length/perPage)){currentPage++;render()}});
byId('clearAgentFilters').addEventListener('click',()=>{search.value='';role.value='all';tag.value='all';sort.value='recent';activeTab='all';currentPage=0;render();search.focus()});
root.addEventListener('click',e=>{
 const tagsButton=e.target.closest('[data-more-tags]');
 if(tagsButton){e.preventDefault();e.stopPropagation();openTags(tagsButton);return}
 const toggle=e.target.closest('[data-more]');
 if(toggle){e.preventDefault();e.stopPropagation();openMenu(toggle);return}
 const row=e.target.closest('.agent-record');
 if(row&&!e.target.closest('a,button,input,select'))location.href=row.dataset.href;
});
root.addEventListener('keydown',e=>{const row=e.target.closest('.agent-record');if(row&&e.target===row&&(e.key==='Enter'||e.key===' ')){e.preventDefault();location.href=row.dataset.href}});
document.addEventListener('pointerdown',e=>{
 if(!menu.hidden&&!e.target.closest('#agentContextMenu')&&!e.target.closest('[data-more]'))closeMenu();
 if(!tagsPopover.hidden&&!e.target.closest('#agentTagsPopover')&&!e.target.closest('[data-more-tags]'))closeTags();
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!tagsPopover.hidden)closeTags(true);closeMenu()}});
window.addEventListener('resize',()=>{closeMenu();closeTags()});
byId('agentsTable')?.closest('.agents-table-scroller')?.addEventListener('scroll',()=>{closeMenu();closeTags()},{passive:true});
render();
})();
