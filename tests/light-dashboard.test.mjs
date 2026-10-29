import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { Script } from "node:vm";

const root = resolve(import.meta.dirname, "..");
const html = readFileSync(resolve(root, "index.html"), "utf8");
const css = readFileSync(resolve(root, "styles/redesign-v1.css"), "utf8");
const js = readFileSync(resolve(root, "scripts/redesign-v1.js"), "utf8");

const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);

test("dashboard has unique element IDs and working source references", () => {
  assert.equal(new Set(ids).size, ids.length, "HTML ids must be unique");
  assert.match(html, /id="overviewView"/);
  assert.match(html, /id="placeholderView"/);
  assert.match(html, /styles\/redesign-v1\.css/);
  assert.match(html, /scripts\/redesign-v1\.js/);
  const jsIds = [...js.matchAll(/\$\("([A-Za-z0-9]+)"\)/g)].map((match) => match[1]);
  for (const id of jsIds) assert.ok(ids.includes(id), "Missing DOM element: " + id);
});

test("all icon references have SVG symbols", () => {
  const symbols = new Set([...html.matchAll(/<symbol id="(i-[^"]+)"/g)].map((match) => match[1]));
  for (const [, icon] of html.matchAll(/<use href="#(i-[^"]+)"/g)) {
    assert.ok(symbols.has(icon), "Missing SVG symbol " + icon);
  }
});

test("all prototype links stay inside the new route system", () => {
  const pages = new Set([
    "overview", "agents", "library", "messages", "knowledge", "integrations", "contacts",
    "automation", "finance", "workspace", "profile", "settings", "notifications",
    "attention", "create"
  ]);
  const agents = new Set(["consultant", "leads", "recruiter", "support"]);
  const sections = new Set(["overview", "messages", "settings", "integrations",
    "knowledge", "testing", "automation", "analytics", "logs"]);
  const links = [...html.matchAll(/href="#\/([^"]+)"/g)].map(match => match[1]);
  assert.ok(links.length >= 30);
  for (const link of links) {
    const parts = link.split("/");
    const valid = pages.has(link) ||
      (parts.length === 3 && parts[0] === "agent" && agents.has(parts[1]) && sections.has(parts[2]));
    assert.ok(valid, "Link points outside redesigned prototype: " + link);
  }
  assert.doesNotMatch(html, /href="\.\/pages\//);
});

test("script parses and layout contains desktop/mobile rules", () => {
  assert.doesNotThrow(() => new Script(js));
  assert.equal((css.match(/\{/g) || []).length, (css.match(/\}/g) || []).length);
  assert.match(css, /@media \(max-width:1040px\)/);
  assert.match(css, /@media \(max-width:710px\)/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /overflow-y:auto/);
});

test("placeholder navigation and agent-context sidebar are present", () => {
  assert.match(html, /class="agent-back"/);
  assert.match(html, /data-agent-section="settings"/);
  assert.match(html, /data-agent-section="testing"/);
  assert.match(html, /data-global-route="library"/);
  assert.match(js, /is-agent-route/);
  assert.match(js, /В разработке/);
});
