# BitGold React — déploiement progressif

Le site historique reste à la racine `/`. Le cockpit React est un aperçu en lecture seule accessible sur `/react-preview/` **uniquement** avec l'image Docker optionnelle.

## Développement
```sh
cd frontend
npm install
npm run build
npm run dev
```
Le serveur Vite redirige les appels `/api` vers Express sur le port 3000.

## Image de prévisualisation
Depuis la racine du dépôt :
```sh
docker build -f server/Dockerfile.react-preview -t bitgold-react-preview .
```
L'image contient le serveur historique et les fichiers React compilés. Elle sert `/react-preview/`, sans modifier les routes historiques.

## Northflank
Le service actuel qui construit `server/Dockerfile` avec le contexte `server` **ne change pas**. Pour activer l'aperçu sur Northflank, créer de préférence un service de test avec **build context racine du dépôt** (`.`) et **Dockerfile `server/Dockerfile.react-preview`**, ou ajuster ces paramètres sur un environnement staging. Conserver les variables d'environnement et secrets existants du backend, sans les publier. Ne pas basculer la production avant vérification des parcours utilisateur.

L'authentification du cockpit utilise le jeton BitGold existant dans le navigateur. L'aperçu et le site historique doivent partager la même origine pour réutiliser la session. Aucun ordre d'achat ou de vente n'est émis depuis React.
