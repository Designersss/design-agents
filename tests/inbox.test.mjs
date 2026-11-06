import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {Script} from "node:vm";
import test from "node:test";

const root=resolve(import.meta.dirname,"..");
const html=readFileSync(resolve(root,"index.html"),"utf8");
const router=readFileSync(resolve(root,"scripts/redesign-v1.js"),"utf8");
const inbox=readFileSync(resolve(root,"scripts/inbox.js"),"utf8");
const css=readFileSync(resolve(root,"styles/inbox.css"),"utf8");
test("Inbox is a dedicated global and agent-context route",()=>{
 assert.match(html,/id="inboxView"[^>]*hidden/);
 assert.match(html,/styles\/inbox\.css/);
 assert.match(html,/scripts\/inbox\.js/);
 assert.match(router,/route\.key==="messages"\|\|\(isAgent&&route\.section==="messages"\)/);
 assert.match(router,/window\.AIMockInbox\.render\(isAgent\?route\.id:null\)/);
 assert.match(router,/isInbox\|\|isAgentOverview/);
 assert.match(html,/data-global-route="messages"/);
 assert.match(html,/data-agent-section="messages"/);
 assert.doesNotMatch(inbox,/inbox-page-head|inbox-head-hint|inbox-eyebrow|ПЕРЕПИСКИ АГЕНТА|ЕДИНЫЙ INBOX/);
 assert.match(inbox,/id="inboxHeading" class="inbox-sr"/);
 assert.match(css,/\.inbox-page\{display:flex;flex-direction:column;[^}]*height:calc\(100dvh - 76px\)/);
 assert.match(css,/\.inbox-workspace\{flex:1 1 auto;height:100%;min-height:0/);
 assert.match(css,/height:calc\(100dvh - 68px\)/);
});
test("Messenger Workspace has a list, active conversation, and customer context",()=>{
 for(const name of ["inbox-list-pane","inbox-chat-pane","inbox-context-pane","inbox-thread-list","inbox-messages","inbox-person","inbox-context-section","inbox-compose-form"])
   assert.ok(inbox.includes(name),name);
 assert.match(inbox,/function syncScope\(id\)/);
 assert.match(inbox,/scope==="all"\|\|c\.agent===scope/);
 assert.match(inbox,/data-inbox-search/);
 assert.match(inbox,/data-inbox-filter/);
 assert.match(inbox,/data-inbox-back/);
 assert.match(inbox,/data-inbox-context/);
 assert.match(inbox,/data-inbox-context-close/);
});
test("Takeover, human answer, return, close and reopen cannot send externally",()=>{
 assert.match(inbox,/action==="take"/);
 assert.match(inbox,/action==="return"/);
 assert.match(inbox,/action==="close"/);
 assert.match(inbox,/action==="reopen"/);
 assert.match(inbox,/c\.mode!=="human"/);
 assert.match(inbox,/localStorage\.setItem/);
 assert.match(inbox,/Действия и сообщения на этой странице сохраняются только в текущем браузере/);
 assert.doesNotMatch(inbox,/\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\b|\bnavigator\.sendBeacon\b/);
 assert.match(inbox,/function esc\(x\)/);
 assert.match(inbox,/esc\(m\[1\]\)/);
});
test("Only Telegram is a conversation transport; CRM is contextual metadata",()=>{
 assert.match(inbox,/source:"Telegram Bot API"/);
 assert.doesNotMatch(inbox,/source:"amoCRM"|source:"Битрикс24"/);
 assert.match(inbox,/crm:"amoCRM"/);
 assert.match(inbox,/crm:"Битрикс24"/);
 assert.match(inbox,/agent:"leads"/);
 assert.match(inbox,/agent:"support"/);
 assert.match(inbox,/agent:"recruiter"/);
 assert.match(inbox,/agent:"consultant"/);
});
test("Inbox JS parses and adapts to full-screen, tablet and mobile layout",()=>{
 assert.doesNotThrow(()=>new Script(inbox));
 assert.equal((css.match(/\{/g)||[]).length,(css.match(/\}/g)||[]).length);
 assert.match(css,/grid-template-columns:minmax\(245px,295px\) minmax\(0,1fr\) minmax\(220px,250px\)/);
 assert.match(css,/@media\(max-width:1180px\)/);
 assert.match(css,/@media\(max-width:710px\)/);
 assert.match(css,/data-mobile-view="conversation"/);
 assert.match(css,/prefers-reduced-motion/);
});
