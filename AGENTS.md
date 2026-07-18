# Repository Guidelines

## Project Structure & Module Organization

This repository publishes the `@mobius29/create-frontend` Node.js CLI. Runtime modules live in `src/`; `src/index.js` is the executable entry point. Generator files live under `templates/react-router-ts/` and `templates/next-oxc/`; keep template-specific configuration there. Unit tests are in `test/`, and maintenance utilities are in `scripts/`.

## Build, Test, and Development Commands

Use Node.js 22.13 or newer and pnpm 11.

- `pnpm install`: install repository dependencies.
- `pnpm check`: validate CLI and template configuration.
- `pnpm test`: run all unit tests with Node's built-in test runner.
- `pnpm lint` / `pnpm lint:fix`: report or fix Oxlint issues.
- `pnpm format:check` / `pnpm format`: check or apply Oxfmt formatting.
- `pnpm smoke`: generate and verify a React Router project in `/tmp`.
- `pnpm smoke:next-oxc`: exercise the Next.js template.
- `pnpm pack:dry`: inspect the files that would be published to npm.

## Coding Style & Naming Conventions

Use ESM JavaScript (`import`/`export`) and two-space indentation. Oxfmt enforces a 120-column width and sorted imports; Oxlint checks correctness and unused variables. Use kebab-case filenames such as `backend-integrations.js`, camelCase for functions and variables, and PascalCase for error classes. Prefer small modules matching the existing CLI flow.

## Testing Guidelines

Tests use `node:test` with `node:assert/strict`. Name files `test/<module>.test.js` and describe observable behavior, for example `test("rejects an invalid package name", ...)`. Add a focused test for changed parsing, filesystem, naming, or integration behavior. Run `pnpm test` and `pnpm check`; run the relevant smoke command when template output changes. No numeric coverage threshold is configured.

## Commit & Pull Request Guidelines

History uses short Conventional Commit-style subjects such as `feat: ...`, `fix: ...`, `docs: ...`, and `rfc: ...`; follow that pattern and keep commits scoped. Pull requests should explain the user-visible change, list verification commands, and link issues. Include terminal output for CLI changes and screenshots only when generated UI changes. Call out regenerated templates.

## Security & Configuration

Never commit npm credentials or real Supabase keys. Template environment files should contain placeholders only. Treat overwrite and cleanup changes as destructive: keep target-path validation intact and test both dry-run and refusal paths.
