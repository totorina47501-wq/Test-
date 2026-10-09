import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const source=readFileSync(new URL("../src/index.js",import.meta.url),"utf8");
test("bot decision audit persists reason, proposed fraction and explicit simulation mode",()=>{
 assert.match(source,/ALTER TABLE bot_ai_decisions ADD COLUMN IF NOT EXISTS decision_reason TEXT/);
 assert.match(source,/ALTER TABLE bot_ai_decisions ADD COLUMN IF NOT EXISTS proposed_fraction/);
 assert.match(source,/decision\.decisionReason,decision\.fraction/);
 assert.match(source,/simulation_mode\) VALUES\([^\n]*'simulation'/);
});
test("decision history is authenticated, scoped to owner and bounded",()=>{
 assert.match(source,/app\.get\("\/api\/bots\/decisions\/history",auth,/);
 assert.match(source,/WHERE user_id=\$1 AND \(\$2::text='' OR bot_type=\$2\) AND \(\$3::text='' OR asset=\$3\)/);
 assert.match(source,/decisionFilters\(req\.query\)/);
 assert.match(source,/res\.json\(\{mode:"simulation",decisions:rows\.rows\.map\(presentDecision\),filters\}\)/);
});
