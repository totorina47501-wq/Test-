import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = path.resolve(process.cwd());
const appPath = path.join(root, "public/app.js");
const app = fs.readFileSync(appPath, "utf8");

test("le bundle front passe toujours le parseur JavaScript", () => {
  execFileSync(process.execPath, ["--check", appPath], { stdio: "pipe" });
});

test("les messages HTML injectés dans le front restent des chaînes valides", () => {
  assert.doesNotMatch(app, /:"<div class="history-empty">/);
  assert.match(app, /class=\\\"history-empty\\\"/);
});

test("les outils graphiques Elite ont leurs dépendances déclarées", () => {
  assert.match(app, /function bindEliteChartTools\(\)/);
  assert.match(app, /function calculateIndicators\(points\)/);
  assert.match(app, /calculateIndicators\(clean\)/);
});

test("l'activation des outils graphiques reste strictement réservée à Elite", () => {
  assert.match(app, /botState\.plan\?\.plan==="elite"/);
  assert.match(app, /botState\.plan\?\.features\?\.chartAdvanced===true/);
});


test("les décisions IA ont un endpoint et un statut visibles",()=>{assert.match(app,/api\\/bots\\/\\+encodeURIComponent\\(type\\)\\+\\"\\/decision\\"/);assert.match(app,/botsAIStatus/);assert.match(app,/botAIConfidence/);});
