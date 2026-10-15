# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.4.2](https://github.com/ttoss/ttoss/compare/%40ttoss%2Ferrors%400.4.1...%40ttoss%2Ferrors%400.4.2) (2026-10-15)

**Note:** Version bump only for package @ttoss/errors

## [0.4.1](https://github.com/ttoss/ttoss/compare/%40ttoss%2Ferrors%400.4.0...%40ttoss%2Ferrors%400.4.1) (2026-10-14)

**Note:** Version bump only for package @ttoss/errors

# [0.4.0](https://github.com/ttoss/ttoss/compare/%40ttoss%2Ferrors%400.3.0...%40ttoss%2Ferrors%400.4.0) (2026-10-14)

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

# [0.3.0](https://github.com/ttoss/ttoss/compare/@ttoss/errors@0.2.1...@ttoss/errors@0.3.0) (2026-10-09)

### Features

- **auth-core,http-server-auth,http-server-mcp:** resource indicators and scopes_supported ([#1316](https://github.com/ttoss/ttoss/issues/1316)) ([8203460](https://github.com/ttoss/ttoss/commit/82034600ba2eab429ed625f85e74296abf5bcefc))

## [0.2.1](https://github.com/ttoss/ttoss/compare/@ttoss/errors@0.2.0...@ttoss/errors@0.2.1) (2026-10-07)

**Note:** Version bump only for package @ttoss/errors

# [0.2.0](https://github.com/ttoss/ttoss/compare/@ttoss/errors@0.1.0...@ttoss/errors@0.2.0) (2026-10-07)

### Features

- **errors,i18n-core,appsync-api:** code plus values for errors whose thrower holds no copy ([#1311](https://github.com/ttoss/ttoss/issues/1311)) ([cdd82e0](https://github.com/ttoss/ttoss/commit/cdd82e0bf41817084685891920106f2f4f26658b))

# 0.1.0 (2026-10-06)

### Features

- **errors:** add @ttoss/errors; http-server and auth-core adopt it ([#1306](https://github.com/ttoss/ttoss/issues/1306)) ([b5b7a11](https://github.com/ttoss/ttoss/commit/b5b7a1193c9b5e231a7a8d3ef6362e9ce9e58570))
