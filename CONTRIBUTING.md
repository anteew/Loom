# Contributing to Loom

## Development Standards
- Language: JavaScript (Node.js ESM) on Node >= 18.
- Code organization:
  - Source code in `src/`
  - Tests in `tests/`
- Imports: Use ESM `import`/`export`.
- Avoid unused variables; prefix intentionally-unused with `_`.
- Prefer small, focused modules with simple, testable functions.

## Linting
- ESLint is configured for Node ESM with recommended rules.
- Run:
  - `npm run lint` — check lint
  - `npm run lint:fix` — auto-fix where possible
- Lint scope targets `src/**/*.js` and `tests/**/*.js`.
- Ignored directories: `node_modules/`, `dist/`, `coverage/`, and external roots: `openpilot/`, `opendbc/`, `comma-tools/`.

## Testing Standards
- Test runner: Vitest.
- Test file naming: `*.test.js` in `tests/`.
- Structure tests by unit under test (e.g., `graph.manager.test.js`).
- Use Vitest globals (`describe`, `it`, `expect`)—already enabled for tests.
- Mock external services and I/O in unit tests; keep integration tests minimal and deterministic.
- Commands:
  - `npm test` — run all tests
  - `npm run test:watch` — TDD loop
- Coverage (optional future): if added, target >=80% lines/branches for core modules.

## Commit & PR Guidelines
- Keep commits scoped and descriptive (imperative, e.g., "add xyz").
- Ensure `npm run lint` and `npm test` pass locally before pushing.
- In PRs, describe what changed and how you tested it. Link to related docs/specs when relevant.

## Formatting (Optional)
- If the team wants auto-formatting, we can add Prettier and integrate with ESLint via `eslint-config-prettier`. For now, we rely on ESLint rules and consistent editor settings.
