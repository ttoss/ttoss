# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [2.1.1](https://github.com/ttoss/ttoss/compare/@ttoss/fsl-theme@2.1.0...@ttoss/fsl-theme@2.1.1) (2026-07-18)

**Note:** Version bump only for package @ttoss/fsl-theme

# [2.1.0](https://github.com/ttoss/ttoss/compare/@ttoss/fsl-theme@2.0.0...@ttoss/fsl-theme@2.1.0) (2026-07-15)

### Features

- introduce @ttoss/fsl-ui semantic component library ([#1133](https://github.com/ttoss/ttoss/issues/1133)) ([a45b9ea](https://github.com/ttoss/ttoss/commit/a45b9ea3c540df4df47f4760659789d248120aa8)), closes [#8](https://github.com/ttoss/ttoss/issues/8)

# [2.0.0](https://github.com/ttoss/ttoss/compare/@ttoss/fsl-theme@1.1.22...@ttoss/fsl-theme@2.0.0) (2026-07-12)

- fsl-theme: close spec↔reality gap, remove incomplete themes (#1128) ([06fc033](https://github.com/ttoss/ttoss/commit/06fc033151019174df769f4bd2dfe7e11c3bfb06)), closes [#1128](https://github.com/ttoss/ttoss/issues/1128) [#spacing-order-rule](https://github.com/ttoss/ttoss/issues/spacing-order-rule) [#errors-validation-must-fail-when](https://github.com/ttoss/ttoss/issues/errors-validation-must-fail-when)

### BREAKING CHANGES

- dataviz CSS custom properties are renamed to keep their
  channel segment: `--tt-dataviz-series-N` → `--tt-dataviz-color-series-N`,
  `--tt-dataviz-scale-*` → `--tt-dataviz-color-scale-*`, `--tt-dataviz-state-*` →
  `--tt-dataviz-color-state-*`/`--tt-dataviz-geo-state-*`, `--tt-dataviz-shape-*`
  → `--tt-dataviz-encoding-shape-*`, etc. The token `semantic.dataviz.color.status.na`
  is renamed to `semantic.dataviz.color.status.notApplicable`. The built-in themes
  `corporate`, `oca`, and `ventures` are removed from the public export; use
  `createTheme({ extends: bruttal, overrides })` to build a branded theme.

- fix(fsl-theme): tier 1 integrity — DTCG conformance, SSR href, phantom-layer docs

* DTCG: stop emitting the invalid `$type: "string"`; `dtcgType` is now optional
  in the registry and `toDTCG` omits `$type` for opaque tokens (keywords,
  easing curves, border styles, dash strings). Border/focus line widths gain a
  `.width` → dimension override. Documents the resolved-scalar profile and
  defers composites/aliases/$description as enhancements (adr-013). Adds a
  conformance test asserting no invalid `$type` and valid-or-absent types.
* SSR: `<ThemeProvider>` hoisted `<style>` gains a stable `href`
  (`tt-theme-<themeId|root>`) so React 19 dedups multiple providers / re-renders
  instead of duplicating the `:root` block. Documents the React 18 limitation
  (auto-inject needs React 19; use ThemeHead/ThemeStyles on 18) and clarifies
  the theme-to-both warning. Adds SSR (renderToStaticMarkup) tests; clearDom now
  removes hoisted theme styles between tests.
* Docs integrity: mark the unbuilt Component Semantics Projection and
  Deterministic Resolver (layers 3 & 5) as planned rather than present-tense
  fact (component-model status banner, fsl/index, fsl-structural-language,
  fsl-lexicon, colors.md); drop the dead projection.ts GitHub link; fix stale
  `@ttoss/theme2` → `@ttoss/fsl-theme` in theme-provider.md and CONTRIBUTING.md.

- chore: add guardian skill to skills-lock

Records the guardian skill (ttoss/skills) in the reproducible skills manifest.
The skill contents live under .claude/skills (gitignored); only the lock is tracked.

- fix(fsl-theme): harden ref-resolution + deepMerge; enforce theme brief

U3 engine hardening (three latent bugs in roots/helpers.ts, each with a test):

- isTokenRef now rejects interior braces, so a multi-ref string like `{a} {b}`
  is no longer mis-parsed as one path — it takes the compound path and resolves
  consistently with toCssVars (the two paths previously diverged).
- resolveInline re-resolves a resolved embedded ref that still contains `{`, so
  chained compound refs (compound → compound → raw) expand fully.
- deepMerge skips `__proto__` / `constructor` / `prototype` override keys,
  guarding createTheme's public `overrides` against prototype pollution.

Also adds an FSL-DESIGN-001..003 test asserting the package's exported themes
(baseBundle, bruttal) declare a `meta` brief with name/posture/density/
accessibility target. Branch coverage threshold raised 94 → 94.2.

All three engine bugs are latent (no shipped theme value triggers them today).

- test(fsl-theme): add llms.txt drift guard

llms.txt is the hand-authored LLM-facing usage contract and can silently
drift from the code. Assert every concrete claim still resolves against the
real token contract: each vars.<path> mention is a live leaf or namespace,
each documented vars.x -> var(--tt-...) mapping agrees with toCssVarName, and
each name imported from '@ttoss/fsl-theme' is a real export. Checks only the
docs -> code direction (catches stale docs) without requiring the guide to
enumerate every token.

- chore: update guardian skill lock hash after reinstall

- docs(fsl-theme): correct ThemeProvider dedup jsdoc; drop process artifacts

G-025: the ThemeProvider/themeStyleHref jsdoc claimed a ThemeHead + themed
ThemeProvider "collapse to one tag" on React 19. They don't: ThemeStyles /
ThemeHead render an href-less inline <style> that does not dedup against the
provider's href-keyed hoisted tag. Reword to state only href-keyed providers
sharing a themeId collapse, and warn against combining the two.

G-026: remove REVIEW.md and TIER0-PLAN.md — session process artifacts that do
not belong in the repository (already excluded from the published package).

- docs(fsl-theme): fix broken spacing anchor breaking docusaurus build

## 1.1.22 (2026-07-11)

**Note:** Version bump only for package @ttoss/fsl-theme

## [1.1.21](https://github.com/ttoss/ttoss/compare/@ttoss/fsl-theme@1.1.20...@ttoss/fsl-theme@1.1.21) (2026-06-10)

**Note:** Version bump only for package @ttoss/fsl-theme

## [1.1.20](https://github.com/ttoss/ttoss/compare/@ttoss/fsl-theme@1.1.19...@ttoss/fsl-theme@1.1.20) (2026-06-09)

### Bug Fixes

- add rolldown/vite 8 export conditions and move @ttoss/components to peerDep ([c85efe3](https://github.com/ttoss/ttoss/commit/c85efe3b91f4af2405515bd6fa20227579869583))

## [1.1.19](https://github.com/ttoss/ttoss/compare/@ttoss/fsl-theme@1.1.18...@ttoss/fsl-theme@1.1.19) (2026-06-09)

**Note:** Version bump only for package @ttoss/fsl-theme

## [1.1.18](https://github.com/ttoss/ttoss/compare/@ttoss/fsl-theme@1.1.17...@ttoss/fsl-theme@1.1.18) (2026-06-05)

### Bug Fixes

- **@ttoss/http-server-mcp:** improve test coverage and fix peerDependencies ([#1022](https://github.com/ttoss/ttoss/issues/1022)) ([253bd98](https://github.com/ttoss/ttoss/commit/253bd98eaa29f690d4e198ad994b5d1aed4e89c5))

## [1.1.17](https://github.com/ttoss/ttoss/compare/@ttoss/fsl-theme@1.1.16...@ttoss/fsl-theme@1.1.17) (2026-06-05)

**Note:** Version bump only for package @ttoss/fsl-theme

## [1.1.16](https://github.com/ttoss/ttoss/compare/@ttoss/fsl-theme@1.1.15...@ttoss/fsl-theme@1.1.16) (2026-06-05)

**Note:** Version bump only for package @ttoss/fsl-theme

## [1.1.15](https://github.com/ttoss/ttoss/compare/@ttoss/fsl-theme@1.1.14...@ttoss/fsl-theme@1.1.15) (2026-06-05)

### Bug Fixes

- update publishConfig.exports for tsdown output format ([#1017](https://github.com/ttoss/ttoss/issues/1017)) ([982c7fc](https://github.com/ttoss/ttoss/commit/982c7fc5d5a40adf3b61a3ebbbef6d649a04d65d))

## [1.1.14](https://github.com/ttoss/ttoss/compare/@ttoss/fsl-theme@1.1.13...@ttoss/fsl-theme@1.1.14) (2026-06-03)

**Note:** Version bump only for package @ttoss/fsl-theme

## [1.1.13](https://github.com/ttoss/ttoss/compare/@ttoss/fsl-theme@1.1.12...@ttoss/fsl-theme@1.1.13) (2026-06-02)

**Note:** Version bump only for package @ttoss/fsl-theme

## [1.1.12](https://github.com/ttoss/ttoss/compare/@ttoss/fsl-theme@1.1.11...@ttoss/fsl-theme@1.1.12) (2026-05-13)

**Note:** Version bump only for package @ttoss/fsl-theme

## 1.1.11 (2026-05-12)

**Note:** Version bump only for package @ttoss/fsl-theme

## [1.1.15](https://github.com/ttoss/ttoss/compare/@ttoss/theme2@1.1.14...@ttoss/theme2@1.1.15) (2026-04-23)

**Note:** Version bump only for package @ttoss/theme2

## 1.1.14 (2026-04-23)

**Note:** Version bump only for package @ttoss/theme2

## [1.1.13](https://github.com/ttoss/ttoss/compare/@ttoss/theme2@1.1.8...@ttoss/theme2@1.1.13) (2026-04-07)

**Note:** Version bump only for package @ttoss/theme2

## [1.1.12](https://github.com/ttoss/ttoss/compare/@ttoss/theme2@1.1.8...@ttoss/theme2@1.1.12) (2026-04-07)

**Note:** Version bump only for package @ttoss/theme2

## [1.1.11](https://github.com/ttoss/ttoss/compare/@ttoss/theme2@1.1.8...@ttoss/theme2@1.1.11) (2026-04-07)

**Note:** Version bump only for package @ttoss/theme2

## [1.1.10](https://github.com/ttoss/ttoss/compare/@ttoss/theme2@1.1.8...@ttoss/theme2@1.1.10) (2026-04-04)

**Note:** Version bump only for package @ttoss/theme2

## [1.1.9](https://github.com/ttoss/ttoss/compare/@ttoss/theme2@1.1.8...@ttoss/theme2@1.1.9) (2026-04-04)

**Note:** Version bump only for package @ttoss/theme2

## 1.1.8 (2026-04-04)

### Bug Fixes

- main sh ([8f99d3c](https://github.com/ttoss/ttoss/commit/8f99d3cc3f9e6a394508a6c91f3c5c80615a9c13))

## 1.1.7 (2026-04-03)

### Bug Fixes

- main sh ([78eedbb](https://github.com/ttoss/ttoss/commit/78eedbb13da832d4725fd3aec6d996ca4de672fd))

## 1.1.6 (2026-04-01)

**Note:** Version bump only for package @ttoss/theme2

## 1.1.5 (2026-04-01)

**Note:** Version bump only for package @ttoss/theme2

## 1.1.4 (2026-04-01)

**Note:** Version bump only for package @ttoss/theme2

## 1.1.3 (2026-04-01)

**Note:** Version bump only for package @ttoss/theme2

## 1.1.2 (2026-03-31)

### Bug Fixes

- phone number ([#904](https://github.com/ttoss/ttoss/issues/904)) ([a1c30bd](https://github.com/ttoss/ttoss/commit/a1c30bd29a56a35e5b105b100d1cd1c35350607a))

## 1.1.1 (2026-03-31)

**Note:** Version bump only for package @ttoss/theme2

# 1.1.0 (2026-03-31)

### Features

- create form actions ([#895](https://github.com/ttoss/ttoss/issues/895)) ([5537ba4](https://github.com/ttoss/ttoss/commit/5537ba40cb44f47804a6b03a8b5e4db561fa059c)), closes [#896](https://github.com/ttoss/ttoss/issues/896)

## [1.0.2](https://github.com/ttoss/ttoss/compare/@ttoss/theme2@1.0.1...@ttoss/theme2@1.0.2) (2026-03-08)

**Note:** Version bump only for package @ttoss/theme2

## 1.0.1 (2026-03-07)

**Note:** Version bump only for package @ttoss/theme2
