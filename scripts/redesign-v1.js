(() => {
"use strict";
// Static UX prototype: all data is illustrative, no API calls.
const pageTitles = {
 overview:"Обзор", agents:"Агенты",library:"Библиотека агентов",
 messages:"Сообщения", knowledge:"Знания",integrations:"Интеграции",
 contacts:"Контакты",automation:"Автоматизации",finance:"Финансы",
 workspace:"Пространства",profile:"Профиль",settings:"Настройки",
 notifications:"Уведомления",create:"Создание агента",attention:"Требует внимания"
};
const agents={consultant:"Консультант",leads:"Менеджер заявок",recruiter:"HR-рекрутер",support:"Поддержка"};
const agentSections={overview:"Обзор",messages:"Диалоги",settings:"Настройки",integrations:"Интеграции",knowledge:"Знания",testing:"Тестирование",automation:"Автоматизации",analytics:"Статистика",logs:"Логи"};
const items=[
 ["Обзор","overview","home"],["Агенты","agents","grid"],["Библиотека агентов","library","layers"],
 ["Сообщения","messages","message"],["Знания","knowledge","book"],
 ["Интеграции","integrations","plug"],["Контакты","contacts","users"],
 ["Автоматизации","automation","workflow"],["Финансы","finance","wallet"],
 ...Object.entries(agents).map(([id,name])=>[name,"agent/"+id+"/overview","bot"])
];
const $=id=>document.getElementById(id);
const stats={
 "7":[["284","+12% к прошлой неделе"],["96","+18% к прошлой неделе"],["24","За последние 7 дней"],["28 сек","−22% к прошлой неделе"]],
 "30":[["1 126","+9% к прошлому месяцу"],["418","+14% к прошлому месяцу"],["88","За последние 30 дней"],["31 сек","−11% к прошлому месяцу"]]
};
function currentRoute(){
 let key=decodeURIComponent(location.hash.replace(/^#\/?/,""))||"overview";
 let parts=key.split("/");
 if(parts[0]==="agent"){
   const id=Object.hasOwn(agents,parts[1])?parts[1]:"consultant";
   const section=Object.hasOwn(agentSections,parts[2])?parts[2]:"overview";
   return {key:"agent",id,section,title:agentSections[section],name:agents[id]};
 }
 if(!Object.hasOwn(pageTitles,key))key="overview";
 return {key,title:pageTitles[key]};
}
function closeMobile(){
 $("appSidebar").classList.remove("is-open");
 $("mobileScrim").hidden=true;
 $("mobileToggle").setAttribute("aria-expanded","false");
}
function closeNotifications(){
 $("notificationsPopover").hidden=true;
 $("notificationsToggle").setAttribute("aria-expanded","false");
}
function closeSearch(){
 $("searchOverlay").hidden=true;
 document.body.style.overflow="";
}
function renderRoute(){
 const route=currentRoute(),isAgent=route.key==="agent";
 document.body.classList.toggle("is-agent-route",isAgent);
 $("overviewView").hidden=route.key!=="overview";
 $("placeholderView").hidden=route.key==="overview";
 $("breadcrumbRoot").textContent=isAgent?"Агенты":"AIMock";
 $("breadcrumbCurrent").textContent=isAgent?route.name+" / "+route.title:route.title;
 if(isAgent){
   $("agentSidebarName").textContent=route.name;
   document.querySelectorAll("[data-agent-section]").forEach(link=>{
     link.href="#/agent/"+route.id+"/"+link.dataset.agentSection;
     const active=link.dataset.agentSection===route.section;
     link.classList.toggle("active",active);
     if(active)link.setAttribute("aria-current","page");else link.removeAttribute("aria-current");
   });
   $("placeholderName").textContent="В разработке";
   $("placeholderContext").textContent=route.name+" / "+route.title;
   $("placeholderDescription").textContent="В следующем этапе здесь появится отдельный раздел агента. Сейчас доступен обновлённый общий обзор и новое контекстное меню.";
 }else{
   document.querySelectorAll("[data-global-route]").forEach(link=>{
     const active=link.dataset.globalRoute===route.key;
     link.classList.toggle("active",active);
     if(active)link.setAttribute("aria-current","page");else link.removeAttribute("aria-current");
   });
   if(route.key!=="overview"){
     $("placeholderName").textContent="В разработке";
     $("placeholderContext").textContent=route.title;
     $("placeholderDescription").textContent="Страница «"+route.title+"» будет реализована следующим этапом в новой светлой дизайн-системе AIMock.";
   }
 }
 document.title="AIMock — "+(isAgent?route.name+" / ":"")+route.title;
 closeMobile();closeNotifications();closeSearch();
 document.querySelector(".workspace").scrollTop=0;
 window.scrollTo(0,0);
}
function updatePeriod(value){
 const period=value==="30"?"30":"7";
 document.querySelectorAll("[data-period]").forEach(button=>{
   const active=button.dataset.period===period;
   button.classList.toggle("selected",active);
   button.setAttribute("aria-pressed",String(active));
 });
 document.querySelectorAll("[data-metric-index]").forEach(el=>{
   const pair=stats[period][Number(el.dataset.metricIndex)];
   if(!pair)return;
   el.querySelector("[data-value]").textContent=pair[0];
   el.querySelector("[data-detail]").textContent=pair[1];
 });
}
function renderSearch(query){
 const results=$("globalSearchResults");
 results.replaceChildren();
 const needle=(query||"").trim().toLocaleLowerCase("ru-RU");
 const matches=items.filter(item=>item[0].toLocaleLowerCase("ru-RU").includes(needle));
 if(!matches.length){
   const p=document.createElement("p");p.className="empty-results";p.textContent="Ничего не найдено";results.append(p);
 }
 matches.forEach(item=>{
   const link=document.createElement("a");link.href="#/"+item[1];
   const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");svg.classList.add("icon");
   const use=document.createElementNS("http://www.w3.org/2000/svg","use");use.setAttribute("href","#i-"+item[2]);svg.append(use);
   const label=document.createElement("strong");label.textContent=item[0];
   const type=document.createElement("span");type.textContent=item[1].startsWith("agent/")?"Агент":"Раздел";
   link.append(svg,label,type);link.addEventListener("click",closeSearch);results.append(link);
 });
}
function openSearch(){
 closeNotifications();$("searchOverlay").hidden=false;$("globalSearchInput").value="";
 renderSearch("");$("globalSearchInput").focus();document.body.style.overflow="hidden";
}
document.querySelectorAll("[data-period]").forEach(button=>button.addEventListener("click",()=>updatePeriod(button.dataset.period)));
$("mobileToggle").addEventListener("click",()=>{
 const active=!$("appSidebar").classList.contains("is-open");
 $("appSidebar").classList.toggle("is-open",active);$("mobileScrim").hidden=!active;
 $("mobileToggle").setAttribute("aria-expanded",String(active));
});
$("mobileScrim").addEventListener("click",closeMobile);
$("searchToggle").addEventListener("click",openSearch);
$("closeSearch").addEventListener("click",closeSearch);
$("globalSearchInput").addEventListener("input",event=>renderSearch(event.target.value));
$("searchOverlay").addEventListener("click",event=>{if(event.target===$("searchOverlay"))closeSearch();});
$("notificationsToggle").addEventListener("click",()=>{
 const active=$("notificationsPopover").hidden;
 $("notificationsPopover").hidden=!active;$("notificationsToggle").setAttribute("aria-expanded",String(active));
});
document.addEventListener("click",event=>{
 if(!$("notificationsPopover").hidden&&!$("notificationsPopover").contains(event.target)&&!$("notificationsToggle").contains(event.target))closeNotifications();
});
document.addEventListener("keydown",event=>{
 if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==="k"){
   event.preventDefault();if($("searchOverlay").hidden)openSearch();else closeSearch();
 }
 if(event.key==="Escape"){closeSearch();closeMobile();closeNotifications();}
});
window.addEventListener("hashchange",renderRoute);
updatePeriod("7");renderRoute();
})();