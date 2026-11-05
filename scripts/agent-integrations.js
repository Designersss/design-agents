(() => {
"use strict";
// Agent-side visual configuration only. No provider requests, credentials or CRM writes.
const storageKey="aimock:lead-integration-assignments:v1";
const $=id=>document.getElementById(id);
const icon=id=>'<svg class="icon" aria-hidden="true"><use href="#i-'+id+'"></use></svg>';
const esc=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const catalog=[
 {id:"tg-leads",kind:"channel",provider:"telegram",title:"Бот для заявок",subtitle:"Telegram Bot API",meta:"Канал входящих обращений",state:"ready"},
 {id:"tg-help",kind:"channel",provider:"telegram",title:"Бот консультаций",subtitle:"Telegram Bot API",meta:"Используется агентом «Консультант»",state:"occupied",owner:"consultant"},
 {id:"tg-backup",kind:"channel",provider:"telegram",title:"Второй бот",subtitle:"Telegram Bot API",meta:"Свободен для назначения",state:"ready"},
 {id:"amo-sales",kind:"crm",provider:"amocrm",title:"amoCRM · Продажи",subtitle:"amoCRM",meta:"Сделки и контакты",state:"ready"},
 {id:"amo-service",kind:"crm",provider:"amocrm",title:"amoCRM · Сервис",subtitle:"amoCRM",meta:"Доступно для совместного назначения",state:"ready"},
 {id:"bitrix-main",kind:"crm",provider:"bitrix",title:"Битрикс24 · Основная",subtitle:"Битрикс24",meta:"Требуется повторная авторизация",state:"reauth"}
];
const grants=[
 {id:"contacts_read",title:"Читать контакты",desc:"Использовать разрешённые сведения о клиентах"},
 {id:"leads_create",title:"Создавать заявки",desc:"Создавать новую запись после сбора данных"},
 {id:"leads_update",title:"Обновлять заявки",desc:"Изменять существующую запись при наличии разрешений"}
];
const baseline=()=>({assigned:["tg-leads","amo-sales"],permissions:{"amo-sales":["contacts_read","leads_create"]}});
function load(){try{const value=JSON.parse(localStorage.getItem(storageKey));if(!value||!Array.isArray(value.assigned)||typeof value.permissions!=="object"||!value.permissions)return baseline();return {assigned:[...new Set(value.assigned)].filter(x=>catalog.some(c=>c.id===x&&c.state==="ready")),permissions:value.permissions}}catch{return baseline()}}
let state=load(),pickerOpen=false,pickerKind="channel",infoMessage="";
const connected=kind=>catalog.filter(c=>c.kind===kind&&state.assigned.includes(c.id));
const isRunning=()=>window.AIMockAgentDetail.getStatus("leads");
const locked=()=>isRunning()?" disabled":"";
const save=()=>{try{localStorage.setItem(storageKey,JSON.stringify(state))}catch{}};
const logo=provider=>'<span class="ai-integration-logo '+provider+'">'+(provider==="telegram"?"✈":provider==="amocrm"?"a": "24")+'</span>';
const details=connection=>'<div class="ai-connection-identity">'+logo(connection.provider)+
  '<div class="ai-connection-text"><strong>'+esc(connection.title)+'</strong>'+
  '<span>'+esc(connection.subtitle)+' <span class="ai-middle-dot">·</span> '+esc(connection.meta)+'</span></div></div>';
function assignedRow(c){
 const scope=c.kind==="crm";
 return '<article class="ai-connection-card" data-ai-assigned="'+esc(c.id)+'">'+
   '<div class="ai-connection-top">'+details(c)+
    '<div class="ai-connection-actions"><span class="ai-assigned-label">'+icon("check")+' Назначено агенту</span>'+
    '<button type="button" class="ai-connection-remove" data-ai-remove="'+esc(c.id)+'" aria-label="Отвязать '+esc(c.title)+'"'+locked()+'>'+icon("close")+'</button></div></div>'+
   (scope?'<div class="ai-grants">'+
    '<div class="ai-grants-heading"><strong>Разрешённые действия агента</strong><small>Действительные права дополнительно проверяет подключённая CRM.</small></div>'+
    '<div class="ai-grants-grid">'+grants.map(grant=>'<label class="ai-grant"><input type="checkbox" data-ai-grant="'+grant.id+
      '" data-ai-connection="'+esc(c.id)+'"'+((state.permissions[c.id]||[]).includes(grant.id)?" checked":"")+locked()+'>'+
      '<span><strong>'+grant.title+'</strong><small>'+grant.desc+'</small></span></label>').join("")+'</div></div>':
    '<div class="ai-connection-note">'+icon("message")+' Один Telegram-бот закрепляется за одним агентом. Для перевода сначала отвяжите его.</div>')+
  '</article>';
}
function section(kind){
 const isChannel=kind==="channel",title=isChannel?"Каналы общения":"CRM и данные",desc=isChannel?
 "Боты, через которые агент получает сообщения и общается с клиентами.":
 "Системы, в которые агент может передавать заявки при наличии разрешений.";
 const available=connected(kind);
 return '<section class="ai-integrations-panel" aria-label="'+title+'">'+
  '<div class="ai-section-head"><div><span class="ai-section-kicker">'+(isChannel?"01 / КОММУНИКАЦИЯ":"02 / РЕЗУЛЬТАТ")+'</span>'+
    '<h2>'+title+'</h2><p>'+desc+'</p></div>'+
    '<button type="button" class="ai-secondary-button" data-ai-open="'+kind+'"'+locked()+'>'+icon("plus")+(isChannel?"Выбрать бота":"Выбрать CRM")+'</button></div>'+
  '<div class="ai-connection-list">'+(available.length?available.map(assignedRow).join("") :
    '<div class="ai-empty-connection">'+icon(isChannel?"message":"plug")+'<strong>'+ (isChannel?"Канал не назначен":"CRM не назначена")+'</strong>'+
     '<p>'+ (isChannel?"Выберите доступного Telegram-бота из вашего рабочего пространства.":"Выберите подключение amoCRM или Битрикс24 из общего хаба.")+'</p></div>')+'</div></section>';
}
function summary(){
 const channelCount=connected("channel").length,crmCount=connected("crm").length;
 return '<aside class="ai-integrations-aside">'+
   '<section class="ai-aside-card"><span class="ai-section-kicker">НАСТРОЙКА АГЕНТА</span><h2>Подключения</h2>'+
     '<div class="ai-summary-line"><span>'+icon("message")+' Каналы общения</span><strong>'+channelCount+'</strong></div>'+
     '<div class="ai-summary-line"><span>'+icon("plug")+' CRM</span><strong>'+crmCount+'</strong></div>'+
     '<p>Выбранные подключения принадлежат текущему рабочему пространству.</p></section>'+
   '<section class="ai-aside-guide"><span class="ai-section-kicker">КАК ЭТО РАБОТАЕТ</span><h2>Один хаб, разные агенты</h2>'+
     '<div class="ai-guide-item"><span class="ai-guide-number">01</span><div><strong>Создайте подключение</strong><p>Авторизация и управление подключениями происходят в общем хабе.</p></div></div>'+
     '<div class="ai-guide-item"><span class="ai-guide-number">02</span><div><strong>Назначьте агенту</strong><p>Бот закрепляется за одним агентом, CRM можно использовать совместно.</p></div></div>'+
     '<div class="ai-guide-item"><span class="ai-guide-number">03</span><div><strong>Разрешите действия</strong><p>Для CRM отдельно выбираются необходимые возможности.</p></div></div>'+
   '</section>'+
   '<section class="ai-hub-note"><span class="ai-hub-icon">'+icon("plug")+'</span><div><strong>Нужно новое подключение?</strong>'+
     '<p>Добавьте его в Integration Hub, затем назначьте агенту.</p>'+
     '<a href="#/integrations">Перейти в хаб '+icon("right")+'</a></div></section>'+
 '</aside>';
}
function catalogRow(c){
 const assigned=state.assigned.includes(c.id),occupied=c.state==="occupied",reauth=c.state==="reauth";
 const status=assigned?"Уже назначено":occupied?"Занято другим агентом":reauth?"Нужна авторизация":"Доступно";
 const blocked=assigned||occupied||reauth||isRunning();
 return '<div class="ai-picker-row" data-ai-catalog="'+esc(c.id)+'">'+details(c)+
   '<div class="ai-picker-choice"><span class="ai-picker-status '+(occupied?"is-busy":reauth?"is-reauth":assigned?"is-assigned":"")+'">'+status+'</span>'+
   (occupied?'<a href="#/agent/consultant/overview" class="ai-owner-link">Карточка агента</a>':
    '<button type="button" data-ai-assign="'+esc(c.id)+'"'+(blocked?" disabled":"")+'>'+ (assigned?"Выбрано":reauth?"Недоступно":"Назначить")+'</button>')+
   '</div></div>';
}
function picker(){
 const title=pickerKind==="channel"?"Выбрать канал общения":"Выбрать CRM";
 return '<div class="ai-picker-backdrop" data-ai-backdrop>'+
   '<section class="ai-picker-dialog" role="dialog" aria-modal="true" aria-labelledby="aiPickerHeading">'+
    '<div class="ai-picker-header"><div><span class="ai-section-kicker">ПОДКЛЮЧЕНИЯ ПРОСТРАНСТВА</span><h2 id="aiPickerHeading">'+title+'</h2>'+
      '<p>Здесь можно назначить существующее подключение агенту. Авторизация выполняется в общем хабе.</p></div>'+
      '<button type="button" class="ai-picker-close" aria-label="Закрыть выбор подключения" data-ai-close>'+icon("close")+'</button></div>'+
    '<div class="ai-picker-list">'+catalog.filter(c=>c.kind===pickerKind).map(catalogRow).join("")+'</div>'+
    '<div class="ai-picker-footer"><a href="#/integrations">Добавить подключение в хабе '+icon("right")+'</a>'+
    '<button type="button" data-ai-close>Закрыть</button></div>'+
   '</section></div>';
}
function render(){
 const root=$("agentIntegrationsView");
 if(!root||root.hidden)return;
 const running=isRunning();
 root.innerHTML='<div class="ai-integrations-header"><div><span class="ai-page-kicker">Входящие заявки · Менеджер заявок</span>'+
  '<h1 id="agentIntegrationsHeading">Интеграции</h1>'+
  '<p>Выберите каналы общения и CRM, которые агент будет использовать в работе.</p></div>'+
  '<div class="ai-integrations-header-actions"><span class="ai-integrations-status">'+(running?"Только просмотр":"Автосохранение")+'</span>'+
  '<a href="#/integrations" class="ai-secondary-button">'+icon("plug")+' Все подключения</a></div></div>'+
  (running?'<div class="ai-readonly-note" role="note">'+icon("alert")+
  ' Агент работает. Чтобы изменить назначения или разрешения, <a href="#/agent/leads/overview">сначала остановите его на странице обзора</a>.</div>':"")+
  '<div class="ai-integrations-layout"><div class="ai-integrations-main">'+section("channel")+section("crm")+'</div>'+summary()+'</div>'+
  (infoMessage?'<p class="ai-feedback" role="status">'+esc(infoMessage)+'</p>':"")+
  (pickerOpen?picker():"");
}
function assign(id){
 if(isRunning())return;
 const c=catalog.find(c=>c.id===id);
 if(!c||c.state!=="ready"||state.assigned.includes(id))return;
 state.assigned.push(id);
 if(c.kind==="crm"&&!state.permissions[id])state.permissions[id]=["contacts_read"];
 pickerOpen=false;infoMessage="";save();render();
}
function detach(id){
 if(isRunning()||!state.assigned.includes(id))return;
 const c=catalog.find(c=>c.id===id);
 if(!c)return;
 const ok=window.confirm('Отвязать «'+c.title+'» от агента? Подключение останется в общем хабе.');
 if(!ok)return;
 state.assigned=state.assigned.filter(x=>x!==id);
 infoMessage="";save();render();
}
document.addEventListener("click",event=>{
 const root=$("agentIntegrationsView");
 if(!root||root.hidden||!root.contains(event.target))return;
 const target=event.target.closest("button");
 if(event.target.matches("[data-ai-backdrop]")){pickerOpen=false;render();return}
 if(!target)return;
 if(target.hasAttribute("data-ai-close")){pickerOpen=false;render();return}
 if(target.dataset.aiOpen){
   if(isRunning())return;
   pickerKind=target.dataset.aiOpen==="crm"?"crm":"channel";
   pickerOpen=true;render();$("agentIntegrationsView").querySelector(".ai-picker-close")?.focus();return;
 }
 if(target.dataset.aiAssign){assign(target.dataset.aiAssign);return}
 if(target.dataset.aiRemove){detach(target.dataset.aiRemove);return}
});
document.addEventListener("change",event=>{
 const el=event.target;
 const root=$("agentIntegrationsView");
 if(!root||root.hidden||!root.contains(el)||!el.matches("[data-ai-grant]")||isRunning())return;
 const id=el.dataset.aiConnection,grant=el.dataset.aiGrant;
 if(!state.assigned.includes(id)||!grants.some(g=>g.id===grant))return;
 const previous=state.permissions[id]||[];
 state.permissions[id]=el.checked?[...new Set([...previous,grant])]:previous.filter(x=>x!==grant);
 save();render();
});
document.addEventListener("keydown",event=>{
 if(event.key!=="Escape"||!pickerOpen)return;
 pickerOpen=false;render();
});
window.AIMockAgentIntegrations={
 render:()=>{pickerOpen=false;infoMessage="";render()},
 getLocalState:()=>structuredClone(state)
};
})();