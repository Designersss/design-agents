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
 const recruiter=agent.role==='recruiter',active=agent.status==='active';
 text('agentName',agent.name);text('agentDescription',agent.description);
 text('topAgentCrumb',agent.name);text('detailCrumb',agent.name);
 text('agentRole',recruiter?'Рекрутер':'Менеджер обращений');text('heroRole',recruiter?'AI-рекрутер':'AI-менеджер обращений');
 text('metricDialogs',agent.dialogs);text('metricProcessed',agent.processed);text('metricTransferred',agent.transferred);text('metricResponse',agent.response);
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
 text('autosaveState',active?'Только просмотр':'Автосохранение включено');
 el('instructionInput').value=agent.instruction??(recruiter?'Помогай кандидатам, уточняй опыт и собирай контактные данные.':'Принимай обращения и отвечай на вопросы клиентов.');
 el('handoffInput').value=agent.handoff??(recruiter?'Передавай диалог HR, когда кандидат готов к собеседованию.':'Передавай сотруднику сложные запросы.');
 el('tagsInput').value=agent.tags;el('accessInput').value=agent.access||'team';
 el('taskSpecificInput').value=agent.taskSpecific??'';
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
 el('hrSettings').hidden=!hr;
 el('settingsLockNote').hidden=!active;

 const ready=agent.status!=='draft';text('readinessLabel',ready?'Готов':'Нужна настройка');
 el('readinessLabel').classList.toggle('warning',!ready);
 text('readinessInstructions',ready?'Настроены':'Нужно заполнить');text('readinessChannel',ready?'Telegram подключён':'Не подключён');
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
 const hero=el('detailHero');hero.style.backgroundImage=agent.coverData?'linear-gradient(180deg,#080e0e8c,#0a1010ed),url('+JSON.stringify(agent.coverData)+')':'';
 hero.style.backgroundSize='cover';hero.style.backgroundPosition='center';
 document.title=agent.name+' — AIMock';syncSpace();
 document.querySelectorAll('[data-internal-tab]').forEach(a=>a.href=link(a.dataset.internalTab));
}
for(const a of document.querySelectorAll('[data-agent-tab],[data-internal-tab]'))a.addEventListener('click',e=>{e.preventDefault();selectedTab(a.dataset.agentTab||a.dataset.internalTab,true)});
window.addEventListener('popstate',()=>selectedTab(new URLSearchParams(location.search).get('tab')));
document.addEventListener('click',e=>{if(e.target.closest('[data-space]'))queueMicrotask(syncSpace)});
function saveSettings(){
 if(agent.status==='active')return;
 agent.instruction=el('instructionInput').value;agent.handoff=el('handoffInput').value;
 agent.tags=el('tagsInput').value;agent.access=el('accessInput').value;
 agent.taskSpecific=el('taskSpecificInput').value;
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
}
for(const input of document.querySelectorAll('[data-editable]')){
 input.addEventListener('input',()=>{if(agent.status==='active')return;text('autosaveState','Сохранение…');clearTimeout(settingsTimer);settingsTimer=setTimeout(saveSettings,250)});
 input.addEventListener('change',saveSettings);
}
const stopDialog=el('stopAgentDialog'),editDialog=el('profileDialog');
el('lifecycleButton').addEventListener('click',()=>{
 if(agent.status==='active'){stopDialog.showModal();return}
 const instruction=agent.instruction??el('instructionInput').value;
 const handoff=agent.handoff??el('handoffInput').value;
 if(agent.status==='draft'||!instruction.trim()||!handoff.trim()||(agent.modelMode==='explicit'&&!agent.publicModelId)){
 selectedTab('settings',true);text('autosaveState','Проверьте инструкции и подключение перед запуском');return;
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
for(const [inputId,property] of [['coverUpload','coverData'],['avatarUpload','avatarData']]){
 el(inputId).addEventListener('change',e=>{
 const file=e.target.files?.[0];if(!file||agent.status==='active')return;
 if(!file.type.startsWith('image/')||file.size>1700000){text('profileSaveState','Изображение должно быть меньше 1,7 МБ');return}
 const reader=new FileReader();
 reader.onload=()=>{agent[property]=reader.result;text('profileSaveState',persist()?'Изображение сохранено':'Не удалось сохранить');render()};
 reader.readAsDataURL(file);
 });
}
render();selectedTab(query.get('tab'));
})();