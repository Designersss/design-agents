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
const valid=['overview','settings','vacancies','integrations','work','knowledge','testing','journal'];
let settingsTimer,profileTimer;
document.querySelector('.navrow[href$="/agents.html"]')?.classList.add('selected');
function persist(){saved[id]={...agent};try{localStorage.setItem(key,JSON.stringify(saved));return true}catch(_){return false}}
const sectionInfo={
 settings:['Настройки агента','Профессиональные параметры, подключения и доступы','Настройки'],
 vacancies:['Вакансии','Позиции, требования и условия отбора','Вакансии'],
 work:['Кандидаты','Обращения и результаты работы агента','Кандидаты'],
 knowledge:['База знаний','Разрешённые документы и материалы','База знаний'],
 integrations:['Интеграции','Подключённые сервисы и разрешения','Интеграции'],
 journal:['Журнал действий','События и результаты работы','Журнал'],
 testing:['Тестирование агента','Проверка сценариев и ответов','Тестирование']
};
function selectedTab(tab,push=false){
 const requested=valid.includes(tab)?tab:'overview';
 const current=requested==='vacancies'&&agent.role!=='recruiter'?'overview':requested;
 const subpage=current!=='overview';
 root.classList.toggle('agent-section-mode',subpage);
 root.classList.toggle('agent-home-mode',!subpage);
 // Hide the entire home-only profile, including avatar, title, status and actions.
 // The native hidden property complements scoped CSS and keeps it inaccessible.
 el('detailHero').hidden=subpage;
 document.querySelectorAll('[data-pane]').forEach(panel=>panel.hidden=panel.dataset.pane!==current);
 const back=link('overview');
 el('topAgentCrumb').href=back;
 el('agentBackLink').href=back;
 el('agentBackLink').hidden=!subpage;
 el('topSectionSeparator').hidden=!subpage;
 el('topSectionCrumb').hidden=!subpage;
 if(subpage){
   const config=sectionInfo[current]||sectionInfo.settings;
   text('topSectionCrumb',current==='work'&&agent.role!=='recruiter'?'Заявки':config[2]);
   document.title=(current==='work'&&agent.role!=='recruiter'?'Заявки':config[0])+' · '+agent.name+' — AIMock';
 }else{document.title=agent.name+' — AIMock'}
 if(push)history.pushState({},'',link(current));
 el('detailScroll').scrollTop=0;
}
let currentOverviewPeriod=7;
function updateOverviewMetrics(){
 const period=currentOverviewPeriod;
 document.querySelectorAll('[data-overview-period]').forEach(button=>{
  const active=Number(button.dataset.overviewPeriod)===period;
  button.classList.toggle('is-active',active);
  button.setAttribute('aria-pressed',String(active));
 });
 const multiplier=period===30?4:1;
 text('metricDialogs',Math.round(agent.dialogs*multiplier).toLocaleString('ru-RU'));
 text('metricProcessed',Math.round(agent.processed*multiplier).toLocaleString('ru-RU'));
 text('metricTransferred',Math.round(agent.transferred*multiplier).toLocaleString('ru-RU'));
 text('metricResponse',agent.response);
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
// Visual guidance only: factual business inputs remain in typed settings,
// while immutable professional safeguards are defined by the platform.
const settingsGuidance={
 employer:{
  title:'Работодатель',
  lead:'Укажите, от имени какой компании, ИП или проекта ведётся подбор.',
  builtin:'Рекрутер уже умеет вести интервью и корректно представлять подтверждённые сведения о работодателе.',
  input:'Выберите профиль работодателя либо создайте его один раз для повторного использования в вакансиях.',
  example:'«Студия Север» — разработка ПО, удалённая команда, официальный сайт.',
  note:'Workspace может содержать несколько работодателей. Здесь выбор демонстрационный: назначение работодателя каждой вакансии будет выполняться отдельно.'
 },
 vacancies:{
  title:'Вакансии',
  lead:'Назначьте агенту позиции, для которых он будет принимать отклики.',
  builtin:'Агент проводит интервью по требованиям конкретной вакансии и фиксирует ответы без автоматического окончательного отказа.',
  input:'Отметьте доступные вакансии. Требования, график, компенсация и вопросы должны храниться в карточке каждой позиции.',
  example:'Frontend-разработчик · React / TypeScript · удалённо — условия подтверждаются работодателем.',
  note:'Один рекрутер может вести несколько вакансий. Изменения списка здесь не создают и не публикуют реальные вакансии.'
 },
 recipient:{
  title:'Ответственный HR',
  lead:'Определите, кому передавать итоги общения с кандидатами.',
  builtin:'Агент сам распознаёт ситуации, требующие участия человека, и не выносит окончательных кадровых решений.',
  input:'Выберите уполномоченного получателя и отметьте типы уведомлений, которые ему нужны.',
  example:'Когда интервью завершено, ответственный HR получает уведомление и просматривает собранные сведения.',
  note:'Выбор получателя не выдаёт дополнительных прав доступа. Персональные данные кандидатов не отправляются в обычных уведомлениях.'
 },
 domain:{
  title:'Рабочие данные',
  lead:'Добавьте факты о бизнесе и типах обращений, с которыми работает менеджер.',
  builtin:'Менеджер умеет уточнять запрос, собирать разрешённые сведения и передавать сложные случаи сотруднику.',
  input:'Укажите действительные категории обращений и ответственного за результат. Не нужно писать алгоритм ведения разговора.',
  example:'Консультация по услугам, запрос расчёта стоимости, заявка на обратную связь.',
  note:'Реальные действия и доступные данные будут ограничены правами интеграций и опубликованными настройками.'
 },
 custom:{
  title:'Дополнительные пожелания',
  lead:'Дополните работу агента нюансами именно вашего процесса.',
  builtin:'Профессия, правила безопасности, проверка фактов и обязательная передача сложных случаев уже предусмотрены AIMock.',
  input:'Это необязательное поле. Запишите только особые пожелания; факты о компании и требования вакансии лучше хранить в их отдельных полях.',
  example:'«Для удалённых вакансий уточняй готовность работать по московскому времени. Нестандартный график согласуй с HR».',
  note:'Этот текст не системный промпт. Проверка конфликтов выполняется сервером в реальном продукте; локальный макет её не имитирует.'
 },
 model:{
  title:'AI-модель',
  lead:'Выберите способ использования совместимой AI-модели.',
  builtin:'В режиме «Автоматически» AIMock использует опубликованную модель, назначенную для этой профессии.',
  input:'Оставьте автоматический режим или выберите модель из совместимого каталога, когда он будет доступен.',
  example:'Режим: «Автоматически» — подходящий выбор для большинства пользователей.',
  note:'Каталог и стоимость должны приходить из Admin. В этом прототипе реальное подключение модели отсутствует.'
 },
 access:{
  title:'Доступы и теги',
  lead:'Настройте видимость агента для команды и его организацию в списках.',
  builtin:'Ограничения Workspace и разрешения на операции задаются отдельно и не отменяются названиями тегов.',
  input:'Добавьте поисковые теги; в пространстве компании выберите допустимую группу доступа.',
  example:'Теги: «HR», «IT-подбор». Группа: «Сотрудники HR».',
  note:'В личном Workspace нет командных ролей. Теги сами по себе не дают сотрудникам прав.'
 },
 sources:{
  title:'Знания и интеграции',
  lead:'Свяжите агента с подтверждёнными материалами и рабочими каналами.',
  builtin:'Агент использует разрешённую базу знаний и действует только в рамках выданных разрешений.',
  input:'Откройте отдельные разделы, чтобы настроить документы, каналы, CRM и допустимые действия.',
  example:'FAQ работодателя — для ответов кандидатам; Telegram — для приёма откликов.',
  note:'Выбор файла в данном макете сохраняет только его название. Ни загрузки содержимого, ни реального подключения сервиса здесь нет.'
 },
 preflight:{
  title:'Перед запуском',
  lead:'Проверьте готовность агента к работе после настройки.',
  builtin:'AIMock должен проверять обязательные зависимости и ограничения сервера перед переводом агента в LIVE.',
  input:'Убедитесь, что данные, каналы, получатель, модель и разрешения заданы. Отдельно проверьте тариф и AI-баланс.',
  example:'Вакансия назначена → канал подключён → ответственный указан → серверная проверка пройдена.',
  note:'Это макет. Надписи здесь не подтверждают готовность, права, активную подписку или реальный запуск.'
 }
};
const nonRecruiterGuidance={
 custom:{
  example:'«Если клиент запрашивает нестандартные условия, передай запрос ответственному менеджеру».'
 },
 access:{
  example:'Теги: «Входящие», «Поддержка». Группа: «Команда обслуживания».'
 },
 sources:{
  example:'FAQ о продукте — для типовых ответов; разрешённый Telegram-канал — для обращений.'
 },
 preflight:{
  input:'Проверьте категории обращений, ответственного сотрудника, каналы, модель и необходимые разрешения.',
  example:'Рабочие данные заполнены → канал подключён → ответственный указан → серверная проверка пройдена.'
 }
};
function updateSettingsGuidance(key){
 const base=settingsGuidance[key]||settingsGuidance.employer;
 const data=agent.role==='recruiter'?base:{...base,...(nonRecruiterGuidance[key]||{})};
 text('settingsGuidanceTitle',data.title);
 text('settingsGuidanceLead',data.lead);
 text('settingsGuidanceBuiltin',data.builtin);
 text('settingsGuidanceInput',data.input);
 text('settingsGuidanceExample',data.example);
 text('settingsGuidanceNote',data.note);
 text('settingsGuidanceState',agent.status==='active'
  ?'Агент работает: настройка доступна только для просмотра.'
  :'Черновик или остановлен: изменения автоматически сохраняются в этом браузере.');
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
 updateSettingsGuidance(target);
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
// The purpose is a read-only explanation of the built-in profession, not a user prompt.
const professionSummaries={
 recruiter:[
  'HR-рекрутер помогает проводить первичный отбор кандидатов на назначенные вакансии. Он опирается на подтверждённые требования каждой позиции и сведения работодателя.',
  'Принимает отклики, проводит первичное интервью, уточняет опыт и ожидания кандидатов. Проверяет полноту информации и отмечает, какие сведения ещё требуют уточнения.',
  'Готовит понятную сводку по каждому кандидату и передаёт её ответственному HR. Решения о приёме и окончательном отказе принимает только человек.'
 ],
 inbound:[
  'Менеджер заявок обрабатывает входящие обращения из подключённых каналов. Он помогает клиентам по вопросам услуг компании и фиксирует запросы в пределах назначенных полномочий.',
  'Уточняет потребность, собирает необходимые сведения и отвечает на типовые вопросы, используя разрешённую информацию о продуктах и условиях. Не придумывает отсутствующие данные.',
  'Формирует структурированную заявку для ответственного сотрудника. Нестандартные случаи и действия, требующие согласования, передаются человеку вместе с контекстом обращения.'
 ],
 support:[
  'Специалист поддержки помогает пользователям разобраться с распространёнными вопросами по продуктам и сервисам компании, используя актуальные разрешённые материалы.',
  'Уточняет обстоятельства проблемы, следует проверенным инструкциям, предлагает доступные безопасные шаги и сообщает, когда сведений для решения недостаточно.',
  'Фиксирует результат обращения и, если требуется участие сотрудника, передаёт ему контекст проблемы. Агент не запрашивает секреты и не обещает неподтверждённые сроки.'
 ],
 partners:[
  'Менеджер партнёров принимает обращения потенциальных и действующих партнёров, помогает разобраться в общих условиях сотрудничества и собирает сведения о запросе.',
  'Уточняет направление партнёрства и необходимые детали, отвечает на вопросы по утверждённым материалам и фиксирует договорённости только в разрешённых пределах.',
  'Готовит информацию для ответственного менеджера и передаёт вопросы, требующие коммерческого согласования. Самостоятельно не принимает обязательства от имени компании.'
 ],
 archive:[
  'Менеджер обращений помогает разбирать запросы по ранее поступившим заявкам и доступным архивным материалам, не выходя за установленные права доступа.',
  'Определяет предмет обращения, проверяет разрешённые источники, уточняет недостающую информацию и отделяет подтверждённые сведения от предположений.',
  'Готовит результат для сотрудника либо передаёт запрос на ручную проверку, если документов недостаточно или операция требует дополнительных прав.'
 ]
};
function render(){
  const titles=agent.role==='recruiter'
   ?[['Новый отклик','Кандидат оставил обращение'],['Интервью завершено','Результаты переданы HR'],['Диалог завершён','Кандидат получил ответ']]
   :[['Новое обращение','Клиент написал через канал связи'],['Передано сотруднику','Требуется ручное рассмотрение'],['Обращение обработано','Клиент получил ответ']];
 titles.forEach(([title,note],i)=>{text('agentEventTitle'+(i+1),title);text('agentEventNote'+(i+1),note)});

 const recruiter=agent.role==='recruiter',active=agent.status==='active';
 text('agentName',agent.name);text('agentDescription',agent.description);
 text('topAgentCrumb',agent.name);
 text('heroRole',recruiter?'AI-рекрутер':'AI-менеджер обращений');
 updateOverviewMetrics();
 text('metricResultLabel',recruiter?'Кандидатов обработано':'Заявок обработано');
 text('workTitle',recruiter?'Кандидаты':'Заявки');
 document.querySelectorAll('[data-role-card]').forEach(card=>{
  card.hidden=(card.dataset.roleCard==='hr'&&!recruiter)||(card.dataset.roleCard==='other'&&recruiter);
 });
 const profession=agent.role==='recruiter'
  ?'recruiter'
  :(['a3','a7'].includes(id)?'support':id==='a5'?'partners':id==='a10'?'archive':'inbound');
 const summary=professionSummaries[profession];
 text('agentPurpose',summary[0]);
 text('agentPurposeProcess',summary[1]);
 text('agentPurposeDetails',summary[2]);
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
 const currentSetting=document.querySelector('[data-setting-key].active');
 if(currentSetting)updateSettingsGuidance(currentSetting.dataset.settingKey);

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
 document.querySelectorAll('[data-route-card]').forEach(a=>a.href=link(a.dataset.routeCard));
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

document.querySelectorAll('[data-overview-period]').forEach(button=>{
 button.addEventListener('click',()=>{
  currentOverviewPeriod=Number(button.dataset.overviewPeriod)===30?30:7;
  updateOverviewMetrics();
 });
});
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
// Cards and in-content links use native navigation to dedicated URLs.
 // No horizontal tab bar or intercepted in-place tab switching.
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
 text('topAgentCrumb',agent.name);
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