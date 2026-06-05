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

All React packages follow a **context-first** pattern — applications configure once at the root via providers; packages consume via hooks. Never pass style, theme, translation, or notification callbacks as props.

**Foundation packages** (always `peerDependencies`, never `dependencies`):

- `@ttoss/ui` — core components (`Box`, `Button`, `Flex`, `Text`, etc.) with `sx` prop for theme tokens
- `@ttoss/theme` — design tokens (colors, spacing, typography)
- `@ttoss/react-i18n` — i18n via `useI18n()` / `defineMessages`
- `@ttoss/react-notifications` — notifications via `useNotifications()`
- `@ttoss/forms` — form management with validation

```typescript
// ✅ Correct: consume context
import { Box, Button } from '@ttoss/ui';
import { defineMessages, useI18n } from '@ttoss/react-i18n';
import { useNotifications } from '@ttoss/react-notifications';

// ❌ Wrong: props for style/text/notifications
type Props = { backgroundColor?: string; buttonText?: string; onNotify?: fn };
```

Application root sets up providers once; all ttoss packages inherit automatically.

## Internationalization (i18n)

Use `defineMessages` from `@ttoss/react-i18n` for **all** user-facing text, labels, error messages, and locale-specific formatting values (decimal separators, date formats). Do not hardcode locale-specific values.

```typescript
import { defineMessages, useI18n } from '@ttoss/react-i18n';

const messages = defineMessages({
  label: {
    defaultMessage: 'English text here',
    description: 'Context for translators',
  },
});

const { intl } = useI18n();
const text = intl.formatMessage(messages.label);
```

After any `defineMessages` change, run `pnpm run -w i18n` from the monorepo root.

## Code Style

**Object parameters** — prefer destructured object params over multiple positional args for functions with 2+ parameters:

```typescript
// ✅ Preferred
function createUser({ name, email, isActive }: CreateUserParams) {}

// ❌ Avoid
function createUser(name: string, email: string, isActive: boolean) {}
```

Exceptions: single-param functions, standard callbacks (`.map((item, index) => ...)`), simple utilities like `Math.max(a, b)`.

**JSDoc on React components** — every exported React component must have a JSDoc comment describing what it does; every prop in the interface must have a `/** ... */` doc comment. Storybook's `autodocs` reads these automatically. Internal helper components (not exported from the package's public API) do not need JSDoc.

## Forms

Use **Zod** for all new form validation schemas. Only maintain existing Yup schemas — do not create new ones with Yup.

## Storybook Stories

Required for any new or modified React component, form field, or UI element:

- Location: `docs/storybook/stories/PACKAGE_NAME/ComponentName.stories.tsx`
- Must include a default story and variant stories with `tags: ['autodocs']`
- Run `pnpm storybook` to verify stories render correctly before finishing

## Chakra UI (`packages/ui/src/chakra/`)

Recipes and slot recipes must contain **only color tokens** — never spacing, sizing, typography, border-width, layout, or other non-color properties. Use Chakra UI defaults for everything except color.

Use ttoss semantic color tokens from these categories: `navigation`, `display`, `action`, `input`, `feedback`.

```typescript
// ✅ Only color tokens in recipes
base: {
  color: 'display.text.primary.default',
  backgroundColor: 'display.background.primary.default',
  borderColor: 'display.border.muted.default',
}

// ❌ Non-color tokens do not belong in recipes
base: { gap: '4', fontSize: 'sm', borderRadius: 'full', display: 'flex' }
```

New recipes go in `packages/ui/src/chakra/recipes/`; slot recipes in `packages/ui/src/chakra/slotRecipes/`. Both are auto-integrated by `ChakraThemeProvider.tsx`.

## `@ttoss/fsl-theme`

Before proposing architectural changes, consult `packages/fsl-theme/CONTRIBUTING.md` for the ADR workflow and review protocol. When code diverges from a spec or "obvious best practice", treat it as **evidence of an unstated invariant** — not a bug — until proven otherwise. Investigate before changing.

Documentation artifacts are orthogonal: JSDoc answers "how do I use this right now?"; `README.md` answers "how do I integrate it?"; `CONTRIBUTING.md` answers "how do I modify it safely?"; `CHANGELOG.md` answers "what changed?".

## `@ttoss/carlin`

- Source: `packages/carlin/src/` — Tests: `packages/carlin/tests/` (never in `src/`)
- Every code change requires a corresponding test; new CLI options must have tests in `tests/unit/cli.test.ts` covering default values and custom values
- Documentation in `docs/website/docs/carlin/` must be updated with every code change

## Documentation (`docs/`)

**Less is more.** Every sentence must earn its place. When in doubt, cut it out.

- Prefer flowing paragraphs over fragmented bullet lists; use lists only for actionable steps or items readers reference individually
- Use **Mermaid diagrams** to visualize processes, workflows, architectures, and relationships instead of text descriptions
- For React/UI components, link to [Storybook](https://storybook.ttoss.dev/) instead of embedding per-component code snippets
- Do not duplicate content that exists elsewhere — link to it
- All documentation must be in English
- Internal Docusaurus links: omit numeric folder prefixes (e.g., use `/docs/product/product-development/principles`, not `/docs/product/03-product-development/02-principles`)
- Blog posts require `<!-- truncate -->` after the introduction

## Path-Specific Instruction Files

Detailed guidelines live in `.github/instructions/`:

| File                                          | Applies to                                                  |
| --------------------------------------------- | ----------------------------------------------------------- |
| `general.instructions.md`                     | Entire repo — linting, i18n workflow, code style            |
| `packages.instructions.md`                    | `packages/**` — testing, coverage, README, Storybook        |
| `react-packages-architecture.instructions.md` | `**/*.tsx` — context-based pattern                          |
| `forms.instructions.md`                       | `**/*.ts`, `**/*.tsx` — Zod vs Yup                          |
| `chakra-ui.instructions.md`                   | `packages/ui/src/chakra/**` — recipe token rules            |
| `fsl-theme.instructions.md`                   | `packages/fsl-theme/**` — ADR workflow, divergence protocol |
| `carlin.instructions.md`                      | `packages/carlin/**` — CLI testing, docs requirement        |
| `docs.instructions.md`                        | `**/*.md`, `**/*.mdx` — documentation standards             |
