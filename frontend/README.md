# BitGold React — interface de production

React (Vite/TypeScript) est l'interface principale de BitGold en production. L'image `server/Dockerfile` construit le frontend React et le sert à la racine `/` avec `FRONTEND_MODE=react` par défaut. Le frontend historique reste présent pour un éventuel rollback contrôlé.

## Développement

```sh
cd frontend
npm ci
npm run build
npm run dev
```

Le serveur Vite redirige les appels `/api` vers Express sur le port 3000.

## Prévisualisation optionnelle

L'image `server/Dockerfile.react-preview` reste disponible pour un environnement de test isolé. Depuis la racine du dépôt :

```sh
docker build -f server/Dockerfile.react-preview -t bitgold-react-preview .
```

Elle sert React sur `/react-preview/`, sans changer la configuration de production.

## Production et sécurité

- Utiliser `server/Dockerfile` avec le contexte de build à la racine du dépôt.
- Garder les variables d'environnement et secrets backend dans Northflank, jamais dans le dépôt.
- L'authentification React réutilise les jetons et contrôles de session existants ; ne pas introduire de contournement 2FA.
- Les achats/ventes disponibles dans React sont des **simulations**, pas des ordres réels.
- Respecter le flux PR → `staging` (CI vertes) → `main` (CI vertes), puis vérifier les parcours publics et authentifiés en production.

Pour les critères de validation, le diagnostic et le rollback de l'interface, voir [le runbook de production](../docs/react-production-runbook.md).
