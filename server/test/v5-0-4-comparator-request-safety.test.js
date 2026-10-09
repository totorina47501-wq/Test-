import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const source=readFileSync(new URL("../public/app.js",import.meta.url),"utf8");
test("comparator ignores late results after a newer request",()=>{
 assert.match(source,/let comparatorRequestVersion=0;/);
 assert.match(source,/const requestVersion=\+\+comparatorRequestVersion;/);
 assert.match(source,/if\(requestVersion!==comparatorRequestVersion\)return;\s*const rows=/);
 assert.match(source,/\}catch\(error\)\{\s*if\(requestVersion!==comparatorRequestVersion\)return;/);
});
test("changing comparison inputs invalidates cached cards and pending results",()=>{
 assert.match(source,/input\.addEventListener\("change",\(\)=>\{\s*comparatorRequestVersion\+\+;/);
 assert.match(source,/getElementById\("botComparatorDays"\)\?\.addEventListener\("change",\(\)=>\{\s*comparatorRequestVersion\+\+;/);
 assert.match(source,/Sélection modifiée : relancez la comparaison/);
 assert.match(source,/Période modifiée : relancez la comparaison/);
});
