import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { Script } from "node:vm";
const root=resolve(import.meta.dirname,"..");
const html=readFileSync(resolve(root,"index.html"),"utf8");
const core=readFileSync(resolve(root,"scripts/redesign-v1.js"),"utf8");
const detail=readFileSync(resolve(root,"scripts/agent-detail-modular-v3.js"),"utf8");
const css=readFileSync(resolve(root,"styles/agent-detail-modular-v3.css"),"utf8");
test("both scripts parse and agent detail is loaded ahead of router",()=>{
 assert.doesNotThrow(()=>new Script(detail));
 assert.doesNotThrow(()=>new Script(core));
 assert.ok(html.includes('id="agentDetailView"'));
 assert.ok(html.includes("agent-detail-modular-v3.css"));
 assert.ok(html.indexOf("agent-detail-modular-v3.js")<html.indexOf("redesign-v1.js"));
 assert.ok(core.includes('window.AIMockAgentDetail.render(route)'));
 assert.ok(core.includes('route.section==="overview"'));
});
test("every profession has a corresponding design fixture and agent route",()=>{
 for(const key of ["consultant","leads","recruiter","support"]){
   assert.ok(detail.includes(key+": {"),key);
   assert.ok(core.includes("window.AIMockAgentDetail.getAgentNames()"));
 }
 assert.doesNotMatch(detail,/AG-02\d{2}|Модульный обзор|Карточка агента ·|Демо:/);
 assert.doesNotMatch(html,/Дизайн-прототип|Демо-пространство|демонстрационные/);
 assert.match(detail,/Статус .*обновлён на экране/);
 assert.match(detail,/Открыть раздел/);
 assert.match(detail,/data-detail-toggle/);
});
test("modular layout adapts without duplicate navigation",()=>{
 assert.equal((css.match(/\{/g)||[]).length,(css.match(/\}/g)||[]).length);
 assert.match(css,/\.detail-top-grid\s*\{[^}]*display:grid;[^}]*grid-template-columns:minmax\(0,\.86fr\)[^}]*align-items:stretch/);
 assert.match(css,/\.detail-top-grid\s*>\s*\.detail-card\s*\{[^}]*min-height:0;[^}]*align-self:stretch/);
 assert.doesNotMatch(css,/\.detail-top-grid\s*\{\s*display:flex/);
 assert.match(css,/@container \(max-width:540px\)/);
 assert.doesNotMatch(css,/min-height:305px|min-height:265px/);
 assert.match(css,/@media \(max-width:600px\)/);
 assert.match(css,/\.detail-top-grid/);
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);
 assert.equal(ids.length,new Set(ids).size);
});
test("new overview navigation remains scoped to agent",()=>{
 for(const section of ["messages","knowledge","settings","testing","integrations","automation","analytics","logs"]){
   assert.ok(html.includes('data-agent-section="'+section+'"'));
 }
 assert.match(html,/class="agent-back"/);
 assert.ok(core.includes("isAgentOverview"));
});

test("shell fills viewport with fixed header and inset floating sidebar",()=>{
 const layout=readFileSync(resolve(root,"styles/redesign-v1.css"),"utf8");
 assert.match(layout,/\.app-shell\s*\{[^}]*width:100%/);
 assert.match(layout,/min-height:100dvh; margin:0;/);
 assert.match(layout,/\.sidebar\s*\{[^}]*position:fixed;[^}]*left:16px; top:16px; bottom:16px;/s);
 assert.match(layout,/\.topbar\s*\{[^}]*position:fixed; top:0;/);
 assert.match(layout,/\.workspace\s*\{[^}]*margin-left:252px; padding-top:76px;/s);
 assert.match(layout,/@media \(max-width:710px\)/);
 assert.doesNotMatch(layout,/max-width:1680px/);
});

test("agent overview uses custom names and optional descriptions independent of profession",()=>{
 assert.match(detail,/getAgentNames/);
 assert.match(detail,/name:"Входящие заявки"/);
 assert.match(detail,/title:"Менеджер заявок"/);
 assert.match(detail,/description:""/);
 assert.match(detail,/data.description\?/);
 assert.match(detail,/detail-heading-tags/);
 assert.match(detail,/detail-responsibilities/);
 assert.match(detail,/detail-kicker/);
 assert.match(detail,/detail-profession/);
 assert.doesNotMatch(detail,/detail-responsibility-index|detail-flow-arrow/);
 assert.match(css,/\.detail-responsibilities[^}]*grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
 assert.doesNotMatch(detail,/data\.flow|detail-identity-foot|detailControlsLabel|detail-bubbles/);
 assert.doesNotMatch(detail,/Редактирование.*После остановки/);
 assert.match(core,/route.section==="overview"\?route.name:/);
 assert.match(css,/\.detail-stat-description[^}]*margin:7px 0 23px/);
 assert.match(css,/\.detail-activity-item/);
});
