# Internationalisation — audit et corrections

## État constaté (14 octobre 2026)

Le dépôt utilise déjà un dictionnaire React local dans `frontend/src/i18n.ts` pour fr, en, es, de et pt-BR. Le composant Investir exploite ce système, mais d'autres écrans contiennent encore du français en dur : `App.tsx`, `LandingPage.tsx`, `AccountPage.tsx`, `CockpitPremium.tsx`, composants des bots et formulaires annexes. Des formats `fr-FR` sont également codés en dur. Il serait inexact de déclarer l'application entièrement traduite.

## Correctif livré dans ce lot

Le dialogue d'authentification (connexion, inscription et 2FA) utilise désormais les vingt clés `auth*` traduites dans les cinq langues. Le bouton Google Identity Services reçoit la locale active. Les flux d'authentification et la logique 2FA restent inchangés.

## Contrôles recommandés avant fusion

- Exécuter le build TypeScript/Vite et les tests de connexion, inscription et 2FA.
- Vérifier manuellement les cinq langues sur le dialogue, notamment les libellés accessibles.
- Ajouter ensuite un contrôle statique pour les textes JSX non traduits et les formats `fr-FR`, puis traduire par écran sans changer les règles métier.
- Vérifier les messages serveur exposés aux utilisateurs, en traduisant côté interface des codes d'erreur stables plutôt que des chaînes arbitraires.

## Solution gratuite

Conserver le dictionnaire local et `Intl` est gratuit, sans service tiers ni coût de licence. `i18next` et `react-i18next` sont également libres et gratuits si une migration devient utile. Les services de traduction hébergés peuvent avoir des quotas ou frais : ils ne sont pas requis ici.

## Lot complémentaire

Traduction de libellés statiques supplémentaires dans les écrans principaux et les composants de sécurité, cockpit, portefeuille et bots, avec clés cohérentes dans les cinq dictionnaires. Restent à contrôler les phrases interpolées, les erreurs API et le contenu marketing long : ne pas déclarer une couverture totale sans audit automatisé.

## Complément (14 octobre 2026)
- Localisation du guide d'onboarding, consentement marketing local et résumé Micro Alpha dans les cinq langues, sans changer les flux métiers.
- Les libellés accessibles suivent la langue active. Les valeurs monétaires du résumé Micro Alpha utilisent `Intl` avec la locale sélectionnée.
- L'audit exhaustif des autres composants, erreurs API et dates reste nécessaire avant de certifier 100 % de couverture.

## Lot de finition complémentaire
- Composants Micro Alpha (laboratoire et compte persistant) et laboratoire de backtests : traduction progressive avec le dictionnaire existant, et formats monétaires alignés sur la locale.
- Les textes restants doivent être détectés par un contrôle statique avant toute affirmation de couverture intégrale ; certains retours serveur et phrases composées restent en français.

## Passe de traduction ciblée — 14 octobre 2026
- Réutilisation du dictionnaire existant, sans service de traduction payant.
- Textes statiques complémentaires dans portefeuille, cockpit, profil, sécurité, Quantum Fund et Micro Alpha.
- La traduction des erreurs API dynamiques et des libellés composés doit être validée en revue visuelle dans les cinq langues. Ne pas affirmer 100 % sans inventaire exhaustif.

## Landing multilingue et captures (14 octobre 2026)
- `LandingPage.tsx` sélectionne une capture de la vraie interface via `/showcase/<langue>/<fichier>` ; les captures historiques restent le repli si une variante localisée manque.
- `server/scripts/capture-showcase.mjs` prévoit les cinq variantes linguistiques, avec données synthétiques isolées pour les modules privés. Les images localisées ne sont pas automatiquement présentes : exécuter le script dans un environnement de capture Playwright, inspecter les résultats et committer les PNG avant de déclarer la livraison visuelle complète.
- Les illustrations schématiques et textes JSX restant en français doivent faire l’objet d’une passe finale de localisation. Ne pas prétendre que tous les écrans et toutes les captures sont traduits avant vérification.

## Clôture des captures localisées — lot en cours
- Les onglets de l’espace connecté utilisent désormais les libellés du dictionnaire actif et des identifiants de test stables, afin que Playwright capture la bonne vue indépendamment de la langue.
- Le workflow archive récursivement `server/public/showcase/<langue>/...` et publie récursivement ces captures synthétiques sur `main` après validation du workflow de push. Cela permet à la landing de charger de vraies captures localisées au lieu de retomber systématiquement sur les PNG racine.
- Cette étape ferme le défaut de pipeline d’images. L’audit des chaînes françaises restantes dans les composants continue : ne pas annoncer 100 % de couverture tant que le contrôle statique final n’est pas vert.
