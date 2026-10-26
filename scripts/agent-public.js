/* Read-only public card preview. No actual publishing, entitlement lookup, LLM calls or copying. */
(()=>{
'use strict';
const $=id=>document.getElementById(id),p=new URLSearchParams(location.search);
const agents={
a1:['HR-рекрутер','Проводит первичный отбор кандидатов','AI-рекрутер','А','#4a454d'],
a2:['Менеджер заявок','Принимает обращения и отвечает клиентам','AI-менеджер обращений','Д','#345258'],
a3:['Поддержка','Отвечает на вопросы пользователей','AI-менеджер обращений','С','#584442'],
a4:['Рекрутер · Дизайн','Помогает HR с поиском специалистов','AI-рекрутер','М','#3f4c68'],
a5:['Менеджер партнёров','Входящие заявки от партнёров','AI-менеджер обращений','М','#4a454d'],
a6:['HR · Регионы','Отбор кандидатов в регионах','AI-рекрутер','Р','#345258'],
a7:['Поддержка сайта','Обращения из каналов компании','AI-менеджер обращений','С','#584442'],
a8:['Новый рекрутер','Инструкция и подключения не завершены','AI-рекрутер','Н','#3f4c68'],
a9:['Рекрутер · IT','Подбор технических специалистов','AI-рекрутер','Р','#4a454d'],
a10:['Менеджер · Архив','Обработка архивных запросов','AI-менеджер обращений','М','#345258']
};
const id=Object.hasOwn(agents,p.get('agent'))?p.get('agent'):'a1';
const [name,description,role,letter,color]=agents[id];
$('publicTitle').textContent=name;$('publicDescription').textContent=description;
$('publicRole').textContent=role;$('publicAvatar').textContent=letter;
$('publicAvatar').style.setProperty('--av',color);
$('publicPurpose').textContent=role==='AI-рекрутер'
 ?'Проводит первичные беседы с кандидатами, собирает ответы на вопросы и передаёт результаты на решение HR.'
 :'Обрабатывает обращения и вопросы клиентов, собирает информацию и передаёт запросы сотруднику.';
const all={guide:'Описание вакансий',faq:'Частые вопросы',policy:'Информация о компании'};
const selected=(p.get('materials')||'').split(',').filter(x=>Object.hasOwn(all,x));
const items=$('publicMaterials');
for(const key of [...new Set(selected)]){const row=document.createElement('div');row.className='public-material';const strong=document.createElement('strong');strong.textContent=all[key];const small=document.createElement('small');small.textContent='Разрешённый материал';row.append(strong,small);items.append(row)}
if(!items.children.length){const hint=document.createElement('p');hint.className='public-material-empty';hint.textContent='Автор не включил дополнительные файлы или знания.';items.append(hint)}
const dialog=$('publicCopyDialog');
$('publicCopyButton').addEventListener('click',()=>dialog.showModal());
$('publicCloseDialog').addEventListener('click',()=>dialog.close());
$('publicCancelCopy').addEventListener('click',()=>dialog.close());
$('publicTargetWorkspace').addEventListener('change',()=>{$('publicCopyPlan').hidden=true;$('publicCopyHelp').textContent='Для выбранного пространства потребуется новая серверная проверка'});
$('publicPreviewCopy').addEventListener('click',()=>{$('publicCopyPlan').hidden=false;$('publicCopyHelp').textContent='Это визуальный план. Без проверки на сервере копирование остаётся недоступным.'});
})();