import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const publicDir=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../public");
const files=["styles.css","app.js","index.html","bitgold-v3.css"];
test("BitGold chart and interface accents use mint, not fluorescent lime",()=>{
  for(const file of files){
    const source=fs.readFileSync(path.join(publicDir,file),"utf8");
    assert.doesNotMatch(source,/#c8ff45/i,file+" still contains fluorescent lime");
  }
  const app=fs.readFileSync(path.join(publicDir,"app.js"),"utf8");
  assert.match(app,/stroke=\\?"#b3ffca/);
  const css=fs.readFileSync(path.join(publicDir,"styles.css"),"utf8");
  assert.match(css,/\.market-periods button\.active\{background:#b3ffca/);
  const html=fs.readFileSync(path.join(publicDir,"index.html"),"utf8");
  assert.match(html,/app\.js\?v=20261009-mint1/);
});
