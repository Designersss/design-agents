/* AIMock agent detail: local UI interactions; no API calls. */
(() => {
'use strict';
const root=document.getElementById('detailRoot');if(!root)return;
const el=id=>document.getElementById(id),query=new URLSearchParams(location.search);
const defaults={
a1:['HR-рекрутер','Проводит первичный отбор кандидатов','recruiter','active','А','#4a454d','Подбор, Вакансии, Первичный отбор, Собеседования, Резюме',124,36,8,'28 сек'],
a2:['Менеджер заявок','Принимает обращения и отвечает клиентам','inbound','active','Д','#345258','Продажи, Входящие, Консультации, Срочно',98,64,12,'33 сек'],
a3:['Поддержка','Отвечает на вопросы пользователей','inbound','active','С','#584442','FAQ, Клиенты, Поддержка',42,31,4,'25 сек'],
a4:['Рекрутер · Дизайн','Помогает HR с поиском специалистов','recruiter','active','М','#3f4c68','Подбор, Дизайн, Портфолио, Интервью',73,22,7,'29 сек'],
a5:['Менеджер партнёров','Входящие заявки от партнёров','inbound','active','М','#4a454d','Продажи, Партнёры',28,21,3,'32 сек'],
a6:['HR · Регионы','Отбор кандидатов в регионах','recruiter','active','Р','#345258','Подбор, Регионы, Вакансии, Массовый найм',31,19,5,'26 сек'],
a7:['Поддержка сайта','Обращения из каналов компании','inbound','stopped','С','#584442','FAQ, Поддержка',8,7,1,'35 сек'],
a8:['Новый рекрутер','Инструкция и подключения не завершены','recruiter','draft','Н','#3f4c68','Подбор',0,0,0,'—'],
a9:['Рекрутер · IT','Подбор технических специалистов','recruiter','active','Р','#4a454d','Подбор, IT, Вакансии, Собеседования',58,25,6,'27 сек'],
a10:['Менеджер · Архив','Обработка архивных запросов','inbound','stopped','М','#345258','FAQ, Архив',4,4,0,'41 сек']
};
const id=Object.hasOwn(defaults,query.get('agent'))?query.get('agent'):'a1';
const keys=['name','description','role','status','initial','color','tags','dialogs','processed','transferred','response'];
const base=Object.fromEntries(keys.map((key,i)=>[key,defaults[id][i]]));
const key='aimock-agent-overrides-v1';let saved={};
try{saved=JSON.parse(localStorage.getItem(key)||'{}')||{}}catch(_){}
const agent={...base,...(saved[id]||{})};
const text=(id,v)=>{if(el(id))el(id).textContent=String(v)};
const link=tab=>'?agent='+encodeURIComponent(id)+'&tab='+encodeURIComponent(tab);
const valid=['overview','settings','integrations','work','knowledge','testing','journal'];
let settingsTimer,profileTimer;
document.querySelector('.navrow[href$="/agents.html"]')?.classList.add('selected');
function persist(){saved[id]={...agent};try{localStorage.setItem(key,JSON.stringify(saved));return true}catch(_){return false}}
function selectedTab(tab,push=false){
 const current=valid.includes(tab)?tab:'overview';
 document.querySelectorAll('[data-agent-tab]').forEach(a=>{
 const selected=a.dataset.agentTab===current;
 a.classList.toggle('active',selected);
 a.href=link(a.dataset.agentTab);
 if(selected)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');
 });
 document.querySelectorAll('[data-pane]').forEach(panel=>panel.hidden=panel.dataset.pane!==current);
 if(push)history.pushState({},'',link(current));
 el('detailScroll').scrollTop=0;
}
const chartSamples={
  7:{dialog:[147,134,138,120,112,123,91,102,83,69,81,50],done:[173,166,158,150,153,139,130,134,118,111,100,92]},
  30:{dialog:[169,140,127,138,94,110,83,92,68,79,51,32],done:[176,171,163,153,144,152,127,135,112,123,97,84]}
};
function updateOverviewMetrics(){
 const period=Number(el('overviewPeriod')?.value||7);
 const multiplier=period===30?4:1;
 text('metricDialogs',Math.round(agent.dialogs*multiplier).toLocaleString('ru-RU'));
 text('metricProcessed',Math.round(agent.processed*multiplier).toLocaleString('ru-RU'));
 text('metricTransferred',Math.round(agent.transferred*multiplier).toLocaleString('ru-RU'));
 text('metricResponse',agent.response);
 const lines=chartSamples[period]||chartSamples[7];
 const toPoints=arr=>arr.map((y,i)=>[32+i*676/(arr.length-1),y]);
 const make=arr=>toPoints(arr).map(([x,y])=>x.toFixed(1)+','+y).join(' ');
 el('trendDialogs').setAttribute('points',make(lines.dialog));
 el('trendHandled').setAttribute('points',make(lines.done));
 const start=toPoints(lines.dialog);
 const path='M'+start.map(([x,y])=>x.toFixed(1)+' '+y).join(' L')+' L708 182 L32 182Z';
 el('trendArea').setAttribute('d',path);
}
function closeProfileTags(){
 el('detailTagsPopup').hidden=true;
 el('detailTagsMore').setAttribute('aria-expanded','false');
}
function renderProfileTags(){
 const tags=String(agent.tags||'').split(',').map(s=>s.trim()).filter(Boolean);
 const container=el('detailTags'),popup=el('detailTagsPopup'),button=el('detailTagsMore');
 container.replaceChildren();popup.replaceChildren();closeProfileTags();
 for(const label of tags.slice(0,3)){
   const chip=document.createElement('span');chip.className='profile-tag';chip.textContent=label;container.append(chip);
 }
 for(const label of tags.slice(3)){
   const chip=document.createElement('span');chip.className='profile-tag';chip.textContent=label;popup.append(chip);
 }
 button.hidden=tags.length<=3;
 button.textContent='+'+(tags.length-3);
 button.setAttribute('aria-label','Показать ещё '+(tags.length-3)+' тегов агента');
}
function showSettingSection(key){
 const views=[...document.querySelectorAll('[data-setting-view]')];
 const allowed=['employer','vacancies','recipient','domain','custom','model','access','sources','preflight'];
 const initial=agent.role==='recruiter'?'employer':'domain';
 const choice=allowed.includes(key)?key:initial;
 const target=(agent.role==='recruiter'&&choice==='domain')||(agent.role!=='recruiter'&&['employer','vacancies','recipient'].includes(choice))?initial:choice;
 views.forEach(view=>{view.hidden=view.dataset.settingView!==target});
 document.querySelectorAll('[data-setting-key]').forEach(button=>{
   const active=button.dataset.settingKey===target;button.classList.toggle('active',active);
   button.setAttribute('aria-current',String(active));
 });
}


const employerStorageKey='aimock-employer-profiles-preview-v1';
const sampleEmployers=[
{id:'demo-tech',kind:'company',name:'Технологии Плюс',industry:'IT и разработка',website:'https://techplus.example',location:'Москва / удалённо',description:'Разработка корпоративных веб-сервисов и цифровых продуктов.'},
{id:'demo-sole',kind:'sole',name:'ИП Мария Орлова',industry:'Дизайн и брендинг',website:'',location:'Санкт-Петербург / удалённо',description:'Небольшая студия графического и продуктового дизайна.'}
];
function loadEmployers(){
 try{
  const custom=JSON.parse(localStorage.getItem(employerStorageKey)||'[]');
  if(!Array.isArray(custom))return [...sampleEmployers];
  const byId=new Map(sampleEmployers.map(x=>[x.id,x]));
  for(const item of custom){if(item&&typeof item.id==='string'&&typeof item.name==='string')byId.set(item.id,item)}
  return [...byId.values()];
 }catch(_){return [...sampleEmployers]}
}
let employers=loadEmployers(),editingEmployer=null;
function persistEmployers(){
 try{localStorage.setItem(employerStorageKey,JSON.stringify(employers));return true}catch(_){return false}
}
const kindLabels={company:'Компания',sole:'ИП',project:'Проект',agency:'Агентство'};
function updateCustomCount(){text('customInstructionsCount',el('customInstructionsInput').value.length+' / 2500')}
function setEmployerActions(){
 const locked=agent.status==='active';
 el('addEmployer').disabled=locked;
 el('editEmployer').disabled=locked||!el('employerSelect').value;
 el('insertInstructionExample').disabled=locked;
 el('knowledgeFileInput').disabled=locked;
 el('knowledgeUploadLabel').classList.toggle('is-disabled',locked);
}
function renderEmployerProfile(){
 const select=el('employerSelect'),selectedId=agent.previewEmployerId===undefined?'demo-tech':agent.previewEmployerId;
 select.replaceChildren();
 const empty=document.createElement('option');empty.value='';empty.textContent='Выберите работодателя';select.append(empty);
 for(const employer of employers){const option=document.createElement('option');option.value=employer.id;option.textContent=employer.name;select.append(option)}
 select.value=employers.some(e=>e.id===selectedId)?selectedId:'';
 const employer=employers.find(e=>e.id===select.value),present=!!employer;
 el('employerProfile').hidden=!present;el('employerEmpty').hidden=present;
 if(present){
  text('employerAvatar',(employer.name||'К').trim().slice(0,1).toLocaleUpperCase('ru-RU'));
  text('employerDisplayName',employer.name);
  text('employerDisplayType',(kindLabels[employer.kind]||'Работодатель')+(employer.industry?' · '+employer.industry:''));
  text('employerDisplayDescription',employer.description||'Описание ещё не заполнено');
  text('employerDisplayLocation',employer.location||'Локация не указана');
  text('employerDisplayWebsite',employer.website||'Сайт не указан');
 }
 el('editEmployer').disabled=agent.status==='active'||!present;
}
function openEmployerForm(existing){
 if(agent.status==='active')return;
 editingEmployer=existing?.id||null;
 text('employerEditorTitle',existing?'Изменить работодателя':'Добавить работодателя');
 for(const name of ['kind','name','industry','website','location','description']){
  el('employerForm').elements[name].value=existing?.[name]||'';
 }
 if(!existing)el('employerKind').value='company';
 text('employerFormStatus','Данные пока сохраняются только в этом браузере. Реальный аккаунт и права будут подключены через API.');
 el('employerEditorDialog').showModal();
}

function syncSpace(){
 let personal=false;try{personal=sessionStorage.getItem('aimock-space')==='personal'}catch(_){}
 el('companyAccess').hidden=personal;
 const staff=el('hrRecipientTeamOption');staff.disabled=personal;staff.hidden=personal;
 if(personal&&el('hrRecipientInput').value==='hr'){
   el('hrRecipientInput').value='owner';
   if(agent.status!=='active'){agent.hrRecipient='owner';persist()}
 }
}
function render(){
  const titles=agent.role==='recruiter'
   ?[['Новый отклик','Кандидат оставил обращение'],['Интервью завершено','Результаты переданы HR'],['Диалог завершён','Кандидат получил ответ']]
   :[['Новое обращение','Клиент написал через канал связи'],['Передано сотруднику','Требуется ручное рассмотрение'],['Обращение обработано','Клиент получил ответ']];
 titles.forEach(([title,note],i)=>{text('agentEventTitle'+(i+1),title);text('agentEventNote'+(i+1),note)});

 const recruiter=agent.role==='recruiter',active=agent.status==='active';
 text('agentName',agent.name);text('agentDescription',agent.description);
 text('topAgentCrumb',agent.name);text('detailCrumb',agent.name);
 text('agentRole',recruiter?'Рекрутер':'Менеджер обращений');text('heroRole',recruiter?'AI-рекрутер':'AI-менеджер обращений');
 updateOverviewMetrics();
 text('metricResultLabel',recruiter?'Кандидатов обработано':'Заявок обработано');
 text('workTitle',recruiter?'Кандидаты':'Заявки');
 const workTab=document.querySelector('[data-agent-tab="work"]');workTab.textContent=recruiter?'Кандидаты':'Заявки';
 const workQuick=document.querySelector('[data-internal-tab="work"]>span>span');if(workQuick)workQuick.textContent=recruiter?'Кандидаты':'Заявки';
 const purpose=document.getElementById('agentPurpose');
 if(purpose)purpose.textContent=recruiter?'Проводит первичный диалог с кандидатами, уточняет опыт и передаёт анкеты на рассмотрение HR-специалисту.':'Принимает обращения, отвечает на вопросы клиентов и передаёт сложные запросы сотруднику.';
 const tasks=recruiter?['Уточняет опыт и ожидания','Собирает ответы на вопросы','Передаёт анкеты сотруднику']:['Определяет цель обращения','Помогает решить типовой вопрос','Передаёт сложные запросы сотруднику'];
 const holder=document.getElementById('agentTasks');
 holder.replaceChildren(...tasks.map(s=>{const div=document.createElement('div');div.className='task-item';div.textContent='✓  '+s;return div}));
 text('agentStatusText',active?'Работает':agent.status==='stopped'?'Остановлен':'Черновик');
 el('agentStatus').className='status-pill '+agent.status;
 el('lifecycleButton').textContent=active?'Остановить':'Запустить';
 el('lifecycleButton').classList.toggle('primary',active);
 el('editProfileButton').disabled=active;
 el('editProfileButton').title=active?'Сначала остановите агента':'Изменить профиль';
 document.querySelectorAll('[data-editable]').forEach(input=>input.disabled=active);
 // The Admin-published model catalog is not connected in this prototype.
 el('publicModelInput').disabled=true;
 text('autosaveState',active?'Только просмотр':'Автосохранение включено');
 el('tagsInput').value=agent.tags;el('accessInput').value=agent.access||'team';
 el('customInstructionsInput').value=agent.customInstructions??agent.taskSpecific??'';
 el('businessContextInput').value=agent.businessContext??'';
 el('serviceTypesInput').value=agent.serviceTypes??'';
 el('resultDestinationInput').value=agent.resultDestination??'owner';
 updateCustomCount();
 text('builtinProfessionTitle',recruiter?'HR-рекрутер уже подготовлен к работе':'Профессиональные навыки уже встроены');
 text('builtinProfessionDescription',recruiter?'Он умеет проводить интервью, уточнять сведения, проверять факты и передавать результаты HR. Ничего из этого не нужно прописывать вручную.':'Агент умеет обрабатывать типовые обращения, проверять сведения и передавать сложные случаи человеку. Добавляйте только сведения своего бизнеса.');
 el('hrRecipientInput').value=agent.hrRecipient??'owner';
 const notify=agent.hrNotifications||{new:true,review:true,clarify:true};
 el('hrNotifyNew').checked=notify.new!==false;
 el('hrNotifyReview').checked=notify.review!==false;
 el('hrNotifyClarify').checked=notify.clarify!==false;
 const assigned=agent.assignedVacancies||['vacancyFrontend'];
 el('vacancyFrontend').checked=assigned.includes('vacancyFrontend');
 el('vacancyDesigner').checked=assigned.includes('vacancyDesigner');
 el('modelModeInput').value=agent.modelMode||'automatic';
 el('explicitModelWrap').hidden=el('modelModeInput').value!=='explicit';
 const hr=agent.role==='recruiter';
 document.querySelectorAll('[data-setting-scope]').forEach(button=>{
  button.hidden=(button.dataset.settingScope==='hr'&&!hr)||(button.dataset.settingScope==='other'&&hr);
 });
 if(!hr&&document.querySelector('[data-setting-key="employer"].active'))showSettingSection('domain');
 setEmployerActions();renderEmployerProfile();
 document.querySelectorAll('[data-go-setting][data-hr-only]').forEach(button=>button.hidden=!hr);
 el('settingsLockNote').hidden=!active;

 const ready=agent.status!=='draft';
 text('readinessLabel',ready?'Проверка при запуске':'Черновик — не проверено');
 el('readinessLabel').classList.toggle('warning',!ready);
 text('readinessInstructions','Встроены в профессию');
 text('readinessChannel','Проверит сервер');
 document.querySelectorAll('[data-pane="integrations"] .service-line em').forEach(e=>{
   e.textContent=ready?'Подключено':'Не подключено';
   e.style.color=ready?'':'#d9b47e';
 });
 const workDescriptions=recruiter?['Вопрос о вакансии','Ожидает ответа','Информация получена']:['Вопрос по продукту','Ожидает решения','Обращение получено'];
 document.querySelectorAll('[data-pane="work"] .work-row small').forEach((e,i)=>{e.textContent=workDescriptions[i]});
 const firstKnowledge=document.querySelector('[data-pane="knowledge"] .file-row strong');
 if(firstKnowledge)firstKnowledge.textContent=recruiter?'Информация о вакансиях':'Материалы о продуктах';

 const avatar=el('agentDetailAvatar');avatar.style.setProperty('--av',agent.color);avatar.textContent=agent.avatarData?'':agent.initial;
 avatar.style.backgroundImage=agent.avatarData?'url('+JSON.stringify(agent.avatarData)+')':'none';
 renderProfileTags();renderKnowledge();
 document.title=agent.name+' — AIMock';syncSpace();
 document.querySelectorAll('[data-internal-tab]').forEach(a=>a.href=link(a.dataset.internalTab));
}

el('employerSelect').addEventListener('change',()=>{
 if(agent.status==='active')return;
 agent.previewEmployerId=el('employerSelect').value;persist();renderEmployerProfile();text('autosaveState','Работодатель выбран · локально сохранено');
});
el('addEmployer').addEventListener('click',()=>openEmployerForm(null));
el('editEmployer').addEventListener('click',()=>openEmployerForm(employers.find(e=>e.id===el('employerSelect').value)));
for(const id of ['employerCancel','employerCancelTop'])el(id).addEventListener('click',()=>el('employerEditorDialog').close());
el('employerForm').addEventListener('submit',event=>{
 event.preventDefault();if(agent.status==='active')return;
 const values={};
 for(const field of ['kind','name','industry','website','location','description'])values[field]=el('employerForm').elements[field].value.trim();
 if(!values.name){text('employerFormStatus','Введите название работодателя');return}
 // The form is a local UI prototype, not a public employer directory.
 const employerId=editingEmployer||'local-'+Date.now().toString(36);
 const entry={id:employerId,...values};
 const oldIndex=employers.findIndex(x=>x.id===employerId);
 if(oldIndex>=0)employers[oldIndex]=entry;else employers.push(entry);
 const savedOk=persistEmployers();
 if(!savedOk){text('employerFormStatus','Не удалось сохранить данные в браузере');return}
 agent.previewEmployerId=employerId;persist();renderEmployerProfile();el('employerEditorDialog').close();
 text('autosaveState','Данные работодателя сохранены локально');
});
el('insertInstructionExample').addEventListener('click',()=>{
 if(agent.status==='active')return;
 const textarea=el('customInstructionsInput');
 const sample='Для удалённых вакансий уточняй готовность работать по московскому времени. Если кандидат просит нестандартный график, передавай этот вопрос HR. Не обещай индивидуальные условия без согласования.';
 textarea.value=(textarea.value?textarea.value.trim()+'\n\n':'')+sample;
 textarea.value=textarea.value.slice(0,2500);
 saveSettings();textarea.focus();
});
document.querySelectorAll('[data-go-setting]').forEach(button=>button.addEventListener('click',()=>showSettingSection(button.dataset.goSetting)));
const knowledgeInput=el('knowledgeFileInput');
function renderKnowledge(){
 const container=el('knowledgeLocalList');container.replaceChildren();
 for(const entry of agent.previewKnowledge||[]){
  const row=document.createElement('div');row.className='knowledge-preview-item';
  const info=document.createElement('div'),name=document.createElement('strong'),details=document.createElement('small');
  name.textContent=entry.name;details.textContent='Только локальный список · файл не загружен';
  info.append(name,details);
  const remove=document.createElement('button');remove.type='button';remove.textContent='Убрать';
  remove.disabled=agent.status==='active';
  remove.addEventListener('click',()=>{agent.previewKnowledge=(agent.previewKnowledge||[]).filter(x=>x.id!==entry.id);persist();renderKnowledge()});
  row.append(info,remove);container.append(row);
 }
}
knowledgeInput.addEventListener('change',event=>{
 if(agent.status==='active')return;
 const files=Array.from(event.target.files||[]);
 const safeFiles=files.filter(file=>/\.(pdf|docx?|txt|md)$/i.test(file.name)&&file.size<=10*1024*1024);
 const current=agent.previewKnowledge||[];
 agent.previewKnowledge=[...current,...safeFiles.map((file,i)=>({id:'item-'+Date.now()+'-'+i,name:file.name.slice(0,110)}))].slice(-12);
 persist();renderKnowledge();knowledgeInput.value='';
});

el('overviewPeriod').addEventListener('change',updateOverviewMetrics);
document.querySelectorAll('[data-setting-key]').forEach(button=>button.addEventListener('click',()=>showSettingSection(button.dataset.settingKey)));
el('detailTagsMore').addEventListener('click',e=>{
 e.preventDefault();e.stopPropagation();
 const open=el('detailTagsPopup').hidden;
 el('detailTagsPopup').hidden=!open;el('detailTagsMore').setAttribute('aria-expanded',String(open));
});
document.addEventListener('click',e=>{
 if(!e.target.closest('.profile-tags'))closeProfileTags();
});
document.addEventListener('keydown',e=>{
 if(e.key==='Escape')closeProfileTags();
});
for(const a of document.querySelectorAll('[data-agent-tab],[data-internal-tab]'))a.addEventListener('click',e=>{e.preventDefault();selectedTab(a.dataset.agentTab||a.dataset.internalTab,true)});
window.addEventListener('popstate',()=>selectedTab(new URLSearchParams(location.search).get('tab')));
document.addEventListener('click',e=>{if(e.target.closest('[data-space]'))queueMicrotask(syncSpace)});
function saveSettings(){
 if(agent.status==='active')return;
 agent.tags=el('tagsInput').value;agent.access=el('accessInput').value;
 agent.customInstructions=el('customInstructionsInput').value;
 agent.businessContext=el('businessContextInput').value;
 agent.serviceTypes=el('serviceTypesInput').value;
 agent.resultDestination=el('resultDestinationInput').value;
 updateCustomCount();
 agent.hrRecipient=el('hrRecipientInput').value;
 agent.hrNotifications={
   new:el('hrNotifyNew').checked,
   review:el('hrNotifyReview').checked,
   clarify:el('hrNotifyClarify').checked
 };
 agent.assignedVacancies=['vacancyFrontend','vacancyDesigner'].filter(v=>el(v).checked);
 agent.modelMode=el('modelModeInput').value;
 el('explicitModelWrap').hidden=agent.modelMode!=='explicit';

 text('autosaveState',persist()?'Изменения сохранены':'Не удалось сохранить');
 renderProfileTags();
}
for(const input of document.querySelectorAll('[data-editable]')){
 input.addEventListener('input',()=>{if(agent.status==='active')return;text('autosaveState','Сохранение…');clearTimeout(settingsTimer);settingsTimer=setTimeout(saveSettings,250)});
 input.addEventListener('change',saveSettings);
}
const stopDialog=el('stopAgentDialog'),editDialog=el('profileDialog');
el('lifecycleButton').addEventListener('click',()=>{
 if(agent.status==='active'){stopDialog.showModal();return}
 if(agent.status==='draft'||(agent.modelMode==='explicit'&&!agent.publicModelId)){
 selectedTab('settings',true);
 showSettingSection('preflight');
 text('autosaveState','Проверьте реальные подключения, права и модель перед запуском');return;
 }
 agent.status='active';persist();render();
});
for(const b of document.querySelectorAll('[data-close-stop]'))b.addEventListener('click',()=>stopDialog.close());
el('confirmStop').addEventListener('click',()=>{agent.status='stopped';persist();stopDialog.close();render()});
function saveProfile(){
 if(agent.status==='active')return;
 agent.name=el('profileName').value.trim()||agent.name;
 agent.description=el('profileDescription').value.trim();
 agent.initial=agent.name.charAt(0).toLocaleUpperCase('ru-RU');
 text('profileSaveState',persist()?'Изменения сохранены':'Не удалось сохранить');
 text('agentName',agent.name);text('agentDescription',agent.description);
 text('topAgentCrumb',agent.name);text('detailCrumb',agent.name);
 el('agentDetailAvatar').textContent=agent.avatarData?'':agent.initial;
 document.title=agent.name+' — AIMock';
}
el('editProfileButton').addEventListener('click',()=>{
 if(agent.status==='active')return;
 el('profileName').value=agent.name;el('profileDescription').value=agent.description;
 text('profileSaveState','Изменения сохраняются автоматически');editDialog.showModal();
});
for(const button of document.querySelectorAll('[data-close-profile]'))button.addEventListener('click',()=>editDialog.close());
for(const id of ['profileName','profileDescription'])el(id).addEventListener('input',()=>{text('profileSaveState','Сохранение…');clearTimeout(profileTimer);profileTimer=setTimeout(saveProfile,250)});
editDialog.addEventListener('close',()=>{clearTimeout(profileTimer);if(agent.status!=='active')saveProfile()});
for(const [inputId,property] of [['avatarUpload','avatarData']]){
 el(inputId).addEventListener('change',e=>{
 const file=e.target.files?.[0];if(!file||agent.status==='active')return;
 if(!file.type.startsWith('image/')||file.size>1700000){text('profileSaveState','Изображение должно быть меньше 1,7 МБ');return}
 const reader=new FileReader();
 reader.onload=()=>{agent[property]=reader.result;text('profileSaveState',persist()?'Изображение сохранено':'Не удалось сохранить');render()};
 reader.readAsDataURL(file);
 });
}
render();showSettingSection(agent.role==='recruiter'?'employer':'domain');selectedTab(query.get('tab'));
})();