import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const index=fs.readFileSync(path.resolve(process.cwd(),"src/index.js"),"utf8");

test("settlement serializes contenders on the quote before provider execution",()=>{
  const lock=index.indexOf("SELECT * FROM x402_quotes WHERE id=$1 AND user_id=$2 FOR UPDATE");
  const state=index.indexOf('if(!["pending","issued"].includes(quote.status))',lock);
  const mark=index.indexOf("SET status='verified',idempotency_key=$2",state);
  const settle=index.indexOf("openFacilitator.settle",mark);
  assert.ok(lock>=0&&state>lock&&mark>state&&settle>mark);
});

test("idempotent replay is resolved while the quote lock is held",()=>{
  const lock=index.indexOf("SELECT * FROM x402_quotes WHERE id=$1 AND user_id=$2 FOR UPDATE");
  const same=index.indexOf('quote.status==="settled"&&quote.idempotency_key===idempotencyKey',lock);
  const cross=index.indexOf("idempotency_key=$2 AND id<>$3",same);
  assert.ok(lock>=0&&same>lock&&cross>same);
  assert.match(index,/X402_IDEMPOTENCY_REPLAY/);
});

test("provider failure consumes the quote instead of reopening it",()=>{
  assert.match(index,/status IN \('pending','issued','verified'\)/);
  assert.match(index,/SET status='failed',failed_at=CURRENT_TIMESTAMP/);
});
