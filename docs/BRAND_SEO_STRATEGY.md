# BitGold — Branding et SEO

## Positionnement
BitGold : explorez la crypto, testez des bots IA, apprenez sans argent réel.

Signature : « La crypto s'explore. Les stratégies se testent. »

Promesse : cockpit pédagogique de simulation crypto, portefeuille virtuel, stratégies Silver/Shield/Gold. Aucune transaction réelle, aucun rendement garanti.

## Identité
Conserver le fond sombre #0A0E17, les accents #c8ff2e, les surfaces glassmorphism et les captures authentifiées lorsque disponibles. Ne pas inventer de gains ou de témoignages.

## SEO
Le frontend dispose de balises title, description, canonical, Open Graph et JSON-LD SoftwareApplication. Le canonical Northflank est provisoire avant l'achat du domaine de marque. Ne pas annoncer de langues SEO tant que les pages traduites ne sont pas indexables sur des URLs dédiées. Vérifier le HTML renvoyé par le serveur, car une SPA React peut ne pas être correctement comprise sans pré-rendu.

## Prochains lots
1. Vérifier nom, marque et domaine puis homogénéiser landing, emails et onboarding.
2. Auditer robots, indexabilité, Core Web Vitals, rendu HTML et confidentialité des pages JWT.
3. Produire des pages publiques crawlables : simulateur, bots IA, risques, portefeuille virtuel et FAQ.
4. Mesurer avec consentement : visite, CTA, inscription, première simulation, retour J7.
5. Étendre les langues avec URLs dédiées et hreflang réciproque.

## Validation
Exécuter frontend lint/build, tests backend et Playwright mobile/desktop. Vérifier les métadonnées dans le HTML réellement servi, puis consigner la CI PR/main et la preuve de production dans FUNCTIONALITY_TRACKER.md. Ne pas confondre CI verte et indexation Google.
