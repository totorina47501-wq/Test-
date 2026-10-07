# Contribution et promotion

## Règle de livraison

Toute modification suit obligatoirement ce flux :

1. **feature/fix/chore branch** → développement et commits atomiques.
2. **Pull Request vers `staging`** → la CI doit être verte.
3. **Accumulation d'un lot de release sur `staging`** → plusieurs évolutions peuvent être intégrées successivement, chacune avec CI verte.
4. **Promotion unique `staging` → `main`** → à la frontière de release, après validation du lot complet sur staging.
5. **CI `main`** → la CI doit rester verte après promotion.

### Branches

- Les branches de travail ne poussent jamais directement sur `main`.
- Les branches de travail ciblent `staging`.
- La seule branche autorisée à promouvoir vers `main` est `staging`.

### CI

Le workflow `.github/workflows/tests.yml` s'exécute sur :

- les pushes sur `staging` et `main`;
- les Pull Requests ciblant `staging` ou `main`.

La séquence attendue est donc :

`feature/*` → PR `staging` → CI verte → merge staging → CI verte → autres évolutions du lot → validation staging → PR unique `staging` → `main` → CI verte.

Aucune évolution ne doit être intégrée à `staging` sans CI de PR verte. La promotion vers `main` se fait par lot de release et non après chaque évolution.

## Convention de commit

Utiliser des messages courts et explicites, par exemple :

- `feat: ...`
- `fix: ...`
- `chore: ...`
- `test: ...`
- `docs: ...`

Les changements doivent rester simulation-only tant que le produit n'autorise pas explicitement des opérations réelles.
