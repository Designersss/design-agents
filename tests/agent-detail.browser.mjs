import assert from "node:assert/strict";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const root=resolve(import.meta.dirname,"..");
const base=pathToFileURL(resolve(root,"index.html")).href;
const artifactDir=resolve(root,"artifacts","agent-detail");
mkdirSync(artifactDir,{recursive:true});
const browser=await chromium.launch({headless:true});
let failed=false;
try {
 const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
 const exceptions=[];
 page.on("pageerror",error=>exceptions.push(error.message));
 await page.goto(base+"#/agent/leads/overview");
 await page.waitForSelector("#detailToggleStatus");
 assert.equal((await page.locator("#agentDetailHeading").textContent()).trim(),"Входящие заявки");
 assert.equal(await page.locator("#placeholderView").isVisible(),false);
 assert.equal(await page.locator("#agentDetailView").isVisible(),true);
 assert.equal(await page.locator(".global-nav").isVisible(),false);
 assert.equal(await page.locator(".agent-nav").isVisible(),true);
 assert.equal(await page.locator(".detail-top-grid > .detail-card").count(),3);
 const topGeometry=await page.locator(".detail-top-grid > .detail-card").evaluateAll(cards=>
   cards.map(card=>{
     const c=card.getBoundingClientRect();
     return {height:c.height,top:c.top,bottom:c.bottom,left:c.left,minHeight:getComputedStyle(card).minHeight};
   }));
 assert.equal(topGeometry.length,3);
 for(const card of topGeometry){
   assert.equal(card.minHeight,"0px","No forced oversized minimum heights");
   assert.ok(Math.abs(card.top-topGeometry[0].top)<=1,"All three top cards must share a row");
   assert.ok(Math.abs(card.bottom-topGeometry[0].bottom)<=1,"All three top cards must have equal height");
   assert.ok(card.height<380,"Row height should be content-driven, not a giant fixed-height box: "+JSON.stringify(card));
 }
 assert.ok(topGeometry[0].left<topGeometry[1].left && topGeometry[1].left<topGeometry[2].left,"Three cards keep the original left-to-right layout");
 assert.equal(await page.locator(".detail-responsibility-index").count(),0);
 assert.equal(await page.locator(".detail-stat-grid > .detail-card").count(),3); 
 assert.equal((await page.locator("#breadcrumbCurrent").textContent()).trim(),"Входящие заявки");
 assert.equal((await page.locator(".detail-profession").textContent()).trim(),"Менеджер заявок");
 const professionVisual=await page.locator(".detail-description").evaluate(el=>{
   const styles=getComputedStyle(el);
   return {fontSize:parseFloat(styles.fontSize),lineHeight:parseFloat(styles.lineHeight),text:el.textContent.trim()};
 });
 assert.ok(professionVisual.text.startsWith("Менеджер заявок — специалист"));
 assert.ok(professionVisual.text.length>=150);
 assert.ok(professionVisual.fontSize>=13,"Profession text must be readable");
 assert.ok(professionVisual.lineHeight>=21,"Profession copy needs generous leading");
 assert.doesNotMatch(professionVisual.text,/агент|чат-бот/i);
 const statusRowSpacing=await page.locator(".detail-state-row").evaluateAll(rows=>rows.map(row=>({
   top:parseFloat(getComputedStyle(row).paddingTop),
   bottom:parseFloat(getComputedStyle(row).paddingBottom)
 })));
 assert.equal(statusRowSpacing.length,3);
 for(const spacing of statusRowSpacing){
   assert.ok(spacing.top>=10 && spacing.bottom>=10,
     "State row needs balanced vertical padding: "+JSON.stringify(spacing));
 }
 const stateBottomGap=await page.locator(".detail-state").evaluate(card=>{
   const last=card.querySelector(".detail-state-row:last-child");
   const cardBottom=card.getBoundingClientRect().bottom;
   const lastBottom=last.getBoundingClientRect().bottom;
   return cardBottom-lastBottom-parseFloat(getComputedStyle(card).paddingBottom);
 });
 assert.ok(Math.abs(stateBottomGap)<=2,
   "Status rows should use card height without a large empty bottom area");


 assert.equal(await page.locator(".detail-heading-tags span").count(),3);
 assert.equal(await page.locator(".detail-identity .detail-bubble").count(),0);
 assert.equal(await page.locator(".detail-identity .detail-tags").count(),0);
 assert.equal(await page.locator(".detail-state-row").count(),3);
 assert.equal(await page.locator(".detail-responsibility").count(),3);
 assert.equal(await page.locator(".detail-capability-icon").count(),3);
 assert.equal(await page.locator(".detail-flow-eyebrow").count(),0);
 assert.equal(await page.locator(".detail-responsibilities .detail-responsibility").count(),3);

 assert.equal(await page.locator(".detail-handoff").count(),0);
 assert.doesNotMatch(await page.locator(".detail-flow").innerText(),/Выполняет самостоятельно|Когда подключает человека/i);


 const capabilityBadges=await page.locator(".detail-capability-icon").evaluateAll(elements=>
  elements.map(el=>({
    width:el.getBoundingClientRect().width,
    height:el.getBoundingClientRect().height,
    hasIcon:!!el.querySelector('svg use')
  })));
 assert.equal(capabilityBadges.length,3);
 for(const badge of capabilityBadges){
   assert.ok(Math.abs(badge.width-badge.height)<=1,"Capability icon must remain square");
   assert.ok(badge.hasIcon,"Capability icon must have SVG symbol");
 }

 const responsibilityRows=await page.locator(".detail-responsibility").evaluateAll(rows=>
  rows.map(row=>({x:row.getBoundingClientRect().x,y:row.getBoundingClientRect().y,
    width:row.getBoundingClientRect().width,height:row.getBoundingClientRect().height,
    separator:getComputedStyle(row).borderTopWidth})));
 assert.equal(responsibilityRows.length,3);
 for(let i=1;i<responsibilityRows.length;i++){
   assert.ok(Math.abs(responsibilityRows[i].x-responsibilityRows[0].x)<=1,
     "Responsibilities should be vertically aligned in one column");
   assert.ok(responsibilityRows[i].y>=responsibilityRows[i-1].y+responsibilityRows[i-1].height-1,
     "Responsibilities must appear under one another, not side by side");
   assert.ok(Math.abs(responsibilityRows[i].width-responsibilityRows[0].width)<=1,
     "Responsibility rows must span the same available width");
   assert.equal(responsibilityRows[i].separator,"1px","Each subsequent row has horizontal separator");
 }

 assert.equal(await page.locator(".detail-activity-item").count(),3);
 assert.equal(await page.locator("#detailControlsLabel").count(),0);
 assert.doesNotMatch(await page.locator("#agentDetailView").innerText(),/Режим работы|Автоматический|Редактирование|После остановки/);
 const metricSpacing=await page.locator(".detail-stat").first().evaluate((el)=>{
   const d=el.querySelector(".detail-stat-description").getBoundingClientRect();
   const l=el.querySelector(".detail-stat-link").getBoundingClientRect();
   return l.top-d.bottom;
 });
 assert.ok(metricSpacing>=20,"Metric description needs a visible gap before its link");
 const statusIcon=await page.locator(".detail-state-row .detail-bubble").first().boundingBox();
 assert.ok(Math.abs(statusIcon.width-statusIcon.height)<=1,"State icon must remain circular");
 const shellBounds=await page.evaluate(()=>{
   const shell=document.querySelector(".app-shell");
   const sidebar=document.querySelector(".sidebar");
   const header=document.querySelector(".topbar");
   const sh=shell.getBoundingClientRect(),sb=sidebar.getBoundingClientRect(),hd=header.getBoundingClientRect();
   return { shell:{x:sh.x,y:sh.y,width:sh.width}, side:{left:sb.left,top:sb.top,bottom:innerHeight-sb.bottom},
      header:{top:hd.top,left:hd.left},positions:{sidebar:getComputedStyle(sidebar).position,topbar:getComputedStyle(header).position},
      viewport:innerWidth, outerRadius:getComputedStyle(shell).borderTopLeftRadius, pageText:document.body.innerText};
 });
 assert.equal(shellBounds.shell.x,0);assert.equal(shellBounds.shell.y,0);
 assert.equal(shellBounds.shell.width,shellBounds.viewport);
 assert.equal(shellBounds.outerRadius,"0px");
 assert.equal(shellBounds.positions.sidebar,"fixed");
 assert.equal(shellBounds.positions.topbar,"fixed");
 assert.ok(Math.abs(shellBounds.side.left-16)<=1);
 assert.ok(Math.abs(shellBounds.side.top-16)<=1);
 assert.ok(Math.abs(shellBounds.side.bottom-16)<=1);
 assert.equal(shellBounds.header.top,0);
 assert.ok(shellBounds.header.left>=250);
 assert.doesNotMatch(shellBounds.pageText,/демо|прототип|Модульный обзор|Карточка агента|AG-02\d\d/i);
 await page.evaluate(()=>window.scrollTo(0,300));
 assert.ok(Math.abs(await page.locator(".sidebar").evaluate(el=>el.getBoundingClientRect().top)-16)<=1);
 assert.equal(await page.locator(".topbar").evaluate(el=>el.getBoundingClientRect().top),0);
 await page.evaluate(()=>window.scrollTo(0,0));
 await page.screenshot({path:resolve(artifactDir,"manager-desktop.png"),fullPage:true});
 await page.locator("#detailToggleStatus").click();
 assert.match(await page.locator(".detail-status").textContent(),/Остановлен/);
 assert.match(await page.locator("#agentSidebarStatus").textContent(),/Остановлен/);
 assert.match(await page.locator("#detailToggleStatus").textContent(),/Запустить/);
 await page.locator('[data-agent-section="settings"]').click();
 await page.waitForSelector("#agentSettingsView:not([hidden])");
 assert.equal(await page.locator("#placeholderView").isVisible(),false);
 assert.equal((await page.locator("#agentSettingsHeading").textContent()).trim(),"Настройки");
 assert.equal((await page.locator("#breadcrumbCurrent").textContent()).trim(),"Входящие заявки / Настройки");
 assert.equal(await page.locator(".ls-type").count(),3);
 assert.equal(await page.locator(".ls-field").count(),5);
 assert.equal(await page.locator(".ls-preview-field").count(),5);
 assert.match(await page.locator(".ls-preview-assessment").innerText(),/Требуются сведения/);
 assert.match(await page.locator(".ls-preview-missing").innerText(),/Размеры помещения/);
 assert.match(await page.locator(".ls-builder-heading h2").textContent(),/Расчёт кухни/);
 await page.screenshot({path:resolve(artifactDir,"settings-lead-desktop.png"),fullPage:true});
 await page.locator('[data-ls-type="measure"]').click();
 assert.match(await page.locator(".ls-builder-heading h2").textContent(),/Замер/);
 assert.equal(await page.locator(".ls-field").count(),4);
 await page.locator('[data-ls-type="kitchen"]').click();
 await page.locator('[data-ls-action="add-field"]').click();
 assert.equal(await page.locator(".ls-field").count(),6);
 assert.equal(await page.locator(".ls-field-editor").count(),1);
 await page.locator('[data-ls-fieldprop="title"]').fill("Материал фасада");
 await page.locator('[data-ls-fieldprop="title"]').press("Tab");
 assert.match(await page.locator(".ls-field-list").innerText(),/Материал фасада/);
 assert.equal(await page.locator(".ls-preview-field").count(),6,"Preview must show all configured fields");
 assert.match(await page.locator(".ls-preview-progress").innerText(),/6 из 6/);
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem("aimock:lead-settings-builder:v1")));
 assert.ok(saved.types[0].fields.some(f=>f.title==="Материал фасада"),"Fields autosave to local browser storage");
 await page.locator('.ls-field-main[data-ls-field="comment"]').click();
 await page.locator('[data-ls-fieldprop="condition"]').selectOption("match");
 await page.locator('[data-ls-fieldprop="conditionField"]').selectOption("furniture");
 await page.locator('[data-ls-fieldprop="conditionValue"]').selectOption("Кухня");
 assert.equal(await page.locator('.ls-preview-field:has([data-ls-preview="comment"])').count(),0);
 assert.match(await page.locator(".ls-preview-hidden").innerText(),/1 поле скрыто/);
 await page.locator('[data-ls-preview="furniture"]').selectOption("Кухня");
 assert.equal(await page.locator('.ls-preview-field:has([data-ls-preview="comment"])').count(),1);
 assert.match(await page.locator(".ls-preview-condition").innerText(),/По условию: Тип мебели = Кухня/);
 await page.locator('[data-ls-preview="furniture"]').selectOption("Шкаф");
 assert.doesNotMatch(await page.locator(".ls-preview").innerText(),/Комментарий/);
 await page.locator('[data-ls-preview="size"]').fill("200 × 300");
 await page.locator('[data-ls-preview="phone"]').fill("abc");
 await page.locator("#ls-preview-form button[type=submit]").click();
 assert.match(await page.locator(".ls-preview-feedback").textContent(),/Проверьте формат полей: Контакт для связи/);
 await page.locator('[data-ls-preview="phone"]').fill("+7 (900) 123-45-67");
 await page.locator("#ls-preview-form button[type=submit]").click();
 assert.match(await page.locator(".ls-preview-feedback").textContent(),/формат значений корректен/);
 assert.match(await page.locator(".ls-preview-assessment").textContent(),/Поля заполнены/);
 await page.locator('[data-ls-type="consult"]').click();
 assert.match(await page.locator(".ls-preview-assessment").textContent(),/Неполная заявка допустима/);
 assert.match(await page.locator(".ls-preview-assessment").textContent(),/ответственному на рассмотрение/);
 await page.locator("#ls-preview-form button[type=submit]").click();
 assert.match(await page.locator(".ls-preview-feedback").textContent(),/Неполная заявка допускается/);
 await page.locator('[data-ls-config="criteria"]').selectOption("required");
 assert.match(await page.locator(".ls-preview-assessment").textContent(),/Требуются сведения/);
 await page.locator("#ls-preview-form button[type=submit]").click();
 assert.match(await page.locator(".ls-preview-feedback").textContent(),/Заполните обязательные поля: Тема вопроса/);
 await page.locator('[data-ls-config="incompleteAction"]').selectOption("wait");
 assert.match(await page.locator(".ls-preview-assessment").textContent(),/ожидает уточнений от клиента/);
 await page.locator('.ls-tab[data-ls-tab="result"]').click();
 assert.match(await page.locator(".ls-result-rules").innerText(),/Заявка ожидает дополнительных сведений/);
 await page.locator('[data-ls-tab="types"]').click();
 await page.locator('[data-ls-type="kitchen"]').click();


 await page.locator('[data-ls-tab="work"]').click();
 assert.match(await page.locator("#agentSettingsView").innerText(),/Рабочие данные/);
 await page.locator('.ls-tab[data-ls-tab="result"]').click();
 assert.match(await page.locator("#agentSettingsView").innerText(),/Результат заявки/);
 await page.locator('[data-ls-tab="model"]').click();
 assert.match(await page.locator("#agentSettingsView").innerText(),/AI-модель/);
 await page.locator('.ls-tab[data-ls-tab="ready"]').click();
 assert.match(await page.locator("#agentSettingsView").innerText(),/Перед запуском/);
 await page.locator('[data-ls-tab="types"]').click();
 await page.screenshot({path:resolve(artifactDir,"settings-lead-after-edit.png"),fullPage:true});
 // Return to the approved overview; the builder must not replace its layout.
 await page.goto(base+"#/overview");
 await page.waitForSelector("#overviewView:not([hidden])");
 const overviewShell=await page.evaluate(()=>({x:document.querySelector(".app-shell").getBoundingClientRect().x,
    radius:getComputedStyle(document.querySelector(".app-shell")).borderTopLeftRadius,
    labels:document.body.innerText}));
 assert.equal(overviewShell.x,0);
 assert.equal(overviewShell.radius,"0px");
 assert.doesNotMatch(overviewShell.labels,/демо|прототип/i);
 await page.screenshot({path:resolve(artifactDir,"overview-fullscreen.png"),fullPage:true});
 assert.match(await page.locator(".agent-card").nth(1).locator(".state").textContent(),/Остановлен/); assert.equal((await page.locator(".agent-card").nth(1).locator(".agent-name").textContent()).trim(),"Входящие заявки");
 assert.equal(await page.locator(".agent-card").last().locator(".agent-card-description").isVisible(),false);
 await page.goto(base+"#/agent/recruiter/overview");
 await page.waitForFunction(()=>document.querySelector("#agentDetailHeading")?.textContent?.trim()==="Подбор в команду");
 assert.match(await page.locator(".detail-description").textContent(),/^HR-рекрутер — специалист/);
 assert.equal((await page.locator("#agentDetailHeading").textContent()).trim(),"Подбор в команду");
 assert.match(await page.locator(".detail-responsibilities").textContent(),/Готовит сводку/);

 assert.match(await page.locator(".detail-status").textContent(),/Остановлен/);
 await page.goto(base+"#/agent/consultant/overview");
 await page.waitForFunction(()=>document.querySelector("#agentDetailHeading")?.textContent?.trim()==="Помощник магазина");
 assert.match(await page.locator(".detail-description").textContent(),/^Консультант — специалист/);
 assert.match(await page.locator(".detail-responsibilities").textContent(),/Подготавливает итог/);

 await page.goto(base+"#/agent/support/overview");
 await page.waitForFunction(()=>document.querySelector("#agentDetailHeading")?.textContent?.trim()==="Служба помощи");
 assert.match(await page.locator(".detail-description").textContent(),/^Специалист поддержки — представитель/);
 assert.match(await page.locator(".detail-responsibilities").textContent(),/Помогает решить вопрос/);
 assert.equal(await page.locator(".detail-user-description").count(),0,"Optional description must not leave an empty paragraph");
 assert.equal((await page.locator("#breadcrumbCurrent").textContent()).trim(),"Служба помощи");
 for(const size of [{width:1024,height:768},{width:768,height:900},{width:390,height:844}]){
   await page.setViewportSize(size);
   await page.waitForTimeout(100);
   const bounds=await page.evaluate(()=>({page:document.documentElement.scrollWidth,viewport:innerWidth}));
   assert.ok(bounds.page<=bounds.viewport+2,"Horizontal page overflow at "+size.width+"px: "+JSON.stringify(bounds));
   assert.equal(await page.locator(".detail-capability-icon").count(),3);
   assert.equal(await page.locator(".detail-handoff").count(),0);
   const rowsAtWidth=await page.locator(".detail-responsibility").evaluateAll(rows=>rows.map(el=>({top:el.getBoundingClientRect().top,left:el.getBoundingClientRect().left})));
   assert.ok(rowsAtWidth[0].top<rowsAtWidth[1].top && rowsAtWidth[1].top<rowsAtWidth[2].top,
     "Responsibilities stay vertically stacked at "+size.width+"px");
   if(size.width===390){
     const pos=await page.evaluate(()=>({topbar:getComputedStyle(document.querySelector(".topbar")).position,headerLeft:document.querySelector(".topbar").getBoundingClientRect().left, sidebarVisible:getComputedStyle(document.querySelector(".sidebar")).display}));
     assert.equal(pos.topbar,"fixed");assert.equal(pos.headerLeft,0);assert.equal(pos.sidebarVisible,"none");
     await page.locator("#mobileToggle").click();
     assert.equal(await page.locator(".sidebar").isVisible(),true);
     const mobileSidebar=await page.locator(".sidebar").boundingBox();
     assert.ok(mobileSidebar.x>=10 && mobileSidebar.y>=10);
     await page.screenshot({path:resolve(artifactDir,"support-mobile-menu.png"),fullPage:true});
     await page.locator("#mobileScrim").click({position:{x:380,y:100}});
     await page.screenshot({path:resolve(artifactDir,"support-mobile.png"),fullPage:true});
   }
 }
 await page.setViewportSize({width:1440,height:900});
 await page.goto(base+"#/agent/leads/overview");
 await page.waitForSelector("#detailToggleStatus");
 await page.locator("[data-detail-share]").click();
 assert.match(await page.locator("#detailToast").textContent(),/Общий доступ недоступен/);
 await page.locator("[data-detail-more]").click();
 assert.equal(await page.locator("[data-detail-menu]").isVisible(),true);
 await page.locator("[data-detail-unavailable]").first().click();
 assert.match(await page.locator("#detailToast").textContent(),/действие недоступно/);
 await page.locator(".agent-back").click();
 await page.waitForSelector("#placeholderView:not([hidden])");
 assert.equal(await page.locator("#placeholderView").isVisible(),true);
 assert.equal(await page.locator(".global-nav").isVisible(),true);
 assert.equal(await page.locator(".agent-nav").isVisible(),false);
 const emptyStateRoutes=[
   "agents","library","messages","knowledge","integrations","contacts",
   "automation","finance","workspace","profile","settings","notifications",
   "attention","create"
 ];
 const banned=/в разработке|демо|демонстрац|прототип|в следующем этапе|заглушка/i;
 for(const key of emptyStateRoutes){
   await page.goto(base+"#/"+key);
   await page.waitForSelector("#placeholderView:not([hidden])");
   assert.equal((await page.locator("#placeholderName").textContent()).trim(),
     (await page.locator("#breadcrumbCurrent").textContent()).trim(),
     "Empty-state heading should be the section title: "+key);
   assert.match(await page.locator("#placeholderDescription").textContent(),/Нет данных для отображения/);
   assert.equal(await page.locator("#placeholderReturn").getAttribute("href"),"#/overview");
   assert.doesNotMatch(await page.locator("#placeholderView").innerText(),banned,"Forbidden label in "+key);
 }
 for(const section of ["messages","integrations","knowledge","testing","automation","analytics","logs"]){
   await page.goto(base+"#/agent/leads/"+section);
   await page.waitForSelector("#placeholderView:not([hidden])");
   assert.equal((await page.locator("#placeholderName").textContent()).trim(),
      (await page.locator("#breadcrumbCurrent").textContent()).trim().split(" / ").at(-1));
   assert.equal(await page.locator("#placeholderReturn").getAttribute("href"),"#/agent/leads/overview");
   assert.doesNotMatch(await page.locator("#placeholderView").innerText(),banned,"Forbidden label in agent "+section);
 }
 await page.goto(base+"#/agent/consultant/settings");
 await page.waitForSelector("#placeholderView:not([hidden])");
 assert.equal(await page.locator("#agentSettingsView").isVisible(),false);
 await page.goto(base+"#/agent/leads/settings");
 await page.waitForSelector("#agentSettingsView:not([hidden])");
 for(const size of [{width:1024,height:768},{width:768,height:900},{width:390,height:844}]){
   await page.setViewportSize(size);
   const widths=await page.evaluate(()=>({width:document.documentElement.scrollWidth,viewport:innerWidth}));
   assert.ok(widths.width<=widths.viewport+2,"Lead settings horizontal overflow at "+size.width+": "+JSON.stringify(widths));
   const cardBounds=await page.evaluate(()=>{
     const main=document.querySelector(".ls-builder").getBoundingClientRect();
     const preview=document.querySelector(".ls-preview").getBoundingClientRect();
     return {main:main.width,preview:preview.width};
   });
   if(size.width<=880)assert.ok(cardBounds.preview>=cardBounds.main-3,
      "Preview should fill same available width as the editor on narrow screens: "+JSON.stringify(cardBounds));
   if(size.width===390)await page.screenshot({path:resolve(artifactDir,"settings-lead-mobile.png"),fullPage:true});
 }
 await page.setViewportSize({width:1440,height:900});
 await page.goto(base+"#/agent/leads/overview");
 await page.waitForSelector("#detailToggleStatus");
 await page.locator("[data-detail-more]").click();
 assert.doesNotMatch(await page.locator("[data-detail-menu]").innerText(),banned);
 assert.deepEqual(exceptions,[]);
 console.log("Agent detail browser smoke passed: routing, 4 professions, status, layout, placeholders, menus.");
} catch(error) {
 failed=true;
 console.error(error);
} finally {
 await browser.close();
}
if(failed)process.exitCode=1;
