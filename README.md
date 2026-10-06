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

## Bots Free / Pro

- **Free** : 1 bot actif, Shield Bot inclus.
- **Pro** : jusqu'à 3 bots actifs, Silver Bot, Gold Bot et Adaptive AI Bot.
- **Adaptive AI** : moteur déterministe et explicable combinant momentum, RSI, position dans le range et volatilité, sans API IA externe.
- Les ordres des bots restent **100 % simulés** dans le portefeuille démo.
- Le changement Free/Pro présent dans cette version est un **mode de démonstration** ; un vrai paiement devra être relié à un prestataire de paiement avant commercialisation.


## Stripe — configuration prête

L'intégration Stripe est préparée côté serveur, sans aucune clé dans Git :
- Checkout abonnement **Pro** et **Elite** via les Price IDs Stripe.
- Customer Portal pour gérer l'abonnement.
- Webhook signé pour synchroniser automatiquement Free / Pro / Elite dans PostgreSQL.
- Les clés et Price IDs sont à renseigner dans **Northflank** uniquement.

Variables Northflank : STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRO_PRICE_ID, STRIPE_ELITE_PRICE_ID, STRIPE_SUCCESS_URL, STRIPE_CANCEL_URL, STRIPE_PORTAL_RETURN_URL.

Webhook Stripe à configurer vers /api/stripe/webhook avec les événements checkout.session.completed, customer.subscription.updated et customer.subscription.deleted.


## Politique de frais — Cash-in / Cash-out

BitGold prévoit une grille de frais indicative différente selon le niveau d'abonnement. Elle est calculée côté serveur et exposée dans le cockpit :

| Formule | Cash-in | Cash-out | Limite quotidienne indicative |
|---|---:|---:|---:|
| Free | 1,50 % + 0,50 € | 1,99 % + 0,50 € | 2 000 € |
| Pro | 0,90 % + 0,35 € | 1,25 % + 0,35 € | 10 000 € |
| Elite | 0,45 % + 0,20 € | 0,75 % + 0,20 € | 50 000 € |

Les endpoints authentifiés `/api/transfers/fees` et `/api/transfers/quote` permettent d'obtenir la politique et de calculer un devis de frais. Dans le prototype actuel, il s'agit uniquement d'une **simulation** : aucun mouvement d'argent réel n'est exécuté. Les tarifs définitifs devront être adaptés au prestataire de paiement, au moyen de paiement, aux coûts de réseau et aux obligations réglementaires applicables.


## Profils utilisateurs et Google Sign-In

L'inscription crée désormais un profil utilisateur avec :
- prénom et nom ;
- email de connexion ;
- téléphone et date de naissance (optionnels) ;
- pays, ville et code postal ;
- adresse (optionnelle) ;
- devise préférée ;
- profil de risque.

Une fois connecté, l'icône utilisateur du header ouvre le profil et permet de modifier ces informations. L'email de connexion reste volontairement non modifiable depuis ce formulaire.

### Google Sign-In

La connexion Google utilise Google Identity Services avec vérification du jeton côté serveur. Aucun secret Google n'est stocké dans Git.

Pour activer le bouton Google sur Northflank :
1. créer un OAuth 2.0 Client ID de type Web application dans Google Cloud ;
2. ajouter l'origine du site BitGold dans les Authorized JavaScript origins ;
3. renseigner GOOGLE_CLIENT_ID dans les variables d'environnement Northflank ;
4. redéployer le service.

Sans GOOGLE_CLIENT_ID, le bouton Google reste automatiquement masqué et l'inscription/connexion classique continue de fonctionner.
