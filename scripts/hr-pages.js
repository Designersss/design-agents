/* Recruitment UI only. The real product needs authenticated APIs and RBAC. */
(() => {
'use strict';
const H=window.AIMockHR,root=document.querySelector('[data-hr-page]');
if(!H||!root)return;
const page=root.dataset.hrPage,q=new URLSearchParams(location.search);
const $=(selector,node=document)=>node.querySelector(selector);
function element(tag,cls,content){
 const el=document.createElement(tag);
 if(cls)el.className=cls;
 if(content!==undefined)el.textContent=String(content);
 return el;
}
function link(text,url,cls){
 const a=element('a',cls||'',text);a.href=url;return a;
}
function clear(node){node.replaceChildren()}
function short(value){return String(value||'').trim().toLocaleLowerCase('ru-RU')}
function pill(status,labels){
 const el=element('span','hr-pill '+status,labels[status]||status||'—');return el;
}
function stat(name,value){
 const div=element('div','hr-stat');
 div.append(element('small','',name),element('strong','',value));return div;
}
function empty(node,heading,description){
 node.hidden=false;clear(node);
 node.append(element('strong','',heading),element('p','',description));
}
function agentName(id){return H.agents.find(a=>a.id===id)?.name||'HR-агент'}
const applicationCount=id=>H.data().applications.filter(x=>x.vacancyId===id).length;
function addOption(sel,value,label){
 const option=document.createElement('option');option.value=value;option.textContent=label;sel.append(option);
}
function renderVacancies(){
 const d=H.data(),rows=$('#vacancyRows'),nothing=$('#vacanciesEmpty');
 clear(rows);clear($('#vacancyStats'));
 $('#vacancyStats').append(stat('Всего вакансий',d.vacancies.length),stat('Открытые',d.vacancies.filter(x=>x.status==='open').length),stat('Черновики',d.vacancies.filter(x=>x.status==='draft').length),stat('Отклики',d.applications.length));
 const term=short($('#vacancySearch').value),filter=$('#vacancyStatus').value;
 const list=d.vacancies.filter(v=>(!term||short([v.title,v.employer,v.location,v.requirements].join(' ')).includes(term))&&(!filter||v.status===filter));
 for(const v of list){
  const row=link('', './vacancy-detail.html?id='+encodeURIComponent(v.id),'hr-row');
  const title=element('div','hr-cell');title.append(element('strong','',v.title),element('small','',v.location||v.format||''));
  const employer=element('div','hr-cell',v.employer);
  const state=element('div','hr-cell');state.append(pill(v.status,H.statuses));
  const assigned=H.assignedAgents(v.id),agent=element('div','hr-cell',assigned.length?assigned.map(x=>x.name).join(', '):'Не назначен');
  const count=element('div','hr-cell',applicationCount(v.id));
  row.append(title,employer,state,agent,count);rows.append(row);
 }
 nothing.hidden=list.length>0;if(!list.length)empty(nothing,'Вакансий не найдено',d.vacancies.length?'Измените фильтры или создайте новую вакансию.':'Создайте первую вакансию, затем назначьте её HR-агенту.');
 $('#vacancyCount').textContent='Показано '+list.length+' из '+d.vacancies.length+' вакансий';
}
let editingId=null;
function renderVacancyForm(){
 const form=$('#vacancyForm'),id=q.get('id'),v=H.vacancy(id);editingId=v?.id||null;
 $('#vacancyPageTitle').textContent=v?v.title:'Новая вакансия';
 for(const name of ['title','employer','location','format','salary','status','description','requirements','questions']){
  const input=form.elements.namedItem(name);if(!input)continue;
  input.value=v?.[name]||(name==='status'?'draft':name==='format'?'Удалённо':'');
 }
 $('#vacancySaveStatus').textContent='';
 const assigned=$('#vacancyAgents');clear(assigned);
 if(v){
  const agents=H.assignedAgents(v.id);
  if(agents.length){
   const wrap=element('div','hr-side-links');
   agents.forEach(a=>wrap.append(link(a.name,'./agent-detail.html?agent='+encodeURIComponent(a.id)+'&tab=vacancies')));
   assigned.append(wrap);
  }else assigned.append(element('p','','Пока ни одному агенту не назначена эта вакансия.'));
  $('#vacancyApplicationsCount').textContent=applicationCount(v.id);
  $('#vacancyCandidatesLink').href='./candidates.html?vacancy='+encodeURIComponent(v.id);
 }else{
  assigned.append(element('p','','Сохраните вакансию, затем откройте настройки HR-агента.'));
  $('#vacancyApplicationsCount').textContent='0';
  $('#vacancyCandidatesLink').href='./candidates.html';
 }
}
function saveVacancy(event){
 event.preventDefault();
 const form=$('#vacancyForm');
 if(!form.reportValidity())return;
 const fields=Object.fromEntries(new FormData(form).entries());
 try{
  const vacancy=H.upsertVacancy({...fields,id:editingId});
  editingId=vacancy.id;
  history.replaceState({},'','./vacancy-detail.html?id='+encodeURIComponent(vacancy.id));
  renderVacancyForm();
  $('#vacancySaveStatus').textContent='Вакансия сохранена в этом браузере';
 }catch(err){$('#vacancySaveStatus').textContent=err.message||'Не удалось сохранить запись'}
}
function updateCandidateFilters(){
 const d=H.data();
 const vacancy=$('#candidateVacancy'),agent=$('#candidateAgent'),status=$('#candidateStatus');
 const selections=[vacancy.value,agent.value,status.value];
 vacancy.replaceChildren();addOption(vacancy,'','Все вакансии');
 d.vacancies.forEach(v=>addOption(vacancy,v.id,v.title));
 agent.replaceChildren();addOption(agent,'','Все агенты');
 H.agents.forEach(a=>addOption(agent,a.id,a.name));
 status.replaceChildren();addOption(status,'','Все статусы');
 for(const [key,label] of Object.entries(H.applicationStatuses))addOption(status,key,label);
 [vacancy,agent,status].forEach((sel,i)=>{if([...sel.options].some(x=>x.value===selections[i]))sel.value=selections[i]});
}
function renderCandidates(){
 const d=H.data(),rows=$('#candidateRows'),nothing=$('#candidatesEmpty');clear(rows);clear($('#candidateStats'));
 const unique=new Set(d.applications.map(a=>a.candidateId)).size;
 $('#candidateStats').append(stat('Кандидатов',unique),stat('Откликов',d.applications.length),stat('На рассмотрении',d.applications.filter(x=>x.status==='review').length),stat('Требуют внимания',d.applications.filter(x=>['clarify','potential'].includes(x.status)).length));
 const term=short($('#candidateSearch').value),vacancyId=$('#candidateVacancy').value,agentId=$('#candidateAgent').value,status=$('#candidateStatus').value;
 const list=d.applications.filter(app=>{
  const c=H.candidate(app.candidateId),v=H.vacancy(app.vacancyId);
  return (!term||short([c?.name,c?.email,c?.experience,v?.title,v?.employer,app.summary].join(' ')).includes(term))&&(!vacancyId||vacancyId===app.vacancyId)&&(!agentId||agentId===app.agentId)&&(!status||status===app.status);
 });
 for(const app of list){
  const c=H.candidate(app.candidateId),v=H.vacancy(app.vacancyId);
  const row=link('','./candidate-detail.html?application='+encodeURIComponent(app.id),'hr-row hr-candidate-row');
  const name=element('div','hr-cell');name.append(element('strong','',c?.name||'Без имени'),element('small','',c?.experience||''));
  const position=element('div','hr-cell',v?.title||'Вакансия удалена');
  const agent=element('div','hr-cell',agentName(app.agentId));
  const state=element('div','hr-cell');state.append(pill(app.status,H.applicationStatuses));
  row.append(name,position,agent,state,element('div','hr-cell',app.source),element('div','hr-cell',app.date));rows.append(row);
 }
 nothing.hidden=list.length>0;
 if(!list.length)empty(nothing,'Отклики не найдены',d.applications.length?'Измените фильтры или строку поиска.':'Когда HR-агент обработает отклик, здесь появится кандидат.');
 $('#candidateCount').textContent='Показано '+list.length+' из '+d.applications.length+' откликов · '+unique+' уникальных кандидатов';
}
let selectedAppId=null;
function renderCandidateDetails(){
 const requested=q.get('application'),initial=H.application(requested);
 const app=H.application(selectedAppId)||initial;
 if(!app){
  $('#candidatePageTitle').textContent='Кандидат не найден';
  $('#candidateName').textContent='Нет данных в выбранном Workspace';
  $('#candidateExperience').textContent='Откройте общий каталог кандидатов.';
  $('#candidateContact').textContent='';
  $('#applicationEditor').hidden=true;clear($('#candidateApplications'));return;
 }
 selectedAppId=app.id;const c=H.candidate(app.candidateId),v=H.vacancy(app.vacancyId);
 $('#applicationEditor').hidden=false;
 $('#candidatePageTitle').textContent=c?.name||'Кандидат';
 $('#candidateName').textContent=c?.name||'Кандидат';
 $('#candidateExperience').textContent=c?.experience||'Опыт не указан';
 $('#candidateContact').textContent=c?.email||'Контактные данные отсутствуют';
 $('#applicationVacancyTitle').textContent=v?.title||'Вакансия недоступна';
 $('#applicationEmployer').textContent=(v?.employer||'Работодатель не указан')+' · '+(v?.location||v?.format||'');
 $('#applicationAgent').textContent=agentName(app.agentId);
 $('#applicationOrigin').textContent=app.source+' · '+app.date;
 $('#applicationSummary').textContent=app.summary||'Сводка отсутствует';
 clear($('#applicationStatusBadge'));$('#applicationStatusBadge').append(pill(app.status,H.applicationStatuses));
 const select=$('#applicationStatus');select.replaceChildren();
 for(const [key,label] of Object.entries(H.applicationStatuses))addOption(select,key,label);
 select.value=app.status;
 $('#applicationNotes').value=app.notes||'';
 $('#applicationSaveState').textContent='';
 const links=$('#candidateApplications');clear(links);
 H.data().applications.filter(a=>a.candidateId===app.candidateId).forEach(a=>{
  const v=H.vacancy(a.vacancyId);
  const row=link(v?.title||'Вакансия','./candidate-detail.html?application='+encodeURIComponent(a.id),'hr-application-link'+(a.id===app.id?' selected':''));
  row.append(element('small','',H.applicationStatuses[a.status]||a.status));
  row.addEventListener('click',event=>{event.preventDefault();selectedAppId=a.id;history.pushState({},'','?application='+encodeURIComponent(a.id));renderCandidateDetails()});
  links.append(row);
 });
}
function saveCandidate(){
 if(!selectedAppId)return;
 try{
  H.updateApplication(selectedAppId,{status:$('#applicationStatus').value,notes:$('#applicationNotes').value});
  renderCandidateDetails();$('#applicationSaveState').textContent='Изменения сохранены локально';
 }catch(err){$('#applicationSaveState').textContent=err.message||'Не удалось сохранить'}
}
function init(){
 if(page==='vacancies'){
  ['vacancySearch','vacancyStatus'].forEach(id=>$('#'+id).addEventListener(id==='vacancySearch'?'input':'change',renderVacancies));
  renderVacancies();
 }else if(page==='vacancy'){
  $('#vacancyForm').addEventListener('submit',saveVacancy);renderVacancyForm();
 }else if(page==='candidates'){
  updateCandidateFilters();
  const initial=q.get('vacancy');if(initial&&H.vacancy(initial))$('#candidateVacancy').value=initial;
  const initialAgent=q.get('agent');if(initialAgent&&H.agents.some(a=>a.id===initialAgent))$('#candidateAgent').value=initialAgent;
  ['candidateSearch','candidateVacancy','candidateAgent','candidateStatus'].forEach(id=>$('#'+id).addEventListener(id==='candidateSearch'?'input':'change',renderCandidates));
  renderCandidates();
 }else if(page==='candidate'){
  $('#saveApplication').addEventListener('click',saveCandidate);
  window.addEventListener('popstate',()=>{selectedAppId=null;renderCandidateDetails()});
  renderCandidateDetails();
 }
}
function refresh(){
 if(page==='vacancies')renderVacancies();
 if(page==='vacancy')renderVacancyForm();
 if(page==='candidates'){updateCandidateFilters();renderCandidates()}
 if(page==='candidate'){selectedAppId=null;renderCandidateDetails()}
}
window.addEventListener('aimock:workspace-change',refresh);
window.addEventListener('aimock:hr-update',refresh);
init();
})();
