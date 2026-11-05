import assert from "node:assert/strict";
import test from "node:test";
import {Script} from "node:vm";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";

const root=resolve(import.meta.dirname,"..");
const code=readFileSync(resolve(root,"scripts/agent-knowledge.js"),"utf8");
const css=readFileSync(resolve(root,"styles/agent-knowledge.css"),"utf8");
const shell=readFileSync(resolve(root,"index.html"),"utf8");
const router=readFileSync(resolve(root,"scripts/redesign-v1.js"),"utf8");

test("Agent Knowledge is an isolated route inside the shared shell",()=>{
 assert.doesNotThrow(()=>new Script(code));
 assert.match(shell,/id="agentKnowledgeView"/);
 assert.match(shell,/styles\/agent-knowledge\.css/);
 assert.match(shell,/scripts\/agent-knowledge\.js/);
 assert.ok(shell.indexOf("scripts/agent-knowledge.js")<shell.indexOf("scripts/redesign-v1.js"));
 assert.match(router,/route\.id==="leads"&&route\.section==="knowledge"/);
 assert.match(router,/window\.AIMockAgentKnowledge\.render\(route\)/);
 assert.match(router,/isLeadIntegrations\|\|isLeadKnowledge/);
});
test("only authorized current workspace sources can be assigned",()=>{
 assert.match(code,/storeKey="aimock:lead-knowledge-assignments:v1"/);
 assert.match(code,/localStorage\.setItem/);
 assert.match(code,/state:"current"/);
 assert.match(code,/state:"outdated"/);
 assert.doesNotMatch(code,/Внутренние документы руководства/);
 assert.match(code,/if\(!s\|\|!isCurrent\(s\)\|\|state\.assigned\.includes\(id\)\)return/);
 assert.match(code,/if\(isRunning\(\)\)return/);
 assert.match(code,/\.filter\(id=>catalog\.some\(c=>c\.id===id&&c\.state!=="restricted"\)\)/);
 assert.match(code,/Материал требует проверки актуальности/);
 assert.match(code,/Назначайте агенту только нужные источники/);
 assert.match(code,/Библиотека знаний/);
 assert.match(code,/#\/knowledge/);
 assert.doesNotMatch(code,/fetch\(|XMLHttpRequest|\.post\(|botToken|secret|credentials/);
});
test("knowledge UI has source metadata, FAQ, search, filtering and safe detach",()=>{
 for(const phrase of [
  "Назначенные материалы","Версия","Область доступа","Актуально",
  "Требует обновления","Нет доступа","Частые вопросы клиентов",
  "Документы","FAQ","Нет доступа","Обновить в библиотеке","Отвязать материал?",
  "Изменение содержимого и версии выполняется в библиотеке знаний"
 ])assert.ok(code.includes(phrase),phrase);
 assert.match(code,/data-ak-assign/);
 assert.match(code,/data-ak-details/);
 assert.match(code,/data-ak-confirm-remove/);
 assert.match(code,/data-ak-filter/);
 assert.match(code,/id="akSearch"/);
 assert.match(code,/isRunning\(\)/);
 assert.match(code,/aria-modal="true"/);
 assert.match(css,/\.ak-layout\{display:grid;/);
 assert.match(css,/\.ak-picker,\.ak-details,\.ak-confirm\{/);
 assert.match(css,/@media\(max-width:620px\)/);
 assert.equal((css.match(/\{/g)||[]).length,(css.match(/\}/g)||[]).length);
});
