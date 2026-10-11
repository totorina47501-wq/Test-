import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const source=readFileSync(new URL("../src/index.js",import.meta.url),"utf8");

test("manual simulated trades reject missing or stale asset quotes",()=>{
  const handler=source.slice(source.indexOf('app.post("/api/trades"'));
  assert.match(handler,/const quote=marketSnapshot\.find\(row=>row\.symbol===asset\)/);
  assert.match(handler,/!quote\.priceFresh/);
  assert.match(handler,/Date\.now\(\)-Number\(quote\.priceUpdatedAt\)>120000/);
  assert.match(handler,/Cotation indisponible ou périmée/);
});

test("bot execution rejects stale asset quotes",()=>{
  const handler=source.slice(source.indexOf('async function executeBot'),source.indexOf('app.post("/api/trades"'));
  assert.match(handler,/!quote\.priceFresh/);
  assert.match(handler,/Date\.now\(\)-Number\(quote\.priceUpdatedAt\)>120000/);
});
