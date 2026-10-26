
/* Visual-only interactions for AIMock / Agents; no server operations. */
(() => {
'use strict';
const root=document.querySelector('.agents-page');
if(!root)return;
const byId=id=>document.getElementById(id);
const rows=[...root.querySelectorAll('.agent-record')];
const rowsHost=byId('agentsRows');
const tabs=[...root.querySelectorAll('[data-tab]')];
const search=byId('agentSearch'),role=byId('roleFilter'),group=byId('groupFilter'),tag=byId('tagFilter'),sort=byId('sortAgents');
const pagePrev=byId('agentsPrev'),pageNext=byId('agentsNext'),pageIndex=byId('agentsPage'),pagesTotal=byId('agentsPages'),count=byId('agentsCount');
const empty=byId('agentsEmpty'),selectAll=byId('selectAllAgents'),selectedBar=byId('agentSelection'),selectedCount=byId('selectedCount');
const menu=byId('agentContextMenu');
const perPage=8;
let activeTab='all',currentPage=0,visible=[],currentMenuButton=null;
const normalize=s=>String(s||'').trim().toLocaleLowerCase('ru-RU');
const selected=new Set();
function filtered(){
 const query=normalize(search.value);
 return rows.filter(row=>(activeTab==='all'||row.dataset.status===activeTab)
  &&(role.value==='all'||row.dataset.role===role.value)
  &&(group.value==='all'||row.dataset.group===group.value)
  &&(tag.value==='all'||row.dataset.tags.split(',').includes(tag.value))
  &&normalize(row.textContent).includes(query))
  .sort((a,b)=>sort.value==='name'?a.dataset.sortName.localeCompare(b.dataset.sortName,'ru')
   :sort.value==='cases'?Number(b.dataset.count)-Number(a.dataset.count)
   :Number(b.dataset.stamp)-Number(a.dataset.stamp));
}
function updateSelection(){
 const pageRows=visible.slice(currentPage*perPage,(currentPage+1)*perPage);
 for(const row of rows){const isSelected=selected.has(row.dataset.agentId);row.classList.toggle('is-selected',isSelected);row.querySelector('.agent-check').checked=isSelected;}
 const onPage=pageRows.filter(row=>selected.has(row.dataset.agentId)).length;
 selectAll.checked=pageRows.length>0&&onPage===pageRows.length;
 selectAll.indeterminate=onPage>0&&onPage<pageRows.length;
 selectedBar.hidden=selected.size===0;
 selectedCount.textContent='Выбрано: '+selected.size;
}
function render(){
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
 updateSelection();
}
function closeMenu(){
 menu.hidden=true;
 currentMenuButton?.setAttribute('aria-expanded','false');
 currentMenuButton=null;
}
function openMenu(btn){
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
for(const input of [search,role,group,tag,sort])input.addEventListener(input===search?'input':'change',()=>{currentPage=0;closeMenu();render()});
pagePrev.addEventListener('click',()=>{if(currentPage>0){currentPage--;render()}});
pageNext.addEventListener('click',()=>{if(currentPage+1<Math.ceil(visible.length/perPage)){currentPage++;render()}});
selectAll.addEventListener('change',()=>{for(const row of visible.slice(currentPage*perPage,(currentPage+1)*perPage)){if(selectAll.checked)selected.add(row.dataset.agentId);else selected.delete(row.dataset.agentId)}updateSelection()});
byId('clearSelection').addEventListener('click',()=>{selected.clear();updateSelection()});
byId('clearAgentFilters').addEventListener('click',()=>{search.value='';role.value='all';group.value='all';tag.value='all';sort.value='recent';activeTab='all';currentPage=0;render();search.focus()});
root.addEventListener('click',e=>{
 const toggle=e.target.closest('[data-more]');
 if(toggle){e.preventDefault();e.stopPropagation();openMenu(toggle);return}
 const checkbox=e.target.closest('.agent-check');
 if(checkbox){e.stopPropagation();if(checkbox.checked)selected.add(checkbox.value);else selected.delete(checkbox.value);updateSelection();return}
 const row=e.target.closest('.agent-record');
 if(row&&!e.target.closest('a,button,input,select'))location.href=row.dataset.href;
});
root.addEventListener('keydown',e=>{const row=e.target.closest('.agent-record');if(row&&e.target===row&&(e.key==='Enter'||e.key===' ')){e.preventDefault();location.href=row.dataset.href}});
document.addEventListener('pointerdown',e=>{if(!menu.hidden&&!e.target.closest('#agentContextMenu')&&!e.target.closest('[data-more]'))closeMenu()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu()});
window.addEventListener('resize',closeMenu);
render();
})();
