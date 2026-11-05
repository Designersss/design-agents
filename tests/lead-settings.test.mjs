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
  "Контакт для связи","Критерий готовности","Результат и передача","AI-модель","Доступы и теги",
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
 assert.doesNotMatch(script,/ls-work-guide|ls-types-help|ПОДСКАЗКА|КАК ЭТО РАБОТАЕТ/);
 assert.match(script,/data-ls-tab="types"/);
 assert.match(script,/Встроенные правила профессии и безопасности не меняются/);
 assert.match(css,/\.ls-work-layout\{display:grid;grid-template-columns:/);
 assert.match(css,/@media\(max-width:1240px\)/);
 assert.match(css,/\.ls-work-textarea\{/);
 assert.match(css,/\.ls-work-layout,\.ls-model-layout\{grid-template-columns:minmax\(0,1fr\)/);
 assert.match(script,/counter\.textContent=el\.value\.length\+" символов"/);
});

test("AI model and access are separate tabs with independent responsibilities",()=>{
 assert.match(script,/class="ls-model-view"/);
 assert.match(script,/\["model","AI-модель"\],\["access","Доступы и теги"\]/);
 assert.match(script,/function accessTab\(\)/);
 assert.match(script,/tab==="model"\?modelTab\(\):tab==="access"\?accessTab\(\)/);
 assert.match(script,/<h2>AI-модель<\/h2>/);
 assert.match(script,/<h2>Доступы и теги<\/h2>/);
 assert.doesNotMatch(script,/AI-модель и доступы/);
 assert.match(script,/\["access","Доступы и теги"\]/);
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

test("types of applications use a guided two-column flow without reinstating the preview",()=>{
 assert.match(script,/class="ls-types-view"/);
 assert.match(script,/ls-types-intro/);
 assert.match(script,/ВЫБРАННЫЙ ТИП ЗАЯВКИ/);
 assert.match(script,/Какие данные собирать/);
 assert.match(script,/Когда заявка готова/);
 assert.match(script,/ls-completion-panel/);
 assert.doesNotMatch(script,/ls-types-help/);
 assert.match(script,/Условия сбора/);
 assert.match(script,/ls-fields-empty/);
 assert.match(script,/data-ls-action="add-type"/);
 assert.match(script,/data-ls-action="rename-type"/);
 assert.match(script,/data-ls-type-name/);
 assert.match(script,/data-ls-action="delete-type"/);
 assert.match(script,/state\.types\.length<=1/);
 assert.match(script,/fieldCountLabel\(n\)/);
 assert.doesNotMatch(script,/prompt\("Название типа заявки"/);
 assert.doesNotMatch(script,/Предпросмотр заявки/);
 assert.match(css,/\.ls-types-view \.ls-workbench\{grid-template-columns:/);
 assert.match(css,/@media\(max-width:880px\)/);
 assert.match(css,/\.ls-types-view \.ls-criteria\{[^}]*grid-template-columns:1fr 1fr/);
});

test("in-app help is distinct from agent knowledge and the dismissed banner stays hidden",()=>{
 const html=readFileSync(resolve(root,"index.html"),"utf8");
 const css=readFileSync(resolve(root,"styles/redesign-v1.css"),"utf8");
 const integr=readFileSync(resolve(root,"scripts/agent-integrations.js"),"utf8");
 const knowledge=readFileSync(resolve(root,"scripts/agent-knowledge.js"),"utf8");
 assert.match(html,/id="appHelpBanner"[^>]*hidden/);
 assert.match(html,/id="appHelpDismiss"/);
 assert.match(html,/id="helpView"/);
 assert.match(html,/href="#\/help"/);
 assert.match(html,/href="#\/knowledge"/);
 assert.match(html,/id="helpHeading">Справка AIMock/);
 assert.match(router,/help:"Справка AIMock"/);
 assert.match(router,/helpStorageKey="aimock:help-banner:dismissed:v1"/);
 assert.match(router,/localStorage\.setItem\(helpStorageKey,"1"\)/);
 assert.match(router,/route\.key==="help"/);
 assert.match(router,/appHelpBanner/);
 assert.match(css,/\.app-help-banner\[hidden\],\.app-help-page\[hidden\]\{display:none!important\}/);
 assert.doesNotMatch(script,/ls-work-guide|ls-types-help/);
 assert.doesNotMatch(integr,/ai-aside-guide|КАК ЭТО РАБОТАЕТ/);
 assert.doesNotMatch(knowledge,/ak-overview-card|КАК ЭТО РАБОТАЕТ/);
});
