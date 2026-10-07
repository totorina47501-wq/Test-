import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const index=fs.readFileSync(path.resolve(process.cwd(),"src/index.js"),"utf8");

test("x402 persists a settlement receipt and exposes it to its owner",()=>{
  assert.match(index,/settlement_receipt JSONB/);
  assert.match(index,/\/api\/agent-payments\/x402\/receipt\/:quoteId/);
  assert.match(index,/WHERE id=\$1 AND user_id=\$2/);
  assert.match(index,/settlement_receipt=\$2/);
  assert.match(index,/transaction:result\?\.transaction\|\|result\?\.txHash/);
});

test("idempotency keys cannot be replayed across quotes",()=>{
  assert.match(index,/idempotency_key=\$2 AND id<>\$3/);
  assert.match(index,/X402_IDEMPOTENCY_REPLAY/);
  assert.match(index,/receipt:quote\.settlement_receipt/);
});
