import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const publicDir=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../public");
const files=["styles.css","app.js","index.html","bitgold-v3.css","bitgold-2.css","ux-bots-guide-1-5.css","ux-cockpit-1-5.css","ux-premium-1-5.css","sticky-header.css"];
test("BitGold chart and interface accents use mint, not fluorescent lime",()=>{
  for(const file of files){
    const source=fs.readFileSync(path.join(publicDir,file),"utf8");
    assert.doesNotMatch(source,/#c8ff45|#d7ff91|#43e5b8|#86f3d0|rgba\(\s*200\s*,\s*255\s*,\s*69\s*,|rgba\(\s*67\s*,\s*229\s*,\s*184\s*,/i,file+" still contains a legacy fluorescent accent");
  }
  const app=fs.readFileSync(path.join(publicDir,"app.js"),"utf8");
  assert.match(app,/stroke=\\?"#b3ffca/);
  const css=fs.readFileSync(path.join(publicDir,"styles.css"),"utf8");
  assert.match(css,/\.market-periods button\.active\{background:#b3ffca/);
  const html=fs.readFileSync(path.join(publicDir,"index.html"),"utf8");
  assert.match(html,/app\.js\?v=20261009-mint1/);
});
