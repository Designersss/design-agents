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
   assert.ok(core.includes(key+":")||core.includes(key+':"'),key);
 }
 assert.match(detail,/В реальном сервисе действие не выполнялось/);
 assert.match(detail,/Открыть раздел/);
 assert.match(detail,/data-detail-toggle/);
});
test("modular layout adapts without duplicate navigation",()=>{
 assert.equal((css.match(/\{/g)||[]).length,(css.match(/\}/g)||[]).length);
 assert.match(css,/grid-template-columns:minmax\(0,\.92fr\)/);
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
