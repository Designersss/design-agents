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

test("manager settings remain mounted on the approved agent route",()=>{
 assert.doesNotThrow(()=>new Script(script));
 assert.ok(html.includes('id="agentSettingsView"'));
 assert.ok(html.includes("agent-settings-builder.css"));
 assert.ok(html.includes("agent-settings-builder.js"));
 assert.ok(html.indexOf("agent-settings-builder.js")<html.indexOf("redesign-v1.js"));
 assert.match(router,/route\.id==="leads"&&route\.section==="settings"/);
 assert.match(router,/window\.AIMockLeadSettings\.render/);
});

test("application preview is entirely removed from the active settings screen",()=>{
 assert.doesNotMatch(script,/Предпросмотр|preview|ls-preview-form|Проверить заполнение/i);
 assert.doesNotMatch(css,/\.ls-preview|\.ls-right|\.ls-dark-btn/i);
 assert.match(script,/class="ls-workbench"/);
 assert.match(script,/class="ls-main-column"/);
 assert.match(script,/resultSummary\(\)/);
 assert.match(css,/\.ls-workbench\{display:grid;grid-template-columns:minmax\(165px,195px\) minmax\(0,1fr\)/);
 assert.match(css,/\.ls-main-column\{display:flex;flex-direction:column/);
 assert.match(css,/\.ls-result\{/);
});

test("types, fields, conditions and local autosave remain available",()=>{
 for(const label of [
  "Расчёт кухни","Замер","Консультация","Тип мебели","Размеры помещения",
  "Контакт для связи","Критерий готовности","Результат и передача","AI-модель и доступы",
  "Перед запуском","Обязательное поле","Условие появления",
  "Когда выбрано значение","Сценарии обработки"
 ])assert.ok(script.includes(label),label);
 assert.match(script,/localStorage\.setItem/);
 assert.match(script,/if\(isRunning\(\)\)return/);
 assert.match(script,/data-ls-fieldprop="conditionField"/);
 assert.match(script,/data-ls-fieldprop="conditionValue"/);
 assert.match(script,/data-ls-action="add-field"/);
 assert.match(script,/data-ls-action="delete-field"/);
 assert.match(script,/data-ls-action="move-up"/);
 assert.match(script,/data-ls-config="criteria"/);
 assert.match(script,/data-ls-config="incompleteAction"/);
 assert.match(script,/Неполная заявка направляется ответственному для рассмотрения/);
 assert.doesNotMatch(script,/fetch\(|XMLHttpRequest|\.post\(/);
});

test("responsive editor retains light full-screen layout",()=>{
 assert.equal((css.match(/\{/g)||[]).length,(css.match(/\}/g)||[]).length);
 assert.match(css,/@media\(max-width:1430px\)/);
 assert.match(css,/@media\(max-width:880px\)/);
 assert.match(css,/@media\(max-width:620px\)/);
 assert.match(css,/\.agent-settings-view \[hidden\]\{display:none!important\}/);
 const approved=readFileSync(resolve(root,"styles/agent-detail-modular-v3.css"),"utf8");
 assert.match(approved,/\.detail-top-grid\s*\{[^}]*align-items:stretch/);
});

test("work data redesign explains business context without duplicating knowledge or lead fields",()=>{
 assert.match(script,/function workTab\(\)/);
 assert.match(script,/class="ls-work-view"/);
 assert.match(script,/id="lsWorkProject"/);
 assert.match(script,/id="lsWorkRequirements"/);
 assert.match(script,/data-ls-config="project"/);
 assert.match(script,/data-ls-config="requirements"/);
 assert.match(script,/data-ls-counter="project"/);
 assert.match(script,/data-ls-counter="requirements"/);
 assert.match(script,/Посмотреть пример заполнения/);
 assert.match(script,/Перейти к знаниям/);
 assert.match(script,/data-ls-tab="types"/);
 assert.match(script,/Встроенные правила профессии и безопасности не меняются/);
 assert.match(css,/\.ls-work-layout\{display:grid;grid-template-columns:/);
 assert.match(css,/@media\(max-width:1240px\)/);
 assert.match(css,/\.ls-work-textarea\{/);
 assert.match(css,/\.ls-work-aside\{/);
 assert.match(script,/counter\.textContent=el\.value\.length\+" символов"/);
});

test("AI model and access redesign respects profession defaults and company permissions",()=>{
 assert.match(script,/class="ls-model-view"/);
 assert.match(script,/function modelTab\(\)/);
 assert.match(script,/data-ls-model-mode="automatic"/);
 assert.match(script,/data-ls-model-mode="explicit"/);
 assert.match(script,/назначенную администратором для этой профессии/);
 assert.match(script,/каталог моделей/i);
 assert.match(script,/ls-model-catalog-status/);
 assert.match(script,/isCompanyWorkspace\(\)/);
 assert.match(script,/Только владелец/);
 assert.match(script,/Группа «Отдел продаж»/);
 assert.match(script,/data-ls-model="access"/);
 assert.match(script,/Теги не управляют доступом/);
 assert.match(script,/data-ls-remove-tag/);
 assert.match(script,/function addModelTag\(\)/);
 assert.match(script,/function removeModelTag\(index\)/);
 assert.match(script,/if\(isRunning\(\)\)return/);
 assert.match(script,/AI-модель",state\.model\.mode==="automatic"\|\|!!state\.model\.modelId/);
 assert.match(css,/\.ls-model-layout\{display:grid;grid-template-columns:/);
 assert.match(css,/@media\(max-width:1240px\)/);
 assert.match(css,/\.ls-model-tag-list\{/);
 assert.match(css,/\.ls-model-choice\.is-selected\{/);
});
