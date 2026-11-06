import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {Script} from "node:vm";
import test from "node:test";
const root=resolve(import.meta.dirname,"..");
const html=readFileSync(resolve(root,"index.html"),"utf8");
const router=readFileSync(resolve(root,"scripts/redesign-v1.js"),"utf8");
const js=readFileSync(resolve(root,"scripts/agent-testing.js"),"utf8");
const css=readFileSync(resolve(root,"styles/agent-testing.css"),"utf8");

test("All agent testing routes mount one dedicated workspace",()=>{
 assert.match(html,/id="agentTestingView"/);
 assert.match(html,/scripts\/agent-testing\.js/);
 assert.match(html,/styles\/agent-testing\.css/);
 assert.match(html,/data-agent-section="testing"/);
 assert.match(router,/isAgentTesting=isAgent&&route\.section==="testing"/);
 assert.match(router,/window\.AIMockAgentTesting\.render\(route\)/);
 assert.match(router,/isAgentTesting\|\|isLeadSettings/);
 assert.match(router,/\$\("agentTestingView"\)\.hidden=!isAgentTesting/);
});
test("Testing has four profession-specific, structured sample scenario sets",()=>{
 for(const id of ["consultant","leads","recruiter","support"]){
  assert.match(js,new RegExp("\\b"+id+":\\s*\\{"));
 }
 for(const label of ["Первичный скрининг","Передача менеджеру","Возврат товара","Помощь с выбором"]){
  assert.ok(js.includes(label),label);
 }
 assert.match(js,/не формировать автоматический окончательный отказ/i);
 assert.match(js,/Не выдумывать окончательную цену/);
});
test("Prototype explicitly labels responses as samples and never performs live sends",()=>{
 assert.match(js,/offline scripted sample replies, not an LLM/);
 assert.match(js,/настоящая AI-модель не подключена/);
 assert.match(js,/Это описание сценария, а не оценка качества реального AI-ответа/);
 assert.match(js,/не обращается к интеграциям/);
 assert.match(js,/localStorage\.setItem/);
 assert.doesNotMatch(js,/\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\b|\bnavigator\.sendBeacon\b/);
});
test("Chat UX includes new session, persistent history, scenarios and text input",()=>{
 for(const part of ["at-history","at-dialog","at-tools","at-messages","at-compose","at-result",
                    "data-at-new","data-at-open","data-at-scenario","data-at-form","data-at-history-toggle","data-at-tools-toggle"]){
  assert.ok(js.includes(part),part);
 }
 assert.match(js,/const esc=text=>/);
 assert.match(js,/esc\(m\.text\)/);
 assert.match(js,/maxlength="2000"/);
 assert.match(js,/event\.key==="Enter"&&!event\.shiftKey/);
});
test("Testing workspace is viewport-sized and responsive without extra page intro",()=>{
 assert.doesNotThrow(()=>new Script(js));
 assert.equal((css.match(/\{/g)||[]).length,(css.match(/\}/g)||[]).length);
 assert.match(css,/height:calc\(100dvh - 102px\)/);
 assert.match(css,/@media\(max-width:1200px\)/);
 assert.match(css,/@media\(max-width:880px\)/);
 assert.match(css,/@media\(max-width:710px\)/);
 assert.match(css,/height:calc\(100dvh - 84px\)/);
 assert.doesNotMatch(js,/at-page-intro|at-page-hero|big-page-title/);
});
