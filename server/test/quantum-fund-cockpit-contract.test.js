import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const server=readFileSync(new URL("../src/index.js",import.meta.url),"utf8");
const ui=readFileSync(new URL("../../frontend/src/components/QuantumFundPanel.tsx",import.meta.url),"utf8");
const account=readFileSync(new URL("../../frontend/src/components/AccountPage.tsx",import.meta.url),"utf8");

test("Quantum Fund route requires auth and reuses causal bot backtests",()=>{
 assert.match(server,/app\.get\("\/api\/bots\/quantum-fund",auth,async\(req,res\)=>/);
 assert.match(server,/compareBacktests\(\{botTypes,histories\}\)/);
 assert.match(server,/compareQuantumFund\(\{agents,/);
 assert.ok(server.indexOf('app.get("/api/bots/quantum-fund"')<server.indexOf('app.get("/api/bots/:botType"'));
});
test("Quantum Fund component is integrated and exposes accessible feedback",()=>{
 assert.match(account,/<QuantumFundPanel botIds=/);
 assert.match(ui,/onExpired\(\)/);
 assert.match(ui,/role="alert"/);
 assert.match(ui,/aria-label=\{copy\.period\}/);
 assert.match(ui,/fr.*Période Quantum Fund/);
 assert.match(ui,/en.*Quantum Fund period/);
 assert.match(ui,/es.*Período de Quantum Fund/);
 assert.match(ui,/Sharpe/);
 assert.match(ui,/Sortino/);
 assert.match(ui,/simulation/i);
});
