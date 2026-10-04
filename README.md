# BitGold

Prototype d'interface pour une application d'investissement crypto.

## Contenu
- Dashboard BitGold responsive
- Marchés crypto en données de démonstration
- Simulateur d'investissement
- Modales d'inscription/connexion
- Avertissement clair : aucun investissement réel

## Important
Le prototype ne gère ni argent, ni crypto-actifs, ni comptes réels. Pour passer en production, il faudra notamment traiter la conformité réglementaire, KYC/AML, sécurité, conservation des actifs et intégration d'un prestataire autorisé selon les pays visés.

## Architecture MVP
- Frontend statique compatible GitHub Pages
- API Node/Express dans `server/`
- Authentification par email + mot de passe haché
- PostgreSQL pour portefeuille et historique
- Achats/ventes papier côté serveur
- Dockerfile prêt pour un hébergeur backend

### Déploiement sans Render

Le frontend reste sur GitHub Pages et le backend reste dans `server/`.

Pour le backend, Northflank propose actuellement un Developer Sandbox gratuit et indique qu'aucune carte bancaire n'est requise. Le plan gratuit inclut des services et une base de données.

Configuration :
1. Créer un projet **Developer Sandbox**.
2. Créer un addon **PostgreSQL**.
3. Créer un service depuis ce dépôt GitHub.
4. Utiliser `server/Dockerfile` et `server` comme répertoire du service si l'interface le demande.
5. Exposer le port HTTP `3000`.
6. Ajouter :
   - `DATABASE_URL` : URL PostgreSQL fournie par l'addon
   - `JWT_SECRET` : valeur aléatoire longue
   - `CLIENT_ORIGIN` : `https://totorina47501-wq.github.io`
7. Déployer puis vérifier `/api/health`.
8. Dans le navigateur, définir l'URL publique de l'API :
   `localStorage.setItem("bitgold-api","https://TON-URL")`

**Pas de transactions réelles.** Pour passer en production : base de données managée, secrets sécurisés, sessions robustes, KYC/AML, prestataire crypto/paiement autorisé et audit de sécurité/réglementaire.
