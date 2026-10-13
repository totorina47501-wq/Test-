import test from "node:test";
import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";
const script=fileURLToPath(new URL("../scripts/internal-readiness.mjs",import.meta.url));
test("internal readiness inventory exists and does not claim commercial approval",()=>{
 const run=spawnSync(process.execPath,[script],{encoding:"utf8"});
 assert.equal(run.status,0,run.stderr);
 const data=JSON.parse(run.stdout);
 assert.equal(data.commercialApproval,false);
 assert.ok(data.checks.length>=10);
 assert.equal(data.missing.length,0);
 assert.ok(data.externalEvidenceRequired.length>=5);
});
test("paid launch approval remains fail-closed",()=>{
 const run=spawnSync(process.execPath,[script],{encoding:"utf8",env:{...process.env,BITGOLD_REQUIRE_COMMERCIAL_APPROVAL:"true"}});
 assert.equal(run.status,2);
});
