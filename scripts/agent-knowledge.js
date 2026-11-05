(() => {
"use strict";
// Agent-scoped knowledge UI only: sample source metadata, local assignments, no file uploads or RAG calls.
const storeKey="aimock:lead-knowledge-assignments:v1";
const icon=id=>'<svg class="icon" aria-hidden="true"><use href="#i-'+id+'"></use></svg>';
const escape=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const catalog=[
 {id:"products",kind:"document",title:"Каталог мебели",details:"Ассортимент кухонь, шкафов и гардеробных, материалы и доступные варианты исполнения.",format:"PDF",version:"3",state:"current",audience:"Для отдела продаж",size:"2,4 МБ"},
 {id:"faq",kind:"faq",title:"Частые вопросы клиентов",details:"Ответы на повторяющиеся вопросы о заказах, материалах, способах связи и порядке оформления.",format:"FAQ",version:"5",state:"current",audience:"Общие знания компании",size:"18 вопросов"},
 {id:"delivery",kind:"document",title:"Доставка, замер и монтаж",details:"Условия выезда на замер, доставки и установки изделий, а также ограничения по регионам.",format:"DOCX",version:"2",state:"current",audience:"Для отдела продаж",size:"124 КБ"},
 {id:"payments",kind:"faq",title:"Оплата и гарантии",details:"Информация о доступных способах оплаты, гарантийных обязательствах и возвратах.",format:"FAQ",version:"1",state:"current",audience:"Общие знания компании",size:"12 вопросов"},
 {id:"pricing",kind:"document",title:"Прайс-лист",details:"Справочный прайс-лист требует пересмотра перед использованием в ответах клиентам.",format:"XLSX",version:"1",state:"outdated",audience:"Для отдела продаж",size:"310 КБ"}
];
const initial=()=>({assigned:["products","faq"]});
function load(){try{
 const raw=JSON.parse(localStorage.getItem(storeKey));
 if(!raw||!Array.isArray(raw.assigned))return initial();
 return {assigned:[...new Set(raw.assigned)].filter(id=>catalog.some(c=>c.id===id&&c.state!=="restricted"))};
}catch{return initial()}}
let state=load(),pickOpen=false,detailsId=null,search="",filter="all",pendingRemove=null;
const isRunning=()=>window.AIMockAgentDetail.getStatus("leads");
const locked=()=>isRunning()?" disabled":"";
const save=()=>{try{localStorage.setItem(storeKey,JSON.stringify(state))}catch{}};
const lookup=id=>catalog.find(s=>s.id===id);
const isCurrent=s=>s.state==="current";
const assigned=()=>catalog.filter(s=>state.assigned.includes(s.id));
const iconFor=s=>s.kind==="faq"?"message":"file";
function statePill(s){
 const label=s.state==="current"?"Актуально":s.state==="outdated"?"Требует обновления":"Нет доступа";
 return '<span class="ak-source-state is-'+s.state+'">'+label+'</span>';
}
function sourceSymbol(s){return '<span class="ak-source-symbol '+(s.kind==="faq"?"is-faq":"is-document")+'">'+icon(iconFor(s))+'</span>'}
function sourceIdentity(s){
 return '<div class="ak-source-identity">'+sourceSymbol(s)+'<div class="ak-source-label"><strong>'+escape(s.title)+'</strong>'+
 '<span>'+escape(s.format)+' <span class="ak-meta-dot">·</span> Версия '+escape(s.version)+' <span class="ak-meta-dot">·</span> '+escape(s.audience)+'</span></div></div>';
}
function sourceRow(s){
 return '<article class="ak-source-row" data-ak-assigned="'+s.id+'">'+
 '<div class="ak-source-row-top">'+sourceIdentity(s)+
 '<div class="ak-source-row-tools">'+statePill(s)+
 '<button class="ak-icon-button" type="button" data-ak-details="'+s.id+'" aria-label="Открыть сведения о '+escape(s.title)+'">'+icon("right")+'</button>'+
 '<button class="ak-icon-button" type="button" data-ak-remove="'+s.id+'" aria-label="Отвязать '+escape(s.title)+'"'+locked()+'>'+icon("close")+'</button></div></div>'+
 '<p class="ak-source-description">'+escape(s.details)+'</p>'+
 (s.state==="outdated"?'<p class="ak-source-warning">'+icon("alert")+' Материал требует проверки актуальности перед использованием.</p>':"")+
 '</article>';
}
function assignedPanel(){
 const sources=assigned();
 const count=sources.filter(isCurrent).length;
 return '<section class="ak-main-panel" aria-labelledby="akAssignedHeading">'+
 '<div class="ak-panel-header"><div><span class="ak-eyebrow">ИСТОЧНИКИ АГЕНТА</span><h2 id="akAssignedHeading">Назначенные материалы</h2>'+
 '<p>Агент использует только разрешённые источники из библиотеки текущего пространства.</p></div>'+
 '<button type="button" class="ak-outline-button" data-ak-open'+locked()+'>'+icon("plus")+' Выбрать материалы</button></div>'+
 '<div class="ak-assigned-count"><span>'+sources.length+' '+(sources.length===1?"источник":"источника")+'</span><span>'+count+' актуально</span></div>'+
 '<div class="ak-source-list">'+(sources.length?sources.map(sourceRow).join(""):'<div class="ak-empty">'+icon("book")+'<strong>Источники не назначены</strong><p>Выберите нужные материалы из библиотеки рабочего пространства.</p></div>')+'</div>'+
 '</section>';
}
function sidePanel(){
 return '<aside class="ak-aside">'+
 '<section class="ak-library-card"><span class="ak-library-icon">'+icon("book")+'</span><div><strong>Библиотека знаний</strong>'+
 '<p>Добавление файлов, создание FAQ, версии и общие права — в отдельном разделе AIMock.</p>'+
 '<a href="#/knowledge">Открыть библиотеку '+icon("right")+'</a></div></section>'+
 '<div class="ak-safety-note">'+icon("alert")+' При отсутствии подтверждённых данных агент должен уточнять информацию, а не придумывать цены или условия.</div>'+
 '</aside>';
}
function sourceChoice(s){
 const selected=state.assigned.includes(s.id),ready=s.state==="current";
 const disabled=selected||!ready||isRunning();
 const action=selected?"Назначено":s.state==="restricted"?"Недоступно":s.state==="outdated"?"Обновить в библиотеке":"Назначить";
 return '<article class="ak-picker-source" data-ak-catalog="'+s.id+'">'+sourceIdentity(s)+
 '<div class="ak-picker-source-actions">'+statePill(s)+
 '<button type="button" data-ak-assign="'+s.id+'"'+(disabled?" disabled":"")+'>'+action+'</button></div></article>';
}
function picker(){
 const needle=search.trim().toLocaleLowerCase("ru");
 const visible=catalog.filter(s=>(filter==="all"||s.kind===filter)&&(s.title+" "+s.format+" "+s.details).toLocaleLowerCase("ru").includes(needle));
 return '<div class="ak-backdrop" data-ak-backdrop>'+
 '<section role="dialog" aria-modal="true" aria-labelledby="akPickerHeading" class="ak-picker">'+
 '<div class="ak-picker-header"><div><span class="ak-eyebrow">БИБЛИОТЕКА ПРОСТРАНСТВА</span><h2 id="akPickerHeading">Выбрать материалы</h2>'+
 '<p>Назначайте агенту только нужные источники. Новые материалы создаются в общей библиотеке.</p></div>'+
 '<button type="button" class="ak-icon-button" data-ak-close aria-label="Закрыть окно">'+icon("close")+'</button></div>'+
 '<div class="ak-picker-controls"><label class="ak-picker-search">'+icon("search")+'<input id="akSearch" type="search" value="'+escape(search)+'" placeholder="Найти материал" aria-label="Найти материал"></label>'+
 '<div class="ak-filter-tabs" aria-label="Тип источника">'+
 [['all','Все'],['document','Документы'],['faq','FAQ']].map(([v,label])=>'<button type="button" data-ak-filter="'+v+'" class="'+(filter===v?"active":"")+'" aria-pressed="'+(filter===v)+'">'+label+'</button>').join("")+'</div></div>'+
 '<div class="ak-picker-body" aria-live="polite">'+(visible.length?visible.map(sourceChoice).join(""):'<div class="ak-picker-empty">Ничего не найдено. Попробуйте другой запрос.</div>')+'</div>'+
 '<div class="ak-picker-footer"><a href="#/knowledge">Добавить материал в библиотеке '+icon("right")+'</a>'+
 '<button type="button" data-ak-close>Готово</button></div></section></div>';
}
function details(){
 const s=lookup(detailsId);if(!s)return "";
 return '<div class="ak-backdrop" data-ak-backdrop>'+
 '<section role="dialog" aria-modal="true" aria-labelledby="akDetailsHeading" class="ak-details">'+
 '<div class="ak-details-top"><div><span class="ak-eyebrow">СВЕДЕНИЯ ОБ ИСТОЧНИКЕ</span><h2 id="akDetailsHeading">'+escape(s.title)+'</h2></div>'+
 '<button type="button" class="ak-icon-button" data-ak-close aria-label="Закрыть сведения">'+icon("close")+'</button></div>'+
 '<p class="ak-details-description">'+escape(s.details)+'</p>'+
 '<div class="ak-details-grid">'+
 '<div><span>Тип</span><strong>'+escape(s.format)+'</strong></div>'+
 '<div><span>Версия</span><strong>'+escape(s.version)+'</strong></div>'+
 '<div><span>Область доступа</span><strong>'+escape(s.audience)+'</strong></div>'+
 '<div><span>Состояние</span>'+statePill(s)+'</div>'+
 '</div>'+
 '<p class="ak-details-note">Это сведения о назначенном источнике. Изменение содержимого и версии выполняется в библиотеке знаний.</p>'+
 '<div class="ak-details-actions"><a href="#/knowledge">Перейти в библиотеку '+icon("right")+'</a><button type="button" data-ak-close>Закрыть</button></div>'+
 '</section></div>';
}
function removeDialog(){
 const s=lookup(pendingRemove);if(!s)return "";
 return '<div class="ak-backdrop" data-ak-backdrop><section role="dialog" aria-modal="true" aria-labelledby="akRemoveHeading" class="ak-confirm">'+
 '<div><h2 id="akRemoveHeading">Отвязать материал?</h2><p>«'+escape(s.title)+'» больше не будет доступен этому агенту. В общей библиотеке он сохранится.</p></div>'+
 '<div class="ak-confirm-actions"><button type="button" data-ak-close>Отмена</button><button class="is-danger" type="button" data-ak-confirm-remove>Отвязать</button></div>'+
 '</section></div>';
}
function render(){
 const root=document.getElementById("agentKnowledgeView");if(!root||root.hidden)return;
 const running=isRunning();
 root.innerHTML='<header class="ak-header"><div><span class="ak-page-kicker">Входящие заявки · Менеджер заявок</span>'+
 '<h1 id="agentKnowledgeHeading">Знания</h1><p>Материалы, к которым агент может обращаться во время работы с клиентами.</p></div>'+
 '<div class="ak-header-actions"><span class="ak-save-state">'+(running?"Только просмотр":"Автосохранение")+'</span>'+
 '<a class="ak-outline-button" href="#/knowledge">'+icon("book")+' Библиотека знаний</a></div></header>'+
 (running?'<div class="ak-readonly" role="note">'+icon("alert")+' Агент работает. Изменение назначенных знаний доступно после <a href="#/agent/leads/overview">остановки на странице обзора</a>.</div>':"")+
 '<div class="ak-layout"><div class="ak-main">'+assignedPanel()+'</div>'+sidePanel()+'</div>'+
 (pickOpen?picker():detailsId?details():pendingRemove?removeDialog():"");
}
function assign(id){
 if(isRunning())return;
 const s=lookup(id);if(!s||!isCurrent(s)||state.assigned.includes(id))return;
 state.assigned.push(id);pickOpen=false;search="";filter="all";save();render();
}
function remove(id){
 if(isRunning()||!state.assigned.includes(id))return;
 state.assigned=state.assigned.filter(x=>x!==id);pendingRemove=null;save();render();
}
function closeDialog(){pickOpen=false;detailsId=null;pendingRemove=null;search="";filter="all";render()}
document.addEventListener("click",event=>{
 const root=document.getElementById("agentKnowledgeView");
 if(!root||root.hidden||!root.contains(event.target))return;
 if(event.target.matches("[data-ak-backdrop]")){closeDialog();return}
 const button=event.target.closest("button");if(!button)return;
 if(button.hasAttribute("data-ak-close")){closeDialog();return}
 if(button.hasAttribute("data-ak-open")){if(isRunning())return;pickOpen=true;detailsId=null;pendingRemove=null;search="";filter="all";render();document.getElementById("akSearch")?.focus();return}
 if(button.dataset.akAssign){assign(button.dataset.akAssign);return}
 if(button.dataset.akDetails){detailsId=button.dataset.akDetails;pickOpen=false;pendingRemove=null;render();return}
 if(button.dataset.akRemove){if(isRunning())return;pendingRemove=button.dataset.akRemove;detailsId=null;pickOpen=false;render();return}
 if(button.hasAttribute("data-ak-confirm-remove")){remove(pendingRemove);return}
 if(button.dataset.akFilter){filter=button.dataset.akFilter;render();document.getElementById("akSearch")?.focus();return}
});
document.addEventListener("input",event=>{
 if(event.target.id!=="akSearch")return;
 const root=document.getElementById("agentKnowledgeView");if(!root||root.hidden)return;
 search=event.target.value;
 const oldFocus={start:event.target.selectionStart,end:event.target.selectionEnd};
 render();
 const field=document.getElementById("akSearch");field?.focus();
 if(field&&oldFocus.start!==null)field.setSelectionRange(oldFocus.start,oldFocus.end);
});
document.addEventListener("keydown",event=>{if(event.key==="Escape"&&(pickOpen||detailsId||pendingRemove))closeDialog()});
window.AIMockAgentKnowledge={render:()=>{pickOpen=false;detailsId=null;pendingRemove=null;render()},getLocalState:()=>structuredClone(state)};
})();