/* AIMock — visual interactions for agent catalog (no server mutations). */
(() => {
  'use strict';
  const page=document.querySelector('.catalog-page');if(!page)return;
  const rows=[...page.querySelectorAll('.catalog-row')],tabs=[...page.querySelectorAll('[data-tab]')];
  const input=document.getElementById('agentSearch'),role=document.getElementById('roleFilter'),group=document.getElementById('groupFilter'),status=document.getElementById('statusFilter'),tag=document.getElementById('tagFilter'),sort=document.getElementById('sortAgents');
  const empty=document.getElementById('catalogEmpty'),count=document.getElementById('catalogCount'),number=document.getElementById('catalogPageNumber'),previous=document.getElementById('catalogPrevious'),next=document.getElementById('catalogNext');
  const pageSize=6;let tab='all',index=0;
  const normalize=s=>String(s||'').toLocaleLowerCase('ru-RU').trim();
  function render(){
    const q=normalize(input.value);
    const filtered=rows.filter(row=>(tab==='all'||row.dataset.status===tab)&&(status.value==='all'||row.dataset.status===status.value)&&(role.value==='all'||row.dataset.role===role.value)&&(group.value==='all'||row.dataset.group===group.value)&&(tag.value==='all'||row.dataset.tags.split(',').includes(tag.value))&&normalize(row.textContent).includes(q));
    filtered.sort((a,b)=>sort.value==='name'?a.dataset.sortName.localeCompare(b.dataset.sortName,'ru'):Number(b.dataset.stamp)-Number(a.dataset.stamp));
    const totalPages=Math.max(1,Math.ceil(filtered.length/pageSize));index=Math.min(index,totalPages-1);
    rows.forEach(r=>r.hidden=true);
    filtered.slice(index*pageSize,(index+1)*pageSize).forEach(r=>{r.hidden=false;page.querySelector('.catalog-list').append(r)});
    // Keep the empty state and pagination within their existing visual regions.
    empty.hidden=filtered.length!==0;
    const from=filtered.length?index*pageSize+1:0,to=Math.min((index+1)*pageSize,filtered.length);
    count.textContent='Показано '+from+'–'+to+' из '+filtered.length;
    number.textContent=(index+1)+' / '+totalPages;
    previous.disabled=index===0;next.disabled=index===totalPages-1;
    tabs.forEach(t=>{const yes=t.dataset.tab===tab;t.classList.toggle('is-active',yes);t.setAttribute('aria-selected',String(yes))});
  }
  tabs.forEach(t=>t.addEventListener('click',()=>{tab=t.dataset.tab;status.value='all';index=0;render()}));
  [input,role,group,tag,sort].forEach(el=>el.addEventListener(el===input?'input':'change',()=>{index=0;render()}));
  status.addEventListener('change',()=>{tab='all';index=0;render()});
  previous.addEventListener('click',()=>{if(index>0){index--;render()}});
  next.addEventListener('click',()=>{index++;render()});
  document.getElementById('clearAgentFilters').addEventListener('click',()=>{input.value='';role.value='all';group.value='all';status.value='all';tag.value='all';sort.value='recent';tab='all';index=0;render();input.focus()});
  render();
})();
