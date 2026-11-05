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
  {id:"kitchen",name:"Расчёт кухни",criteria:"required",incompleteAction:"wait",fields:[
    mk("furniture","Тип мебели","select",true,"Кухня / шкаф / гардеробная",["Кухня","Шкаф","Гардеробная"]),
    mk("size","Размеры помещения","text",true,"Можно приблизительно"),
    mk("phone","Контакт для связи","phone",true,"Для уточнения деталей"),
    mk("budget","Ориентировочный бюджет","money",false,"В рублях"),
    mk("comment","Комментарий","text",false,"Дополнительные пожелания")
  ]},
  {id:"measure",name:"Замер",criteria:"required",incompleteAction:"handoff",fields:[
    mk("service","Что нужно измерить","select",true,"Помещение или мебель",["Кухня","Шкаф","Другое"]),
    mk("address","Адрес замера","address",true),
    mk("date","Удобная дата","date",false),
    mk("phone","Контакт для связи","phone",true)
  ]},
  {id:"consult",name:"Консультация",criteria:"incomplete",incompleteAction:"handoff",fields:[
    mk("subject","Тема вопроса","text",true),
    mk("contact","Контакт для связи","phone",false),
    mk("comment","Дополнительная информация","text",false)
  ]}
 ],
 result:{destination:"aimock",recipient:"owner",crmAction:"none",notify:true},
 model:{mode:"automatic",tags:"заявки, магазин",access:"team"}
});
let state=load(), selected="kitchen", tab="types", editField=null;
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
  '<div class="ls-main-column"><section class="ls-panel ls-builder"><div class="ls-builder-heading"><div><span class="ls-section-eyebrow">Настройка типа заявки</span>'+
   '<h2>'+escape(t.name)+'</h2><p>Укажите, какие сведения нужны для этого обращения.</p></div>'+
   '<button type="button" class="ls-outline-btn" data-ls-action="rename-type"'+disabled()+'>'+icon("sliders")+' Изменить тип</button></div>'+
   fieldList(t)+
   '<div class="ls-criteria"><div><strong>Критерий готовности</strong><small>Для этого типа заявки</small></div>'+
    select(t.criteria,[["required","Все обязательные поля"],["incomplete","Допускается неполная заявка"]],'data-ls-config="criteria"')+
    '<p>Полностью готовая заявка содержит все обязательные сведения. Неполная всегда отмечается отдельно.</p>'+
    '<div class="ls-criteria-divider"></div>'+
    '<div><strong>Если данных не хватает</strong><small>Сценарий для неполной заявки</small></div>'+
    select(t.incompleteAction||"wait",[["wait","Ожидать уточнения от клиента"],["handoff","Направить ответственному на рассмотрение"]],'data-ls-config="incompleteAction"')+
    '<p>Передача человеку не делает неполную заявку полностью готовой. В этом макете реальные уведомления не отправляются.</p>'+
   '</div></section>'+resultSummary()+'</div></div>';
}
function resultSummary(){
 return '<section class="ls-panel ls-result"><button type="button" class="ls-summary-link" data-ls-tab="result"><strong>Результат заявки</strong>'+icon("right")+'</button>'+
  '<p>Создание внутренней заявки в AIMock</p>'+
  '<p class="ls-result-note"><span class="ls-indicator"></span>CRM — '+(state.result.crmAction==="none"?"без внешних действий":"настроить подключение")+'</p></section>';
}
function workTab(){
 const types=state.types;
 const typeNames=types.map(t=>'<span class="ls-work-type">'+escape(t.name)+'</span>').join("");
 return '<div class="ls-work-view">'+
   '<div class="ls-work-intro"><div><span class="ls-section-eyebrow">ОСНОВНОЕ</span>'+
     '<h2>Рабочие данные</h2><p>Расскажите о бизнесе и его особенностях. Это поможет менеджеру заявок понимать контекст обращений.</p></div></div>'+
   '<div class="ls-work-layout">'+
     '<div class="ls-work-primary">'+
       '<section class="ls-panel ls-work-form" aria-labelledby="lsWorkBusinessHeading">'+
         '<div class="ls-work-fieldgroup">'+
           '<div class="ls-work-field-title"><span class="ls-work-step">01</span><div><h3 id="lsWorkBusinessHeading">О вашем бизнесе</h3>'+
           '<p>Чем занимается компания, какие товары или услуги предлагает и кому они предназначены.</p></div></div>'+
           '<label class="ls-work-label" for="lsWorkProject">Описание бизнеса <span class="ls-work-required">Обязательно</span></label>'+
           '<textarea id="lsWorkProject" class="ls-input ls-work-textarea" data-ls-config="project" placeholder="Например: изготавливаем кухни, шкафы и гардеробные на заказ. Помогаем с подбором материалов и оформлением замера."'+disabled()+'>'+escape(state.project)+'</textarea>'+
           '<div class="ls-work-field-bottom"><span>Пишите своими словами — без команд и технических инструкций.</span>'+
             '<span data-ls-counter="project">'+String(state.project||"").length+' символов</span></div>'+
           '<details class="ls-work-example"><summary>'+icon("book")+' Посмотреть пример заполнения '+icon("right")+'</summary>'+
             '<p>«Мы изготавливаем корпусную мебель по индивидуальным размерам. Работаем с частными клиентами, предлагаем кухни, шкафы и гардеробные. Клиенты обращаются за консультацией, расчётом стоимости и записью на замер».</p></details>'+
         '</div>'+
         '<div class="ls-work-separator"></div>'+
         '<div class="ls-work-fieldgroup">'+
           '<div class="ls-work-field-title"><span class="ls-work-step">02</span><div><h3>Дополнительные пожелания</h3>'+
           '<p>Особенности общения с клиентами, которые важно учитывать именно в вашем бизнесе.</p></div></div>'+
           '<label class="ls-work-label" for="lsWorkRequirements">Что ещё учитывать <span class="ls-work-muted">Необязательно</span></label>'+
           '<textarea id="lsWorkRequirements" class="ls-input ls-work-textarea ls-work-textarea-small" data-ls-config="requirements" placeholder="Например: стараться отвечать кратко, обращаться к клиенту на «вы», учитывать предпочтительный способ связи."'+disabled()+'>'+escape(state.requirements)+'</textarea>'+
           '<div class="ls-work-field-bottom"><span>Встроенные правила профессии и безопасности не меняются.</span>'+
             '<span data-ls-counter="requirements">'+String(state.requirements||"").length+' символов</span></div>'+
         '</div>'+
       '</section>'+
       '<section class="ls-panel ls-work-related"><div class="ls-work-related-head"><div>'+
         '<h3>Типы обращений</h3><p>Какие запросы обрабатывает агент и какие данные собирает.</p></div>'+
         '<button type="button" class="ls-outline-btn" data-ls-tab="types">Настроить поля '+icon("right")+'</button></div>'+
         '<div class="ls-work-types">'+(typeNames||'<span class="ls-work-muted">Нет настроенных типов заявок</span>')+'</div></section>'+
     '</div>'+
     '<aside class="ls-work-aside" aria-label="Подсказки по настройке">'+
       '<section class="ls-work-guide"><span class="ls-section-eyebrow">ПОДСКАЗКА</span><h3>Что здесь указывать?</h3>'+
         '<p>Достаточно объяснить, с каким бизнесом работает менеджер заявок. Не нужно описывать его алгоритм или писать промпт.</p>'+
         '<div class="ls-work-guide-item"><span class="ls-work-guide-dot"></span><div><strong>Рабочие данные</strong><small>Контекст компании и особенности общения.</small></div></div>'+
         '<div class="ls-work-guide-item"><span class="ls-work-guide-dot"></span><div><strong>Знания</strong><small>Каталоги, цены, сроки, документы и FAQ.</small></div></div>'+
         '<div class="ls-work-guide-item"><span class="ls-work-guide-dot"></span><div><strong>Типы заявок</strong><small>Какие поля агент должен собрать у клиента.</small></div></div>'+
       '</section>'+
       '<div class="ls-work-knowledge"><div class="ls-work-knowledge-icon">'+icon("book")+'</div><div>'+
         '<strong>Нужны сведения о товарах и услугах?</strong>'+
         '<p>Добавляйте справочные материалы в «Знания», чтобы не дублировать их в описании.</p>'+
         '<a href="#/agent/leads/knowledge">Перейти к знаниям '+icon("right")+'</a></div></div>'+
     '</aside>'+
   '</div></div>';
}
function resultTab(){
 const v=state.result,t=type();
 return '<div class="ls-simple-grid">'+panel("Результат заявки","Куда записывать подтверждённые данные.",
   row("Внутренняя заявка","Создаётся в AIMock независимо от внешней CRM.",'<div class="ls-static-setting">'+icon("check")+' Внутренняя заявка в AIMock</div>')+
   row("Получатель результата","В личном пространстве доступен владелец; в компании — уполномоченные сотрудники.",select(v.recipient,[["owner","Владелец пространства"],["team","Ответственный сотрудник команды"]],'data-ls-result="recipient"'))+
   row("Кому направлять уведомление","При готовности заявки.",'<label class="ls-check"><input type="checkbox" data-ls-result="notify"'+(v.notify?" checked":"")+disabled()+'> Уведомлять ответственного</label>'))+
   panel("Работа с CRM","Внешние действия доступны только при реальном подключении и разрешениях.",
     row("Действие в CRM","Отдельное разрешение требуется для создания и обновления.",select(v.crmAction,[["none","Не выполнять"],["create","Создавать запись"],["update","Обновлять запись"]],'data-ls-result="crmAction"'))+
     '<p class="ls-hint">Подключения и сопоставление полей задаются в разделе «Интеграции».</p><a class="ls-outline-btn" href="#/agent/leads/integrations">Интеграции '+icon("right")+'</a>')+
   panel("Сценарии обработки · "+escape(t.name),"Действия по выбранным правилам, без фактической отправки.",
      '<div class="ls-result-rules"><div><strong>Все обязательные поля заполнены</strong><p>Формируется полная внутренняя заявка для выбранного получателя.</p></div>'+
      '<div><strong>Сведений не хватает</strong><p>'+
       ((t.incompleteAction||"wait")==="handoff"?
       "Неполная заявка направляется ответственному для рассмотрения.":
       "Заявка ожидает дополнительных сведений от клиента.")+'</p></div></div>'+
      '<button type="button" class="ls-outline-btn" data-ls-tab="types">Изменить правила заявки '+icon("right")+'</button>')+
   '</div>';
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
 if(isRunning())return;
 const fieldProp=el.dataset.lsFieldprop;
 if(fieldProp){mutField(fieldProp,el.type==="checkbox"?el.checked:el.value);if(phase==="change")render();return}
 const k=el.dataset.lsConfig;
 if(k==="project"||k==="requirements"){state[k]=el.value;save();const counter=document.querySelector('[data-ls-counter="'+k+'"]');if(counter)counter.textContent=el.value.length+" символов";return}
 if(k==="criteria"||k==="incompleteAction"){type()[k]=el.value;save();render();return}
 if(el.dataset.lsResult){state.result[el.dataset.lsResult]=el.type==="checkbox"?el.checked:el.value;save();render();return}
 if(el.dataset.lsModel){state.model[el.dataset.lsModel]=el.value;save();if(phase==="change")render()}
}
function handleAction(name){
 if(name==="close-field"){editField=null;render();return}
 if(isRunning())return;
 const t=type();
 if(name==="add-type"){const id="type"+Date.now();state.types.push({id,name:"Новый тип заявки",criteria:"required",incompleteAction:"wait",fields:[]});selected=id;editField=null;save();render();return}
 if(name==="rename-type"){const next=prompt("Название типа заявки",t.name);if(next&&next.trim()){t.name=next.trim().slice(0,80);save();render()}return}
 if(name==="add-field"){const id="field"+Date.now();t.fields.push(mk(id,"Новое поле","text",false));editField=id;save();render();return}
 if(name==="delete-field"){if(!editField)return;if(!confirm("Удалить выбранное поле?"))return;t.fields=t.fields.filter(f=>f.id!==editField);editField=null;save();render();return}
 const i=t.fields.findIndex(f=>f.id===editField);if(i<0)return;
 const n=name==="move-up"?i-1:name==="move-down"?i+1:i;
 if(n>=0&&n<t.fields.length&&n!==i){[t.fields[i],t.fields[n]]=[t.fields[n],t.fields[i]];save();render()}
}
function setup(){
 document.addEventListener("click",event=>{
  const root=document.getElementById("agentSettingsView");
  if(!root||root.hidden||!root.contains(event.target))return;
  const button=event.target.closest("button");
  if(!button)return;
  if(button.dataset.lsTab){tab=button.dataset.lsTab;render();return}
  if(button.dataset.lsType){selected=button.dataset.lsType;editField=null;render();return}
  if(button.dataset.lsField){editField=button.dataset.lsField;render();return}
  if(button.dataset.lsAction)handleAction(button.dataset.lsAction);
 });
 for(const evt of ["input","change"]) document.addEventListener(evt,e=>{
  const root=document.getElementById("agentSettingsView");
  if(root&&!root.hidden&&root.contains(e.target))mutate(e,evt);
 });

}
window.AIMockLeadSettings={render:()=>{if(!state.types.some(t=>t.id===selected))selected=state.types[0].id;render();},getState:()=>state};
setup();
})();