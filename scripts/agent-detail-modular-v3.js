(() => {
"use strict";
// Modular agent overview visual implementation.
// All agent metrics are sample data. Status changes are local-only; no API calls.
const professions = {
 consultant: {
   title:"Консультант",
   name:"Помощник магазина",
   description:"Подскажет покупателям, что выбрать, и поможет разобраться с заказом.",
   purpose:"Консультант — специалист, который разбирается в товарах и услугах компании и понимает потребности покупателей. Для этой профессии важны знание ассортимента, условий покупки и умение объяснять информацию простым языком.",
   tags:["Консультации","FAQ","Продажи"],
   icons:["message","book","check","spark"],
   responsibilities:[
     ["Отвечает на вопросы","Находит информацию о товарах, доставке и оплате.","message","blue"],
     ["Помогает с выбором","Уточняет пожелания и предлагает подходящие варианты.","search","yellow"],
     ["Подготавливает итог","Собирает рекомендации и детали запроса.","check","green"]
   ],
   integration:"1 подключена",materials:"8 документов",
   stats:[["Диалоги","176","Обращений за 7 дней","messages","message","blue"],
          ["Результаты","59","Помощь с выбором","analytics","check","green"],
          ["Передачи","9","Передано человеку","messages","users","yellow"]],
   events:[["Ответ в Telegram","12:47 · Новый клиент","message","blue"],
           ["Подобран продукт","12:20 · Каталог","check","green"],
           ["Передано человеку","11:54 · Вопрос о договоре","users","yellow"]]
 },
 leads: {
   title:"Менеджер заявок",
   name:"Входящие заявки",
   description:"Собирает информацию по новым обращениям и передаёт запросы менеджерам.",
   purpose:"Менеджер заявок — специалист по работе с входящими обращениями потенциальных клиентов. Эта профессия объединяет клиентский сервис и продажи: важны понимание потребностей, внимательность к деталям и знание процесса обработки заявок.",
   tags:["Заявки","CRM","Telegram"],
   icons:["file","message","check","workflow"],
   responsibilities:[
     ["Принимает обращения","Общается с клиентами через подключённые каналы.","message","blue"],
     ["Уточняет детали заявки","Собирает контакты, потребности и важные сведения.","file","yellow"],
     ["Формирует результат","Создаёт заявку в CRM с собранными данными.","check","green"]
   ],
   integration:"2 подключены",materials:"12 документов",
   stats:[["Диалоги","128","Сообщения за 7 дней","messages","message","blue"],
          ["Заявки","42","Квалифицировано и передано в CRM","analytics","check","green"],
          ["Передачи","7","Диалогов передано человеку","messages","users","yellow"]],
   events:[["Новая заявка в CRM","12:42 · Анна Ковалева","check","green"],
           ["Ответ в Telegram","12:18 · Михаил Петров","message","blue"],
           ["Передано оператору","11:54 · Индивидуальный вопрос","users","yellow"]]
 },
 recruiter: {
   title:"HR-рекрутер",
   name:"Подбор в команду",
   description:"Первый контакт с кандидатами и уточнение информации по вакансиям.",
   purpose:"HR-рекрутер — специалист по подбору персонала. Профессия требует понимания рынка труда, требований к должностям и профессиональных компетенций, а также навыков оценки опыта и общения с кандидатами.",
   tags:["Подбор","Кандидаты","Скрининг"],
   icons:["users","file","search","book"],
   responsibilities:[
     ["Принимает отклики","Общается с кандидатами по выбранной вакансии.","message","blue"],
     ["Уточняет опыт","Собирает сведения об опыте и требованиях вакансии.","file","yellow"],
     ["Готовит сводку","Систематизирует ответы для HR-команды.","check","green"]
   ],
   integration:"1 подключена",materials:"6 документов",
   stats:[["Диалоги","84","Обращений за 7 дней","messages","message","blue"],
          ["Кандидаты","21","Отправлено на рассмотрение","analytics","users","green"],
          ["Передачи","11","Передано HR-специалисту","messages","users","yellow"]],
   events:[["Новый отклик","13:11 · Кандидат на вакансию","users","green"],
           ["Ответ кандидату","12:45 · Уточнение условий","message","blue"],
           ["На рассмотрении","11:22 · Передано HR","file","yellow"]]
 },
 support: {
   title:"Поддержка",
   name:"Служба помощи",
   description:"",
   purpose:"Специалист поддержки — представитель клиентского сервиса, который хорошо знает продукты компании и типичные вопросы пользователей. Для этой профессии важны внимательность, знание правил и умение объяснять сложную информацию понятным языком.",
   tags:["Поддержка","FAQ","Передачи"],
   icons:["headset","message","book","settings"],
   responsibilities:[
     ["Принимает обращение","Определяет тему вопроса и уточняет детали.","message","blue"],
     ["Находит ответ","Использует инструкции и материалы базы знаний.","book","yellow"],
     ["Помогает решить вопрос","Предлагает проверенные шаги и фиксирует результат.","check","green"]
   ],
   integration:"1 подключена",materials:"14 документов",
   stats:[["Диалоги","143","Обращений за 7 дней","messages","message","blue"],
          ["Решено","107","Ответов по базе знаний","analytics","check","green"],
          ["Передачи","13","Передано оператору","messages","users","yellow"]],
   events:[["Вопрос решён","12:53 · Ответ из базы","check","green"],
           ["Обновлены знания","12:04 · Новый материал","book","blue"],
           ["Передано оператору","11:36 · Сложный запрос","users","yellow"]]
 }
};
const running={consultant:true,leads:true,recruiter:false,support:true};
const getAgentNames=()=>Object.fromEntries(Object.entries(professions).map(([id,data])=>[id,data.name]));
const icon=(name, extra="")=>'<svg class="icon '+extra+'" aria-hidden="true"><use href="#i-'+name+'"></use></svg>';
const bubble=(name,color)=>'<span class="detail-bubble '+color+'">'+icon(name)+'</span>';
const routeFor=(id,section)=>'#/agent/'+id+'/'+section;
const $=id=>document.getElementById(id);
function agentCardStatusSync(){
 const ids=Object.keys(professions);
 document.querySelectorAll("#overviewView .agent-card").forEach((card,index)=>{
   const id=ids[index];
   if(!id)return;
   const state=card.querySelector(".state");
   if(!state)return;
   state.classList.toggle("paused",!running[id]);
   state.textContent=running[id]?"Работает":"Остановлен";
   const heading=card.querySelector(".agent-name");
   if(heading)heading.textContent=professions[id].name;
   const description=card.querySelector(".agent-card-description");
   if(description){
     description.textContent=professions[id].description;
     description.hidden=!professions[id].description;
   }
 });
}
function syncSidebar(id){
 const status=$("agentSidebarStatus");
 if(status){
   status.textContent=running[id]?"Работает":"Остановлен";
   status.classList.toggle("is-paused",!running[id]);
 }
 const icons=professions[id].icons;
 const refs=document.querySelectorAll(".agent-profile .mini-symbols use");
 refs.forEach((el,index)=>el.setAttribute("href","#i-"+icons[index]));
}
function build(route){
 const id=route.id, data=professions[id];
 const active=running[id],status=active?"Работает":"Остановлен";
 const topCards=[
  '<section class="detail-card detail-identity" aria-labelledby="detailProfessionLabel">',
    '<p class="detail-kicker" id="detailProfessionLabel">Профессия</p>',
    '<h2 class="detail-profession">',data.title,'</h2>',
    '<p class="detail-description">',data.purpose,'</p>',
  '</section>',
  '<section class="detail-card detail-flow" aria-labelledby="detailFlowLabel">',
    '<div class="detail-card-title"><h2 id="detailFlowLabel">Как работает агент</h2></div>',
    '<ul class="detail-responsibilities">',
      data.responsibilities.map(([name,description,ic,color])=>
        '<li class="detail-responsibility">'+
          '<span class="detail-capability-icon '+color+'">'+icon(ic)+'</span>'+
          '<div class="detail-capability-copy"><strong>'+name+'</strong><p>'+description+'</p></div>'+
        '</li>').join(""),
    '</ul>',
  '</section>',
  '<section class="detail-card detail-state" aria-labelledby="detailStateLabel">',
    '<div class="detail-card-title"><h2 id="detailStateLabel">Состояние</h2></div>',
    '<div class="detail-state-list">',
      [['Доступность',status,active?"check":"clock",active?"green":"slate"],
       ['Интеграции',data.integration,"plug","blue"],
       ['Материалы',data.materials,"book","yellow"]]
        .map(([name,value,ic,color])=>'<div class="detail-state-row">'+bubble(ic,color)+'<span>'+name+'</span><strong>'+value+'</strong></div>').join(""),
    '</div>',
  '</section>'
 ].join("");
 const metricCards=data.stats.map(([name,value,description,section,ic,color])=>
  '<section class="detail-card detail-stat">'+
    '<div class="detail-stat-label">'+bubble(ic,color)+'<span>'+name+'</span></div>'+
    '<div class="detail-stat-number">'+value+'</div>'+
    '<p class="detail-stat-description">'+description+'</p>'+
    '<a class="detail-stat-link" href="'+routeFor(id,section)+'">Открыть раздел '+icon("arrow")+'</a>'+
  '</section>').join("");
 const lastEvents=data.events.map(([title,meta,ic,color])=>{
   const [time,...context]=meta.split(" · ");
   return '<a class="detail-activity-item" href="'+routeFor(id,"logs")+'">'+
     '<span class="detail-activity-time">'+time+'</span>'+
     '<span class="detail-activity-marker '+color+'" aria-hidden="true"></span>'+
     '<span class="detail-activity-copy"><strong>'+title+'</strong><small>'+context.join(" · ")+'</small></span>'+
     icon("right")+'</a>';
 }).join("");
 return [
  '<div class="detail-heading">',
   '<div class="detail-heading-copy">',
    '<div class="detail-title-row"><h1 id="agentDetailHeading">',data.name,'</h1>',
    '<span class="detail-status ',active?"":"is-paused",'" role="status">',status,'</span></div>',
    data.description?'<p class="detail-user-description">'+data.description+'</p>':"",
    '<div class="detail-heading-tags">',data.tags.map(tag=>'<span>'+tag+'</span>').join(""),'</div>',
   '</div>',
   '<div class="detail-actionbar">',
     '<button class="detail-button" type="button" data-detail-share>',icon("arrow"),' Поделиться</button>',
     '<button class="detail-button dark" type="button" id="detailToggleStatus" data-detail-toggle aria-label="',active?"Остановить":"Запустить",' агента">',icon(active?"close":"check"),' ',active?"Остановить":"Запустить",'</button>',
     '<span class="detail-actions-wrap">',
       '<button class="detail-button square" type="button" data-detail-more aria-label="Дополнительные действия" aria-expanded="false">···</button>',
       '<span class="detail-share-menu" data-detail-menu hidden>',
         '<button type="button" data-detail-unavailable="Дублирование агента">Дублировать агента</button>',
         '<button type="button" data-detail-unavailable="Перенос агента">Перенести агента</button>',
       '</span>',
     '</span>',
   '</div>',
  '</div>',
  '<div class="detail-top-grid">',topCards,'</div>',
  '<div class="detail-stat-grid">',metricCards,'</div>',
  '<section class="detail-card detail-activity-card" aria-labelledby="detailEventsLabel">',
    '<div class="detail-card-title"><h2 id="detailEventsLabel">Последние действия</h2>',
    '<a href="',routeFor(id,"logs"),'">Все действия ',icon("arrow"),'</a></div>',
    '<div class="detail-activity-list">',lastEvents,'</div>',
  '</section>',
 ].join("");
}
function render(route){
 if(!route||!Object.hasOwn(professions,route.id))return;
 $("agentDetailView").innerHTML=build(route);
 syncSidebar(route.id);
 agentCardStatusSync();
}
function notify(message){
 let toast=$("detailToast");
 if(!toast){
   toast=document.createElement("div");toast.id="detailToast";toast.className="detail-toast";
   toast.setAttribute("role","status");document.body.append(toast);
 }
 toast.textContent=message;
 toast.hidden=false;
}
document.addEventListener("click",(event)=>{
 const root=$("agentDetailView");
 if(!root||root.hidden||!root.contains(event.target))return;
 const route=window.location.hash.split("/");
 const id=Object.hasOwn(professions,route[2])?route[2]:"leads";
 if(event.target.closest("[data-detail-toggle]")){
   running[id]=!running[id];render({id});$("detailToggleStatus").focus();
   notify("Статус «"+professions[id].name+"» обновлён на экране.");
 }else if(event.target.closest("[data-detail-share]")){
   notify("Общий доступ недоступен.");
 }else if(event.target.closest("[data-detail-more]")){
   const menu=root.querySelector("[data-detail-menu]");
   menu.hidden=!menu.hidden;
   root.querySelector("[data-detail-more]").setAttribute("aria-expanded",String(!menu.hidden));
 }else{
   const unavailable=event.target.closest("[data-detail-unavailable]");
   if(unavailable)notify(unavailable.dataset.detailUnavailable+": действие недоступно.");
   const menu=root.querySelector("[data-detail-menu]");if(menu)menu.hidden=true;
   const more=root.querySelector("[data-detail-more]");if(more)more.setAttribute("aria-expanded","false");
 }
});
window.addEventListener("hashchange",()=>{const toast=$("detailToast");if(toast)toast.hidden=true;});
window.AIMockAgentDetail={render,getStatus:(id)=>running[id]===true,refreshCards:agentCardStatusSync,getAgentNames};
})();