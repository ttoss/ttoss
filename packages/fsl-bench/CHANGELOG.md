# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.7.1](https://github.com/ttoss/ttoss/compare/%40ttoss%2Ffsl-bench%400.7.0...%40ttoss%2Ffsl-bench%400.7.1) (2026-10-20)

**Note:** Version bump only for package @ttoss/fsl-bench

# [0.7.0](https://github.com/ttoss/ttoss/compare/%40ttoss%2Ffsl-bench%400.6.0...%40ttoss%2Ffsl-bench%400.7.0) (2026-10-14)

- feat!: ESLint 10 with maintained React/import/a11y plugins, and a lint-clean monorepo (#1323) ([6efae16](https://github.com/ttoss/ttoss/commit/6efae16a0ee2e036bb9fe41c132aa8cd03fe3489)), closes [#1323](https://github.com/ttoss/ttoss/issues/1323) [jsx-eslint/eslint-plugin-react#3977](https://github.com/jsx-eslint/eslint-plugin-react/issues/3977) [#958](https://github.com/ttoss/ttoss/issues/958)

### BREAKING CHANGES

- @ttoss/layouts, @ttoss/react-notifications and
  @ttoss/geovis now have @ttoss/react-i18n as a peer dependency, and their
  components must be rendered inside an `I18nProvider` (NotificationsProvider
  renders the modal, and GeoVisProvider renders the hover tooltip).
- requires ESLint 10. Rules are renamed: `import/*` ->
  `import-x/*`, `jsx-a11y/*` -> `jsx-a11y-x/*`, `react/*` ->
  `@eslint-react/*` (see the package README for the mapping); update
  `eslint-disable` comments accordingly.

# [0.6.0](https://github.com/ttoss/ttoss/compare/%40ttoss%2Ffsl-bench%400.5.0...%40ttoss%2Ffsl-bench%400.6.0) (2026-10-14)

### chore

- **deps:** update all dependencies to latest and fix breaking changes ([#1325](https://github.com/ttoss/ttoss/issues/1325)) ([6997247](https://github.com/ttoss/ttoss/commit/6997247a6f03638c1d8469eb141e6e7ace694463)), closes [#private](https://github.com/ttoss/ttoss/issues/private)

### BREAKING CHANGES

- **deps:** `DashboardGridItem` is now based on react-grid-layout
  v2's `LayoutItem`, and `onLayoutChange` receives a `Layout` (read-only
  array of items) instead of `Layout[]`.
- **deps:** `useReactTable`, `getCoreRowModel` and `createCell` are
  no longer exported; use `useTable({ features, columns, data })` with
  `tableFeatures`, and `createColumnHelper<typeof features, Row>()`.
  `JsonEditor` now requires `setData`; use `JsonViewer` for read-only data.
- **deps:** the `maplibre-gl` peer dependency is now `>=6.4.1`
  (was `>=5.0.0`).

# 0.5.0 (2026-10-14)

### Bug Fixes

- **deps:** bump vulnerable and deprecated dependencies within existing ranges ([#1324](https://github.com/ttoss/ttoss/issues/1324)) ([a633312](https://github.com/ttoss/ttoss/commit/a633312f71bc515cf15135f2a1caae6835a4d155))

### Features

- **geovis,geovis-workspace:** 3D polygon extrusion, a view-mode choi… ([#1308](https://github.com/ttoss/ttoss/issues/1308)) ([8ecea5c](https://github.com/ttoss/ttoss/commit/8ecea5c8167762c009c8c62c9d0dc004519e021e))

## [0.4.1](https://github.com/ttoss/ttoss/compare/@ttoss/fsl-bench@0.4.0...@ttoss/fsl-bench@0.4.1) (2026-10-01)

**Note:** Version bump only for package @ttoss/fsl-bench

# 0.4.0 (2026-09-30)

### Features

- **eslint-config:** enforce the quality metrics ESLint can, drop the config that does nothing ([#1211](https://github.com/ttoss/ttoss/issues/1211)) ([5673a18](https://github.com/ttoss/ttoss/commit/5673a1817b104a403466d07ac2ecd589bc4ddd49)), closes [ttoss/i18n-cli#build-config](https://github.com/ttoss/i18n-cli/issues/build-config)

## [0.3.1](https://github.com/ttoss/ttoss/compare/@ttoss/fsl-bench@0.3.0...@ttoss/fsl-bench@0.3.1) (2026-09-28)

**Note:** Version bump only for package @ttoss/fsl-bench

# 0.3.0 (2026-09-28)

### Features

- **openapi-codegen:** pull referenced files into the merged document ([#1249](https://github.com/ttoss/ttoss/issues/1249)) ([0da2566](https://github.com/ttoss/ttoss/commit/0da25663f72e22e403c7182eee9951b58c9c14e1))

# [0.2.0](https://github.com/ttoss/ttoss/compare/@ttoss/fsl-bench@0.1.16...@ttoss/fsl-bench@0.2.0) (2026-08-31)

### Features

- **eslint-config:** enforce the quality metrics ESLint can, drop the config that does nothing ([#1211](https://github.com/ttoss/ttoss/issues/1211)) ([5673a18](https://github.com/ttoss/ttoss/commit/5673a1817b104a403466d07ac2ecd589bc4ddd49)), closes [ttoss/i18n-cli#build-config](https://github.com/ttoss/i18n-cli/issues/build-config)

## [0.1.16](https://github.com/ttoss/ttoss/compare/@ttoss/fsl-bench@0.1.15...@ttoss/fsl-bench@0.1.16) (2026-08-16)

**Note:** Version bump only for package @ttoss/fsl-bench

## [0.1.15](https://github.com/ttoss/ttoss/compare/@ttoss/fsl-bench@0.1.14...@ttoss/fsl-bench@0.1.15) (2026-08-13)

**Note:** Version bump only for package @ttoss/fsl-bench

## [0.1.14](https://github.com/ttoss/ttoss/compare/@ttoss/fsl-bench@0.1.13...@ttoss/fsl-bench@0.1.14) (2026-08-07)

**Note:** Version bump only for package @ttoss/fsl-bench

## [0.1.13](https://github.com/ttoss/ttoss/compare/@ttoss/fsl-bench@0.1.12...@ttoss/fsl-bench@0.1.13) (2026-08-06)

**Note:** Version bump only for package @ttoss/fsl-bench

## [0.1.12](https://github.com/ttoss/ttoss/compare/@ttoss/fsl-bench@0.1.11...@ttoss/fsl-bench@0.1.12) (2026-08-05)

**Note:** Version bump only for package @ttoss/fsl-bench

## [0.1.11](https://github.com/ttoss/ttoss/compare/@ttoss/fsl-bench@0.1.10...@ttoss/fsl-bench@0.1.11) (2026-08-05)

**Note:** Version bump only for package @ttoss/fsl-bench

## [0.1.10](https://github.com/ttoss/ttoss/compare/@ttoss/fsl-bench@0.1.9...@ttoss/fsl-bench@0.1.10) (2026-08-05)

**Note:** Version bump only for package @ttoss/fsl-bench

## [0.1.9](https://github.com/ttoss/ttoss/compare/@ttoss/fsl-bench@0.1.8...@ttoss/fsl-bench@0.1.9) (2026-07-30)

**Note:** Version bump only for package @ttoss/fsl-bench

## [0.1.8](https://github.com/ttoss/ttoss/compare/@ttoss/fsl-bench@0.1.7...@ttoss/fsl-bench@0.1.8) (2026-07-29)

**Note:** Version bump only for package @ttoss/fsl-bench

## [0.1.7](https://github.com/ttoss/ttoss/compare/@ttoss/fsl-bench@0.1.6...@ttoss/fsl-bench@0.1.7) (2026-07-26)

**Note:** Version bump only for package @ttoss/fsl-bench

## [0.1.6](https://github.com/ttoss/ttoss/compare/@ttoss/fsl-bench@0.1.5...@ttoss/fsl-bench@0.1.6) (2026-07-25)

**Note:** Version bump only for package @ttoss/fsl-bench

## [0.1.5](https://github.com/ttoss/ttoss/compare/@ttoss/fsl-bench@0.1.4...@ttoss/fsl-bench@0.1.5) (2026-07-24)

**Note:** Version bump only for package @ttoss/fsl-bench

## [0.1.4](https://github.com/ttoss/ttoss/compare/@ttoss/fsl-bench@0.1.3...@ttoss/fsl-bench@0.1.4) (2026-07-23)

**Note:** Version bump only for package @ttoss/fsl-bench

## [0.1.3](https://github.com/ttoss/ttoss/compare/@ttoss/fsl-bench@0.1.2...@ttoss/fsl-bench@0.1.3) (2026-07-19)

**Note:** Version bump only for package @ttoss/fsl-bench

## [0.1.2](https://github.com/ttoss/ttoss/compare/@ttoss/fsl-bench@0.1.1...@ttoss/fsl-bench@0.1.2) (2026-07-18)

**Note:** Version bump only for package @ttoss/fsl-bench

## 0.1.1 (2026-07-17)

**Note:** Version bump only for package @ttoss/fsl-bench
