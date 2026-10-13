import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
const root=path.resolve(process.cwd());
const publicDir=path.join(root,"public/seo-guides");
const source=fs.readFileSync(path.join(root,"src/index.js"),"utf8");
const pages=["simulateur-crypto","bots-ia-crypto","portefeuille-virtuel","risques-crypto"];
test("crawlable educational pages have distinct metadata and explicit simulation warning",()=>{
 for(const slug of pages){const html=fs.readFileSync(path.join(publicDir,slug+".html"),"utf8");assert.match(html,/<html lang="fr">/);assert.match(html,/<meta name="description"/);assert.ok(html.includes('/guides/'+slug));assert.match(html,/rel="canonical"/);assert.match(html,/Aucun ordre réel/);assert.match(html,/<main>/);assert.doesNotMatch(html,/auth-token|JWT_SECRET|bitgold-token/)}
});
test("guide index links only to published public guides",()=>{const index=fs.readFileSync(path.join(publicDir,"index.html"),"utf8");for(const slug of pages)assert.ok(index.includes('/guides/'+slug));assert.ok(index.includes('<main>'))});
test("server routes sitemap and robots without exposing portfolio in sitemap",()=>{assert.match(source,/app.get\("\/sitemap.xml"/);assert.match(source,/app.get\("\/robots.txt"/);assert.match(source,/\/guides/);assert.match(source,/seoPublicPaths.has\(slug\)/);assert.ok(source.includes("Disallow: /portefeuille"));const sitemap=source.match(/app.get\("\/sitemap.xml".*?/);assert.ok(sitemap);assert.ok(!source.includes("<loc>https://p01--service-bitgold--dvn9t2gvmtgx.code.run/portefeuille"))});
