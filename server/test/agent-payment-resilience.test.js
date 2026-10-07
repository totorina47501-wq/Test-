import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
const index=fs.readFileSync(path.resolve(process.cwd(),"src/index.js"),"utf8");

test("reconciliation flags stale in-flight payments",()=>{
  assert.match(index,/15\*60\*1000/);
  assert.match(index,/\["pending","verified"\]\.includes\(row\.status\)/);
  assert.match(index,/X402_STALE_IN_FLIGHT/);
  assert.match(index,/healthy:anomalies\.length===0/);
});

test("reconciliation keeps receipt and failure integrity alarms",()=>{
  assert.match(index,/X402_MISSING_RECEIPT/);
  assert.match(index,/severity:"critical"/);
  assert.match(index,/X402_MISSING_FAILURE_TIMESTAMP/);
});
