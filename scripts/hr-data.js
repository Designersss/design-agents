/* AIMock HR data: isolated, local-only UX demo; never used as a real ATS. */
(() => {
'use strict';
const key='aimock-hr-workspace-demo-v1';
const bySpace={company:null,personal:null};
const agents=[{id:'a1',name:'HR-рекрутер'},{id:'a4',name:'Рекрутер · Дизайн'},{id:'a6',name:'HR · Регионы'},{id:'a8',name:'Новый рекрутер'},{id:'a9',name:'Рекрутер · IT'}];
const seed=()=>({
 hrEnabled:true,
 vacancies:[
  {id:'vacancyFrontend',title:'Frontend-разработчик',employer:'Технологии Плюс',location:'Москва / удалённо',format:'Удалённо',salary:'от 180 000 ₽',status:'open',description:'Разработка интерфейсов веб-продуктов.',requirements:'React, TypeScript, опыт командной разработки',questions:'Расскажите о вашем опыте с React и TypeScript.\nКогда готовы приступить?',created:'2026-10-27'},
  {id:'vacancyDesigner',title:'Продуктовый дизайнер',employer:'ИП Мария Орлова',location:'Санкт-Петербург / удалённо',format:'Гибрид',salary:'По договорённости',status:'draft',description:'Проектирование цифровых продуктов.',requirements:'Figma, UX-исследования, портфолио',questions:'Какой проект из портфолио лучше отражает ваш опыт?',created:'2026-10-26'}
 ],
 candidates:[
  {id:'c-anna',name:'Анна Смирнова',email:'anna@example.test',phone:'',experience:'4 года · React, TypeScript',notes:''},
  {id:'c-ivan',name:'Иван Петров',email:'ivan@example.test',phone:'',experience:'2 года · JavaScript, React',notes:''},
  {id:'c-maria',name:'Мария Орлова',email:'maria@example.test',phone:'',experience:'5 лет · Product Design, Figma',notes:''}
 ],
 applications:[
  {id:'app-anna',candidateId:'c-anna',vacancyId:'vacancyFrontend',agentId:'a1',status:'review',source:'Telegram',date:'2026-10-28',summary:'Первичное интервью завершено. Опыт React подтверждён в ответах кандидата. Ожидается оценка HR.',notes:''},
  {id:'app-ivan',candidateId:'c-ivan',vacancyId:'vacancyFrontend',agentId:'a1',status:'clarify',source:'Telegram',date:'2026-10-28',summary:'Необходимо уточнить коммерческий опыт и доступность для начала работы.',notes:''},
  {id:'app-maria',candidateId:'c-maria',vacancyId:'vacancyDesigner',agentId:'a4',status:'potential',source:'Веб-форма',date:'2026-10-27',summary:'Портфолио получено. Есть вопросы к релевантности продуктовых исследований; решение остаётся за HR.',notes:''}
 ]});
const empty=()=>({hrEnabled:false,vacancies:[],candidates:[],applications:[]});
function space(){try{return sessionStorage.getItem('aimock-space')==='personal'?'personal':'company'}catch(_){return 'company'}}
function fromStorage(s){
 if(bySpace[s])return bySpace[s];
 let all={};try{all=JSON.parse(localStorage.getItem(key)||'{}')||{}}catch(_){}
 const stored=all[s];
 const valid=stored&&Array.isArray(stored.vacancies)&&Array.isArray(stored.candidates)&&Array.isArray(stored.applications);
 return bySpace[s]=valid?stored:s==='company'?seed():empty();
}
function data(){return fromStorage(space())}
function save(){
 const s=space(),state=data();
 let all={};try{all=JSON.parse(localStorage.getItem(key)||'{}')||{}}catch(_){}
 all[s]=state;try{localStorage.setItem(key,JSON.stringify(all))}catch(_){}
 window.dispatchEvent(new CustomEvent('aimock:hr-update',{detail:{space:s}}));
 return state;
}
function uid(kind){return kind+'-'+(typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8))}
function vacancy(id){return data().vacancies.find(v=>v.id===id)}
function candidate(id){return data().candidates.find(v=>v.id===id)}
function application(id){return data().applications.find(v=>v.id===id)}
function upsertVacancy(v){
 const d=data();
 if(!v.title||!String(v.title).trim()||!v.employer||!String(v.employer).trim())throw new Error('Укажите должность и работодателя.');
 const prev=v.id?vacancy(v.id):null;
 const record={id:prev?.id||uid('vacancy'),created:prev?.created||new Date().toISOString().slice(0,10),
  title:String(v.title).trim().slice(0,120),employer:String(v.employer).trim().slice(0,120),
  location:String(v.location||'').trim().slice(0,150),format:String(v.format||'Не указан').slice(0,50),
  salary:String(v.salary||'').trim().slice(0,100),status:['draft','open','paused','closed'].includes(v.status)?v.status:'draft',
  description:String(v.description||'').trim().slice(0,3000),
  requirements:String(v.requirements||'').trim().slice(0,3000),
  questions:String(v.questions||'').trim().slice(0,3000)};
 if(prev)Object.assign(prev,record);else d.vacancies.unshift(record);
 save();return record;
}
function updateApplication(id,updates){
 const record=application(id);if(!record)throw new Error('Отклик не найден');
 if(updates.status!==undefined){
  if(!['new','clarify','review','potential','approved','rejected'].includes(updates.status))throw new Error('Недопустимый статус');
  record.status=updates.status;
 }
 if(updates.notes!==undefined)record.notes=String(updates.notes).slice(0,3000);
 save();return record;
}
function assignmentIds(agentId){
 let overrides={};try{overrides=JSON.parse(localStorage.getItem('aimock-agent-overrides-v1')||'{}')||{}}catch(_){}
 const saved=overrides[agentId];
 if(Array.isArray(saved?.assignedVacancies))return saved.assignedVacancies;
 return space()==='company'?(agentId==='a1'?['vacancyFrontend']:agentId==='a4'?['vacancyDesigner']:[]):[];
}
function assignedAgents(vacancyId){return agents.filter(a=>assignmentIds(a.id).includes(vacancyId))}
const statuses={draft:'Черновик',open:'Открыта',paused:'Приостановлена',closed:'Закрыта'};
const applicationStatuses={new:'Новый отклик',clarify:'Нужно уточнение',review:'На рассмотрении',potential:'Потенциальный отказ',approved:'Одобрен HR',rejected:'Отказ HR'};
function hasModule(){const d=data();return d.hrEnabled===true||d.vacancies.length>0||d.candidates.length>0||d.applications.length>0}
window.AIMockHR={space,data,save,uid,vacancy,candidate,application,upsertVacancy,updateApplication,assignmentIds,assignedAgents,agents,statuses,applicationStatuses,hasModule};
})();
