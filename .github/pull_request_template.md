## Summary

<!-- What does this PR do, and why? Not a restatement of the branch/commit name — enough context that a reviewer understands the motivation from this section alone. -->

## Type of change

- [ ] Feature
- [ ] Bug fix
- [ ] Refactor
- [ ] Test
- [ ] Infrastructure / CI
- [ ] Documentation

## How was this tested?

- [ ] Domain unit tests (`yarn test`)
- [ ] Repository integration tests against real Postgres (`yarn test:integration`)
- [ ] HTTP e2e tests (`yarn test:e2e`)
- [ ] Manual verification (describe below)

<!-- Exact commands run and their outcome, or manual steps taken. -->

## Checklist

- [ ] `yarn lint`, `npx tsc --noEmit`, and the relevant test tier(s) above all pass locally
- [ ] Tests were written before implementation (TDD), for any domain/state logic changed
- [ ] `DECISIONS.md` and `C4-MODEL.md` updated, if this changes architecture or a domain rule
- [ ] Commit messages follow `type(scope): summary`, scope = domain/module touched

## Related

<!-- Link relevant DECISIONS.md entries, issues, or "N/A". -->
