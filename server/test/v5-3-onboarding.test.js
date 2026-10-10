import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../public');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
test('V5.3 onboarding is scoped and available on investing and dashboard',()=>{
 const onboarding=read('onboarding-v5-3.js'), loader=read('bitgold-v4.js');
 assert.match(onboarding,/window\.location\.pathname/);
 assert.match(onboarding,/is-authenticated/);
 assert.match(loader,/onboarding-v5-3\.js\?v=2/);
 assert.match(loader,/location\.pathname === '\/'/);
});
test('V5.3 records only allowlisted anonymous events locally, never a token',()=>{
 const src=read('onboarding-v5-3.js');
 assert.match(src,/new Set\(\['onboarding_view'/);
 assert.match(src,/localStorage\.setItem/);
 assert.match(src,/metrics\.slice\(-maxEntries\)/);
 assert.doesNotMatch(src,/authorization|apiToken|email|password|Bearer/i);
});
test('V5.3 completes onboarding milestones from wallet and trade events',()=>{
 const app=read('app.js'), src=read('onboarding-v5-3.js');
 assert.match(app,/bitgold:wallet-loaded/);
 assert.match(src,/bitgold:wallet-loaded/);
 assert.match(src,/bitgold:simulated-trade/);
 assert.match(src,/onboarding_return_d1/);
});
test('V5.3 guides empty portfolio without actual-money action',()=>{
 const app=read('app.js'), css=read('onboarding-v5-3.css');
 assert.match(app,/bitgoldPortfolioEmpty/);
 assert.match(app,/première opération simulée/);
 assert.match(css,/bitgold-portfolio-empty/);
});
