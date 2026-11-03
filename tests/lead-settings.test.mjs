import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {Script} from "node:vm";
import test from "node:test";
const root=resolve(import.meta.dirname,"..");
const html=readFileSync(resolve(root,"index.html"),"utf8");
const router=readFileSync(resolve(root,"scripts/redesign-v1.js"),"utf8");
const script=readFileSync(resolve(root,"scripts/agent-settings-builder.js"),"utf8");
const css=readFileSync(resolve(root,"styles/agent-settings-builder.css"),"utf8");
test("approved variant 03 mounts only on lead manager settings",()=>{
 assert.doesNotThrow(()=>new Script(script));
 assert.ok(html.includes('id="agentSettingsView"'));
 assert.ok(html.includes("agent-settings-builder.css"));
 assert.ok(html.includes("agent-settings-builder.js"));
 assert.ok(html.indexOf("agent-settings-builder.js")<html.indexOf("redesign-v1.js"));
 assert.match(router,/route\.id==="leads"&&route\.section==="settings"/);
 assert.match(router,/window\.AIMockLeadSettings\.render/);
 assert.match(router,/placeholderView"\)\.hidden=route\.key==="overview"\|\|isAgentOverview\|\|isLeadSettings/);
});
test("lead builder has professional field contracts and an independent preview",()=>{
 for(const text of [
  "Расчёт кухни","Замер","Консультация","Тип мебели","Размеры помещения","Контакт для связи",
  "Ориентировочный бюджет","Комментарий","Критерий готовности","Результат и передача",
  "AI-модель и доступы","Перед запуском","Проверить поля","Обязательно"
 ])assert.ok(script.includes(text),text);
 assert.match(script,/fieldKinds=\{[^}]*phone:[^}]*email:[^}]*money:[^}]*date:/);
 assert.match(script,/localStorage\.setItem/);
 assert.match(script,/if\(isRunning\(\)\)return/);
 assert.match(script,/data-ls-fieldprop/);
 assert.match(script,/data-ls-action="add-field"/);
 assert.match(script,/data-ls-action="delete-field"/);
 assert.match(script,/data-ls-action="move-up"/);
 assert.match(script,/data-ls-tab="result"/);
 assert.match(script,/data-ls-preview/);
 assert.match(script,/data-ls-fieldprop="conditionField"/);
 assert.match(script,/data-ls-fieldprop="conditionValue"/);
 assert.match(script,/function fieldVisible/);
 assert.match(script,/previewValues\[f\.conditionField\]===f\.conditionValue/);
 assert.doesNotMatch(script,/Если поле нужно не всегда, укажите условие простыми словами/);
 assert.doesNotMatch(script,/автоматически отказывать|системный промпт:|технические trace/i);
});
test("builder preserves light full-screen shell and adapts to mobile",()=>{
 assert.equal((css.match(/\{/g)||[]).length,(css.match(/\}/g)||[]).length);
 assert.match(css,/\.ls-workbench\{display:grid;grid-template-columns:/);
 assert.match(css,/@media\(max-width:1430px\)/);
 assert.match(css,/@media\(max-width:880px\)/);
 assert.match(css,/@media\(max-width:620px\)/);
 assert.match(css,/\.agent-settings-view \[hidden\]\{display:none!important\}/);
 const existing=readFileSync(resolve(root,"styles/agent-detail-modular-v3.css"),"utf8");
 assert.match(existing,/\.detail-top-grid\s*\{[^}]*align-items:stretch/);
});
