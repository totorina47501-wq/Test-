import test from "node:test";
import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";
const script=fileURLToPath(new URL("../scripts/restore-drill.mjs",import.meta.url));
function run(env){return spawnSync(process.execPath,[script],{encoding:"utf8",env:{...process.env,NODE_ENV:"test",...env}})}
test("restore drill refuses missing operator acknowledgment",()=>{
 const r=run({BITGOLD_BACKUP_SOURCE_URL:"postgres://db1/source",BITGOLD_RESTORE_DISPOSABLE_URL:"postgres://db2/disposable",BITGOLD_RESTORE_DRILL_ACK:""});
 assert.equal(r.status,2);
});
test("restore drill refuses identical database even with consent",()=>{
 const r=run({BITGOLD_BACKUP_SOURCE_URL:"postgres://db/source",BITGOLD_RESTORE_DISPOSABLE_URL:"postgres://db/source",BITGOLD_RESTORE_DRILL_ACK:"DISPOSABLE_DATABASE_ONLY"});
 assert.equal(r.status,2);
});
test("restore drill refuses non-postgres URLs",()=>{
 const r=run({BITGOLD_BACKUP_SOURCE_URL:"https://example.com/source",BITGOLD_RESTORE_DISPOSABLE_URL:"postgres://db/disposable",BITGOLD_RESTORE_DRILL_ACK:"DISPOSABLE_DATABASE_ONLY"});
 assert.equal(r.status,2);
});
test("restore drill refuses production runtime",()=>{
 const r=spawnSync(process.execPath,[script],{encoding:"utf8",env:{...process.env,NODE_ENV:"production",BITGOLD_BACKUP_SOURCE_URL:"postgres://db1/source",BITGOLD_RESTORE_DISPOSABLE_URL:"postgres://db2/disposable",BITGOLD_RESTORE_DRILL_ACK:"DISPOSABLE_DATABASE_ONLY"}});
 assert.equal(r.status,2);
});
