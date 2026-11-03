(() => {
"use strict";
// Visual reference implementation: local-only draft state; no API, model invocation or CRM writes.
const storeKey = "aimock:lead-settings-builder:v1";
const icon = (id) => '<svg class="icon" aria-hidden="true"><use href="#i-'+id+'"></use></svg>';
const escape = v => String(v??"").replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fieldKinds={text:"Текст",select:"Список",phone:"Телефон",email:"Email",money:"Сумма",date:"Дата",number:"Число",address:"Адрес"};
const mk=(id,title,type,required,hint="",options=[])=>({id,title,type,required,hint,options,condition:"always",conditionField:"",conditionValue:""});
const initial=()=>({
 project:"Изготавливаем кухни, шкафы и гардеробные на заказ по индивидуальным размерам.",
 requirements:"",
 types:[
  {id:"kitchen",name:"Расчёт кухни",criteria:"required",fields:[
    mk("furniture","Тип мебели","select",true,"Кухня / шкаф / гардеробная",["Кухня","Шкаф","Гардеробная"]),
    mk("size","Размеры помещения","text",true,"Можно приблизительно"),
    mk("phone","Контакт для связи","phone",true,"Для уточнения деталей"),
    mk("budget","Ориентировочный бюджет","money",false,"В рублях"),
    mk("comment","Комментарий","text",false,"Дополнительные пожелания")
  ]},
  {id:"measure",name:"Замер",criteria:"required",fields:[
    mk("service","Что нужно измерить","select",true,"Помещение или мебель",["Кухня","Шкаф","Другое"]),
    mk("address","Адрес замера","address",true),
    mk("date","Удобная дата","date",false),
    mk("phone","Контакт для связи","phone",true)
  ]},
  {id:"consult",name:"Консультация",criteria:"incomplete",fields:[
    mk("subject","Тема вопроса","text",true),
    mk("contact","Контакт для связи","phone",false),
    mk("comment","Дополнительная информация","text",false)
  ]}
 ],
 result:{destination:"aimock",recipient:"owner",crmAction:"none",notify:true},
 model:{mode:"automatic",tags:"заявки, магазин",access:"team"}
});
let state=load(), selected="kitchen", tab="types", editField=null, previewValues={}, previewMessage="";
function normalize(x){
 if(!x||!Array.isArray(x.types)||!x.types.length) return initial();
 return x;
}
function load(){try{return normalize(JSON.parse(localStorage.getItem(storeKey)))}catch{return initial()}}
function persist(){try{localStorage.setItem(storeKey,JSON.stringify(state))}catch{}}
function type(){return state.types.find(t=>t.id===selected)||state.types[0]}
function isRunning(){return window.AIMockAgentDetail.getStatus("leads")}
function disabled(){return isRunning()?" disabled":""}
function option(value,label,current){return '<option value="'+escape(value)+'"'+(String(value)===String(current)?" selected":"")+'>'+escape(label)+'</option>'}
function row(title,sub,html){return '<div class="ls-formrow"><label class="ls-label">'+escape(title)+'</label>'+(sub?'<p class="ls-hint">'+escape(sub)+'</p>':"")+html+'</div>'}
function input(text,attrs=""){return '<input class="ls-input" type="text" value="'+escape(text)+'" '+attrs+disabled()+'>'}
function select(value,entries,attrs=""){return '<select class="ls-input" '+attrs+disabled()+'>'+entries.map(([v,l])=>option(v,l,value)).join("")+'</select>'}
function textArea(value,attrs=""){return '<textarea class="ls-input ls-textarea" '+attrs+disabled()+'>'+escape(value)+'</textarea>'}
function panel(title,desc,content,addon=""){return '<section class="ls-panel"><div class="ls-panel-head"><div><h2>'+title+'</h2>'+(desc?'<p>'+desc+'</p>':"")+'</div>'+addon+'</div>'+content+'</section>'}
function tabs(){
 const list=[["work","Рабочие данные"],["types","Типы заявок и поля"],["result","Результат и передача"],["model","AI-модель и доступы"],["ready","Перед запуском"]];
 return '<div class="ls-tabs" role="tablist" aria-label="Разделы настроек">'+list.map(([id,text])=>
  '<button type="button" class="ls-tab'+(tab===id?" is-active":"")+'" role="tab" aria-selected="'+(tab===id)+'" data-ls-tab="'+id+'">'+text+'</button>').join("")+'</div>';
}
function typesList(){
 return '<aside class="ls-panel ls-types" aria-label="Типы заявок"><h2 class="ls-section-eyebrow">Типы заявок</h2>'+
   '<div class="ls-type-list">'+state.types.map(t=>'<button type="button" class="ls-type'+(t.id===type().id?" is-active":"")+'" data-ls-type="'+escape(t.id)+'">'+icon("file")+'<span>'+escape(t.name)+'</span><small>'+t.fields.length+'</small></button>').join("")+'</div>'+
   '<button type="button" class="ls-addtype" data-ls-action="add-type"'+disabled()+'>'+icon("plus")+' Добавить тип</button></aside>';
}
function fieldList(t){
 let rows=t.fields.map((f,i)=>'<div class="ls-field" data-field-row="'+escape(f.id)+'">'+
  '<span class="ls-grip" aria-hidden="true">⠿</span>'+
  '<button type="button" class="ls-field-main'+(editField===f.id?" is-selected":"")+'" data-ls-field="'+escape(f.id)+'">'+
  '<strong>'+escape(f.title)+'</strong><small>'+escape(fieldKinds[f.type]||"Текст")+(f.hint?" · "+escape(f.hint):"")+'</small></button>'+
  '<span class="ls-required'+(f.required?"":" is-optional")+'">'+(f.required?"Обязательно":"Необязательно")+'</span>'+
  '<button class="ls-field-arrow" type="button" aria-label="Редактировать поле '+escape(f.title)+'" data-ls-field="'+escape(f.id)+'">'+icon("right")+'</button>'+
  '</div>').join("");
 const open=editField?t.fields.find(x=>x.id===editField):null;
 return '<div class="ls-fields-head"><strong>Поля заявки <span>· '+t.fields.length+'</span></strong><span class="ls-count">'+t.fields.filter(f=>f.required).length+' обязательных</span></div>'+
  '<div class="ls-field-list">'+rows+'</div>'+
  '<button class="ls-addfield" type="button" data-ls-action="add-field"'+disabled()+'>'+icon("plus")+' Добавить поле</button>'+
  (open?fieldEditor(t,open):"");
}
function fieldEditor(t,f){
 return '<section class="ls-field-editor" aria-label="Редактор поля">'+
  '<div class="ls-editor-head"><strong>Настройка поля</strong><button type="button" class="ls-icon-btn" aria-label="Закрыть редактор" data-ls-action="close-field">'+icon("close")+'</button></div>'+
  '<div class="ls-editor-grid">'+
   row("Название поля","Какую информацию нужно получить от клиента",input(f.title,'data-ls-fieldprop="title"'))+
   row("Тип данных","Значения проверяются по выбранному типу",select(f.type,Object.entries(fieldKinds),'data-ls-fieldprop="type"'))+
   row("Подсказка","Необязательно",input(f.hint,'data-ls-fieldprop="hint"'))+
   (f.type==="select"?row("Варианты выбора","Указывайте каждый вариант через запятую",input((f.options||[]).join(", "),'data-ls-fieldprop="options"')):"")+
   row("Условие появления","Можно показывать поле только при выбранном значении другого поля.",select(f.condition||"always",[["always","Всегда"],["match","Когда выбрано значение"]],'data-ls-fieldprop="condition"'))+
   (f.condition==="match"?
      row("Зависит от поля","Доступны другие поля со списком",select(f.conditionField||"",[["","Выберите поле"],...t.fields.filter(other=>other.id!==f.id&&other.type==="select").map(other=>[other.id,other.title])],'data-ls-fieldprop="conditionField"'))+
      row("Значение","При каком ответе показывать это поле",select(f.conditionValue||"",[["","Выберите значение"],...(t.fields.find(other=>other.id===f.conditionField)?.options||[]).map(value=>[value,value])],'data-ls-fieldprop="conditionValue"'))
     :"")+
  '</div>'+
  '<label class="ls-check"><input type="checkbox" data-ls-fieldprop="required"'+(f.required?" checked":"")+disabled()+'> Обязательное поле</label>'+
  '<div class="ls-editor-actions">'+
   '<button type="button" data-ls-action="move-up"'+disabled()+'>↑ Выше</button>'+
   '<button type="button" data-ls-action="move-down"'+disabled()+'>↓ Ниже</button>'+
   '<button type="button" class="ls-danger" data-ls-action="delete-field"'+disabled()+'>Удалить поле</button></div></section>';
}
function builder(){
 const t=type();
 return '<div class="ls-workbench">'+typesList()+
  '<section class="ls-panel ls-builder"><div class="ls-builder-heading"><div><span class="ls-section-eyebrow">Настройка типа заявки</span>'+
   '<h2>'+escape(t.name)+'</h2><p>Укажите, какие сведения нужны для этого обращения.</p></div>'+
   '<button type="button" class="ls-outline-btn" data-ls-action="rename-type"'+disabled()+'>'+icon("sliders")+' Изменить тип</button></div>'+
   fieldList(t)+
   '<div class="ls-criteria"><div><strong>Критерий готовности</strong><small>Для этого типа заявки</small></div>'+
    select(t.criteria,[["required","Все обязательные поля"],["incomplete","Допускается неполная заявка"]],'data-ls-config="criteria"')+
    '<p>Готовность определяется по настроенным полям. Неполную заявку можно сохранить и передать человеку.</p></div></section>'+
    '<aside class="ls-right">'+preview(t)+resultSummary()+'</aside></div>';
}
function fieldVisible(f){return f.condition!=="match"||(!!f.conditionField&&!!f.conditionValue&&previewValues[f.conditionField]===f.conditionValue)}
function preview(t){
 const displayFields=t.fields.filter(fieldVisible).slice(0,5);
 return '<section class="ls-panel ls-preview" aria-label="Предпросмотр заявки"><div class="ls-panel-head"><div><span class="ls-section-eyebrow">Предпросмотр</span><h2>Новая заявка</h2><p>'+escape(t.name)+'</p></div>'+icon("file")+'</div>'+
  '<form id="ls-preview-form" novalidate>'+displayFields.map(f=>{
    const value=previewValues[f.id]||"";
    let control;
    if(f.type==="select")control='<select class="ls-input" data-ls-preview="'+escape(f.id)+'">'+option("","Выберите значение",value)+(f.options||[]).map(x=>option(x,x,value)).join("")+'</select>';
    else control='<input class="ls-input" data-ls-preview="'+escape(f.id)+'" type="'+(f.type==="email"?"email":f.type==="phone"?"tel":f.type==="date"?"date":f.type==="money"||f.type==="number"?"number":"text")+'" placeholder="'+escape(f.hint||"Укажите значение")+'" value="'+escape(value)+'">';
    return '<label class="ls-preview-field"><strong>'+escape(f.title)+(f.required?'<i> *</i>':"")+'</strong>'+control+'</label>';
  }).join("")+'<button type="submit" class="ls-dark-btn">Проверить поля</button>'+
  '<p class="ls-preview-feedback" role="status">'+escape(previewMessage)+'</p></form></section>';
}
function resultSummary(){
 return '<section class="ls-panel ls-result"><button type="button" class="ls-summary-link" data-ls-tab="result"><strong>Результат заявки</strong>'+icon("right")+'</button>'+
  '<p>Создание внутренней заявки в AIMock</p>'+
  '<p class="ls-result-note"><span class="ls-indicator"></span>CRM — '+(state.result.crmAction==="none"?"без внешних действий":"настроить подключение")+'</p></section>';
}
function workTab(){
 return '<div class="ls-simple-grid">'+panel("Рабочие данные","Контекст проекта и предмет работы агента.",
   row("Чем занимается проект или бизнес","Кратко и обычными словами, без системных инструкций.",textArea(state.project,'data-ls-config="project"'))+
   row("Дополнительные пожелания","Необязательно. Особенности работы, которые не меняют правила профессии.",textArea(state.requirements,'data-ls-config="requirements"')))+
   panel("Типы обращений","Допустимые сценарии обработки.",'<div class="ls-type-chips">'+state.types.map(t=>'<span>'+escape(t.name)+'</span>').join("")+'</div><button type="button" data-ls-tab="types" class="ls-outline-btn">Настроить типы и поля '+icon("right")+'</button>')+'</div>';
}
function resultTab(){
 const v=state.result;
 return '<div class="ls-simple-grid">'+panel("Результат заявки","Куда записывать подтверждённые данные.",
   row("Внутренняя заявка","Создаётся в AIMock независимо от внешней CRM.",'<div class="ls-static-setting">'+icon("check")+' Внутренняя заявка в AIMock</div>')+
   row("Получатель результата","В личном пространстве доступен владелец; в компании — уполномоченные сотрудники.",select(v.recipient,[["owner","Владелец пространства"],["team","Ответственный сотрудник команды"]],'data-ls-result="recipient"'))+
   row("Кому направлять уведомление","При готовности заявки.",'<label class="ls-check"><input type="checkbox" data-ls-result="notify"'+(v.notify?" checked":"")+disabled()+'> Уведомлять ответственного</label>'))+
   panel("Работа с CRM","Внешние действия доступны только при реальном подключении и разрешениях.",
     row("Действие в CRM","Отдельное разрешение требуется для создания и обновления.",select(v.crmAction,[["none","Не выполнять"],["create","Создавать запись"],["update","Обновлять запись"]],'data-ls-result="crmAction"'))+
     '<p class="ls-hint">Подключения и сопоставление полей задаются в разделе «Интеграции».</p><a class="ls-outline-btn" href="#/agent/leads/integrations">Интеграции '+icon("right")+'</a>')+'</div>';
}
function modelTab(){
 return '<div class="ls-simple-grid">'+panel("AI-модель","Настройка публичной модели агента.",
   row("Выбор модели","Автоматически — модель, назначенная для профессии в Admin.",select(state.model.mode,[["automatic","Автоматически"],["explicit","Выбрать вручную"]],'data-ls-model="mode"'))+
   (state.model.mode==="explicit"?'<p class="ls-hint">Доступные модели выбираются из каталога провайдера; каталог в этом интерфейсе не загружен.</p>':""))+
   panel("Доступы и теги","Теги служат поиску и не предоставляют права.",
   row("Теги","Через запятую",input(state.model.tags,'data-ls-model="tags"'))+
   row("Группа доступа","Только для пространства компании.",select(state.model.access,[["team","Отдел продаж"],["owner","Только владелец"]],'data-ls-model="access"'))+
   '<p class="ls-hint">Реальные права сотрудников определяются доступами рабочего пространства.</p>')+'</div>';
}
function readyTab(){
 const hasFields=state.types.some(t=>t.fields.some(f=>f.required));
 const checks=[
  ["Рабочие данные",!!state.project.trim(),"Описание предмета работы"],
  ["Типы заявок",state.types.length>0,"Хотя бы один тип"],
  ["Поля заявки",hasFields,"Есть обязательные поля"],
  ["Подключённый канал",null,"Проверяется после подключения"],
  ["Права на действия в CRM",null,"Проверяются по интеграциям"],
  ["Лимиты и баланс",null,"Проверяются сервером при запуске"]
 ];
 return panel("Перед запуском","Сводка конфигурации; здесь не выполняется серверная проверка готовности.",
   '<div class="ls-readiness">'+checks.map(([name,ok,sub])=>'<div class="ls-checkrow"><span class="ls-ready-icon '+(ok===true?"is-ok":"")+'">'+icon(ok===true?"check":"clock")+'</span><span><strong>'+name+'</strong><small>'+sub+'</small></span></div>').join("")+'</div>'+
   '<a href="#/agent/leads/integrations" class="ls-outline-btn">Настроить подключения '+icon("right")+'</a>');
}
function content(){return tab==="types"?builder():tab==="work"?workTab():tab==="result"?resultTab():tab==="model"?modelTab():readyTab()}
function render(){
 const root=document.getElementById("agentSettingsView");if(!root||root.hidden)return;
 const running=isRunning();
 if(!state.types.some(t=>t.id===selected))selected=state.types[0].id;
 root.innerHTML='<div class="ls-header"><div><span class="ls-overline">Входящие заявки · Менеджер заявок</span>'+
  '<h1 id="agentSettingsHeading">Настройки</h1><p>Предмет работы, параметры заявок и действия агента.</p></div>'+
  '<div class="ls-header-actions"><span class="ls-save-state">'+icon("check")+' '+(running?"Только просмотр":"Автосохранение")+'</span>'+
  '<span class="ls-status">'+(running?"Работает":"Остановлен")+'</span>'+
  '<button type="button" class="ls-outline-btn" data-ls-tab="ready">'+icon("check")+' Перед запуском</button></div></div>'+
  (running?'<div class="ls-readonly" role="note">'+icon("alert")+' Работающий агент доступен только для просмотра. Для редактирования <a href="#/agent/leads/overview">остановите его на странице обзора</a>.</div>':"")+
  tabs()+'<div role="tabpanel">'+content()+'</div>';
}
function save(){persist();}
function mutField(prop,value){
 const f=type().fields.find(f=>f.id===editField);if(!f)return;
 if(prop==="required")f.required=!!value;
 else if(prop==="options")f.options=String(value).split(",").map(x=>x.trim()).filter(Boolean);
 else f[prop]=value;
 save();
}
function mutate(event,phase){
 if(document.getElementById("agentSettingsView").hidden)return;
 const el=event.target;
 if(el.matches("[data-ls-preview]")){previewValues[el.dataset.lsPreview]=el.value;if(phase==="change"&&el.tagName==="SELECT")render();return}
 if(isRunning())return;
 const fieldProp=el.dataset.lsFieldprop;
 if(fieldProp){mutField(fieldProp,el.type==="checkbox"?el.checked:el.value);if(phase==="change")render();return}
 const k=el.dataset.lsConfig;
 if(k==="project"||k==="requirements"){state[k]=el.value;save();return}
 if(k==="criteria"){type().criteria=el.value;save();render();return}
 if(el.dataset.lsResult){state.result[el.dataset.lsResult]=el.type==="checkbox"?el.checked:el.value;save();render();return}
 if(el.dataset.lsModel){state.model[el.dataset.lsModel]=el.value;save();if(phase==="change")render()}
}
function handleAction(name){
 if(name==="close-field"){editField=null;render();return}
 if(isRunning())return;
 const t=type();
 if(name==="add-type"){const id="type"+Date.now();state.types.push({id,name:"Новый тип заявки",criteria:"required",fields:[]});selected=id;editField=null;previewValues={};previewMessage="";save();render();return}
 if(name==="rename-type"){const next=prompt("Название типа заявки",t.name);if(next&&next.trim()){t.name=next.trim().slice(0,80);save();render()}return}
 if(name==="add-field"){const id="field"+Date.now();t.fields.push(mk(id,"Новое поле","text",false));editField=id;save();render();return}
 if(name==="delete-field"){if(!editField)return;if(!confirm("Удалить выбранное поле?"))return;t.fields=t.fields.filter(f=>f.id!==editField);editField=null;save();render();return}
 const i=t.fields.findIndex(f=>f.id===editField);if(i<0)return;
 const n=name==="move-up"?i-1:name==="move-down"?i+1:i;
 if(n>=0&&n<t.fields.length&&n!==i){[t.fields[i],t.fields[n]]=[t.fields[n],t.fields[i]];save();render()}
}
function validValue(f,value){
 const text=String(value??"").trim();
 if(!text)return true;
 if(f.type==="email")return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
 if(f.type==="phone"){const digits=text.replace(/\D/g,"");return digits.length>=7&&digits.length<=15}
 if(f.type==="money"||f.type==="number")return Number.isFinite(Number(text));
 if(f.type==="select")return (f.options||[]).includes(text);
 return true;
}
function setup(){
 document.addEventListener("click",event=>{
  const root=document.getElementById("agentSettingsView");
  if(!root||root.hidden||!root.contains(event.target))return;
  const button=event.target.closest("button");
  if(!button)return;
  if(button.dataset.lsTab){tab=button.dataset.lsTab;render();return}
  if(button.dataset.lsType){selected=button.dataset.lsType;editField=null;previewValues={};previewMessage="";render();return}
  if(button.dataset.lsField){editField=button.dataset.lsField;render();return}
  if(button.dataset.lsAction)handleAction(button.dataset.lsAction);
 });
 for(const evt of ["input","change"]) document.addEventListener(evt,e=>{
  const root=document.getElementById("agentSettingsView");
  if(root&&!root.hidden&&root.contains(e.target))mutate(e,evt);
 });
 document.addEventListener("submit",event=>{
  if(event.target.id!=="ls-preview-form")return;
  event.preventDefault();
  const visible=type().fields.filter(fieldVisible);
  const missing=visible.filter(f=>f.required&&!String(previewValues[f.id]||"").trim());
  const invalid=visible.filter(f=>!validValue(f,previewValues[f.id]));
  previewMessage=missing.length?"Заполните обязательные поля: "+missing.map(f=>f.title).join(", "):
    invalid.length?"Проверьте формат полей: "+invalid.map(f=>f.title).join(", "):
    "Все обязательные поля заполнены, формат значений корректен.";
  const message=document.querySelector(".ls-preview-feedback");if(message)message.textContent=previewMessage;
 });
}
window.AIMockLeadSettings={render:()=>{if(!state.types.some(t=>t.id===selected))selected=state.types[0].id;render();},getState:()=>state};
setup();
})();