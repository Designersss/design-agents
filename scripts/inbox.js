(() => {
"use strict";
// Design reference: sample conversations and UI-only actions. No network, CRM mutations or actual sends.
const root=document.getElementById("inboxView");
if(!root)return;
const STORAGE="aimock:inbox-ui:v1";
const initial=[
 {id:"lead-anna",agent:"leads",name:"Анна Ковалева",initials:"АК",color:"peach",handle:"@annakovaleva",source:"Telegram Bot API",agentName:"Входящие заявки",topic:"Расчёт кухни",mode:"waiting",unread:2,time:"12:42",crm:"amoCRM",contact:"Контакт №1248",tags:["Новая заявка","Кухня"],detail:"Интересуется изготовлением кухни по индивидуальным размерам.",messages:[
  ["client","Здравствуйте! Сколько примерно будет стоить кухня на заказ?","12:37"],
  ["agent","Здравствуйте! Помогу с предварительным расчётом. Подскажите, пожалуйста, размеры кухни и желаемый материал фасадов.","12:38"],
  ["client","Помещение 3 на 2,5 метра. Думаю про матовые фасады.","12:40"],
  ["agent","Спасибо, размеры записал. Чтобы передать точный запрос, уточню: нужен ли замер?","12:41"],
  ["client","Да, нужен. Но сначала хочу поговорить с менеджером.","12:42"]]},
 {id:"support-maksim",agent:"support",name:"Максим Орлов",initials:"МО",color:"lavender",handle:"@maxorlov",source:"Telegram Bot API",agentName:"Служба помощи",topic:"Возврат заказа",mode:"human",unread:1,time:"12:35",crm:"Битрикс24",contact:"Контакт №805",tags:["Поддержка","Возврат"],detail:"Клиент уточняет условия возврата заказа. Диалог уже передан сотруднику.",messages:[
  ["client","Добрый день! Можно вернуть заказ, если упаковка уже вскрыта?","12:28"],
  ["agent","Подскажу по условиям возврата. Уточните, пожалуйста, номер заказа.","12:29"],
  ["client","Заказ 4082. Мне нужно обсудить исключение.","12:31"],
  ["system","Диалог передан сотруднику","12:32"],
  ["human","Здравствуйте, Максим! Я подключился к переписке, давайте разберёмся.","12:34"],
  ["client","Спасибо, сейчас пришлю подробности.","12:35"]]},
 {id:"lead-mikhail",agent:"leads",name:"Михаил Петров",initials:"МП",color:"blue",handle:"@m_petroff",source:"Telegram Bot API",agentName:"Входящие заявки",topic:"Запись на замер",mode:"agent",unread:0,time:"12:18",crm:"amoCRM",contact:"Контакт №1233",tags:["Замер"],detail:"Уточняет доступное время для выезда замерщика.",messages:[
  ["client","Здравствуйте, можно заказать замер шкафа?","12:13"],
  ["agent","Здравствуйте! Конечно. Подскажите ваш район и удобное время.","12:14"],
  ["client","Центральный район, после 18:00 в будни.","12:16"],
  ["agent","Принято. Сохраняю пожелания, менеджер сможет согласовать точную дату.","12:18"]]},
 {id:"consultant-elena",agent:"consultant",name:"Елена Миронова",initials:"ЕМ",color:"sage",handle:"@mironova_e",source:"Telegram Bot API",agentName:"Помощник магазина",topic:"Подбор товара",mode:"agent",unread:0,time:"11:56",crm:"Не привязана",contact:"Не указан",tags:["Консультация"],detail:"Клиенту требуется помощь с выбором товара и сроками доставки.",messages:[
  ["client","Подскажите, какая модель подойдёт для небольшого помещения?","11:49"],
  ["agent","Помогу подобрать вариант. Какая площадь комнаты и что для вас важнее: компактность или вместительность?","11:50"],
  ["client","12 квадратных метров, хочу компактный вариант.","11:54"],
  ["agent","Спасибо! Подберу решения под ваши пожелания.","11:56"]]},
 {id:"recruiter-olga",agent:"recruiter",name:"Ольга Соколова",initials:"ОС",color:"rose",handle:"@olga_s",source:"Telegram Bot API",agentName:"Подбор в команду",topic:"Вакансия дизайнера",mode:"waiting",unread:1,time:"11:26",crm:"Не привязана",contact:"Не указан",tags:["Кандидат","HR"],detail:"Кандидат хочет согласовать детали работы с ответственным рекрутером.",messages:[
  ["client","Добрый день! Интересует вакансия дизайнера.","11:20"],
  ["agent","Здравствуйте! Расскажите, пожалуйста, о вашем опыте и формате работы, который вы рассматриваете.","11:21"],
  ["client","Опыт 4 года. Можно обсудить условия с рекрутером?","11:26"]]},
 {id:"support-irina",agent:"support",name:"Ирина Белова",initials:"ИБ",color:"sand",handle:"@belova_ir",source:"Telegram Bot API",agentName:"Служба помощи",topic:"Доставка",mode:"closed",unread:0,time:"Вчера",crm:"Битрикс24",contact:"Контакт №799",tags:["Доставка","Решено"],detail:"Уточнение сроков доставки завершено.",messages:[
  ["client","Когда доставят заказ 4020?","16:21"],
  ["agent","По указанным данным срок доставки — завтра. При изменениях с вами свяжутся.","16:23"],
  ["client","Отлично, спасибо!","16:24"],
  ["system","Диалог завершён","16:25"]]}
];
const validModes=new Set(["agent","waiting","human","closed"]);
const validFilters=new Set(["all","unread","waiting","human","agent","closed"]);
let persisted=readStorage(),scope="all",filter="all",search="",selected=null,mobileView="list",contextOpen=false;
function readStorage(){
 try{const v=JSON.parse(localStorage.getItem(STORAGE));return v&&typeof v==="object"&&!Array.isArray(v)?v:{}}catch{return {}}
}
function save(){try{localStorage.setItem(STORAGE,JSON.stringify(persisted))}catch{}}
function esc(x){return String(x??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}
function icon(id){return '<svg class="icon" aria-hidden="true"><use href="#i-'+id+'"/></svg>'}
function stored(id){return persisted[id]&&typeof persisted[id]==="object"?persisted[id]:{}}
function data(){
 return initial.map(item=>{
  const saved=stored(item.id);
  return {...item,mode:validModes.has(saved.mode)?saved.mode:item.mode,
   unread:Number.isInteger(saved.unread)&&saved.unread>=0?saved.unread:item.unread,
   draft:typeof saved.draft==="string"?saved.draft:"",
   messages:[...item.messages,...(Array.isArray(saved.extra)?saved.extra.filter(m=>Array.isArray(m)&&m.length===3&&["client","agent","human","system"].includes(m[0])&&m.every(v=>typeof v==="string")).slice(-40):[])]};
 });
}
function change(id,values){persisted[id]={...stored(id),...values};save()}
function list(){return data().filter(c=>scope==="all"||c.agent===scope)}
function matches(c){
 const q=search.trim().toLocaleLowerCase("ru-RU");
 return (!q||[c.name,c.topic,c.handle,c.agentName,c.contact].some(x=>x.toLocaleLowerCase("ru-RU").includes(q)))&&
  (filter==="all"||(filter==="unread"?c.unread>0:c.mode===filter));
}
function status(c){
 return {waiting:["Нужен человек","attention"],human:["У сотрудника","human"],agent:["Отвечает агент","agent"],closed:["Завершён","closed"]}[c.mode];
}
function avatar(c,large=false){return '<span class="inbox-avatar '+esc(c.color)+(large?" large":"")+'" aria-hidden="true">'+esc(c.initials)+'</span>'}
function preview(c){
 const m=c.messages[c.messages.length-1];
 return m[0]==="system"?m[1]:(m[0]==="client"?"":m[0]==="agent"?"Агент: ":"Вы: ")+m[1];
}
function listItem(c){
 const active=c.id===selected,st=status(c);
 return '<button type="button" class="inbox-thread'+(active?" is-active":"")+'" data-inbox-open="'+esc(c.id)+'" aria-current="'+(active?"true":"false")+'">'+
  avatar(c)+'<span class="inbox-thread-copy"><span class="inbox-thread-title"><strong>'+esc(c.name)+'</strong><time>'+esc(c.time)+'</time></span>'+
  '<small class="inbox-thread-topic">'+esc(c.topic)+'</small><span class="inbox-thread-preview">'+esc(preview(c))+'</span>'+
  '<span class="inbox-thread-status '+st[1]+'">'+esc(st[0])+'</span></span>'+
  (c.unread?'<span class="inbox-unread" aria-label="Непрочитанных: '+c.unread+'">'+c.unread+'</span>':'')+'</button>';
}
function listPane(records){
 const count=records.filter(c=>c.mode==="waiting").length;
 const filtered=records.filter(matches);
 const options=[["all","Все"],["unread","Непрочитанные"],["waiting","Нужен человек"],["human","У сотрудника"],["agent","У агента"],["closed","Завершённые"]];
 return '<section class="inbox-list-pane" aria-label="Список диалогов"><div class="inbox-list-top"><div><h2>Диалоги <span>'+records.length+'</span></h2><p>'+(scope==="all"?"Все подключённые агенты":"Диалоги выбранного агента")+'</p></div>'+
  (count?'<span class="inbox-attention-count" title="Ожидают сотрудника">'+count+'</span>':'')+'</div>'+
  '<label class="inbox-search">'+icon("search")+'<span class="inbox-sr">Поиск диалогов</span><input type="search" data-inbox-search placeholder="Имя, тема, контакт..." value="'+esc(search)+'" autocomplete="off"></label>'+
  '<div class="inbox-filters" aria-label="Фильтр диалогов">'+options.map(([id,label])=>'<button type="button" data-inbox-filter="'+id+'" class="'+(filter===id?"is-active":"")+'" aria-pressed="'+(filter===id)+'">'+label+'</button>').join("")+'</div>'+
  '<div class="inbox-thread-list" role="group" aria-label="Диалоги">'+(filtered.length?filtered.map(listItem).join(""):'<div class="inbox-list-empty">'+icon("search")+'<strong>Диалогов не найдено</strong><p>Измените запрос или фильтр.</p></div>')+'</div>'+
  '<div class="inbox-list-bottom"><span class="inbox-pulse"></span> История переписок и статусы сотрудников</div></section>';
}
function messageItem(m,i){
 const cls=m[0];
 if(cls==="system")return '<div class="inbox-message-system" data-message="'+i+'"><span>'+esc(m[1])+' · '+esc(m[2])+'</span></div>';
 const label=cls==="client"?"Клиент":cls==="agent"?"AI-агент":"Сотрудник";
 return '<article class="inbox-message '+cls+'" data-message="'+i+'"><div class="inbox-message-bubble"><span class="inbox-message-author">'+label+'</span><p>'+esc(m[1])+'</p><time>'+esc(m[2])+'</time></div></article>';
}
function selectedChat(){return data().find(c=>c.id===selected&&(scope==="all"||c.agent===scope))||null}
function conversationPane(c){
 if(!c)return '<section class="inbox-chat-pane inbox-no-chat"><div class="inbox-empty-dialog">'+icon("message")+'<h2>Выберите диалог</h2><p>Откройте переписку из списка слева, чтобы посмотреть историю и контекст клиента.</p></div></section>';
 const st=status(c),canWrite=c.mode==="human";
 const buttons=(c.mode==="human"?
    '<button class="inbox-primary-action" type="button" data-inbox-action="return">'+icon("bot")+' Вернуть агенту</button>':
    c.mode==="closed"?
    '<button class="inbox-primary-action" type="button" data-inbox-action="reopen">'+icon("message")+' Возобновить</button>':
    '<button class="inbox-primary-action" type="button" data-inbox-action="take">'+icon("users")+' Взять диалог</button>');
 const actionButton='<button class="inbox-quiet-action" type="button" data-inbox-action="'+(c.mode==="closed"?"":"close")+'" '+(c.mode==="closed"?"disabled":"")+' title="Завершить диалог" aria-label="Завершить диалог">'+icon("check")+'</button>';
 return '<section class="inbox-chat-pane" aria-label="Переписка с '+esc(c.name)+'">'+
  '<div class="inbox-chat-head"><button class="inbox-back" type="button" data-inbox-back aria-label="К списку диалогов">'+icon("left")+'</button>'+avatar(c)+
  '<div class="inbox-chat-identity"><h2>'+esc(c.name)+'</h2><p>'+esc(c.source)+' · '+esc(c.topic)+'</p></div>'+
  '<button type="button" class="inbox-context-toggle" data-inbox-context aria-label="Информация о клиенте" aria-expanded="'+contextOpen+'">'+icon("users")+'</button>'+
  actionButton+'</div>'+
  '<div class="inbox-conversation-toolbar"><span class="inbox-live-status '+st[1]+'"><span class="inbox-status-dot"></span>'+esc(st[0])+'</span><span class="inbox-conversation-agent">'+icon("bot")+esc(c.agentName)+'</span></div>'+
  '<div class="inbox-messages" id="inboxMessages"><span class="inbox-day">Сегодня</span>'+c.messages.map(messageItem).join("")+'</div>'+
  '<div class="inbox-composer"><div class="inbox-composer-mode">'+icon(canWrite?"users":"bot")+
   '<span>'+(canWrite?"Вы отвечаете как сотрудник":c.mode==="closed"?"Диалог завершён":c.mode==="waiting"?"Клиент ожидает сотрудника":"Диалог ведёт агент")+'</span>'+
   buttons+'</div>'+
   '<form data-inbox-form class="inbox-compose-form"><label class="inbox-sr" for="inboxCompose">Сообщение клиенту</label>'+
    '<textarea id="inboxCompose" rows="2" placeholder="'+(canWrite?"Напишите сообщение...":"Для ответа возьмите диалог на себя")+'" '+(canWrite?"":"disabled")+' maxlength="2000">'+esc(c.draft)+'</textarea>'+
    '<button type="submit" '+(canWrite?"":"disabled")+' aria-label="Добавить сообщение в макете">'+icon("arrow")+'</button></form>'+
   '<p class="inbox-local-note">Действия и сообщения на этой странице сохраняются только в текущем браузере.</p></div></section>';
}
function contextPane(c){
 if(!c)return '<aside class="inbox-context-pane"></aside>';
 const st=status(c);
 return '<aside class="inbox-context-pane'+(contextOpen?" is-open":"")+'" aria-label="Контекст клиента">'+
  '<div class="inbox-context-top"><h2>О клиенте</h2><button type="button" data-inbox-context-close aria-label="Закрыть информацию">'+icon("close")+'</button></div>'+
  '<div class="inbox-person">'+avatar(c,true)+'<strong>'+esc(c.name)+'</strong><span>'+esc(c.handle)+'</span></div>'+
  '<div class="inbox-context-section"><h3>Детали обращения</h3><p>'+esc(c.detail)+'</p><div class="inbox-tags">'+c.tags.map(t=>'<span>'+esc(t)+'</span>').join("")+'</div></div>'+
  '<div class="inbox-context-section"><h3>Информация</h3>'+
   '<dl><div><dt>Канал</dt><dd>'+esc(c.source)+'</dd></div><div><dt>Агент</dt><dd><a href="#/agent/'+esc(c.agent)+'/overview">'+esc(c.agentName)+'</a></dd></div>'+
   '<div><dt>Обработка</dt><dd>'+esc(st[0])+'</dd></div><div><dt>CRM</dt><dd>'+esc(c.crm)+'</dd></div>'+
   '<div><dt>Запись CRM</dt><dd>'+esc(c.contact)+'</dd></div></dl></div>'+
  '<div class="inbox-context-footer"><a href="#/contacts">Все контакты '+icon("right")+'</a></div></aside>';
}
function render(){
 const records=list(),visible=records.filter(matches);
 if(!selected||!visible.some(c=>c.id===selected))selected=visible[0]?.id||null;
 const chosen=selectedChat(),name=scope==="all"?"Сообщения":"Диалоги";
 root.innerHTML='<div class="inbox-page"><div class="inbox-page-head"><div><span class="inbox-eyebrow">'+(scope==="all"?"ЕДИНЫЙ INBOX":"ПЕРЕПИСКИ АГЕНТА")+'</span><h1 id="inboxHeading">'+name+'</h1>'+
  '<p>'+(scope==="all"?"Переписки всех агентов и обращения, требующие участия сотрудника.":"История обращений и передача разговора сотруднику.")+'</p></div>'+
  '<span class="inbox-head-hint">'+icon("message")+' Telegram Bot API</span></div>'+
  '<div class="inbox-workspace" data-mobile-view="'+mobileView+'">'+listPane(records)+conversationPane(chosen)+contextPane(chosen)+'</div></div>';
 const messages=root.querySelector("#inboxMessages");
 if(messages)messages.scrollTop=messages.scrollHeight;
 const count=data().filter(c=>c.unread>0).length;
 document.querySelectorAll('[data-global-route="messages"] .nav-count').forEach(el=>el.textContent=count?String(count):"");
}
function syncScope(id){
 const next=initial.some(c=>c.agent===id)?id:"all";
 if(next!==scope){scope=next;filter="all";search="";selected=null;mobileView="list";contextOpen=false}
 render();
}
root.addEventListener("click",event=>{
 const button=event.target.closest("button");if(!button)return;
 if(button.hasAttribute("data-inbox-open")){
  selected=button.dataset.inboxOpen;if(filter==="unread")filter="all";change(selected,{unread:0});mobileView="conversation";contextOpen=false;render();return;
 }
 if(button.hasAttribute("data-inbox-filter")){filter=validFilters.has(button.dataset.inboxFilter)?button.dataset.inboxFilter:"all";render();return}
 if(button.hasAttribute("data-inbox-back")){mobileView="list";contextOpen=false;render();return}
 if(button.hasAttribute("data-inbox-context")){contextOpen=!contextOpen;render();return}
 if(button.hasAttribute("data-inbox-context-close")){contextOpen=false;render();return}
 const action=button.dataset.inboxAction;if(!action||!selected)return;
 const c=selectedChat();if(!c)return;
 const next=action==="take"&&["agent","waiting"].includes(c.mode)?"human":
  action==="return"&&c.mode==="human"?"agent":
  action==="close"&&c.mode!=="closed"?"closed":
  action==="reopen"&&c.mode==="closed"?"agent":null;
 if(next){
  const labels={take:"Сотрудник подключился к диалогу",return:"Диалог возвращён агенту",close:"Диалог завершён",reopen:"Диалог возобновлён"};
  const t=new Intl.DateTimeFormat("ru-RU",{hour:"2-digit",minute:"2-digit"}).format(new Date());
  change(c.id,{mode:next,extra:[...(stored(c.id).extra||[]),["system",labels[action],t]].slice(-40)});
  render();
 }
});
root.addEventListener("input",event=>{
 if(event.target.matches("[data-inbox-search]")){
  search=event.target.value;const pos=event.target.selectionStart;
  render();const field=root.querySelector("[data-inbox-search]");
  if(field){field.focus();try{field.setSelectionRange(pos,pos)}catch{}}
 }else if(event.target.id==="inboxCompose"&&selected){
  change(selected,{draft:event.target.value});
 }
});
root.addEventListener("submit",event=>{
 if(!event.target.matches("[data-inbox-form]"))return;
 event.preventDefault();
 const c=selectedChat();const textarea=event.target.querySelector("textarea");
 if(!c||c.mode!=="human"||!textarea)return;
 const message=textarea.value.trim();if(!message)return;
 const t=new Intl.DateTimeFormat("ru-RU",{hour:"2-digit",minute:"2-digit"}).format(new Date());
 change(c.id,{draft:"",extra:[...(stored(c.id).extra||[]),["human",message.slice(0,2000),t]].slice(-40)});
 render();
});
window.AIMockInbox=Object.freeze({render:syncScope});
})();
