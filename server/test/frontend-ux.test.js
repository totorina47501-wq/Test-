import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync(new URL("../public/index.html", import.meta.url), "utf8");

test("landing place les bots avant les tarifs", () => {
  const bots = html.indexOf('id="bots"');
  const decision = html.indexOf('id="bot-decision-flow"');
  const pricing = html.indexOf('id="pricings"');

  assert.ok(bots >= 0, "section bots absente");
  assert.ok(decision > bots, "le parcours de décision doit suivre les bots");
  assert.ok(pricing > decision, "les tarifs doivent arriver après la valeur produit");
});

test("hero présente les bots comme proposition de valeur principale", () => {
  assert.match(html, /BitGold AI · bots intelligents/);
  assert.match(html, /Des bots intelligents pour/);
  assert.match(html, /href="#bots"[^>]*>Découvrir les Bots IA/);
});

test("le parcours d'une décision est explicitement expliqué", () => {
  for (const marker of [
    "Signal marché",
    "Lecture du bot",
    "Garde-fous",
    "Journal",
    "Signal IA",
    "Risk check",
    "Limites",
    "Simulation",
    "Journal d’activité"
  ]) {
    assert.ok(html.includes(marker), `marqueur absent: ${marker}`);
  }
});

test("le journal d’activité expose un parcours utilisateur lisible", () => {
  assert.match(html, /HISTORIQUE · JOURNAL D’ACTIVITÉ/);
  assert.match(html, /Votre historique BitGold/);
  assert.match(html, /journal opérationnel clair/);
  assert.match(html, /data-activity-filter="bot"/);
  assert.match(html, /data-activity-filter="buy"/);
  assert.match(html, /data-activity-filter="sell"/);
});

test("les identifiants HTML restent uniques", () => {
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
  const duplicates = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
  assert.deepEqual(duplicates, [], `IDs dupliqués: ${duplicates.join(", ")}`);
});


const app = fs.readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../public/styles.css", import.meta.url), "utf8");

test("les boutons de navigation vers le journal ouvrent la vue et le retour est câblé", () => {
  for (const id of ["dashboardActivityLink", "dashDecisionOpen", "activityNav", "activityBack"]) {
    assert.match(html, new RegExp('id="' + id + '"'));
    assert.match(app, new RegExp('getElementById\\("' + id + '"\\)'));
  }
  assert.match(app, /dashboardActivityLink"\)\?\.addEventListener\("click",event=>\{event\.preventDefault\(\);openActivity\(\)/);
  assert.match(app, /dashDecisionOpen"\)\?\.addEventListener\("click",\(\)=>openActivity\(\)/);
});

test("les boutons de filtres du journal correspondent aux catégories disponibles", () => {
  for (const filter of ["all", "bot", "buy", "sell", "subscription"]) {
    assert.match(html, new RegExp('data-activity-filter="' + filter + '"'));
  }
  assert.match(app, /data-activity-filter/);
});

test("les panneaux et le journal sont contraints à la largeur mobile", () => {
  assert.match(html, /name="viewport" content="width=device-width, initial-scale=1\.0"/);
  assert.match(css, /mobile-first layout safeguards/);
  assert.match(css, /overflow-x:clip/);
  assert.match(css, /focus-visible/);
  assert.match(css, /activity-page-shell/);
});
