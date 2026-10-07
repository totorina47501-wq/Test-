# Contribution et promotion

## Règle de livraison

Toute modification suit obligatoirement ce flux :

1. **feature/fix/chore branch** → développement et commits atomiques.
2. **Pull Request vers `staging`** → la CI doit être verte.
3. **Promotion `staging` → `main`** → uniquement après CI staging verte.
4. **CI `main`** → la CI doit rester verte après promotion.

### Branches

- Les branches de travail ne poussent jamais directement sur `main`.
- Les branches de travail ciblent `staging`.
- La seule branche autorisée à promouvoir vers `main` est `staging`.

### CI

Le workflow `.github/workflows/tests.yml` s'exécute sur :

- les pushes sur `staging` et `main`;
- les Pull Requests ciblant `staging` ou `main`.

La séquence attendue est donc :

`feature/*` → PR `staging` → CI verte → PR `staging` → `main` → CI verte.

Aucune fonctionnalité ne doit être présentée comme livrée avant la validation CI sur `staging`.

## Convention de commit

Utiliser des messages courts et explicites, par exemple :

- `feat: ...`
- `fix: ...`
- `chore: ...`
- `test: ...`
- `docs: ...`

Les changements doivent rester simulation-only tant que le produit n'autorise pas explicitement des opérations réelles.
