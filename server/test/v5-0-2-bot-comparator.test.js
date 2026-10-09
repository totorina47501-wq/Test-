import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const js=readFileSync(new URL("../public/app.js",import.meta.url),"utf8");
const html=readFileSync(new URL("../public/index.html",import.meta.url),"utf8");
test("comparator defaults to Silver Shield Gold and ranks against BTC",()=>{
 for(const name of ["silver","shield","gold"])assert.match(html,new RegExp('value="'+name+'" checked'));
 assert.match(html,/value="excess">Surperformance vs BTC/);
 assert.match(js,/if\(sort==="excess"\)return comparatorNumber\(row.excessReturnBTC,-Infinity\)/);
 assert.match(js,/Écart vs BTC/);
});
test("sorting cached comparison does not trigger a new remote backtest",()=>{
 assert.match(js,/comparatorCachedRows=rows;/);
 assert.match(js,/if\(cards.length\)renderBotComparator\(comparatorCachedRows\)/);
 assert.match(js,/function comparatorPct\(value\)\{return value!==null&&value!==undefined/);
});
