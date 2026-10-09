import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import { fileURLToPath } from 'node:url';const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../public');const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),css=fs.readFileSync(path.join(root,'bitgold-v4.css'),'utf8'),js=fs.readFileSync(path.join(root,'bitgold-v4.js'),'utf8');
test('V4 showcase is connected to actual BitGold routes',()=>{assert.match(html,/id="v4FeatureStage"/);assert.match(html,/id="v4FeatureFrame"/);assert.match(html,/bitgold-v4\.css/);assert.match(html,/bitgold-v4\.js/);for(const route of ['/investir','/#dashboard','/#bots','/activite','/#transparence'])assert.ok(js.includes(route),route);assert.doesNotMatch(js,/images\.unsplash|placehold\.co|pixabay|fakeScreenshot/i)});
test('V4 carousel is controllable by buttons, touch and keyboard',()=>{assert.match(html,/id="v4FeaturePrev"/);assert.match(html,/id="v4FeatureNext"/);assert.match(js,/ArrowRight/);assert.match(js,/touchstart/);assert.match(js,/aria-current/);assert.match(html,/tabindex="-1"/)});
test('V4 uses mint gains, red losses and semantic warnings',()=>{assert.match(css,/--v4-mint:#b3ffca/);assert.match(css,/--v4-loss:#f87171/);assert.match(css,/--v4-critical:#ef4444/);assert.match(css,/--v4-warning:#fbbf24/);assert.match(css,/prefers-reduced-motion/);assert.match(css,/max-width:760px/)});

test('V4.6 puts connected KPIs before secondary shortcuts and keeps risk disclosure',()=>{
  const start=html.indexOf('id="dashboard"'),end=html.indexOf('id="dashTotal"',start),guide=html.indexOf('class="v4-cockpit-guide"',start),shortcuts=html.indexOf('class="bg2-shortcuts"',start);
  assert.ok(start>=0&&end>start&&guide>end&&shortcuts>guide,'KPI data must precede guide and shortcuts');
  assert.ok(html.includes('class="bg-dashboard-disclaimer"'),'simulation disclosure remains visible');
  assert.ok(!html.includes('class="ux15-quickstart"'),'duplicated connected CTA block removed');
  assert.match(html,/id="heroSignup"/);
  assert.match(html,/id="heroDemo"/);
});
