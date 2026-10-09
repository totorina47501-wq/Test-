import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const source=readFileSync(new URL("../src/index.js",import.meta.url),"utf8");
test("execution audit schema follows decision schema and links simulated trade",()=>{
 assert.ok(source.indexOf("CREATE TABLE IF NOT EXISTS bot_ai_decisions(")<source.indexOf("CREATE TABLE IF NOT EXISTS bot_execution_audit("));
 assert.match(source,/trade_id INTEGER REFERENCES trades\(id\)/);
 assert.match(source,/CHECK\(status IN \('executed','blocked','held'\)\)/);
 assert.match(source,/INSERT INTO trades[^\n]+RETURNING id/);
 assert.match(source,/await audit\("executed",[^\n]+tradeResult\.rows\[0\]\.id\)/);
});
test("blocked and held outcomes are recorded, history scoped and bounded",()=>{
 assert.match(source,/await audit\("held"/);
 assert.match(source,/await audit\("blocked","Cotation absente ou périmée/);
 assert.match(source,/await audit\("blocked","Limite de risque/);
 assert.match(source,/app\.get\("\/api\/bots\/executions\/history",auth,/);
 assert.match(source,/FROM bot_execution_audit WHERE user_id=\$1 ORDER BY id DESC LIMIT \$2/);
 assert.match(source,/res\.json\(\{mode:"simulation",executions:rows\.rows\}\)/);
});
