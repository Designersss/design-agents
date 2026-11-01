(() => {
"use strict";
// UI-only implementation of approved modular agent overview (variant 03).
// Demo data and local in-memory status changes. No external actions or persistence.
const professions = {
 consultant: {
   title:"Консультант",code:"AG-0201",
   summary:"Отвечает на вопросы клиентов, помогает выбрать подходящие продукты и объясняет условия.",
   purpose:"Помогает клиенту с выбором, отвечает по базе знаний и передаёт сложные вопросы человеку.",
   tags:["Консультации","FAQ","Продажи"],
   icons:["message","book","check","spark"],
   flow:[["Telegram","Входящие сообщения","message","blue"],["Консультант","Ответы и рекомендации","book","yellow"],["Человек","Сложные вопросы","users","purple"]],
   integration:"1 подключена",materials:"8 документов",
   stats:[["Диалоги","176","Обращений за 7 дней","messages","message","blue"],
          ["Результаты","59","Помощь с выбором","analytics","check","green"],
          ["Передачи","9","Передано человеку","messages","users","yellow"]],
   events:[["Ответ в Telegram","12:47 · Новый клиент","message","blue"],
           ["Подобран продукт","12:20 · Каталог","check","green"],
           ["Передано человеку","11:54 · Вопрос о договоре","users","yellow"]]
 },
 leads: {
   title:"Менеджер заявок",code:"AG-0204",
   summary:"Обрабатывает входящие запросы, квалифицирует лиды и создаёт сделки в CRM.",
   purpose:"Принимает заявки и ведёт клиента от первого сообщения до передачи заявки команде.",
   tags:["Заявки","CRM","Telegram"],
   icons:["file","message","check","workflow"],
   flow:[["Telegram","Входящие обращения","message","blue"],["Менеджер заявок","Уточнение и квалификация","file","yellow"],["amoCRM","Создание сделки","workflow","purple"]],
   integration:"2 подключены",materials:"12 документов",
   stats:[["Диалоги","128","Сообщения за 7 дней","messages","message","blue"],
          ["Заявки","42","Квалифицировано и передано в CRM","analytics","check","green"],
          ["Передачи","7","Диалогов передано человеку","messages","users","yellow"]],
   events:[["Новая заявка в CRM","12:42 · Анна Ковалева","check","green"],
           ["Ответ в Telegram","12:18 · Михаил Петров","message","blue"],
           ["Передано оператору","11:54 · Индивидуальный вопрос","users","yellow"]]
 },
 recruiter: {
   title:"HR-рекрутер",code:"AG-0207",
   summary:"Помогает с первичным отбором кандидатов, уточняет информацию и передаёт результаты HR.",
   purpose:"Собирает информацию о кандидатах и помогает рекрутеру организовать рассмотрение заявок.",
   tags:["Подбор","Кандидаты","Скрининг"],
   icons:["users","file","search","book"],
   flow:[["Telegram","Отклик кандидата","message","blue"],["HR-рекрутер","Первичный скрининг","users","yellow"],["HR-команда","Ручное рассмотрение","check","purple"]],
   integration:"1 подключена",materials:"6 документов",
   stats:[["Диалоги","84","Обращений за 7 дней","messages","message","blue"],
          ["Кандидаты","21","Отправлено на рассмотрение","analytics","users","green"],
          ["Передачи","11","Передано HR-специалисту","messages","users","yellow"]],
   events:[["Новый отклик","13:11 · Кандидат на вакансию","users","green"],
           ["Ответ кандидату","12:45 · Уточнение условий","message","blue"],
           ["На рассмотрении","11:22 · Передано HR","file","yellow"]]
 },
 support: {
   title:"Поддержка",code:"AG-0208",
   summary:"Отвечает на типовые обращения и передаёт сложные вопросы оператору.",
   purpose:"Обрабатывает типовые вопросы по инструкциям, помогает найти решение и подключает человека при необходимости.",
   tags:["Поддержка","FAQ","Передачи"],
   icons:["headset","message","book","settings"],
   flow:[["Telegram","Вопрос клиента","message","blue"],["Поддержка","Поиск ответа в знаниях","book","yellow"],["Оператор","Сложные обращения","headset","purple"]],
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
 });
}
function syncSidebar(id){
 const status=$("agentSidebarStatus");
 if(status){
   status.textContent=running[id]?"Работает · демо":"Остановлен · демо";
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
    '<div class="detail-bubbles">',data.icons.map((name,i)=>bubble(name,["blue","yellow","green","purple"][i])).join(""),'</div>',
    '<div class="detail-eyebrow">Профессия</div>',
    '<h2 class="detail-profession" id="detailProfessionLabel">',data.title,'</h2>',
    '<p class="detail-description">',data.purpose,'</p>',
    '<div class="detail-tags">',data.tags.map(tag=>'<span>'+tag+'</span>').join(""),'</div>',
    '<div class="detail-identity-foot"><span>Режим работы</span><strong>Автоматический ',active?'<i class="detail-small-dot" aria-hidden="true"></i>':' · на паузе','</strong></div>',
  '</section>',
  '<section class="detail-card detail-flow" aria-labelledby="detailFlowLabel">',
    '<div class="detail-card-title"><h2 id="detailFlowLabel">Как работает агент</h2>',
    '<a href="',routeFor(id,"automation"),'">Подробнее ',icon("right"),'</a></div>',
    '<div class="detail-flow-track">',
      data.flow.map(([name,caption,stepIcon,color],i)=> (i?'<span class="detail-flow-arrow" aria-hidden="true"></span>':"")+
      '<div class="detail-flow-step">'+bubble(stepIcon,color)+'<strong>'+name+'</strong><small>'+caption+'</small></div>').join(""),
    '</div>',
    '<p class="detail-flow-note">Если агенту не хватает полномочий или данных, диалог передаётся человеку.</p>',
  '</section>',
  '<section class="detail-card detail-state" aria-labelledby="detailStateLabel">',
    '<div class="detail-card-title"><h2 id="detailStateLabel">Состояние</h2></div>',
    '<div class="detail-state-list">',
      [['Доступность',status,active?"check":"clock",active?"green":"slate"],
       ['Интеграции',data.integration,"plug","blue"],
       ['Материалы',data.materials,"book","yellow"],
       ['Редактирование',active?"После остановки":"Доступно","sliders","purple"]]
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
 const lastEvents=data.events.map(([title,meta,ic,color])=>'<div class="detail-event">'+bubble(ic,color)+
  '<div><strong>'+title+'</strong><small>'+meta+'</small></div></div>').join("");
 return [
  '<div class="detail-context">Модульный обзор / ',data.code,'</div>',
  '<div class="detail-heading">',
   '<div class="detail-heading-copy">',
    '<span class="detail-caption">Карточка агента · ',data.code,'</span>',
    '<div class="detail-title-row"><h1 id="agentDetailHeading">',data.title,'</h1>',
    '<span class="detail-status ',active?"":"is-paused",'" role="status">',status,'</span></div>',
    '<p>',data.summary,'</p>',
   '</div>',
   '<div class="detail-actionbar">',
     '<button class="detail-button" type="button" data-detail-share>',icon("arrow"),' Поделиться</button>',
     '<button class="detail-button dark" type="button" id="detailToggleStatus" data-detail-toggle aria-label="',active?"Остановить":"Запустить",' агента">',icon(active?"close":"check"),' ',active?"Остановить":"Запустить",'</button>',
     '<span class="detail-actions-wrap">',
       '<button class="detail-button square" type="button" data-detail-more aria-label="Дополнительные действия" aria-expanded="false">···</button>',
       '<span class="detail-share-menu" data-detail-menu hidden>',
         '<button type="button" data-detail-unavailable="Дублирование агента">Дублировать агента — в разработке</button>',
         '<button type="button" data-detail-unavailable="Перенос агента">Перенести агента — в разработке</button>',
       '</span>',
     '</span>',
   '</div>',
  '</div>',
  '<div class="detail-top-grid">',topCards,'</div>',
  '<div class="detail-stat-grid">',metricCards,'</div>',
  '<div class="detail-bottom-grid">',
   '<section class="detail-card" aria-labelledby="detailEventsLabel">',
     '<div class="detail-card-title"><h2 id="detailEventsLabel">Последние действия</h2>',
     '<a href="',routeFor(id,"logs"),'">История ',icon("arrow"),'</a></div>',
     '<div class="detail-events">',lastEvents,'</div>',
   '</section>',
   '<section class="detail-card" aria-labelledby="detailControlsLabel">',
     '<div class="detail-card-title"><h2 id="detailControlsLabel">Управление</h2></div>',
     '<div class="detail-quick-actions">',
       '<a href="',routeFor(id,"testing"),'">',icon("flask"),' Тестировать</a>',
       '<a href="',routeFor(id,"logs"),'">',icon("list"),' Журнал</a>',
       '<a href="',routeFor(id,"settings"),'">',icon("sliders"),' Настройки',active?" · 🔒":"",'</a>',
     '</div>',
     '<p class="detail-control-hint">',active?"Остановите агента, чтобы изменить его параметры.":"Агент остановлен. Теперь его настройки можно редактировать (экран настроек пока в разработке).",'</p>',
   '</section>',
  '</div>',
  '<p class="detail-demo-note">Статусы, показатели и история показаны для демонстрации дизайна. Запуск и остановка изменяют только локальное состояние интерфейса — реальные агенты не запускаются.</p>'
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
   notify("Демо: агент «"+professions[id].title+"» "+(running[id]?"отмечен работающим.":"отмечен остановленным.")+" В реальном сервисе действие не выполнялось.");
 }else if(event.target.closest("[data-detail-share]")){
   notify("Публикация и передача агентов появятся позднее. Это только демонстрационный интерфейс.");
 }else if(event.target.closest("[data-detail-more]")){
   const menu=root.querySelector("[data-detail-menu]");
   menu.hidden=!menu.hidden;
   root.querySelector("[data-detail-more]").setAttribute("aria-expanded",String(!menu.hidden));
 }else{
   const unavailable=event.target.closest("[data-detail-unavailable]");
   if(unavailable)notify(unavailable.dataset.detailUnavailable+" пока в разработке.");
   const menu=root.querySelector("[data-detail-menu]");if(menu)menu.hidden=true;
   const more=root.querySelector("[data-detail-more]");if(more)more.setAttribute("aria-expanded","false");
 }
});
window.addEventListener("hashchange",()=>{const toast=$("detailToast");if(toast)toast.hidden=true;});
window.AIMockAgentDetail={render,getStatus:(id)=>running[id]===true,refreshCards:agentCardStatusSync};
})();