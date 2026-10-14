import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const i18n=readFileSync(new URL("../../frontend/src/i18n.ts",import.meta.url),"utf8");
const investir=readFileSync(new URL("../../frontend/src/components/InvestirPage.tsx",import.meta.url),"utf8");
test("all five locales include trading safety, chart and market strings",()=>{for(const key of ["noRealAssets","simulateTrade","loadingMarkets","tradeFailure","buySimulation","sellSimulation","investIntro","marketDetail"]){assert.equal((i18n.match(new RegExp(key+":","g"))||[]).length,5,key)}});
test("Investir uses translated trading safety and locale-aware EUR values",()=>{assert.match(investir,/t\("noRealAssets"\)/);assert.match(investir,/t\("simulateTrade"\)/);assert.match(investir,/new Intl.NumberFormat\(locale/);assert.doesNotMatch(investir,/toLocaleDateString\("fr-FR"/)});
