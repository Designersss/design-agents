import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {Script} from "node:vm";
import test from "node:test";
const root=resolve(import.meta.dirname,"..");
const script=readFileSync(resolve(root,"scripts/agent-integrations.js"),"utf8");
const css=readFileSync(resolve(root,"styles/agent-integrations.css"),"utf8");
const shell=readFileSync(resolve(root,"index.html"),"utf8");
const router=readFileSync(resolve(root,"scripts/redesign-v1.js"),"utf8");

test("lead-only integration screen is mounted in the existing agent shell",()=>{
 assert.doesNotThrow(()=>new Script(script));
 assert.match(shell,/id="agentIntegrationsView"/);
 assert.match(shell,/styles\/agent-integrations\.css/);
 assert.match(shell,/scripts\/agent-integrations\.js/);
 assert.ok(shell.indexOf('scripts/agent-integrations.js')<shell.indexOf('scripts/redesign-v1.js'));
 assert.match(router,/route\.id==="leads"&&route\.section==="integrations"/);
 assert.match(router,/window\.AIMockAgentIntegrations\.render\(route\)/);
 assert.match(router,/isAgentOverview\|\|(?:isAgentTesting\|\|)?isLeadSettings\|\|isLeadIntegrations/);
});

test("only approved launch connectors appear and assignments are distinct from Hub credentials",()=>{
 for(const label of ["Telegram Bot API","amoCRM","Битрикс24","Назначено агенту","Требуется повторная авторизация","Используется агентом","CRM и данные"])
   assert.ok(script.includes(label),label);
 for(const forbidden of ["WhatsApp","MAX Bot","Viber","hh.ru","OAuth callback","apiKey","botToken"])
   assert.ok(!script.includes(forbidden),forbidden);
 assert.match(script,/storageKey="aimock:lead-integration-assignments:v1"/);
 assert.match(script,/state:"occupied",owner:"consultant"/);
 assert.match(script,/state:"reauth"/);
 assert.match(script,/state\.assigned\.includes\(c\.id\)/);
 assert.match(script,/c\.state!=="ready"/);
 assert.match(script,/window\.confirm/);
 assert.match(script,/if\(isRunning\(\)\)return/);
 assert.match(script,/localStorage\.setItem/);
 assert.match(script,/#\/integrations/);
 assert.doesNotMatch(script,/fetch\(|XMLHttpRequest|WebSocket|\.post\(/);
});
test("CRM permissions are per agent, selectable and never promise authorization",()=>{
 for(const word of ["Читать контакты","Создавать заявки","Обновлять заявки","Действительные права дополнительно проверяет подключённая CRM","data-ai-grant","data-ai-connection"])
   assert.ok(script.includes(word),word);
 assert.match(script,/state\.permissions\[id\]=el\.checked/);
 assert.match(script,/!\s*state\.assigned\.includes\(id\)/);
 assert.match(css,/\.ai-grants-grid\{display:grid;/);
 assert.match(css,/\.ai-picker-backdrop\{position:fixed;/);
 assert.match(css,/@media\(max-width:620px\)/);
 assert.equal((css.match(/\{/g)||[]).length,(css.match(/\}/g)||[]).length);
});
