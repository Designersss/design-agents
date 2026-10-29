/* AIMock prototype UI: navigation, search and lightweight menus. */
(() => {
  'use strict';
  const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
  const shell=$('.shell'),toggle=$('#sidebarToggle');
  const menus=new Map([['workspaceToggle','workspaceMenu'],['accountToggle','accountMenu'],['notificationsToggle','notificationsMenu'],['periodToggle','periodMenu']]);
  const sd=$('#searchDialog'),si=$('#demoSearchInput'),sr=$('#searchResults');
  const prefix=document.body.dataset.depth==='sub'?'../':'./';
  // The HR workspace is contextual: never add two permanent links for non-HR users.
  const hrSection=document.createElement('div');
  hrSection.className='hr-nav-group';hrSection.hidden=true;
  hrSection.innerHTML='<button type="button" class="hr-nav-parent" aria-expanded="false" aria-controls="hrNavChildren"><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V4h8v3M3 12h18"/></svg><span>Подбор персонала</span><span class="hr-nav-chevron" aria-hidden="true">⌄</span></button><div class="hr-nav-links" id="hrNavChildren"><a href="'+prefix+'pages/vacancies.html">Вакансии</a><a href="'+prefix+'pages/candidates.html">Кандидаты</a></div>';
  const agentsNav=$('.sidebar .navrow[href$="/agents.html"]');
  agentsNav?.after(hrSection);
  const hrToggle=$('.hr-nav-parent',hrSection),hrLinks=$('.hr-nav-links',hrSection);
  const onHRPage=/\/(?:vacancies|vacancy-detail|candidates|candidate-detail)\.html$/.test(location.pathname);
  let hrNavOpen=onHRPage;
  function visibleHR(){
    let personal=false,records=false;
    try{
      personal=sessionStorage.getItem('aimock-space')==='personal';
      const snapshot=JSON.parse(localStorage.getItem('aimock-hr-workspace-demo-v1')||'{}');
      const workspace=snapshot[personal?'personal':'company'];
      if(!workspace)return !personal; // Default demo company includes HR; personal starts empty.
      records=workspace.hrEnabled===true||workspace.vacancies?.length>0||workspace.candidates?.length>0||workspace.applications?.length>0;
    }catch(_){return !personal}
    return !!records;
  }
  function updateHRNav(){
    const visible=visibleHR();
    hrSection.hidden=!visible;
    const expanded=visible&&hrNavOpen;
    hrToggle.setAttribute('aria-expanded',String(expanded));
    hrLinks.hidden=!expanded;
    hrToggle.classList.toggle('selected',onHRPage);
    $('.hr-nav-links a',hrSection).forEach(a=>{
      a.classList.toggle('selected',location.pathname.endsWith('/vacancy-detail.html')?a.href.includes('vacancies.html'):location.pathname.endsWith('/candidate-detail.html')?a.href.includes('candidates.html'):new URL(a.href).pathname===location.pathname);
    });
  }
  hrToggle?.addEventListener('click',()=>{hrNavOpen=!hrNavOpen;updateHRNav()});
  window.addEventListener('aimock:hr-update',updateHRNav);
  window.addEventListener('aimock:workspace-change',updateHRNav);
  updateHRNav();

  // Подсветка активного раздела на отдельных страницах.
  if(document.body.dataset.depth==='sub')$$('.navrow[href]').forEach(a=>a.classList.toggle('selected',new URL(a.href,location.href).pathname===location.pathname));
  const destinations={agent:'pages/agent-detail.html',chat:'pages/dialog-detail.html',attention:'pages/attention.html',integration:'pages/integrations.html',activity:'pages/journal.html'};
  const href=type=>prefix+(destinations[type]||'index.html');
  let open=null;
  function close(){if(!open)return;const [id,pid]=open;$('#'+pid).hidden=true;$('#'+id)?.setAttribute('aria-expanded','false');open=null}
  function menu(id){const pid=menus.get(id);if(!pid)return;if(open?.[0]===id){close();return}close();const b=$('#'+id),p=$('#'+pid);if(!b||!p)return;p.hidden=false;b.setAttribute('aria-expanded','true');const r=b.getBoundingClientRect(),size=p.getBoundingClientRect();p.style.left=Math.max(12,Math.min(r.left,innerWidth-size.width-12))+'px';const above=r.top-size.height-8;p.style.top=Math.max(12,above>=12?above:Math.min(innerHeight-size.height-12,r.bottom+8))+'px';open=[id,pid]}
  function space(kind){const isCompany=kind==='company',b=$('#workspaceToggle');if(!b)return;$('strong',b).textContent=isCompany?'Acme Corp':'Личное';const subtitle=$('div > span',b);if(subtitle)subtitle.textContent=isCompany?'Пространство компании':'Личное пространство';$('.work-icon',b).textContent=isCompany?'A':'Д';const crumb=$('.crumb');if(crumb?.firstChild)crumb.firstChild.textContent=isCompany?'Acme Corp ':'Личное ';$$('a[href$="/team.html"]').forEach(x=>x.hidden=!isCompany);$$('[data-space]').forEach(x=>{const yes=x.dataset.space===kind;x.classList.toggle('is-selected',yes);x.setAttribute('aria-checked',String(yes))});try{sessionStorage.setItem('aimock-space',kind)}catch(_){}window.dispatchEvent(new CustomEvent('aimock:workspace-change',{detail:{space:kind}}));close()}
  try{space(sessionStorage.getItem('aimock-space')==='personal'?'personal':'company')}catch(_){space('company')}
  function renderSearch(){if(!sr||!si)return;sr.replaceChildren();const q=si.value.trim().toLocaleLowerCase('ru-RU');if(!q){const p=document.createElement('p');p.className='search-empty';p.textContent='Поиск по агентам, диалогам и обращениям';sr.append(p);return}const matches=$$('[data-preview]').filter(el=>el.textContent.toLocaleLowerCase('ru-RU').includes(q));if(!matches.length){const p=document.createElement('p');p.className='search-empty';p.textContent='Ничего не найдено';sr.append(p);return}for(const el of matches){const a=document.createElement('a');a.className='search-result';a.href=href(el.dataset.preview);const title=document.createElement('strong');title.textContent=(el.querySelector('.agent-name,.chatname,.alert-info>div,.recentitem strong,.integration strong')||el).textContent.trim();const secondary=document.createElement('small');secondary.textContent=el.textContent.trim().replace(/\s+/g,' ').slice(0,120);a.append(title,secondary);sr.append(a)}}
  function search(){if(!sd)return;close();si.value='';renderSearch();sd.showModal();si.focus()}
  document.addEventListener('click',e=>{const btn=e.target.closest('button');if(btn&&menus.has(btn.id)){menu(btn.id);return}if(e.target.closest('#sidebarToggle')){close();const off=shell.classList.toggle('is-collapsed');toggle?.setAttribute('aria-expanded',String(!off));toggle?.setAttribute('aria-label',off?'Развернуть меню':'Свернуть меню');try{sessionStorage.setItem('aimock-sidebar-collapsed',off?'1':'0')}catch(_){}return}if(btn?.dataset.space){space(btn.dataset.space);return}if(btn?.dataset.period){const label=$('#periodLabel');if(label)label.textContent=btn.dataset.period==='7'?'За 7 дней':'За 30 дней';$$('[data-period]').forEach(x=>x.classList.toggle('is-selected',x===btn));close();return}if(e.target.closest('#searchToggle')){search();return}if(btn?.hasAttribute('data-close-dialog')){btn.closest('dialog')?.close();return}const row=e.target.closest('[data-preview]');if(row&&!row.closest('a[href]')){location.href=href(row.dataset.preview);return}if(open&&!e.target.closest('#'+open[1]))close()});
  document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();search()}if(e.key==='Escape')close();if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-preview]')){e.preventDefault();e.target.click()}});
  try{if(sessionStorage.getItem('aimock-sidebar-collapsed')==='1'){shell.classList.add('is-collapsed');toggle?.setAttribute('aria-expanded','false')}}catch(_){}
  si?.addEventListener('input',renderSearch);sd?.addEventListener('click',e=>{if(e.target===sd)sd.close()});window.addEventListener('resize',close);
})();
