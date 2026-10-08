# BitGold — parcours automatisés

Le workflow indépendant `.github/workflows/user-scenarios.yml` exécute chaque jour les scénarios utilisateurs avec une base PostgreSQL éphémère et un serveur local.

Les tests API contrôlent inscription, connexion, accès protégé, achats et ventes simulés, portefeuille et activité. Playwright vérifie les interactions d'authentification sur Chromium desktop et mobile.

Les paiements réels, fournisseurs KYC/AML et connexion Google sont exclus. Les prix de marché du serveur peuvent encore provenir du fournisseur de données configuré.

Les rapports HTML, JUnit, traces et captures d'écran sont conservés dans les artefacts GitHub Actions pendant 14 jours.

Le dépôt ne versionne pas encore de fichier `package-lock.json`. L'installation reproductible avec `npm ci` nécessite d'abord la génération et le commit de ce fichier, puis la mise à jour des workflows.
