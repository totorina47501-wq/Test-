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
    "Ledger"
  ]) {
    assert.ok(html.includes(marker), `marqueur absent: ${marker}`);
  }
});

test("le Ledger expose un parcours utilisateur lisible", () => {
  assert.match(html, /LEDGER · JOURNAL PERSONNEL/);
  assert.match(html, /Votre Ledger BitGold/);
  assert.match(html, /quoi, pourquoi, quand et avec quel statut/);
  assert.match(html, /data-activity-filter="bot"/);
  assert.match(html, /data-activity-filter="buy"/);
  assert.match(html, /data-activity-filter="sell"/);
});

test("les identifiants HTML restent uniques", () => {
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
  const duplicates = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
  assert.deepEqual(duplicates, [], `IDs dupliqués: ${duplicates.join(", ")}`);
});
