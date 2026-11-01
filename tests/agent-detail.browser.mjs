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
 assert.equal((await page.locator("#agentDetailHeading").textContent()).trim(),"Менеджер заявок");
 assert.equal(await page.locator("#placeholderView").isVisible(),false);
 assert.equal(await page.locator("#agentDetailView").isVisible(),true);
 assert.equal(await page.locator(".global-nav").isVisible(),false);
 assert.equal(await page.locator(".agent-nav").isVisible(),true);
 assert.equal(await page.locator(".detail-top-grid > .detail-card").count(),3);
 assert.equal(await page.locator(".detail-stat-grid > .detail-card").count(),3);
 await page.screenshot({path:resolve(artifactDir,"manager-desktop.png"),fullPage:true});
 await page.locator("#detailToggleStatus").click();
 assert.match(await page.locator(".detail-status").textContent(),/Остановлен/);
 assert.match(await page.locator("#agentSidebarStatus").textContent(),/Остановлен/);
 assert.match(await page.locator("#detailToggleStatus").textContent(),/Запустить/);
 await page.locator('[data-agent-section="settings"]').click();
 assert.equal(await page.locator("#placeholderView").isVisible(),true);
 assert.match(await page.locator("#placeholderDescription").textContent(),/Агент остановлен/);
 await page.goto(base+"#/overview");
 await page.waitForSelector("#overviewView:not([hidden])");
 assert.match(await page.locator(".agent-card").nth(1).locator(".state").textContent(),/Остановлен/);
 await page.goto(base+"#/agent/recruiter/overview");
 await page.waitForSelector("#agentDetailHeading");
 assert.equal((await page.locator("#agentDetailHeading").textContent()).trim(),"HR-рекрутер");
 assert.match(await page.locator(".detail-flow-track").textContent(),/HR-команда/);
 assert.match(await page.locator(".detail-status").textContent(),/Остановлен/);
 await page.goto(base+"#/agent/consultant/overview");
 await page.waitForSelector("#agentDetailHeading");
 assert.match(await page.locator(".detail-flow-track").textContent(),/Человек/);
 await page.goto(base+"#/agent/support/overview");
 await page.waitForSelector("#agentDetailHeading");
 assert.match(await page.locator(".detail-flow-track").textContent(),/Оператор/);
 for(const size of [{width:1024,height:768},{width:768,height:900},{width:390,height:844}]){
   await page.setViewportSize(size);
   await page.waitForTimeout(100);
   const bounds=await page.evaluate(()=>({page:document.documentElement.scrollWidth,viewport:innerWidth}));
   assert.ok(bounds.page<=bounds.viewport+2,"Horizontal page overflow at "+size.width+"px: "+JSON.stringify(bounds));
   if(size.width===390)await page.screenshot({path:resolve(artifactDir,"support-mobile.png"),fullPage:true});
 }
 await page.setViewportSize({width:1440,height:900});
 await page.goto(base+"#/agent/leads/overview");
 await page.waitForSelector("#detailToggleStatus");
 await page.locator("[data-detail-share]").click();
 assert.match(await page.locator("#detailToast").textContent(),/демонстрационный интерфейс/);
 await page.locator("[data-detail-more]").click();
 assert.equal(await page.locator("[data-detail-menu]").isVisible(),true);
 await page.locator("[data-detail-unavailable]").first().click();
 assert.match(await page.locator("#detailToast").textContent(),/в разработке/);
 await page.locator(".agent-back").click();
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
