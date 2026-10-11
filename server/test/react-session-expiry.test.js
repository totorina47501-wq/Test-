import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const root=new URL("../../frontend/src/",import.meta.url);
const read=path=>readFileSync(new URL(path,root),"utf8");
test("account requests expire on 401 and propagate to auth",()=>{
  const hook=read("hooks/useAccountData.ts");const page=read("components/AccountPage.tsx");
  assert.match(hook,/response\.status===401/);
  assert.match(hook,/onExpired\(\)/);
  assert.match(page,/useAccountData\(auth\.token,auth\.expireSession\)/);
  assert.match(page,/SessionExpiredError/);
});
test("simulated trade expires session on 401",()=>{
  assert.match(read("hooks/useInvestirMarket.ts"),/response\.status===401/);
  assert.match(read("components/InvestirPage.tsx"),/TradeSessionExpiredError\)auth\.expireSession\(\)/);
});
