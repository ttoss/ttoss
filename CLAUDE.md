# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

**ttoss** (Terezinha Tech Operations) is a TypeScript/JavaScript monorepo with 46+ packages providing modular solutions for product development teams. Package manager is **pnpm** (enforced — npm/yarn are blocked). Node ≥24, pnpm ≥11.2.2 required.

## Commands

```bash
# Install dependencies
pnpm install

# Build i18n for all packages (required before first run; run after any defineMessages change)
pnpm run -w i18n

# Run all tests across the monorepo
pnpm turbo run test

# Run tests for a specific package + all its dependents (from monorepo root)
pnpm turbo run test --filter=...@ttoss/PACKAGE_NAME

# Run tests inside a package directory
cd packages/PACKAGE_NAME
pnpm run test
pnpm run test --testPathPatterns=MyComponent      # filter by file
pnpm run test --testNamePattern="my test name"   # filter by test name

# Build all packages
pnpm turbo run build

# Build a package + all its dependents (from monorepo root)
pnpm turbo run build --filter=...@ttoss/PACKAGE_NAME

# Lint — stage changes first, then run from monorepo root
git add <files>
pnpm run -w lint

# Run Storybook
pnpm storybook

# Check for dependency version mismatches
pnpm syncpack:lint
```

## Build System

**Turbo** orchestrates tasks. Build stages in dependency order:

1. `build-config` — builds `@ttoss/config` and config-related packages first
2. `i18n` — extracts i18n messages (depends on `@ttoss/i18n-cli#build-config`)
3. `build` — builds all packages (depends on `^build` and `i18n`)
4. `test` — runs tests (depends on `i18n` and `build-config`)

Packages use **tsdown** (ESBuild-based) as the builder. Outputs go to `dist/`. Package `exports` fields point to `src/` for local dev (no build needed for local imports); `publishConfig` points to `dist/` for npm publishing.

## Package Development Workflow

After modifying any package, in this order:

1. `pnpm run test` in the package directory — fix failures immediately
2. `pnpm turbo run test --filter=...PACKAGE_NAME` from monorepo root — validates dependents
3. `pnpm turbo run build --filter=...PACKAGE_NAME` from monorepo root — validates build
4. Update `coverageThreshold` in `tests/unit/jest.config.ts` to match new coverage (never decrease; set 0.01–0.1% below actual to allow variation)
5. Update the package `README.md`
6. `git add <files> && pnpm run -w lint`

## Testing

- Unit tests live in `packages/PACKAGE_NAME/tests/unit/`
- Coverage must **never decrease** — update `coverageThreshold` in `jest.config.ts` after every code change
- Use `jest.mocked()` for type-safe mocking — never `(fn as jest.Mock)`
- Use `@ttoss/test-utils` `render` helper when testing React components that need context providers

## React Package Architecture

**Context-first**: applications configure once at the root via providers and packages consume via hooks, so never pass style, theme, translation, or notification callbacks as props. Foundation packages are always `peerDependencies`, never `dependencies`: `@ttoss/ui` (`Box`, `Button`, `Flex`, `Text`, `sx` prop), `@ttoss/theme` (design tokens), `@ttoss/react-i18n` (`useI18n()` / `defineMessages`), `@ttoss/react-notifications` (`useNotifications()`), `@ttoss/forms`.

`@ttoss/ui` and `@ttoss/forms` are **legacy** (owner ruling 2026-07-26): maintain existing consumers only; new UI work targets `@ttoss/fsl-ui` + `@ttoss/fsl-theme`, which take no form-library dependency.

## Internationalization (i18n)

Use `defineMessages` from `@ttoss/react-i18n` for **all** user-facing text, labels, error messages, and locale-specific formatting values (decimal separators, date formats). Do not hardcode locale-specific values.

After any `defineMessages` change, run `pnpm run -w i18n` from the monorepo root.

## Code Style

**Object parameters** — prefer destructured object params over multiple positional args for functions with 2+ parameters. Exceptions: single-param functions, standard callbacks (`.map((item, index) => ...)`), simple utilities like `Math.max(a, b)`.

**JSDoc on React components** — every exported React component must have a JSDoc comment describing what it does; every prop in the interface must have a `/** ... */` doc comment. Storybook's `autodocs` reads these automatically. Internal helper components (not exported from the package's public API) do not need JSDoc.

## Forms

Use **Zod** for all new form validation schemas. Only maintain existing Yup schemas — do not create new ones with Yup.

## Storybook

Every new or modified React component, form field, or UI element needs stories (default plus variants with `tags: ['autodocs']`) at `docs/storybook/stories/PACKAGE_NAME/ComponentName.stories.tsx`. Verify with `pnpm storybook`.

## Path-specific guidance

Nested `CLAUDE.md` files (`packages/ui`, `packages/carlin`, `packages/fsl-theme`, `docs`, `docs/fsl-studio`) load when you read files there. `.github/instructions/` holds more path-specific guidance (written for Copilot; Claude reads it on demand). Markdown/docs standards: `docs/CLAUDE.md` and `.github/instructions/docs.instructions.md`.
