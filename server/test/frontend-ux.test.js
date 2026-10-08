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
  assert.match(html, /Bienvenue sur BitGold/);
  assert.match(html, /La crypto, plus simple à comprendre/);
  assert.match(html, /href="#parcours"[^>]*>Découvrir BitGold/);
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


test("le retour du journal cible le tableau de bord et respecte les mouvements réduits", () => {
  assert.match(app, /function closeActivity\(\)/);
  assert.match(app, /history\.pushState\(\{\}, "", "\/#dashboard"\)/);
  assert.match(app, /prefers-reduced-motion: reduce/);
});

test("le journal affiche des états accessibles et propose de réessayer après erreur", () => {
  assert.match(app, /aria-busy/);
  assert.match(app, /role="status"/);
  assert.match(app, /role="alert"/);
  assert.match(app, /id="activityRetry"/);
  assert.match(app, /addEventListener\("click",loadActivity\)/);
});


test("l'accueil non connecté présente un parcours accueillant et les valeurs BitGold", () => {
  assert.match(html, /Bienvenue sur BitGold/);
  assert.match(html, /href="#parcours">Découvrir BitGold/);
  assert.match(html, /id="parcours"/);
  assert.match(html, /id="valeurs"/);
  for (const value of ["Clarté", "Transparence", "Contrôle", "Responsabilité"]) {
    assert.match(html, new RegExp("<h3>" + value + "</h3>"));
  }
  assert.match(html, /Aucun bot ne passe d’ordre réel/);
  assert.match(html, /aucune promesse de rendement/);
  assert.match(css, /bg-values-grid/);
  assert.match(css, /max-width:560px/);
});

test("le cockpit précise explicitement le caractère simulé des chiffres", () => {
  assert.match(html, /bg-dashboard-disclaimer/);
  assert.match(html, /Soldes, opérations et performances sont simulés/);
  assert.match(html, /Les cours de marché peuvent provenir de fournisseurs externes/);
});


test("le journal permet une recherche combinée aux filtres", () => {
  assert.match(html, /id="activitySearch" type="search"/);
  assert.match(html, /id="activitySearchCount" role="status"/);
  assert.match(app, /getElementById\("activitySearch"\)/);
  assert.match(app, /toLocaleLowerCase\("fr"\)/);
  assert.match(app, /addEventListener\("input",\(\)=>renderActivity/);
  assert.match(css, /bg-activity-tools/);
});


test("l'accueil invité présente une promesse accueillante et honnête", () => {
  assert.match(html, /Bienvenue sur BitGold/);
  assert.match(html, /La crypto, plus simple à comprendre/);
  assert.match(html, /href="#parcours"/);
  assert.match(html, /Sans dépôt/);
  assert.match(html, /100 %/);
});

test("les quatre valeurs BitGold sont accessibles depuis l'accueil", () => {
  assert.match(html, /id="valeurs"/);
  assert.match(html, /Clarté/);
  assert.match(html, /Transparence/);
  assert.match(html, /Contrôle/);
  assert.match(html, /Responsabilité/);
  assert.match(html, /aucune promesse de rendement/);
});

test("le cockpit distingue explicitement les simulations des cours externes", () => {
  assert.match(html, /bg-dashboard-disclaimer/);
  assert.match(html, /Portefeuille de démonstration/);
  assert.match(html, /Les cours de marché peuvent provenir de fournisseurs externes/);
  assert.match(css, /bg-values-grid/);
});

const backend = fs.readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
test("V1.4: un jeton de challenge 2FA ne donne pas accès aux routes authentifiées", () => {
  assert.match(backend, /if\(payload\.purpose\|\|!Number\.isSafeInteger/);
  assert.match(backend, /jwt\.verify\(match\[1\],secret,\{algorithms:\["HS256"\]\}\)/);
  assert.match(backend, /\^Bearer \(\[\^\\s\]\+\)\$/);
});

const v14Frontend = fs.readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
const v14Backend = fs.readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
test("V1.4: inscription protégée contre les tentatives répétées", () => {
  assert.match(v14Backend, /app\.post\("\/api\/auth\/signup", authRateLimit/);
});
test("V1.4: session expirée déconnecte et propose une reconnexion", () => {
  assert.match(v14Frontend, /r\.status===401 && apiToken/);
  assert.match(v14Frontend, /Votre session a expiré\. Reconnectez-vous/);
});
test("V1.4: tableau de bord accessible avec réessai après erreur", () => {
  assert.match(v14Frontend, /chart\.setAttribute\("aria-busy","true"\)/);
  assert.match(v14Frontend, /retry\.addEventListener\("click",\(\)=>loadDashboard\(\)\)/);
  assert.match(v14Frontend, /message\.setAttribute\("role","alert"\)/);
});

test("V1.4: journal conserve le filtre actif au rechargement", () => {
  assert.match(v14Frontend, /document\.querySelector\("\[data-activity-filter\]\.active"\)/);
});
test("V1.4: journal affiche une erreur accessible sans HTML non fiable", () => {
  assert.match(v14Frontend, /message\.textContent=e\.message\|\|"Journal temporairement indisponible\."/);
  assert.match(v14Frontend, /log\.replaceChildren\(message\)/);
  assert.match(v14Frontend, /retry\.addEventListener\("click",loadActivity\)/);
});
