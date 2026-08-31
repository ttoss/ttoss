# @ttoss/eslint-config

**@ttoss/eslint-config** is a set of rules for [ESLint](https://eslint.org/) to use on ttoss ecosystem. It uses the new [ESLint flat configuration format](https://eslint.org/docs/latest/use/configure/configuration-files).

## Installation

```bash
pnpm add -D @ttoss/eslint-config
```

## Usage

Add the following to your `eslint.config.mjs` file:

```js
import ttossEslintConfig from '@ttoss/eslint-config';

export default [...ttossEslintConfig];
```

## Rules

### Complexity, module sizes, and duplication

To keep code understandable and testable, this config limits cyclomatic complexity, cognitive complexity, and module size, and rejects duplicated branches, identical functions, and assignments that are never read. The rationale is explained in [Cognitive Complexity — because testability, understandability, and changeability matter](https://www.sonarsource.com/blog/cognitive-complexity-because-testability-understandability-and-changeability-matter/).

For the current rule values, see [`config.js`](https://github.com/ttoss/ttoss/blob/main/packages/eslint-config/config.js). Test files (`*.spec.ts`, `*.test.ts`, `*.spec.tsx`, `*.test.tsx`) get thresholds calibrated for suites rather than a blanket opt-out: file length, callback nesting and cyclomatic complexity are all still enforced, just at limits picked so only genuine outliers report. Depth, parameter count and cognitive complexity apply unchanged. Only two rules are off there — `max-lines-per-function`, which counts a whole `describe` block as one function, and `no-identical-functions`, since repetitive arrange/assert blocks are how a suite stays readable.

### What this config cannot enforce

ESLint reads one file at a time and has no coverage or runtime data, so these quality gates need separate tooling: Halstead metrics (an escomplex-based reporter), test coverage and CRAP (Jest `coverageThreshold`), surviving mutants (Stryker), cross-file duplication (jscpd), and unused exports or modules (Knip).

`any` is rejected via `@typescript-eslint/no-explicit-any`. `unknown` is deliberately allowed — it is the safe counterpart to `any`, and TypeScript has no alternative for `as unknown as T` double assertions, `Record<string, unknown>`, or generic defaults.
