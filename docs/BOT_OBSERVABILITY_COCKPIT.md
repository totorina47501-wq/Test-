# Observatoire bots IA

Affiche les decisions et executions simulees par bot dans les pages Bots, Portefeuille et Activite. Les moteurs IA et Quantum Fund restent inchanges. Le volume execute n'est pas un benefice.

Verification : frontend lint/build, server tests et Playwright, connexion et expiration de session, filtres, et checks PR/main.

## Comparaison sur une période commune

Les trois bots sont comparés sur la même fenêtre : 7, 30 ou 90 jours, ou tout l’historique chargé. Décisions et exécutions sont filtrées par leur date ; les volumes ne constituent pas des bénéfices. Le journal utilise la même période que les compteurs. Le backend plafonne chaque source à 100 événements : les totaux peuvent donc être incomplets. Résultat net et drawdown sont explicitement « non disponibles » tant qu’aucune valorisation historique attribuée au bot n’existe. Les moteurs et les opérations simulées restent inchangés.

## Vérifications

Vérifier build/lint React, tests backend et scénarios Playwright desktop/mobile sur PR puis sur main. Vérifier aussi le filtre par bot, l’historique vide et l’absence de promesse de rendement.
