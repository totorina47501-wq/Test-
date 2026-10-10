# Audit des critères UX V4 (#274–#278)

Date : 2026-10-10. Périmètre : inspection statique du code sur staging, **pas** une validation visuelle de production. Référence : #343. Aucun ticket fermé sans preuve complète.

| Ticket | Critère | Preuve examinée | Verdict |
| --- | --- | --- | --- |
| #274 | Navigation et architecture desktop/mobile | `server/public/index.html` contient les sections `dashboard`, `marches`, `botComparatorPanel`; `server/public/bitgold-v4.css` contient les styles responsive | Partiel : parcours réels et tailles d'écran non validés |
| #274 | Tokens sémantiques et glassmorphism | `server/public/bitgold-v4.css` : `--v4-mint`, `--v4-loss`, `--v4-warning`, `--v4-glass` | Présent dans le code, audit de cohérence visuelle restant |
| #275 | Carrousel accessible d'outils réels | `server/public/bitgold-v4.js` décrit les pages réelles et leurs liens, sans image fictive | Partiel : tests clavier et captures anonymisées authentiques non prouvés |
| #276 | Hiérarchie performance, positions, bots et risque | `server/public/index.html` : `dashPerformance`, `dashRisk`, `dashBots`, portefeuille | Partiel : rendu desktop/mobile à valider |
| #277 | Bots IA, comparateur et espace Investir | `server/public/index.html` : `botComparatorPanel`, `marches`; `server/public/app.js` : simulateur et logique de cockpit | Partiel : parcours achat/vente et placement visuel à valider |
| #278 | Tokens perte rouge, avertissement ambre, gain menthe | `server/public/bitgold-v4.css` : `--v4-loss:#f87171`, `--v4-warning:#fbbf24`, `--v4-mint:#b3ffca` | Présent dans le code |
| #278 | Reduced motion, contraste WCAG AA, responsive CI | `server/public/bitgold-v4.css` contient `prefers-reduced-motion` | Partiel : contraste WCAG AA et navigation responsive non démontrés |

## Contrôles encore requis
1. Vérifier sur staging et Northflank le rendu réel aux largeurs mobiles et desktop, sans données sensibles dans les captures.
2. Tester au clavier le carrousel, les modales et la navigation, avec technologies d'assistance si possible.
3. Mesurer le contraste WCAG AA sur les états actifs, les alertes et les textes.
4. Réconcilier les PR #289–#306 avec chaque critère avant fermeture.
5. Ne pas confondre succès CI, vérification statique et preuve de déploiement Northflank.

## Hors périmètre
Les dépendances externes #67, #71, #72, #75 restent ouvertes. Aucun argent réel.
