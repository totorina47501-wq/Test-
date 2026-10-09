# Audit de hiérarchie — BitGold V4.5

## Méthode
Revue statique de `server/public/index.html`, des composants V4 et des tests E2E. Les constats décrivent le DOM et la présentation prévue, **pas** une validation visuelle d'une session utilisateur connectée en production.

## Visiteur (non connecté)
1. **Promesse et contexte** : hero « Explorez la crypto », simulation explicitement annoncée.
2. **Action principale** : créer un compte ; action secondaire : explorer la démo.
3. **Preuve / rassurance** : absence de dépôt, portefeuille virtuel, bots explicables et mention du risque.
4. **Exploration** : aperçu interactif de cinq outils, raccourcis marchés/bots/portefeuille, parcours guidé.
5. **Approfondissement** : valeurs, marchés, actualités et explications.

**Constat** : le haut de page cumule hero, aperçu, raccourcis et parcours guidé ; plusieurs éléments promettent une exploration similaire. Le carrousel contient des iframes de pages réelles, non des images publiées. Certaines vues (activité, portefeuille) nécessitent une authentification : ne pas les présenter comme accessibles librement.

**Action V4.5** : CTA primaire et texte de promesse plus lisibles, explications du carrousel mieux hiérarchisées, confort mobile. **À suivre** : rationaliser les modules redondants après validation des parcours et captures visuelles.

## Utilisateur connecté
1. **Cockpit** : titre, simulation, indicateurs personnels, performance et exposition.
2. **Navigation métier** : Investir, bots IA, portefeuille, activité.
3. **Actions / préférences** : personnalisation performance/risque/bots, visibilité des modules.
4. **Secondaire** : raccourcis répétés, actualités compactes, contenus pédagogiques.

**Constat** : les contrôles de personnalisation apparaissent dans l'en-tête du cockpit, avant les données clés ; les blocs « guide », « raccourcis » et « quickstart » sont proches dans leur intention. Les données de portefeuille doivent rester strictement réservées aux sessions authentifiées.

**Action V4.5** : renforcement léger de la lisibilité du cockpit et des raccourcis. **À suivre** : placer les KPI au-dessus des préférences et réduire les doubles appels à l'action, avec tests authentifiés pour éviter les régressions.

## Critères de livraison
- Aucune donnée personnelle ni performance inventée dans les aperçus visiteurs.
- Pas de modification du fonctionnement de l'authentification ou des bots.
- Vérification des tests GitHub et parcours E2E avant chaque fusion staging puis main.
- Les PNG produits comme artefacts CI ne sont **pas** encore des fichiers publics dans `server/public/showcase`. L'intégration visuelle des images reste une tâche distincte.
