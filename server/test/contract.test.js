import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
const root=path.resolve(process.cwd());
const html=fs.readFileSync(path.join(root,"public/index.html"),"utf8");
const app=fs.readFileSync(path.join(root,"public/app.js"),"utf8");
const server=fs.readFileSync(path.join(root,"src/index.js"),"utf8");

test("visitor bot comparison is public and ordered",()=>{
  assert.match(html,/id="bots" class="section bots-section"/);
  assert.doesNotMatch(html,/id="bots"[^>]*auth-only/);
  assert.ok(app.includes("/api/bots/catalog"));
  assert.match(server,/app\.get\("\/api\/bots\/catalog"/);
  assert.match(server,/id:"gold"/); assert.match(server,/id:"silver"/); assert.match(server,/id:"shield"/);
  assert.ok(app.includes("Niveau '+(index+1)"));
});

test("authenticated bot choice is exclusive",()=>{
  assert.match(server,/UPDATE bot_subscriptions SET active=FALSE WHERE user_id=\$1 AND bot_type<>\$2/);
  assert.match(app,/Choisissez votre bot d’investissement/);
});

test("logout listener is not blocked by stale history exports",()=>{
  assert.doesNotMatch(app,/window\.openHistory=openHistory/);
  assert.match(app,/querySelector\("#topLogin"\)\?\.addEventListener/);
  assert.match(app,/function logout\(\)/);
});

test("history action remains removed from market cards",()=>{
  assert.doesNotMatch(html,/id="historyModal"/);
  assert.doesNotMatch(app,/data-action="history"/);
});
