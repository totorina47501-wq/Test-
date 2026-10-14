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
