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
 assert.equal(await page.locator("#appHelpBanner").isVisible(),true);
 assert.equal(await page.locator("#appHelpBanner a").getAttribute("href"),"#/help");
 assert.equal(await page.locator('[data-global-route="help"]').count(),1);
 await page.screenshot({path:resolve(artifactDir,"help-banner-desktop.png"),fullPage:true});
 await page.setViewportSize({width:390,height:844});
 const helpBannerWidth=await page.evaluate(()=>({page:document.documentElement.scrollWidth,viewport:innerWidth}));
 assert.ok(helpBannerWidth.page<=helpBannerWidth.viewport+2,"Help banner overflows mobile viewport");
 await page.screenshot({path:resolve(artifactDir,"help-banner-mobile.png"),fullPage:true});
 await page.setViewportSize({width:1440,height:900});
 await page.locator("#appHelpBanner a").click();
 await page.waitForSelector("#helpView:not([hidden])");
 assert.equal(await page.locator("#placeholderView").isVisible(),false);
 assert.equal((await page.locator("#helpHeading").textContent()).trim(),"Справка AIMock");
 assert.equal(await page.locator("#appHelpBanner").isVisible(),false);
 assert.equal(await page.locator(".app-help-article").count(),3);
 assert.equal(await page.locator("#agentKnowledgeView").isVisible(),false,"Help Center and agent Knowledge are different pages");
 await page.screenshot({path:resolve(artifactDir,"help-center-desktop.png"),fullPage:true});
 await page.setViewportSize({width:390,height:844});
 const helpPageWidth=await page.evaluate(()=>({page:document.documentElement.scrollWidth,viewport:innerWidth}));
 assert.ok(helpPageWidth.page<=helpPageWidth.viewport+2,"Help articles overflow mobile viewport");
 await page.screenshot({path:resolve(artifactDir,"help-center-mobile.png"),fullPage:true});
 await page.setViewportSize({width:1440,height:900});
 await page.goto(base+"#/agent/leads/overview");
 await page.waitForSelector("#detailToggleStatus");
 assert.equal(await page.locator("#appHelpBanner").isVisible(),true);
 await page.locator("#appHelpDismiss").click();
 assert.equal(await page.locator("#appHelpBanner").isVisible(),false);
 assert.equal(await page.evaluate(()=>localStorage.getItem("aimock:help-banner:dismissed:v1")),"1");
 await page.reload();
 await page.waitForSelector("#detailToggleStatus");
 assert.equal(await page.locator("#appHelpBanner").isVisible(),false);

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
 assert.equal(await page.locator(".ls-main-column").count(),1);
 assert.equal(await page.locator(".ls-result").count(),1);
 assert.equal(await page.locator(".ls-preview").count(),0);
 assert.equal(await page.locator("#ls-preview-form").count(),0);
 assert.doesNotMatch(await page.locator("#agentSettingsView").innerText(),/Предпросмотр заявки|Проверить заполнение/);
 assert.match(await page.locator(".ls-builder-heading h2").textContent(),/Расчёт кухни/);
 assert.equal(await page.locator(".ls-types-view").count(),1);
 assert.equal(await page.locator(".ls-completion-panel").count(),1);
 assert.equal(await page.locator(".ls-types-guided .ls-section-info").count(),1);
 assert.equal(await page.locator(".ls-types-guided .ls-section-point").count(),4);
 assert.equal(await page.locator(".ls-types-guided .ls-section-more a").getAttribute("href"),"#/help");
 const typesCardLayout=await page.evaluate(()=>{
   const main=document.querySelector(".ls-types-guided .ls-workbench").getBoundingClientRect();
   const side=document.querySelector(".ls-types-guided .ls-section-aside").getBoundingClientRect();
   return {mainRight:main.right,sideLeft:side.left};
 });
 assert.ok(typesCardLayout.sideLeft>=typesCardLayout.mainRight-2,"Type details side information should appear to the right on desktop");

 assert.equal(await page.locator(".ls-types-help").count(),0);
 assert.equal(await page.locator(".ls-editor-section-label").count(),0);
 assert.equal(await page.locator(".ls-types-example").count(),0);
 await page.evaluate(()=>window.scrollTo(0,0));
 await page.screenshot({path:resolve(artifactDir,"settings-types-desktop.png"),fullPage:true});
 await page.locator('[data-ls-action="add-type"]').click();
 assert.equal(await page.locator(".ls-type").count(),4);
 assert.equal(await page.locator("#lsTypeName").count(),1);
 assert.match(await page.locator(".ls-fields-empty").innerText(),/Поля ещё не добавлены/);
 await page.locator("#lsTypeName").fill("Новая услуга");
 await page.locator("#lsTypeName").press("Tab");
 await page.locator('[data-ls-action="done-type-name"]').click();
 assert.match(await page.locator(".ls-builder-heading h2").innerText(),/Новая услуга/);
 await page.locator('[data-ls-action="rename-type"]').click();
 assert.equal(await page.locator('[data-ls-action="delete-type"]').count(),1);
 page.once("dialog",dialog=>dialog.accept());
 await page.locator('[data-ls-action="delete-type"]').click();
 assert.equal(await page.locator(".ls-type").count(),3);
 assert.match(await page.locator(".ls-builder-heading h2").innerText(),/Расчёт кухни/);
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
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem("aimock:lead-settings-builder:v1")));
 assert.ok(saved.types[0].fields.some(f=>f.title==="Материал фасада"),"Field changes still autosave");
 await page.locator('.ls-field-main[data-ls-field="comment"]').click();
 await page.locator('[data-ls-fieldprop="condition"]').selectOption("match");
 await page.locator('[data-ls-fieldprop="conditionField"]').selectOption("furniture");
 await page.locator('[data-ls-fieldprop="conditionValue"]').selectOption("Кухня");
 const configured=await page.evaluate(()=>JSON.parse(localStorage.getItem("aimock:lead-settings-builder:v1")));
 const dependent=configured.types.find(t=>t.id==="kitchen").fields.find(f=>f.id==="comment");
 assert.equal(dependent.condition,"match");
 assert.equal(dependent.conditionField,"furniture");
 assert.equal(dependent.conditionValue,"Кухня");
 await page.locator('[data-ls-config="criteria"]').selectOption("incomplete");
 await page.locator('[data-ls-config="incompleteAction"]').selectOption("handoff");
 const savedRules=await page.evaluate(()=>JSON.parse(localStorage.getItem("aimock:lead-settings-builder:v1")));
 assert.equal(savedRules.types.find(t=>t.id==="kitchen").criteria,"incomplete");
 assert.equal(savedRules.types.find(t=>t.id==="kitchen").incompleteAction,"handoff");
 await page.locator('.ls-tab[data-ls-tab="result"]').click();
 assert.match(await page.locator(".ls-result-rules").innerText(),/Неполная заявка направляется ответственному/);
 assert.equal(await page.locator(".ls-result-guided .ls-section-info").count(),1);
 assert.equal(await page.locator(".ls-result-view .ls-setting-card").count(),3);
 assert.equal(await page.locator(".ls-result-fields-grid .ls-result-field").count(),6);
 assert.equal(await page.locator('[data-ls-result="crmAction"]').count(),1);
 await page.evaluate(()=>window.scrollTo(0,0));
 await page.screenshot({path:resolve(artifactDir,"settings-result-desktop.png"),fullPage:true});
 await page.locator('[data-ls-result="crmAction"]').selectOption("create");
 assert.equal((await page.evaluate(()=>JSON.parse(localStorage.getItem("aimock:lead-settings-builder:v1")))).result.crmAction,"create");
 await page.locator('[data-ls-result="crmAction"]').selectOption("none");

 await page.locator('[data-ls-tab="work"]').click();
 assert.match(await page.locator("#agentSettingsView").innerText(),/Рабочие данные/);
 assert.equal(await page.locator(".ls-work-form").count(),1);
 assert.equal(await page.locator(".ls-work-guide").count(),0);
 assert.equal(await page.locator(".ls-work-section-info").count(),1);
 assert.match(await page.locator("#lsWorkAboutHeading").textContent(),/Кратко о разделе/);
 assert.equal(await page.locator(".ls-work-about-item").count(),3);
 assert.equal(await page.locator(".ls-work-section-more a").getAttribute("href"),"#/help");
 const workLayout=await page.evaluate(()=>{
   const form=document.querySelector(".ls-work-form").getBoundingClientRect();
   const about=document.querySelector(".ls-work-section-info").getBoundingClientRect();
   return {formX:form.x,formW:form.width,aboutX:about.x,aboutW:about.width};
 });
 assert.ok(workLayout.aboutX>workLayout.formX+workLayout.formW-2,"Section information must be in the right column on desktop: "+JSON.stringify(workLayout));
 assert.equal(await page.locator("#lsWorkProject").count(),1);
 assert.equal(await page.locator("#lsWorkRequirements").count(),1);
 assert.equal(await page.locator(".ls-work-type").count(),3);
 assert.equal(await page.locator(".ls-preview").count(),0);
 await page.evaluate(()=>window.scrollTo(0,0));
 await page.screenshot({path:resolve(artifactDir,"settings-work-data-desktop.png"),fullPage:true});
 const businessDescription=await page.locator("#lsWorkProject").inputValue();
 await page.locator("#lsWorkProject").fill("Изготавливаем мебель на заказ и принимаем заявки на замер.");
 assert.match(await page.locator('[data-ls-counter="project"]').textContent(),/символов/);
 await page.locator("#lsWorkRequirements").fill("Общаться с клиентами на «вы».");
 const workSaved=await page.evaluate(()=>JSON.parse(localStorage.getItem("aimock:lead-settings-builder:v1")));
 assert.match(workSaved.project,/Изготавливаем мебель на заказ/);
 assert.equal(workSaved.requirements,"Общаться с клиентами на «вы».");
 await page.locator(".ls-work-example summary").click();
 assert.equal(await page.locator(".ls-work-example").getAttribute("open"),"");
 await page.locator(".ls-work-related [data-ls-tab='types']").click();
 assert.equal(await page.locator(".ls-type").count(),3);
 await page.locator(".ls-tab[data-ls-tab='work']").click();
 assert.equal(await page.locator("#lsWorkRequirements").inputValue(),"Общаться с клиентами на «вы».");
 await page.locator("#lsWorkProject").fill(businessDescription);
 await page.locator('.ls-tab[data-ls-tab="result"]').click();
 assert.match(await page.locator("#agentSettingsView").innerText(),/Результат заявки/);
 await page.locator('.ls-tab[data-ls-tab="model"]').click();
 assert.match(await page.locator("#agentSettingsView").innerText(),/AI-модель/);
 assert.equal(await page.locator(".ls-model-choice").count(),2);
 assert.equal(await page.locator(".ls-model-guided .ls-section-info").count(),1);
 assert.equal(await page.locator(".ls-model-status-card").count(),1);

 assert.equal(await page.locator(".ls-model-choice.is-selected").count(),1);
 assert.equal(await page.locator(".ls-model-tag").count(),0,"Model page must not contain tags");
 assert.equal(await page.locator("#lsAccessScope").count(),0,"Model page must not contain access controls");
 await page.evaluate(()=>window.scrollTo(0,0));
 await page.screenshot({path:resolve(artifactDir,"settings-model-desktop.png"),fullPage:true});
 await page.locator('[data-ls-model-mode="explicit"]').click();
 assert.equal(await page.locator(".ls-model-manual").count(),1);
 assert.match(await page.locator(".ls-model-manual").innerText(),/Модель не выбрана|Не выбрана/);
 const manualState=await page.evaluate(()=>JSON.parse(localStorage.getItem("aimock:lead-settings-builder:v1")));
 assert.equal(manualState.model.mode,"explicit");
 await page.locator('.ls-tab[data-ls-tab="ready"]').click();
 assert.match(await page.locator(".ls-checkrow").filter({hasText:"AI-модель"}).innerText(),/Автоматически или выбрана конкретная модель/);
 await page.locator('.ls-tab[data-ls-tab="model"]').click();
 await page.locator('[data-ls-model-mode="automatic"]').click();
 assert.equal(await page.locator(".ls-model-manual").count(),0);
 await page.locator('.ls-tab[data-ls-tab="access"]').click();
 assert.match(await page.locator(".ls-model-intro h2").textContent(),/Доступы и теги/);
 assert.equal(await page.locator(".ls-model-choice").count(),0,"Access page must not contain model controls");
 assert.equal(await page.locator(".ls-model-tag").count(),2);
 assert.equal(await page.locator("#lsAccessScope").count(),1);
 assert.equal(await page.locator(".ls-access-guided .ls-section-info").count(),1);

 await page.evaluate(()=>window.scrollTo(0,0));
 await page.screenshot({path:resolve(artifactDir,"settings-access-tags-desktop.png"),fullPage:true});
 await page.locator("#lsTagInput").fill("монтаж");
 await page.locator('[data-ls-action="add-tag"]').click();
 assert.equal(await page.locator(".ls-model-tag").count(),3);
 assert.match(await page.locator(".ls-model-tag-list").innerText(),/монтаж/);
 let tagConfig=await page.evaluate(()=>JSON.parse(localStorage.getItem("aimock:lead-settings-builder:v1")));
 assert.match(tagConfig.model.tags,/монтаж/);
 await page.locator("#lsTagInput").fill("МОНТАЖ");
 await page.locator("#lsTagInput").press("Enter");
 assert.equal(await page.locator(".ls-model-tag").count(),3,"Duplicate tags must not be created");
 assert.match(await page.locator("#lsTagHint").innerText(),/уже назначен/);
 await page.locator('[data-ls-remove-tag="2"]').click();
 assert.equal(await page.locator(".ls-model-tag").count(),2);
 await page.locator("#lsAccessScope").selectOption("owner");
 tagConfig=await page.evaluate(()=>JSON.parse(localStorage.getItem("aimock:lead-settings-builder:v1")));
 assert.equal(tagConfig.model.access,"owner");
 await page.locator("#lsAccessScope").selectOption("team");
 await page.locator('.ls-tab[data-ls-tab="model"]').click();
 assert.equal(await page.locator(".ls-model-choice").count(),2,"Model controls persist after switching tabs");
 await page.locator('.ls-tab[data-ls-tab="access"]').click();
 assert.equal(await page.locator(".ls-model-tag").count(),2,"Tags persist after switching tabs");
 await page.screenshot({path:resolve(artifactDir,"settings-access-tags-after-edit.png"),fullPage:true});
 await page.locator('.ls-tab[data-ls-tab="ready"]').click();
 assert.match(await page.locator("#agentSettingsView").innerText(),/Перед запуском/);
 assert.equal(await page.locator(".ls-ready-guided .ls-section-info").count(),1);
 assert.equal(await page.locator(".ls-ready-notice").count(),1);
 await page.evaluate(()=>window.scrollTo(0,0));
 await page.screenshot({path:resolve(artifactDir,"settings-ready-desktop.png"),fullPage:true});

 await page.locator('.ls-tab[data-ls-tab="types"]').click();
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
 await page.goto(base+"#/agent/leads/settings");
 await page.waitForSelector("#agentSettingsView:not([hidden])");
 await page.locator(".ls-tab[data-ls-tab='work']").click();
 for(const width of [1024,768,390]){
   await page.setViewportSize({width,height:900});
   const boxes=await page.evaluate(()=>{
     const main=document.querySelector(".ls-work-form").getBoundingClientRect();
     const aside=document.querySelector(".ls-work-section-info").getBoundingClientRect();
     return {main:{x:main.x,y:main.y,width:main.width,height:main.height},aside:{x:aside.x,y:aside.y,width:aside.width},body:document.documentElement.scrollWidth,viewport:innerWidth};
   });
   assert.ok(boxes.body<=boxes.viewport+2,"Work data horizontal overflow at "+width+": "+JSON.stringify(boxes));
   assert.ok(boxes.main.width<=boxes.viewport-boxes.main.x+2,"Work data form fits viewport");
   assert.ok(boxes.aside.y>=boxes.main.y+boxes.main.height-2,"Section information must stack below the form on narrow viewports: "+JSON.stringify(boxes));
   if(width===390)await page.screenshot({path:resolve(artifactDir,"settings-work-data-mobile.png"),fullPage:true});
 }
 await page.setViewportSize({width:1440,height:900});
 for(const section of ["model","access"]){
   await page.locator('.ls-tab[data-ls-tab="'+section+'"]').click();
   for(const width of [1024,768,390]){
     await page.setViewportSize({width,height:900});
     const bounds=await page.evaluate(()=>{
       const content=document.querySelector(".ls-model-main").getBoundingClientRect();
       return {left:content.left,width:content.width,body:document.documentElement.scrollWidth,viewport:innerWidth};
     });
     assert.ok(bounds.body<=bounds.viewport+2,section+" horizontal overflow at "+width+": "+JSON.stringify(bounds));
     assert.ok(bounds.width<=bounds.viewport-bounds.left+2,section+" controls fit inside the viewport");
     if(width===390)await page.screenshot({path:resolve(artifactDir,"settings-"+(section==="model"?"model":"access-tags")+"-mobile.png"),fullPage:true});
   }
   await page.setViewportSize({width:1440,height:900});
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
 for(const section of ["messages","testing","automation","analytics","logs"]){
   await page.goto(base+"#/agent/leads/"+section);
   await page.waitForSelector("#placeholderView:not([hidden])");
   assert.equal((await page.locator("#placeholderName").textContent()).trim(),
      (await page.locator("#breadcrumbCurrent").textContent()).trim().split(" / ").at(-1));
   assert.equal(await page.locator("#placeholderReturn").getAttribute("href"),"#/agent/leads/overview");
   assert.doesNotMatch(await page.locator("#placeholderView").innerText(),banned,"Forbidden label in agent "+section);
 }
 // Agent integrations are separate from the generic Hub and from Settings.
 await page.goto(base+"#/agent/leads/integrations");
 await page.waitForSelector("#agentIntegrationsView:not([hidden])");
 assert.equal(await page.locator("#placeholderView").isVisible(),false);
 assert.equal((await page.locator("#agentIntegrationsHeading").textContent()).trim(),"Интеграции");
 assert.equal((await page.locator("#breadcrumbCurrent").textContent()).trim(),"Входящие заявки / Интеграции");
 assert.equal(await page.locator(".ai-integrations-panel").count(),2);
 assert.equal(await page.locator(".ai-aside-guide").count(),0);
 assert.equal(await page.locator(".ai-connection-card").count(),2);
 assert.equal(await page.locator(".ai-grant input").count(),3);
 assert.equal(await page.locator(".ai-assigned-label").count(),2);
 assert.equal(await page.locator(".ai-readonly-note").count(),0);
 await page.evaluate(()=>window.scrollTo(0,0));
 await page.screenshot({path:resolve(artifactDir,"agent-integrations-desktop.png"),fullPage:true});
 await page.locator('[data-ai-open="channel"]').click();
 assert.equal(await page.locator('.ai-picker-dialog[role="dialog"]').count(),1);
 assert.equal(await page.locator('[data-ai-catalog="tg-help"] [data-ai-assign]').count(),0);
 assert.match(await page.locator('[data-ai-catalog="tg-help"]').innerText(),/Занято другим агентом/);
 assert.equal(await page.locator('[data-ai-catalog="tg-backup"] [data-ai-assign]').isEnabled(),true);
 await page.screenshot({path:resolve(artifactDir,"agent-integrations-picker.png"),fullPage:true});
 await page.locator('[data-ai-assign="tg-backup"]').click();
 assert.equal(await page.locator('[data-ai-assigned="tg-backup"]').count(),1);
 assert.equal(await page.locator(".ai-connection-card").count(),3);
 let savedIntegration=await page.evaluate(()=>JSON.parse(localStorage.getItem("aimock:lead-integration-assignments:v1")));
 assert.ok(savedIntegration.assigned.includes("tg-backup"),"New bot assignment autosaves locally");
 page.once("dialog",dialog=>dialog.accept());
 await page.locator('[data-ai-remove="tg-backup"]').click();
 assert.equal(await page.locator('[data-ai-assigned="tg-backup"]').count(),0);
 assert.equal(await page.locator(".ai-connection-card").count(),2);
 await page.locator('[data-ai-open="crm"]').click();
 assert.equal(await page.locator('[data-ai-catalog="bitrix-main"] [data-ai-assign]').isDisabled(),true);
 assert.match(await page.locator('[data-ai-catalog="bitrix-main"]').innerText(),/Нужна авторизация/);
 await page.locator('[data-ai-assign="amo-service"]').click();
 assert.equal(await page.locator('[data-ai-assigned="amo-service"]').count(),1);
 assert.equal(await page.locator(".ai-connection-card").count(),3);
 page.once("dialog",dialog=>dialog.accept());
 await page.locator('[data-ai-remove="amo-service"]').click();
 assert.equal(await page.locator(".ai-connection-card").count(),2);
 const grant=page.locator('[data-ai-connection="amo-sales"][data-ai-grant="leads_update"]');
 assert.equal(await grant.isChecked(),false);
 await grant.check();
 savedIntegration=await page.evaluate(()=>JSON.parse(localStorage.getItem("aimock:lead-integration-assignments:v1")));
 assert.ok(savedIntegration.permissions["amo-sales"].includes("leads_update"));
 await grant.uncheck();
 await page.goto(base+"#/agent/leads/overview");
 await page.waitForSelector("#detailToggleStatus");
 await page.locator("#detailToggleStatus").click();
 assert.match(await page.locator(".detail-status").innerText(),/Работает/);
 await page.goto(base+"#/agent/leads/integrations");
 await page.waitForSelector("#agentIntegrationsView:not([hidden])");
 assert.equal(await page.locator('[data-ai-open="channel"]').isDisabled(),true);
 assert.equal(await page.locator('[data-ai-open="crm"]').isDisabled(),true);
 assert.equal(await page.locator('[data-ai-connection="amo-sales"][data-ai-grant="leads_create"]').isDisabled(),true);
 assert.match(await page.locator(".ai-readonly-note").innerText(),/сначала остановите его/);
 await page.goto(base+"#/agent/leads/overview");
 await page.waitForSelector("#detailToggleStatus");
 await page.locator("#detailToggleStatus").click();
 assert.match(await page.locator(".detail-status").innerText(),/Остановлен/);
 await page.goto(base+"#/agent/leads/integrations");
 await page.waitForSelector("#agentIntegrationsView:not([hidden])");
 for(const size of [{width:1024,height:768},{width:768,height:900},{width:390,height:844}]){
   await page.setViewportSize(size);
   const widths=await page.evaluate(()=>({page:document.documentElement.scrollWidth,window:innerWidth}));
   assert.ok(widths.page<=widths.window+2,"Agent integrations overflow at "+size.width+": "+JSON.stringify(widths));
   if(size.width===390){
     await page.screenshot({path:resolve(artifactDir,"agent-integrations-mobile.png"),fullPage:true});
     await page.locator('[data-ai-open="channel"]').click();
     assert.equal(await page.locator('.ai-picker-dialog[role="dialog"]').count(),1);
     const pickerBounds=await page.locator(".ai-picker-dialog").evaluate(el=>{
       const r=el.getBoundingClientRect();
       return {left:r.left,right:r.right,width:innerWidth};
     });
     assert.ok(pickerBounds.left>=0&&pickerBounds.right<=pickerBounds.width+1,
       "Integration picker must fit mobile viewport: "+JSON.stringify(pickerBounds));
     await page.screenshot({path:resolve(artifactDir,"agent-integrations-picker-mobile.png"),fullPage:true});
     await page.locator(".ai-picker-close").click();
   }
 }
 await page.setViewportSize({width:1440,height:900});
 // Knowledge assignments are separate from the shared Knowledge library.
 await page.goto(base+"#/agent/leads/knowledge");
 await page.waitForSelector("#agentKnowledgeView:not([hidden])");
 assert.equal(await page.locator("#placeholderView").isVisible(),false);
 assert.equal(await page.locator(".ak-main-panel").count(),1);
 assert.equal(await page.locator(".ak-overview-card").count(),0);
 assert.equal(await page.locator(".ak-source-row").count(),2);
 assert.equal(await page.locator("#agentKnowledgeHeading").textContent(),"Знания");
 assert.equal((await page.locator("#breadcrumbCurrent").textContent()).trim(),"Входящие заявки / Знания");
 assert.equal(await page.locator(".ak-source-state.is-current").count(),2);
 assert.equal(await page.locator("#agentIntegrationsView").isVisible(),false);
 assert.equal(await page.locator(".ak-readonly").count(),0);
 await page.evaluate(()=>window.scrollTo(0,0));
 await page.screenshot({path:resolve(artifactDir,"agent-knowledge-desktop.png"),fullPage:true});
 await page.locator('[data-ak-details="products"]').click();
 assert.match(await page.locator(".ak-details").innerText(),/Версия/);
 assert.match(await page.locator(".ak-details").innerText(),/Область доступа/);
 await page.locator('.ak-details-top [data-ak-close]').click();
 await page.locator("[data-ak-open]").click();
 assert.equal(await page.locator(".ak-picker").count(),1);
 assert.equal(await page.locator(".ak-picker-source").count(),5);
 assert.equal(await page.locator('[data-ak-catalog="pricing"] button[data-ak-assign]').isDisabled(),true);
 assert.equal(await page.locator('[data-ak-catalog="private"]').count(),0,"Restricted sources must not leak through the picker");
 await page.screenshot({path:resolve(artifactDir,"agent-knowledge-picker.png"),fullPage:true});
 await page.locator('[data-ak-filter="faq"]').click();
 assert.equal(await page.locator(".ak-picker-source").count(),2);
 await page.locator('[data-ak-filter="all"]').click();
 await page.locator("#akSearch").fill("доставка");
 assert.equal(await page.locator(".ak-picker-source").count(),1);
 await page.locator('[data-ak-assign="delivery"]').click();
 assert.equal(await page.locator('[data-ak-assigned="delivery"]').count(),1);
 assert.equal(await page.locator(".ak-source-row").count(),3);
 const assignedKnowledge=await page.evaluate(()=>JSON.parse(localStorage.getItem("aimock:lead-knowledge-assignments:v1")));
 assert.ok(assignedKnowledge.assigned.includes("delivery"),"Knowledge assignment autosaves locally");
 await page.locator('[data-ak-remove="delivery"]').click();
 assert.match(await page.locator(".ak-confirm").innerText(),/Отвязать материал/);
 await page.locator('.ak-confirm [data-ak-close]').click();
 assert.equal(await page.locator(".ak-source-row").count(),3,"Cancel must preserve source");
 await page.locator('[data-ak-remove="delivery"]').click();
 await page.locator('[data-ak-confirm-remove]').click();
 assert.equal(await page.locator(".ak-source-row").count(),2);
 await page.goto(base+"#/agent/leads/overview");
 await page.waitForSelector("#detailToggleStatus");
 await page.locator("#detailToggleStatus").click();
 assert.match(await page.locator(".detail-status").innerText(),/Работает/);
 await page.goto(base+"#/agent/leads/knowledge");
 await page.waitForSelector("#agentKnowledgeView:not([hidden])");
 assert.equal(await page.locator("[data-ak-open]").isDisabled(),true);
 assert.equal(await page.locator('[data-ak-remove="products"]').isDisabled(),true);
 assert.match(await page.locator(".ak-readonly").innerText(),/остановки на странице обзора/);
 await page.goto(base+"#/agent/leads/overview");
 await page.waitForSelector("#detailToggleStatus");
 await page.locator("#detailToggleStatus").click();
 assert.match(await page.locator(".detail-status").innerText(),/Остановлен/);
 await page.goto(base+"#/agent/leads/knowledge");
 await page.waitForSelector("#agentKnowledgeView:not([hidden])");
 for(const size of [{width:1024,height:768},{width:768,height:900},{width:390,height:844}]){
   await page.setViewportSize(size);
   const width=await page.evaluate(()=>({full:document.documentElement.scrollWidth,viewport:innerWidth}));
   assert.ok(width.full<=width.viewport+2,"Knowledge horizontal overflow at "+size.width+": "+JSON.stringify(width));
   if(size.width===390){
     await page.screenshot({path:resolve(artifactDir,"agent-knowledge-mobile.png"),fullPage:true});
     await page.locator("[data-ak-open]").click();
     const modal=await page.locator(".ak-picker").evaluate(el=>{
       const r=el.getBoundingClientRect();
       return {left:r.left,right:r.right,viewport:innerWidth};
     });
     assert.ok(modal.left>=0&&modal.right<=modal.viewport+1,"Knowledge modal overflows on mobile: "+JSON.stringify(modal));
     await page.screenshot({path:resolve(artifactDir,"agent-knowledge-picker-mobile.png"),fullPage:true});
     await page.locator(".ak-picker-header [data-ak-close]").click();
   }
 }
 await page.setViewportSize({width:1440,height:900});
 await page.goto(base+"#/agent/consultant/settings");
 await page.waitForSelector("#placeholderView:not([hidden])");
 assert.equal(await page.locator("#agentSettingsView").isVisible(),false);
 await page.goto(base+"#/agent/leads/settings");
 await page.waitForSelector("#agentSettingsView:not([hidden])");
 await page.locator('.ls-tab[data-ls-tab="types"]').click();
 for(const size of [{width:1024,height:768},{width:768,height:900},{width:390,height:844}]){
   await page.setViewportSize(size);
   const widths=await page.evaluate(()=>({width:document.documentElement.scrollWidth,viewport:innerWidth,
     offenders:[...document.querySelectorAll("#agentSettingsView *")].map(el=>({el,right:el.getBoundingClientRect().right,w:el.getBoundingClientRect().width}))
       .filter(v=>v.right>innerWidth+2).slice(0,15).map(v=>({tag:v.el.tagName,cls:String(v.el.className).slice(0,85),right:Math.round(v.right),w:Math.round(v.w)}))}));
   assert.ok(widths.width<=widths.viewport+2,"Lead settings horizontal overflow at "+size.width+": "+JSON.stringify(widths));
   const cardBounds=await page.evaluate(()=>{
     const editor=document.querySelector(".ls-builder").getBoundingClientRect();
     const summary=document.querySelector(".ls-result").getBoundingClientRect();
     return {editor:editor.width,summary:summary.width};
   });
   assert.ok(Math.abs(cardBounds.summary-cardBounds.editor)<=3,
      "Result summary should align with the editor: "+JSON.stringify(cardBounds));
   if(size.width===390){
     await page.screenshot({path:resolve(artifactDir,"settings-lead-mobile.png"),fullPage:true});
     assert.equal(await page.locator(".ls-type").count(),3);
   }
 }
 await page.setViewportSize({width:390,height:844});
 await page.locator('.ls-tab[data-ls-tab="types"]').click();
 for(const [section,sideClass] of [
    ["types",".ls-types-guided"],
    ["result",".ls-result-guided"],
    ["model",".ls-model-guided"],
    ["access",".ls-access-guided"],
    ["ready",".ls-ready-guided"]
 ]){
   await page.locator('.ls-tab[data-ls-tab="'+section+'"]').click();
   const geometry=await page.evaluate(className=>{
     const layout=document.querySelector(className);
     const body=layout.querySelector(".ls-guided-main").getBoundingClientRect();
     const aside=layout.querySelector(".ls-section-aside").getBoundingClientRect();
     return {width:document.documentElement.scrollWidth,viewport:innerWidth,bodyBottom:body.bottom,asideTop:aside.top};
   },sideClass);
   assert.ok(geometry.width<=geometry.viewport+2,section+" mobile overflow: "+JSON.stringify(geometry));
   assert.ok(geometry.asideTop>=geometry.bodyBottom-2,section+" section guidance should stack under form: "+JSON.stringify(geometry));
   await page.screenshot({path:resolve(artifactDir,"settings-"+section+"-optionb-mobile.png"),fullPage:true});
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
