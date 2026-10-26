/* AIMock Agents — local visual interactions only. */
(() => {
  'use strict';
  const root = document.querySelector('.agents-page');
  if (!root) return;
  const byId = id => document.getElementById(id);
  const rows = [...root.querySelectorAll('.agent-record')];
  const host = byId('agentsRows');
  const tabs = [...root.querySelectorAll('[data-tab]')];
  const search = byId('agentSearch'), role = byId('roleFilter'), tag = byId('tagFilter'), sort = byId('sortAgents');
  const prev = byId('agentsPrev'), next = byId('agentsNext');
  const pageNumber = byId('agentsPage'), pageTotal = byId('agentsPages'), count = byId('agentsCount');
  const empty = byId('agentsEmpty');
  const pop = byId('agentTagsPopover'), popTitle = byId('agentTagsHeading'), popItems = byId('agentTagsItems');
  let tab = 'all', page = 0, visible = [], activeTrigger = null;
  const perPage = 8;
  const normalize = value => String(value || '').trim().toLocaleLowerCase('ru-RU');

  // Reflect per-agent local edits made on the detail page when returning to the catalog.
  function applyLocalChanges(){
    let overrides={};
    try{overrides=JSON.parse(localStorage.getItem('aimock-agent-overrides-v1')||'{}')||{}}catch(_){}
    for(const row of rows){
      const override=overrides[row.dataset.agentId];
      if(!override)continue;
      const name=row.querySelector('.agent-name'),description=row.querySelector('.agent-description');
      if(typeof override.name==='string' && override.name.trim()){
        name.textContent=override.name;row.dataset.sortName=override.name.toLocaleLowerCase('ru-RU');
        row.setAttribute('aria-label','Открыть агента '+override.name);
      }
      if(typeof override.description==='string')description.textContent=override.description;
      if(['active','stopped','draft'].includes(override.status)){
        row.dataset.status=override.status;
        const status=row.querySelector('.agent-status');
        status.className='agent-status catalog-status '+override.status;
        const stateLabel={active:'Работает',stopped:'Остановлен',draft:'Черновик'}[override.status];
        status.replaceChildren(document.createElement('b'),document.createTextNode(stateLabel));
      }
      const avatar=row.querySelector('.agent-person .avatar');
      if(avatar){
        if(typeof override.initial==='string')avatar.textContent=override.initial;
        if(override.avatarData){avatar.style.backgroundImage='url('+JSON.stringify(override.avatarData)+')';avatar.style.backgroundSize='cover';avatar.style.backgroundPosition='center';avatar.textContent=''}
      }
      if(typeof override.tags==='string'){
        const tags=override.tags.split(',').map(t=>t.trim()).filter(Boolean);
        row.dataset.tags=tags.join(',');
        const cell=row.querySelector('.cell.tags');cell.replaceChildren();
        cell.classList.toggle('has-overflow',tags.length>2);
        for(const tagName of tags.slice(0,2)){
          const pill=document.createElement('span');pill.className='soft-chip agent-tag';pill.title=tagName;pill.textContent=tagName;cell.append(pill);
        }
        if(tags.length>2){
          const b=document.createElement('button');b.type='button';b.className='tag-more';b.dataset.moreTags=row.dataset.agentId;
          b.setAttribute('aria-controls','agentTagsPopover');b.setAttribute('aria-expanded','false');
          b.setAttribute('aria-haspopup','dialog');b.textContent='•••';b.title='Остальные теги';
          b.setAttribute('aria-label','Показать остальные теги агента '+name.textContent);cell.append(b);
        }
      }
    }
  }
  applyLocalChanges();
  const allTags = [...new Set(rows.flatMap(row => row.dataset.tags.split(',').map(t => t.trim()).filter(Boolean)))].sort((a,b) => a.localeCompare(b,'ru'));
  tag.replaceChildren(new Option('Все теги','all'), ...allTags.map(t => new Option(t,t)));

  function isOpen() {
    return pop.matches(':popover-open') || pop.classList.contains('is-open');
  }
  function closeTags(restoreFocus=false) {
    if (!activeTrigger && !isOpen()) return;
    const previousTrigger = activeTrigger;
    if (pop.matches(':popover-open')) pop.hidePopover();
    pop.classList.remove('is-open');
    if (previousTrigger) previousTrigger.setAttribute('aria-expanded','false');
    activeTrigger = null;
    if (restoreFocus && previousTrigger && previousTrigger.isConnected) previousTrigger.focus();
  }
  function positionTags() {
    if (!activeTrigger || !isOpen()) return;
    const r = activeTrigger.getBoundingClientRect();
    const width = pop.offsetWidth, height = pop.offsetHeight;
    pop.style.left = Math.max(8, Math.min(innerWidth - width - 8, r.left)) + 'px';
    pop.style.top = (r.bottom + height + 8 <= innerHeight ? r.bottom + 8 : Math.max(8, r.top - height - 8)) + 'px';
  }
  function openTags(trigger) {
    if (activeTrigger === trigger && isOpen()) { closeTags(); return; }
    closeTags();
    const row = trigger.closest('.agent-record');
    if (!row) return;
    const extras = row.dataset.tags.split(',').map(t => t.trim()).filter(Boolean).slice(2);
    if (!extras.length) return;
    activeTrigger = trigger;
    popTitle.textContent = 'Остальные теги · ' + row.querySelector('.agent-name').textContent;
    popItems.replaceChildren();
    for (const tagName of extras) {
      const chip = document.createElement('span');
      chip.className = 'soft-chip agent-tag';
      chip.textContent = tagName;
      popItems.append(chip);
    }
    if (typeof pop.showPopover === 'function') pop.showPopover();
    else pop.classList.add('is-open');
    trigger.setAttribute('aria-expanded','true');
    positionTags();
  }

  function filtered() {
    const query = normalize(search.value);
    return rows.filter(row =>
      (tab === 'all' || row.dataset.status === tab) &&
      (role.value === 'all' || row.dataset.role === role.value) &&
      (tag.value === 'all' || row.dataset.tags.split(',').includes(tag.value)) &&
      normalize(row.textContent + ' ' + row.dataset.tags).includes(query)
    ).sort((a,b) => sort.value === 'name'
       ? a.dataset.sortName.localeCompare(b.dataset.sortName,'ru')
       : Number(b.dataset.stamp) - Number(a.dataset.stamp));
  }
  function render() {
    closeTags();
    visible = filtered();
    const total = Math.max(1,Math.ceil(visible.length / perPage));
    page = Math.min(page,total - 1);
    for (const row of rows) row.hidden = true;
    for (const row of visible.slice(page*perPage,(page+1)*perPage)) {row.hidden = false; host.append(row)}
    empty.hidden = !!visible.length;
    const first = visible.length ? page*perPage+1 : 0;
    count.textContent = 'Показано '+first+'–'+Math.min((page+1)*perPage,visible.length)+' из '+visible.length;
    pageNumber.textContent = String(page+1); pageTotal.textContent = String(total);
    prev.disabled = page===0; next.disabled = page >= total-1;
    for (const item of tabs) {
      const badge=item.querySelector('span');
      if(badge)badge.textContent=String(rows.filter(row=>item.dataset.tab==='all'||row.dataset.status===item.dataset.tab).length);
      const selected = item.dataset.tab === tab;
      item.classList.toggle('selected',selected);
      item.setAttribute('aria-selected',String(selected));
    }
  }

  for (const item of tabs) item.addEventListener('click',() => {tab=item.dataset.tab;page=0;render()});
  for (const input of [search,role,tag,sort]) input.addEventListener(input===search?'input':'change',() => {page=0;render()});
  prev.addEventListener('click',() => {if(page>0){page--;render()}});
  next.addEventListener('click',() => {if(page+1<Math.ceil(visible.length/perPage)){page++;render()}});
  byId('clearAgentFilters').addEventListener('click',() => {
    search.value='';role.value='all';tag.value='all';sort.value='recent';tab='all';page=0;render();search.focus()
  });
  root.addEventListener('click',e => {
    const moreTags = e.target.closest('[data-more-tags]');
    if (moreTags) {e.preventDefault();e.stopPropagation();openTags(moreTags);return}
    const row = e.target.closest('.agent-record');
    if (row && !e.target.closest('a,button,input,select')) location.href=row.dataset.href;
  });
  root.addEventListener('keydown',e => {
    const row = e.target.closest('.agent-record');
    if (row && e.target===row && (e.key==='Enter'||e.key===' ')) {e.preventDefault();location.href=row.dataset.href}
  });
  document.addEventListener('pointerdown',e => {
    if (isOpen() && !e.target.closest('#agentTagsPopover') && !e.target.closest('[data-more-tags]')) closeTags();
  });
  document.addEventListener('keydown',e => {if(e.key==='Escape' && isOpen()) {e.preventDefault();closeTags(true)}});
  window.addEventListener('resize',closeTags);
  host.closest('.agents-table-scroller')?.addEventListener('scroll',closeTags,{passive:true});
  render();
})();