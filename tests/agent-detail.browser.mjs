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
 assert.equal(await page.locator(".detail-heading-tags span").count(),3);
 assert.equal(await page.locator(".detail-identity .detail-bubble").count(),0);
 assert.equal(await page.locator(".detail-identity .detail-tags").count(),0);
 assert.equal(await page.locator(".detail-state-row").count(),3);
 assert.equal(await page.locator(".detail-responsibility").count(),3);
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
 await page.waitForSelector("#placeholderView:not([hidden])");
 assert.equal(await page.locator("#placeholderView").isVisible(),true);
 assert.match(await page.locator("#placeholderDescription").textContent(),/Агент остановлен/); assert.equal((await page.locator("#breadcrumbCurrent").textContent()).trim(),"Входящие заявки / Настройки");
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
 assert.equal((await page.locator("#agentDetailHeading").textContent()).trim(),"Подбор в команду");
 assert.match(await page.locator(".detail-responsibilities").textContent(),/Передаёт на рассмотрение/);
 assert.match(await page.locator(".detail-status").textContent(),/Остановлен/);
 await page.goto(base+"#/agent/consultant/overview");
 await page.waitForFunction(()=>document.querySelector("#agentDetailHeading")?.textContent?.trim()==="Помощник магазина");
 assert.match(await page.locator(".detail-responsibilities").textContent(),/Передаёт сложные случаи/);
 await page.goto(base+"#/agent/support/overview");
 await page.waitForFunction(()=>document.querySelector("#agentDetailHeading")?.textContent?.trim()==="Служба помощи");
 assert.match(await page.locator(".detail-responsibilities").textContent(),/Подключает оператора/); assert.equal(await page.locator(".detail-user-description").count(),0,"Optional description must not leave an empty paragraph");
 assert.equal((await page.locator("#breadcrumbCurrent").textContent()).trim(),"Служба помощи");
 for(const size of [{width:1024,height:768},{width:768,height:900},{width:390,height:844}]){
   await page.setViewportSize(size);
   await page.waitForTimeout(100);
   const bounds=await page.evaluate(()=>({page:document.documentElement.scrollWidth,viewport:innerWidth}));
   assert.ok(bounds.page<=bounds.viewport+2,"Horizontal page overflow at "+size.width+"px: "+JSON.stringify(bounds));
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
 assert.match(await page.locator("#detailToast").textContent(),/пока в разработке/);
 await page.locator("[data-detail-more]").click();
 assert.equal(await page.locator("[data-detail-menu]").isVisible(),true);
 await page.locator("[data-detail-unavailable]").first().click();
 assert.match(await page.locator("#detailToast").textContent(),/в разработке/);
 await page.locator(".agent-back").click();
 await page.waitForSelector("#placeholderView:not([hidden])");
 assert.equal(await page.locator("#placeholderView").isVisible(),true);
 assert.equal(await page.locator(".global-nav").isVisible(),true);
 assert.equal(await page.locator(".agent-nav").isVisible(),false);
 assert.deepEqual(exceptions,[]);
 console.log("Agent detail browser smoke passed: routing, 4 professions, status, layout, placeholders, menus.");
} catch(error) {
 failed=true;
 console.error(error);
} finally {
 await browser.close();
}
if(failed)process.exitCode=1;
