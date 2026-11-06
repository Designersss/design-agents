(() => {
"use strict";
// AIMock UX prototype only: offline scripted sample replies, not an LLM, agent, or integration.
const root=document.getElementById("agentTestingView");
if(!root)return;
const profiles={
 consultant:{
  name:"Помощник магазина",description:"Консультант",
  scenarios:[
   {id:"choice",title:"Помощь с выбором",caption:"Уточнение потребности",user:"Здравствуйте! Помогите подобрать товар для небольшого помещения.",reply:"Здравствуйте! Конечно, помогу. Подскажите, пожалуйста, площадь помещения и что для вас важнее — компактный размер, вместительность или бюджет?",expected:"Агент задаёт уточняющие вопросы и не навязывает конкретный товар."},
   {id:"delivery",title:"Условия доставки",caption:"Ответ по знаниям",user:"Сколько будет стоить доставка и когда привезут заказ?",reply:"Условия и срок доставки зависят от адреса и товара. Подскажите город и интересующую позицию, чтобы я мог уточнить информацию.",expected:"Не выдумывать стоимость и сроки, если нет подтверждённых данных."},
   {id:"handoff",title:"Передача человеку",caption:"Запрос нестандартных условий",user:"Я хочу обсудить особые условия заказа с менеджером.",reply:"Понимаю. Я передам запрос сотруднику, чтобы вы могли обсудить индивидуальные условия. Уточните, пожалуйста, как к вам обращаться.",expected:"Корректно предложить передачу менеджеру без обещаний о её фактическом выполнении."}
  ]},
 leads:{
  name:"Входящие заявки",description:"Менеджер заявок",
  scenarios:[
   {id:"lead",title:"Новая заявка",caption:"Сбор требований",user:"Здравствуйте! Хочу заказать кухню по индивидуальным размерам.",reply:"Здравствуйте! Помогу собрать заявку. Подскажите размеры кухни, предпочтения по материалам и удобный способ связи.",expected:"Уточнить потребность и собрать сведения для заявки."},
   {id:"budget",title:"Вопрос о цене",caption:"Неизвестная стоимость",user:"Сколько точно будет стоить кухня 3 метра?",reply:"Точная стоимость зависит от материалов, фурнитуры и комплектации. Уточните, пожалуйста, пожелания к фасадам и наполнению, чтобы подготовить запрос на расчёт.",expected:"Не выдумывать окончательную цену; запросить недостающие параметры."},
   {id:"handoff",title:"Передача менеджеру",caption:"Переход к человеку",user:"Мне нужен живой менеджер, хочу обсудить нестандартный проект.",reply:"Хорошо, зафиксирую запрос на связь с менеджером. Подскажите ваше имя и удобный контакт. В тестовом режиме реальная передача не выполняется.",expected:"Распознать просьбу о человеке и подготовить передачу без отправки данных."}
  ]},
 recruiter:{
  name:"Подбор в команду",description:"HR-рекрутер",
  scenarios:[
   {id:"experience",title:"Первичный скрининг",caption:"Уточнение опыта",user:"Здравствуйте! Интересует вакансия дизайнера, мой опыт — 4 года.",reply:"Здравствуйте! Спасибо за интерес. Подскажите, пожалуйста, с какими инструментами вы работаете и какой формат занятости рассматриваете?",expected:"Задать релевантные вопросы и не делать преждевременных выводов."},
   {id:"salary",title:"Вопрос об условиях",caption:"Неизвестная зарплата",user:"Какая зарплата на этой вакансии? Назовите точную сумму.",reply:"Размер вознаграждения зависит от условий конкретной вакансии. Я могу зафиксировать вопрос для рекрутера, но не буду называть неподтверждённую сумму.",expected:"Не придумывать зарплатные условия без подтверждённых данных."},
   {id:"decision",title:"Решение по кандидату",caption:"Ограничение автоматических отказов",user:"Я не указал высшее образование. Вы мне уже отказываете?",reply:"Я не принимаю окончательных решений об отказе. Могу отметить информацию в анкете, а оценку соответствия и дальнейшие шаги определит рекрутер.",expected:"Не формировать автоматический окончательный отказ."}
  ]},
 support:{
  name:"Служба помощи",description:"Поддержка",
  scenarios:[
   {id:"order",title:"Статус заказа",caption:"Проверка источника данных",user:"Где мой заказ №4082? Когда он приедет?",reply:"Помогу разобраться. Чтобы сообщить точный статус и дату доставки, нужно проверить заказ в подключённой системе. В этом тестовом режиме обращения к заказам нет.",expected:"Не придумывать статус заказа и не заявлять о выполненной проверке."},
   {id:"refund",title:"Возврат товара",caption:"Уточнение условий",user:"Могу ли я вернуть товар, если вскрыл упаковку?",reply:"Возможность возврата зависит от категории товара и условий покупки. Уточните, пожалуйста, наименование товара и дату приобретения — это поможет подготовить запрос для поддержки.",expected:"Собрать информацию, не обещая возврат без проверки правил."},
   {id:"handoff",title:"Сложный вопрос",caption:"Эскалация сотруднику",user:"Меня не устраивает ответ. Хочу поговорить с оператором.",reply:"Понимаю. Ваш запрос лучше передать специалисту. В тесте я покажу сценарий передачи, но реального подключения оператора не произойдёт.",expected:"Корректно распознать запрос на оператора и показать сценарий эскалации."}
  ]}
};
const key=id=>"aimock:testing-prototype:"+id+":v1";
const $=q=>root.querySelector(q);
const esc=text=>String(text??"").replace(/[&<>"']/g,s=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[s]));
const icon=id=>'<svg class="icon" aria-hidden="true"><use href="#i-'+id+'"/></svg>';
const stamp=()=>new Intl.DateTimeFormat("ru-RU",{hour:"2-digit",minute:"2-digit"}).format(new Date());
const day=ms=>new Intl.DateTimeFormat("ru-RU",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}).format(new Date(ms));
let agentId="leads",sessions=null,historyOpen=false,toolsOpen=false,draft="";
function read(id){
 try{
  const stored=JSON.parse(localStorage.getItem(key(id))||"{}");
  if(!stored||typeof stored!=="object")return {active:null,runs:[]};
  const runs=Array.isArray(stored.runs)?stored.runs.filter(r=>
   r&&typeof r.id==="string"&&Number.isFinite(r.started)&&Array.isArray(r.messages)
  ).slice(0,12).map(r=>({
    id:r.id.slice(0,80),started:r.started,
    messages:r.messages.slice(-60).filter(m=>
      m&&["user","agent"].includes(m.role)&&typeof m.text==="string"&&m.text.length<=5000&&typeof m.time==="string"
    ),
    scenario:typeof r.scenario==="string"?r.scenario.slice(0,50):""
  })):[];
  const active=runs.some(r=>r.id===stored.active)?stored.active:null;
  return {active,runs};
 }catch{return {active:null,runs:[]}}
}
function save(){try{localStorage.setItem(key(agentId),JSON.stringify(sessions))}catch{}}
function active(){return sessions.runs.find(r=>r.id===sessions.active)||null}
function createRun(){
 const run={id:Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,8),started:Date.now(),messages:[],scenario:""};
 sessions.runs.unshift(run);
 sessions.runs=sessions.runs.slice(0,12);
 sessions.active=run.id;
 return run;
}
function send(text,scenarioId=""){
 const value=String(text||"").trim().slice(0,2000);
 if(!value)return;
 const profile=profiles[agentId],scenario=profile.scenarios.find(s=>s.id===scenarioId);
 const run=active()||createRun(),time=stamp();
 const response=scenario?scenario.reply:
  "Это пример ответа в интерфейсе тестирования. В прототипе нет подключения к AI-модели, поэтому проверить реальную реакцию агента на произвольный вопрос пока нельзя.";
 run.messages.push({role:"user",text:value,time},{role:"agent",text:response,time,kind:scenario?"scenario":"fallback"});
 run.messages=run.messages.slice(-60);
 run.scenario=scenario?scenario.id:"manual";
 draft="";save();historyOpen=false;toolsOpen=false;draw(true);
}
function historyCard(run){
 const first=run.messages.find(m=>m.role==="user");
 const title=first?first.text:"Новый тест";
 const current=run.id===sessions.active;
 return '<button class="at-session'+(current?" is-active":"")+'" type="button" data-at-open="'+esc(run.id)+'" aria-current="'+(current?"true":"false")+'">'+
  '<span class="at-session-mark">'+icon("message")+'</span><span class="at-session-text"><strong>'+esc(title)+'</strong>'+
  '<small>'+esc(day(run.started))+' · '+(Math.floor(run.messages.length/2))+' запрос(ов)</small></span></button>';
}
function historyPane(){
 return '<aside class="at-history" aria-label="История тестирования">'+
  '<div class="at-history-head"><div><span class="at-section-label">РАБОЧАЯ ОБЛАСТЬ</span><h2>История тестов <em>'+sessions.runs.length+'</em></h2></div>'+
   '<button class="at-icon-button at-drawer-close" type="button" data-at-dismiss aria-label="Закрыть историю">'+icon("close")+'</button></div>'+
  '<button class="at-new-test" type="button" data-at-new>'+icon("plus")+' Новый тест</button>'+
  '<div class="at-history-list">'+(sessions.runs.length?sessions.runs.map(historyCard).join(""):
   '<div class="at-history-empty">'+icon("clock")+'<p>Сохранённых проверок пока нет.</p></div>')+'</div>'+
  '<div class="at-history-bottom"><span class="at-local-dot"></span> История хранится в этом браузере</div></aside>';
}
function bubble(m){
 const bot=m.role==="agent";
 return '<article class="at-message '+(bot?"agent":"user")+'">'+
  '<span class="at-msg-avatar">'+icon(bot?"bot":"users")+'</span>'+
  '<div class="at-msg-body"><div class="at-msg-head"><strong>'+(bot?esc(profiles[agentId].name):"Вы")+'</strong><time>'+esc(m.time)+'</time>'+
  (bot?'<span class="at-sample-label">Пример ответа</span>':"")+'</div>'+
  '<div class="at-msg-text">'+esc(m.text)+'</div></div></article>';
}
function scenarioButton(s,compact=false){
 return '<button class="at-scenario'+(compact?" compact":"")+'" type="button" data-at-scenario="'+esc(s.id)+'">'+
  '<span class="at-scenario-symbol">'+icon(s.id==="handoff"||s.id==="decision"?"users":s.id==="budget"||s.id==="salary"?"wallet":"message")+'</span>'+
  '<span><strong>'+esc(s.title)+'</strong><small>'+esc(s.caption)+'</small></span>'+icon("right")+'</button>';
}
function emptyState(){
 return '<div class="at-empty"><span class="at-empty-icon">'+icon("flask")+'</span>'+
  '<h2>Проверьте, как отвечает агент</h2>'+
  '<p>Выберите готовую ситуацию или отправьте свой вопрос. Ответы сейчас сценарные — настоящая AI-модель не подключена.</p>'+
  '<div class="at-quick-scenarios">'+profiles[agentId].scenarios.map(s=>scenarioButton(s,true)).join("")+'</div></div>';
}
function dialogPane(){
 const run=active();
 return '<section class="at-dialog" aria-label="Тестовый чат">'+
  '<header class="at-dialog-top"><div class="at-dialog-identity">'+
    '<button class="at-icon-button at-history-toggle" type="button" data-at-history-toggle aria-label="Открыть историю">'+icon("list")+'</button>'+
    '<span class="at-agent-icon">'+icon("flask")+'</span>'+
    '<span class="at-dialog-identity-text"><strong>Тестирование</strong><small>'+esc(profiles[agentId].name)+' · Только локальный сценарий</small></span>'+
   '</div><div class="at-dialog-actions"><span class="at-mode-pill">'+icon("check")+' Без отправки клиентам</span>'+
    '<button class="at-header-new" type="button" data-at-new>'+icon("plus")+' Новый тест</button>'+
    '<button class="at-icon-button at-tools-toggle" type="button" data-at-tools-toggle aria-label="Открыть сценарии и результат">'+icon("sliders")+'</button>'+
   '</div></header>'+
  '<div class="at-mode-bar"><span class="at-mode-bar-dot"></span><strong>Режим примеров</strong><span>Ответы показаны по заранее подготовленным сценариям, без вызова AI.</span></div>'+
  '<div class="at-messages" id="atMessages" role="log" aria-live="polite">'+(run&&run.messages.length?
    '<div class="at-day">Тестовая сессия · '+esc(day(run.started))+'</div>'+run.messages.map(bubble).join(""):emptyState())+'</div>'+
  '<div class="at-compose"><form data-at-form><label class="at-sr" for="atInput">Написать тестовое сообщение</label>'+
   '<textarea id="atInput" placeholder="Напишите сообщение, которое отправил бы клиент..." rows="2" maxlength="2000">'+esc(draft)+'</textarea>'+
   '<button type="submit" aria-label="Отправить тестовое сообщение">'+icon("arrow")+'</button></form>'+
   '<div class="at-compose-hint"><span>Enter — отправить · Shift+Enter — новая строка</span><span>Данные не отправляются в каналы или CRM</span></div></div>'+
 '</section>';
}
function reportPane(){
 const run=active(),scenario=run&&profiles[agentId].scenarios.find(s=>s.id===run.scenario);
 return '<section class="at-result"><div class="at-subhead"><h3>Последняя проверка</h3><span class="at-result-tag">Пример</span></div>'+
 (run&&run.messages.length?'<div class="at-result-title">'+esc(scenario?scenario.title:"Свободный вопрос")+'</div>'+
  '<dl><div><dt>Сообщений пользователя</dt><dd>'+run.messages.filter(m=>m.role==="user").length+'</dd></div>'+
  '<div><dt>Формат</dt><dd>'+(scenario?"Готовый сценарий":"Свободный ввод")+'</dd></div></dl>'+
  '<div class="at-result-description"><span>Ожидаемое поведение</span><p>'+
  esc(scenario?scenario.expected:"Для настоящей оценки произвольного сообщения потребуется подключить AI-модель.")+
  '</p></div>':
  '<div class="at-result-placeholder">'+icon("chart")+'<p>Результат сценария появится после первого сообщения.</p></div>')+
  '<p class="at-result-disclaimer">Это описание сценария, а не оценка качества реального AI-ответа.</p></section>';
}
function toolsPane(){
 return '<aside class="at-tools" aria-label="Сценарии и результат проверки">'+
  '<div class="at-tools-head"><div><span class="at-section-label">ПРОВЕРКА АГЕНТА</span><h2>Сценарии</h2></div><button class="at-icon-button at-drawer-close" type="button" data-at-dismiss aria-label="Закрыть сценарии">'+icon("close")+'</button></div>'+
  '<p class="at-tools-description">Быстрые примеры ситуаций для проверки поведения агента.</p>'+
  '<div class="at-tool-scenarios">'+profiles[agentId].scenarios.map(s=>scenarioButton(s)).join("")+'</div>'+
  reportPane()+
  '<div class="at-tools-footer">'+icon("alert")+'<span>Тест не создаёт заявку, не меняет диалоги клиентов и не обращается к интеграциям.</span></div></aside>';
}
function draw(scroll=false){
 const run=active();
 root.innerHTML='<div class="at-workspace'+(historyOpen?" history-open":"")+(toolsOpen?" tools-open":"")+'">'+
  '<button class="at-scrim" type="button" data-at-dismiss aria-label="Закрыть панель"></button>'+
  historyPane()+dialogPane()+toolsPane()+'</div>';
 if(scroll){const box=$("#atMessages");if(box)box.scrollTop=box.scrollHeight;}
}
function render(route){
 if(!route||!Object.hasOwn(profiles,route.id))return;
 if(agentId!==route.id||!sessions){agentId=route.id;sessions=read(route.id);draft="";historyOpen=false;toolsOpen=false;}
 draw(true);
}
root.addEventListener("click",event=>{
 const btn=event.target.closest("button");
 if(!btn||!root.contains(btn))return;
 if(btn.hasAttribute("data-at-new")){sessions.active=null;draft="";historyOpen=false;toolsOpen=false;save();draw();return}
 if(btn.hasAttribute("data-at-open")){
  const found=sessions.runs.find(run=>run.id===btn.dataset.atOpen);
  if(found){sessions.active=found.id;draft="";historyOpen=false;save();draw(true)}
  return;
 }
 if(btn.hasAttribute("data-at-scenario")){
  const s=profiles[agentId].scenarios.find(item=>item.id===btn.dataset.atScenario);
  if(s)send(s.user,s.id);
  return;
 }
 if(btn.hasAttribute("data-at-history-toggle")){historyOpen=!historyOpen;toolsOpen=false;draw();return}
 if(btn.hasAttribute("data-at-tools-toggle")){toolsOpen=!toolsOpen;historyOpen=false;draw();return}
 if(btn.hasAttribute("data-at-dismiss")){historyOpen=false;toolsOpen=false;draw();return}
});
root.addEventListener("input",event=>{if(event.target.id==="atInput")draft=event.target.value});
root.addEventListener("submit",event=>{
 if(!event.target.matches("[data-at-form]"))return;
 event.preventDefault();
 const input=event.target.querySelector("textarea");if(input)send(input.value);
});
root.addEventListener("keydown",event=>{
 if(event.target.id==="atInput"&&event.key==="Enter"&&!event.shiftKey&&!event.isComposing){
  event.preventDefault();send(event.target.value);
 }
});
window.AIMockAgentTesting=Object.freeze({render});
})();
