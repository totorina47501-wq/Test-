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


## Portée de lancement — 15 octobre 2026
- Langues exposées : français, anglais et espagnol. Allemand et portugais brésilien ne sont plus proposés dans le sélecteur.
- La passe de fermeture i18n doit traiter les chaînes visibles comme des données localisées, jamais comme des littéraux JSX.
- Les formats de nombres, dates et devises suivent la locale active (fr-FR, en-GB, es-ES).
- Toute nouvelle interface doit utiliser le dictionnaire ou une table de copie typée et conserver les tests TypeScript/TSX verts.

## Reprise consolidée — 16 octobre 2026
- Reprise de la PR #562 dans une branche unique, sans recréer les dictionnaires : langue active FR/EN/ES, textes du shell public et cockpit dans des tables typées, nombre/date/devise en fonction de la locale.
- Les modules fonctionnels possèdent encore des libellés et messages serveur écrits en français : audit complet des écrans et tests de bascule linguistique nécessaires avant tout certificat de couverture à 100 %. Ne pas présenter cette passe comme une traduction exhaustive.
- Vérifications obligatoires : CI React/TSX, tests backend et Playwright ; smoke invité et authentifié après merge sur main. Les stratégies Silver/Shield/Gold, l'authentification, les paiements et transactions simulées restent inchangés.

## Régression production — 16 octobre 2026
- La suite Playwright authentifiée fige explicitement la langue française via le stockage navigateur avant navigation. Les assertions françaises ne doivent pas dépendre d'une préférence linguistique persistée ou d'un défaut implicite.
- Le smoke main du merge #567 a également échoué sur le backtest BTC (HTTP 502). Il s'agit d'une indisponibilité serveur/fournisseur distincte de l'i18n, à investiguer sans masquer le test ni inventer de résultats.

## Passe ciblée 17 octobre 2026
- Localisation des états de chargement/erreur du portefeuille, libellés du backtest et des graphiques cockpit, y compris les formats monétaires et les dates.
- Cette passe est partielle : financement simulé, landing et plusieurs composants gardent des littéraux français. Une couverture FR/EN/ES complète et des tests de bascule navigateur restent à livrer.

## Quantum Fund (18 octobre 2026)
- Traduction FR/EN/ES des libellés, erreurs locales, tableaux, graphiques et formats numériques, sans modification des stratégies.
- Audit des autres écrans et des messages API encore nécessaire : ne pas déclarer 100 % sans contrôle visuel et automatisé.

## Observatoire des bots (20 octobre 2026)
- Localisation FR/EN/ES du journal des bots : résumé, filtres, périodes, erreurs, chronologie, accessibilité, dates et volumes monétaires.
- La logique des bots et les API restent inchangées ; les valeurs d'action/statut et les raisons renvoyées par le serveur peuvent rester non localisées : prévoir des codes stables pour les traduire.
- Audit global toujours ouvert ; cette livraison ne certifie pas 100 % de couverture.
