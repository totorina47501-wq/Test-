# BitGold API

API MVP de test : comptes, authentification JWT, portefeuille SQLite, achats/ventes papier et historique.

## Lancer
1. Copier `.env.example` vers `.env` et définir un JWT_SECRET fort.
2. `npm install`
3. `npm start`

Les opérations sont **papier** : aucun euro ni crypto réel n'est transféré. Pour la production, remplacer SQLite/JWT simplifié par une architecture sécurisée, ajouter KYC/AML et connecter un prestataire réglementé.