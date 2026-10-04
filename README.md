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
- SQLite pour portefeuille et historique
- Achats/ventes papier côté serveur
- Dockerfile prêt pour un hébergeur backend

### Déploiement
GitHub Pages héberge le frontend. L'API doit être déployée séparément (Render, Railway, VPS, etc.) puis l'URL publique peut être enregistrée dans le navigateur avec `localStorage.setItem("bitgold-api","https://...")`.

**Pas de transactions réelles.** Pour passer en production : base de données managée, secrets sécurisés, sessions robustes, KYC/AML, prestataire crypto/paiement autorisé et audit de sécurité/réglementaire.