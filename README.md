# BitGold

Prototype d'interface pour une application d'investissement crypto.

## Contenu
- Dashboard BitGold responsive
- Marchés crypto avec données CoinGecko et valeurs de secours
- Simulateur d'investissement
- Inscription / connexion avec JWT
- PostgreSQL pour portefeuille et historique
- Achats/ventes papier côté serveur
- Avertissement clair : aucun investissement réel

## Important
Le prototype ne gère ni argent, ni crypto-actifs, ni comptes réels. Pour passer en production, il faudra notamment traiter la conformité réglementaire, KYC/AML, sécurité, conservation des actifs et intégration d'un prestataire autorisé selon les pays visés.

## Architecture Northflank

Le frontend et l'API sont servis par le même service Node/Express. Le dossier `server/public/` contient le frontend et Express le sert sur la même origine que `/api/*`.

### Configuration Northflank

1. Créer un projet **Developer Sandbox**.
2. Créer un addon **PostgreSQL**.
3. Créer un service depuis ce dépôt GitHub.
4. Configurer le répertoire du service sur `server` et utiliser `server/Dockerfile`.
5. Exposer le port HTTP `3000`.
6. Ajouter les variables :
   - `DATABASE_URL` : URL PostgreSQL fournie par l'addon.
   - `JWT_SECRET` : secret aléatoire long et unique.
   - `CLIENT_ORIGIN` : optionnel si le service est consommé depuis une autre origine.
7. Déployer.
8. Vérifier que `/api/health` renvoie `{"ok":true,...}`.
9. Ouvrir la page publique du service Northflank et tester inscription puis connexion.

### Connexion

Le frontend utilise automatiquement son propre domaine pour appeler l'API. Il n'y a plus d'URL Northflank/code.run codée en dur.

Une URL d'API peut être forcée uniquement pour un cas particulier avec :

```js
localStorage.setItem("bitgold-api", "https://votre-api.example")
```

Pour un déploiement frontend + API dans le même service Northflank, cette surcharge n'est pas nécessaire.

## Dépannage

- **"Impossible de joindre l'API"** : vérifier le déploiement du service et `/api/health`.
- **"Erreur serveur."** à la connexion : vérifier les logs Northflank et `DATABASE_URL`.
- **"Identifiants incorrects."** : l'API répond correctement mais aucun compte correspondant n'est présent dans la base PostgreSQL utilisée par ce service.
- Si une ancienne session est conservée après un changement de déploiement, supprimer le stockage local du site puis se reconnecter.

**Pas de transactions réelles.** Pour passer en production : base de données managée, secrets sécurisés, sessions robustes, KYC/AML, prestataire crypto/paiement autorisé et audit de sécurité/réglementaire.
