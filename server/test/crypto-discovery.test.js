import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {cryptoDiscovery} from "../src/crypto-discovery.js";
const index=readFileSync(new URL("../src/index.js",import.meta.url),"utf8");
test("discovery catalog contains 20 unique research-only assets",()=>{
 assert.equal(cryptoDiscovery.length,20);
 assert.equal(new Set(cryptoDiscovery.map(a=>a.symbol)).size,20);
 for(const a of cryptoDiscovery){assert.equal(a.mode,"discovery");assert.equal(a.tradable,false);assert.equal(a.botEligible,false);assert.match(a.symbol,/^[A-Z0-9]+$/)}
});
test("market discovery endpoint is read-only and does not change existing bot endpoints",()=>{
 assert.match(index,/app\.get\("\/api\/market\/discovery"/);
 assert.match(index,/assets:cryptoDiscovery/);
 assert.match(index,/compareQuantumFund/);
 assert.match(index,/const marketIds = \{/);
 assert.ok(index.indexOf('app.get("/api/market/discovery"')<index.indexOf('app.get("/api/market"'));
});
test("localized discovery and landing are wired into existing React pages",()=>{
 const read=p=>readFileSync(new URL("../../frontend/src/"+p,import.meta.url),"utf8");
 assert.match(read("components/InvestirPage.tsx"),/<CryptoDiscoveryPanel\/>/);
 assert.match(read("LandingPage.tsx"),/<LanguageSelector\/>/);
 assert.match(read("App.tsx"),/Quantum Fund : comparez avant de décider/);
 assert.match(read("i18n.ts"),/bitgold-language/);
});

test("manual asset expansion leaves bot strategy history scope unchanged",()=>{
 assert.match(index,/ADA: "cardano"/);
 assert.match(index,/XRP: "ripple"/);
 assert.match(index,/LTC: "litecoin"/);
 assert.match(index,/DOT: "polkadot"/);
 assert.match(index,/botLegacyMarketSymbols\.map\(async symbol/);
 assert.match(index,/quote\.priceFresh/);
 assert.match(index,/Date\.now\(\)-Number\(quote\.priceUpdatedAt\)>120000/);
});
