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
 model:{mode:"automatic",modelId:"",tags:"заявки, магазин",access:"team"}
});
let state=load(), selected="kitchen", tab="types", editField=null, editingTypeName=false;
function normalize(x){
 if(!x||!Array.isArray(x.types)||!x.types.length) return initial();
 x.model={...initial().model,...(x.model||{})};
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
 const list=[["work","Рабочие данные"],["types","Типы заявок и поля"],["result","Результат и передача"],["model","AI-модель"],["access","Доступы и теги"],["ready","Перед запуском"]];
 return '<div class="ls-tabs" role="tablist" aria-label="Разделы настроек">'+list.map(([id,text])=>
  '<button type="button" class="ls-tab'+(tab===id?" is-active":"")+'" role="tab" aria-selected="'+(tab===id)+'" data-ls-tab="'+id+'">'+text+'</button>').join("")+'</div>';
}
function fieldCountLabel(n){const tail=n%100;if(n%10===1&&tail!==11)return n+" поле";if([2,3,4].includes(n%10)&&![12,13,14].includes(tail))return n+" поля";return n+" полей"}
function typesList(){
 return '<aside class="ls-panel ls-types" aria-label="Типы заявок">'+
  '<div class="ls-types-sidebar-head"><span class="ls-section-eyebrow">ВАШИ СЦЕНАРИИ</span>'+
  '<h2>Типы заявок <span>'+state.types.length+'</span></h2>'+
  '<p>Для каждого обращения можно задать собственные поля и правила завершения.</p></div>'+
  '<div class="ls-type-list">'+state.types.map((t,i)=>
    '<button type="button" class="ls-type'+(t.id===type().id?" is-active":"")+
    '" aria-current="'+(t.id===type().id?"true":"false")+'" data-ls-type="'+escape(t.id)+'">'+
    '<span class="ls-type-index">'+String(i+1).padStart(2,"0")+'</span>'+
    '<span class="ls-type-text"><strong>'+escape(t.name||"Без названия")+'</strong>'+
    '<small>'+fieldCountLabel(t.fields.length)+'</small></span>'+
    icon("right")+'</button>').join("")+'</div>'+
  '<button type="button" class="ls-addtype" data-ls-action="add-type"'+disabled()+'>'+icon("plus")+' Добавить тип заявки</button>'+
  '<div class="ls-types-sidebar-note">'+icon("message")+' Агент определяет тип обращения по сообщениям клиента и собирает соответствующие сведения.</div>'+
  '</aside>';
}
function fieldList(t){
 const rows=t.fields.map((f,i)=>'<div class="ls-field" data-field-row="'+escape(f.id)+'">'+
  '<span class="ls-field-index">'+String(i+1).padStart(2,"0")+'</span>'+
  '<button type="button" class="ls-field-main'+(editField===f.id?" is-selected":"")+'" data-ls-field="'+escape(f.id)+'">'+
  '<strong>'+escape(f.title||"Новое поле")+'</strong>'+
  '<small>'+escape(fieldKinds[f.type]||"Текст")+(f.hint?" · "+escape(f.hint):"")+'</small></button>'+
  (f.condition==="match"?'<span class="ls-conditional-tag">По условию</span>':"")+
  '<span class="ls-required'+(f.required?"":" is-optional")+'">'+(f.required?"Обязательно":"Необязательно")+'</span>'+
  '<button class="ls-field-arrow" type="button" aria-label="Редактировать поле '+escape(f.title)+'" data-ls-field="'+escape(f.id)+'">'+icon("right")+'</button>'+
  '</div>').join("");
 const open=editField?t.fields.find(f=>f.id===editField):null;
 return '<div class="ls-fields-head"><strong>Поля заявки <span>· '+t.fields.length+'</span></strong>'+
   '<span class="ls-count">'+t.fields.filter(f=>f.required).length+' обязательных</span></div>'+
   '<div class="ls-field-list">'+(rows||'<div class="ls-fields-empty"><strong>Поля ещё не добавлены</strong>'+
     '<p>Начните с информации, без которой заявку нельзя обработать: тип услуги, контакт клиента или необходимые детали.</p></div>')+'</div>'+
   '<button class="ls-addfield" type="button" data-ls-action="add-field"'+disabled()+'>'+icon("plus")+' Добавить поле</button>'+
   (open?fieldEditor(t,open):"");
}
function fieldEditor(t,f){
 const sources=t.fields.filter(other=>other.id!==f.id&&other.type==="select");
 return '<section class="ls-field-editor" aria-label="Редактор поля">'+
   '<div class="ls-editor-head"><div><span class="ls-section-eyebrow">ПАРАМЕТРЫ ПОЛЯ</span>'+
   '<h3>'+escape(f.title||"Новое поле")+'</h3><p>Настройте, какую информацию должен получить агент.</p></div>'+
   '<button type="button" class="ls-icon-btn" aria-label="Закрыть редактор" data-ls-action="close-field">'+icon("close")+'</button></div>'+
   '<div class="ls-editor-section-label">Основное</div>'+
   '<div class="ls-editor-grid">'+
    row("Название поля","Например: контакт для связи, размеры помещения",input(f.title,'data-ls-fieldprop="title"'))+
    row("Тип данных","По типу проверяется формат ответа клиента",select(f.type,Object.entries(fieldKinds),'data-ls-fieldprop="type"'))+
    row("Подсказка для заполнения","Необязательно",input(f.hint,'data-ls-fieldprop="hint"'))+
    (f.type==="select"?row("Варианты ответа","Указывайте значения через запятую",input((f.options||[]).join(", "),'data-ls-fieldprop="options"')):"")+
   '</div>'+
   '<div class="ls-editor-section-label">Условия сбора</div>'+
   '<p class="ls-editor-explain">Обычно агент собирает поле всегда. Если оно нужно только при определённом ответе, задайте условие.</p>'+
   '<div class="ls-editor-grid">'+
    row("Условие появления","Когда нужно уточнять информацию",select(f.condition||"always",[["always","Всегда"],["match","Когда выбрано значение"]],'data-ls-fieldprop="condition"'))+
    (f.condition==="match"?
      row("Зависит от поля","Можно выбрать другое поле типа «Список»",select(f.conditionField||"",[["","Выберите поле"],...sources.map(other=>[other.id,other.title])],'data-ls-fieldprop="conditionField"'))+
      row("Значение","При каком ответе спрашивать это поле",select(f.conditionValue||"",[["","Выберите значение"],...(t.fields.find(other=>other.id===f.conditionField)?.options||[]).map(value=>[value,value])],'data-ls-fieldprop="conditionValue"')):"")+
   '</div>'+
   '<label class="ls-check ls-editor-required"><input type="checkbox" data-ls-fieldprop="required"'+(f.required?" checked":"")+disabled()+'>'+
     '<span><strong>Обязательное поле</strong><small>Агент уточнит сведения, если их не хватает для полной заявки.</small></span></label>'+
   '<div class="ls-editor-actions">'+
    '<button type="button" data-ls-action="move-up"'+disabled()+'>↑ Выше</button>'+
    '<button type="button" data-ls-action="move-down"'+disabled()+'>↓ Ниже</button>'+
    '<button type="button" class="ls-danger" data-ls-action="delete-field"'+disabled()+'>Удалить поле</button></div></section>';
}
function builder(){
 const t=type();
 return '<div class="ls-types-view">'+
   '<div class="ls-types-intro"><span class="ls-section-eyebrow">НАСТРОЙКА ОБРАЩЕНИЙ</span>'+
   '<h2>Типы заявок и поля</h2>'+
   '<p>Определите, какие обращения принимает менеджер и что ему нужно узнать у клиента. Агент задаёт вопросы в переписке, а не показывает клиенту анкету.</p></div>'+
   '<div class="ls-workbench">'+typesList()+
   '<div class="ls-main-column">'+
     '<section class="ls-panel ls-builder"><div class="ls-builder-heading"><div>'+
       '<span class="ls-section-eyebrow">ВЫБРАННЫЙ ТИП ЗАЯВКИ</span>'+
       '<h2>'+escape(t.name||"Новый тип заявки")+'</h2>'+
       '<p>Настройте сведения, которые агент соберёт для этого обращения.</p></div>'+
       '<button type="button" class="ls-outline-btn" data-ls-action="rename-type"'+disabled()+'>'+icon("sliders")+' Название</button></div>'+
       (editingTypeName?'<div class="ls-type-name-editor"><label for="lsTypeName">Название типа заявки</label>'+
          '<div class="ls-type-name-controls"><input id="lsTypeName" data-ls-type-name class="ls-input" type="text" maxlength="80" value="'+escape(t.name)+'"'+disabled()+'>'+
          '<button type="button" class="ls-outline-btn" data-ls-action="done-type-name">Готово</button></div>'+
          '<p>Например: «Расчёт кухни», «Запись на замер» или «Консультация».</p>'+
          (state.types.length>1?'<button class="ls-type-delete" type="button" data-ls-action="delete-type"'+disabled()+'>Удалить этот тип заявки</button>':"")+'</div>':"")+
       '<div class="ls-builder-divider"></div>'+
       '<div class="ls-builder-section-head"><span class="ls-work-step">01</span><div><h3>Какие данные собирать</h3>'+
         '<p>Поля определяют, какую информацию агент должен получить. Уже названное клиентом он не спрашивает повторно.</p></div></div>'+
       fieldList(t)+'</section>'+
     '<section class="ls-panel ls-completion-panel">'+
       '<div class="ls-builder-section-head"><span class="ls-work-step">02</span><div><h3>Когда заявка готова</h3>'+
       '<p>Выберите, как поступить, если клиент предоставил не всю информацию.</p></div></div>'+
       '<div class="ls-criteria"><div class="ls-criteria-row">'+
         '<label for="lsCriteria">Критерий готовности</label>'+
         '<p>Какие сведения обязательны для завершения.</p>'+
         select(t.criteria,[["required","Все обязательные поля"],["incomplete","Допускается неполная заявка"]],'id="lsCriteria" data-ls-config="criteria"')+
       '</div><div class="ls-criteria-row">'+
         '<label for="lsIncompleteAction">Если данных не хватает</label>'+
         '<p>Что делать с неполным обращением.</p>'+
         select(t.incompleteAction||"wait",[["wait","Ожидать уточнения от клиента"],["handoff","Направить ответственному на рассмотрение"]],'id="lsIncompleteAction" data-ls-config="incompleteAction"')+
       '</div></div>'+
       '<div class="ls-completion-note">'+icon("alert")+
         '<span>Передача человеку не делает неполную заявку полностью готовой. Настройки не запускают реальные уведомления в этом макете.</span></div>'+
     '</section>'+
     '<section class="ls-types-help"><div class="ls-types-help-icon">'+icon("book")+'</div>'+
       '<div><h3>Как работают эти настройки?</h3><p>Тип заявки определяет сценарий обращения, поля — необходимые сведения, а критерий готовности — когда можно завершить сбор данных.</p>'+
       '<details class="ls-types-example"><summary>Показать пример '+icon("right")+'</summary>'+
       '<p>Для заявки «Расчёт кухни» агент может уточнить размеры и контакт, но не должен повторно спрашивать уже полученные ответы. Данные о материалах и сроках он берёт из назначенных знаний.</p></details></div></section>'+
     resultSummary()+
   '</div></div></div>';
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
function modelTags(){return String(state.model.tags||"").split(",").map(tag=>tag.trim()).filter(Boolean)}
function isCompanyWorkspace(){return /компании/i.test(document.querySelector(".workspace-link small")?.textContent||"")}
function modelTab(){
 const mode=state.model.mode;
 return '<div class="ls-model-view">'+
   '<div class="ls-model-intro"><span class="ls-section-eyebrow">КОНФИГУРАЦИЯ</span>'+
     '<h2>AI-модель</h2><p>Выберите модель для обработки сообщений. Все остальные настройки агента находятся в своих разделах.</p></div>'+
   '<div class="ls-model-layout"><div class="ls-model-main">'+
     '<section class="ls-panel ls-model-card" aria-labelledby="lsModelHeading">'+
       '<div class="ls-model-section-title"><span class="ls-work-step">01</span><div>'+
         '<h3 id="lsModelHeading">Модель для обработки заявок</h3>'+
         '<p>Модель отвечает за понимание сообщений и подготовку ответов. Профессиональные правила AIMock остаются неизменными.</p>'+
       '</div></div>'+
       '<div class="ls-model-choices" role="group" aria-label="Способ выбора модели">'+
         '<button type="button" class="ls-model-choice'+(mode==="automatic"?" is-selected":"")+'" data-ls-model-mode="automatic" aria-pressed="'+(mode==="automatic")+'"'+disabled()+'>'+
           '<span class="ls-choice-radio" aria-hidden="true"></span><span class="ls-choice-body"><strong>Автоматически</strong>'+
             '<small>AIMock использует модель, назначенную администратором для этой профессии.</small></span>'+
           '<span class="ls-choice-suffix">Рекомендуется</span></button>'+
         '<button type="button" class="ls-model-choice'+(mode==="explicit"?" is-selected":"")+'" data-ls-model-mode="explicit" aria-pressed="'+(mode==="explicit")+'"'+disabled()+'>'+
           '<span class="ls-choice-radio" aria-hidden="true"></span><span class="ls-choice-body"><strong>Выбрать модель</strong>'+
             '<small>Выберите конкретную модель из каталога подключённого провайдера.</small></span></button>'+
       '</div>'+
       (mode==="automatic"?
         '<div class="ls-model-choice-info">'+icon("check")+' <span>Используется значение по умолчанию для профессии «Менеджер заявок».</span></div>':
         '<div class="ls-model-manual"><div class="ls-model-manual-head">'+
           '<strong>Конкретная модель</strong><span class="ls-model-catalog-status">Не выбрана</span></div>'+
           '<p>Для ручного выбора необходим актуальный каталог моделей провайдера. Здесь нет загруженного каталога — название модели не подставляется автоматически.</p>'+
           '<span class="ls-model-manual-note">'+icon("alert")+' Для запуска с ручным выбором модель должна быть указана.</span></div>')+
     '</section></div>'+
     '<aside class="ls-model-aside" aria-label="Объяснение настройки модели">'+
       '<section class="ls-work-guide"><span class="ls-section-eyebrow">КАК ЭТО РАБОТАЕТ</span><h3>Выбор AI-модели</h3>'+
         '<p>По умолчанию AIMock выбирает модель, которую администратор назначил для профессии «Менеджер заявок».</p>'+
         '<div class="ls-work-guide-item"><span class="ls-work-guide-dot"></span><div><strong>Автоматически</strong><small>Можно использовать без ручного выбора модели.</small></div></div>'+
         '<div class="ls-work-guide-item"><span class="ls-work-guide-dot"></span><div><strong>Вручную</strong><small>Требует модель из актуального каталога провайдера.</small></div></div>'+
       '</section>'+
       '<div class="ls-work-knowledge"><div class="ls-work-knowledge-icon">'+icon("sliders")+'</div><div>'+
         '<strong>Кто может управлять агентом?</strong>'+
         '<p>Области доступа и теги находятся в отдельном разделе настроек.</p>'+
         '<button type="button" class="ls-model-nav-link" data-ls-tab="access">Доступы и теги '+icon("right")+'</button></div></div>'+
     '</aside></div></div>';
}
function accessTab(){
 const tags=modelTags(), group=isCompanyWorkspace();
 return '<div class="ls-model-view ls-access-view">'+
   '<div class="ls-model-intro"><span class="ls-section-eyebrow">ОРГАНИЗАЦИЯ</span>'+
     '<h2>Доступы и теги</h2><p>Управляйте областью доступа к агенту и метками для поиска. Эти настройки не влияют на выбор AI-модели.</p></div>'+
   '<div class="ls-model-layout"><div class="ls-model-main">'+
     (group?'<section class="ls-panel ls-model-card" aria-labelledby="lsAccessHeading">'+
       '<div class="ls-model-section-title"><span class="ls-work-step">01</span><div>'+
       '<h3 id="lsAccessHeading">Доступ к агенту</h3>'+
       '<p>В пространстве компании права сотрудников определяются ролями и назначенными областями доступа.</p>'+
       '</div></div>'+
       '<label class="ls-work-label" for="lsAccessScope">Кому доступен агент</label>'+
       '<select id="lsAccessScope" class="ls-input ls-model-select" data-ls-model="access"'+disabled()+'>'+
         option("team","Группа «Отдел продаж»",state.model.access)+
         option("owner","Только владелец",state.model.access)+'</select>'+
       '<p class="ls-model-help">Выбор области доступа не заменяет проверку ролей и разрешений. Изменение этого параметра не выдаёт права на CRM или другие интеграции.</p>'+
       '</section>':'')+
     '<section class="ls-panel ls-model-card ls-model-tags-card" aria-labelledby="lsTagsHeading">'+
       '<div class="ls-model-section-title"><span class="ls-work-step">'+(group?"02":"01")+'</span><div>'+
       '<h3 id="lsTagsHeading">Теги</h3>'+
       '<p>Помогают находить агентов, группировать их и фильтровать списки. Теги не управляют доступом.</p>'+
       '</div></div>'+
       '<div class="ls-model-tag-list" aria-label="Назначенные теги">'+
         (tags.length?tags.map((tag,index)=>'<span class="ls-model-tag">'+escape(tag)+
           '<button type="button" aria-label="Убрать тег '+escape(tag)+'" data-ls-remove-tag="'+index+'"'+disabled()+'>'+icon("close")+'</button></span>').join(""):
           '<span class="ls-model-no-tags">Теги не назначены</span>')+'</div>'+
       '<div class="ls-model-tag-row"><input id="lsTagInput" class="ls-input" type="text" maxlength="32" placeholder="Название нового тега" aria-label="Название нового тега"'+disabled()+'>'+
       '<button type="button" class="ls-outline-btn" data-ls-action="add-tag"'+disabled()+'>'+icon("plus")+' Добавить</button></div>'+
       '<p class="ls-model-tag-hint" role="status" id="lsTagHint">Добавьте тег, чтобы быстрее находить агента в общем списке.</p>'+
     '</section></div>'+
   '<aside class="ls-model-aside" aria-label="Объяснение настроек доступа">'+
     '<section class="ls-work-guide"><span class="ls-section-eyebrow">КАК ЭТО РАБОТАЕТ</span><h3>Доступы и теги — не одно и то же</h3>'+
       '<p>Эти настройки решают разные задачи и не заменяют серверные проверки прав.</p>'+
       (group?'<div class="ls-work-guide-item"><span class="ls-work-guide-dot"></span><div><strong>Доступы</strong><small>Кто может видеть агента и работать с ним при наличии нужных прав.</small></div></div>':
         '<div class="ls-work-guide-item"><span class="ls-work-guide-dot"></span><div><strong>Личное пространство</strong><small>Агент принадлежит владельцу; групп сотрудников здесь нет.</small></div></div>')+
       '<div class="ls-work-guide-item"><span class="ls-work-guide-dot"></span><div><strong>Теги</strong><small>Подписи для поиска и фильтрации. Не предоставляют разрешения.</small></div></div>'+
     '</section>'+
     '<div class="ls-work-knowledge"><div class="ls-work-knowledge-icon">'+icon("sliders")+'</div><div>'+
       '<strong>Нужны права на действия агента?</strong>'+
       '<p>Работа с Telegram, CRM и другими инструментами настраивается отдельно через разрешённые интеграции.</p>'+
       '<a href="#/agent/leads/integrations">Перейти к интеграциям '+icon("right")+'</a></div></div>'+
   '</aside></div></div>';
}
function readyTab(){
 const hasFields=state.types.some(t=>t.fields.some(f=>f.required));
 const checks=[
  ["Рабочие данные",!!state.project.trim(),"Описание предмета работы"],
  ["Типы заявок",state.types.length>0,"Хотя бы один тип"],
  ["Поля заявки",hasFields,"Есть обязательные поля"],
  ["AI-модель",state.model.mode==="automatic"||!!state.model.modelId,"Автоматически или выбрана конкретная модель"],
  ["Подключённый канал",null,"Проверяется после подключения"],
  ["Права на действия в CRM",null,"Проверяются по интеграциям"],
  ["Лимиты и баланс",null,"Проверяются сервером при запуске"]
 ];
 return panel("Перед запуском","Сводка конфигурации; здесь не выполняется серверная проверка готовности.",
   '<div class="ls-readiness">'+checks.map(([name,ok,sub])=>'<div class="ls-checkrow"><span class="ls-ready-icon '+(ok===true?"is-ok":"")+'">'+icon(ok===true?"check":"clock")+'</span><span><strong>'+name+'</strong><small>'+sub+'</small></span></div>').join("")+'</div>'+
   '<a href="#/agent/leads/integrations" class="ls-outline-btn">Настроить подключения '+icon("right")+'</a>');
}
function content(){return tab==="types"?builder():tab==="work"?workTab():tab==="result"?resultTab():tab==="model"?modelTab():tab==="access"?accessTab():readyTab()}
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
 if(el.matches("[data-ls-type-name]")){
   if(phase==="change"){
     const next=el.value.trim();
     if(next){type().name=next.slice(0,80);save()}
     else el.value=type().name;
   }
   return;
 }
 const fieldProp=el.dataset.lsFieldprop;
 if(fieldProp){mutField(fieldProp,el.type==="checkbox"?el.checked:el.value);if(phase==="change")render();return}
 const k=el.dataset.lsConfig;
 if(k==="project"||k==="requirements"){state[k]=el.value;save();const counter=document.querySelector('[data-ls-counter="'+k+'"]');if(counter)counter.textContent=el.value.length+" символов";return}
 if(k==="criteria"||k==="incompleteAction"){type()[k]=el.value;save();render();return}
 if(el.dataset.lsResult){state.result[el.dataset.lsResult]=el.type==="checkbox"?el.checked:el.value;save();render();return}
 if(el.dataset.lsModel){state.model[el.dataset.lsModel]=el.value;save();if(phase==="change")render()}
}
function addModelTag(){
 if(isRunning())return;
 const input=document.getElementById("lsTagInput");
 if(!input)return;
 const tag=input.value.trim().replace(/,/g,"");
 const hint=document.getElementById("lsTagHint");
 if(!tag){if(hint)hint.textContent="Введите название тега.";return}
 const tags=modelTags();
 if(tags.some(t=>t.toLocaleLowerCase("ru")===tag.toLocaleLowerCase("ru"))){
   if(hint)hint.textContent="Этот тег уже назначен.";return
 }
 if(tags.length>=12){if(hint)hint.textContent="Можно назначить не более 12 тегов.";return}
 state.model.tags=[...tags,tag].join(", ");
 save();render();
 document.getElementById("lsTagInput")?.focus();
}
function removeModelTag(index){
 if(isRunning())return;
 const tags=modelTags();
 if(index<0||index>=tags.length)return;
 state.model.tags=tags.filter((_,i)=>i!==index).join(", ");
 save();render();
}
function handleAction(name){
 if(name==="done-type-name"){editingTypeName=false;render();return}
 if(name==="add-tag"){addModelTag();return}
 if(name==="close-field"){editField=null;render();return}
 if(isRunning())return;
 const t=type();
 if(name==="add-type"){const id="type"+Date.now();state.types.push({id,name:"Новый тип заявки",criteria:"required",incompleteAction:"wait",fields:[]});selected=id;editField=null;editingTypeName=true;save();render();document.getElementById("lsTypeName")?.select();return}
 if(name==="rename-type"){editingTypeName=!editingTypeName;render();if(editingTypeName)document.getElementById("lsTypeName")?.focus();return}
 if(name==="delete-type"){
   if(state.types.length<=1)return;
   if(!window.confirm("Удалить тип заявки «"+t.name+"» со всеми его полями и правилами?"))return;
   state.types=state.types.filter(item=>item.id!==t.id);
   selected=state.types[0].id;editField=null;editingTypeName=false;save();render();return;
 }
 if(name==="add-field"){const id="field"+Date.now();t.fields.push(mk(id,"Новое поле","text",false));editField=id;save();render();return}
 if(name==="delete-field"){if(!editField)return;if(!confirm("Удалить выбранное поле?"))return;t.fields=t.fields.filter(f=>f.id!==editField);editField=null;save();render();return}
 const i=t.fields.findIndex(f=>f.id===editField);if(i<0)return;
 const n=name==="move-up"?i-1:name==="move-down"?i+1:i;
 if(n>=0&&n<t.fields.length&&n!==i){[t.fields[i],t.fields[n]]=[t.fields[n],t.fields[i]];save();render()}
}
function setup(){
 document.addEventListener("keydown",event=>{
  if(event.key==="Enter"&&event.target.id==="lsTagInput"){
    event.preventDefault();addModelTag();
  }
 });
 document.addEventListener("click",event=>{
  const root=document.getElementById("agentSettingsView");
  if(!root||root.hidden||!root.contains(event.target))return;
  const button=event.target.closest("button");
  if(!button)return;
  if(button.dataset.lsModelMode){if(!isRunning()){state.model.mode=button.dataset.lsModelMode;save();render()}return}
  if(button.dataset.lsRemoveTag!==undefined){removeModelTag(Number(button.dataset.lsRemoveTag));return}
  if(button.dataset.lsTab){tab=button.dataset.lsTab;render();return}
  if(button.dataset.lsType){selected=button.dataset.lsType;editField=null;editingTypeName=false;render();return}
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