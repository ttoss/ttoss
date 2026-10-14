# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.8.0](https://github.com/ttoss/ttoss/compare/%40ttoss%2Fopenapi-codegen%400.7.0...%40ttoss%2Fopenapi-codegen%400.8.0) (2026-10-14)

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

# 0.7.0 (2026-10-14)

### Bug Fixes

- **deps:** bump vulnerable and deprecated dependencies within existing ranges ([#1324](https://github.com/ttoss/ttoss/issues/1324)) ([a633312](https://github.com/ttoss/ttoss/commit/a633312f71bc515cf15135f2a1caae6835a4d155))

### Features

- **geovis,geovis-workspace:** 3D polygon extrusion, a view-mode choi… ([#1308](https://github.com/ttoss/ttoss/issues/1308)) ([8ecea5c](https://github.com/ttoss/ttoss/commit/8ecea5c8167762c009c8c62c9d0dc004519e021e))

## [0.6.1](https://github.com/ttoss/ttoss/compare/@ttoss/openapi-codegen@0.6.0...@ttoss/openapi-codegen@0.6.1) (2026-10-01)

**Note:** Version bump only for package @ttoss/openapi-codegen

# 0.6.0 (2026-09-30)

### Bug Fixes

- **openapi-codegen:** stop silently dropping header and cookie parameters ([#1246](https://github.com/ttoss/ttoss/issues/1246)) ([96be791](https://github.com/ttoss/ttoss/commit/96be791cfcb12c9d7521c60091a2b76303fa3924))
- **openapi-codegen:** stop typing an untyped schema `string`, and resolve `$ref`s across files ([#1248](https://github.com/ttoss/ttoss/issues/1248)) ([21283be](https://github.com/ttoss/ttoss/commit/21283be5bd895e9dac37d73e4f1a3176df7c3e3c))

### Features

- **eslint-config:** enforce the quality metrics ESLint can, drop the config that does nothing ([#1211](https://github.com/ttoss/ttoss/issues/1211)) ([5673a18](https://github.com/ttoss/ttoss/commit/5673a1817b104a403466d07ac2ecd589bc4ddd49)), closes [ttoss/i18n-cli#build-config](https://github.com/ttoss/i18n-cli/issues/build-config)
- **openapi-codegen:** add package to merge OpenAPI specs and generate CLI route manifests ([#1165](https://github.com/ttoss/ttoss/issues/1165)) ([b39c4be](https://github.com/ttoss/ttoss/commit/b39c4bef1734fa7f03e331f7258b2195ea3eb2a7))
- **openapi-codegen:** pull referenced files into the merged document ([#1249](https://github.com/ttoss/ttoss/issues/1249)) ([0da2566](https://github.com/ttoss/ttoss/commit/0da25663f72e22e403c7182eee9951b58c9c14e1))
- pin server-managed body properties and add whole-body CLI flags ([#1263](https://github.com/ttoss/ttoss/issues/1263)) ([521022f](https://github.com/ttoss/ttoss/commit/521022f7beca7fc0e5c63299135a4798375e07e8))

## [0.5.2](https://github.com/ttoss/ttoss/compare/@ttoss/openapi-codegen@0.5.1...@ttoss/openapi-codegen@0.5.2) (2026-09-28)

**Note:** Version bump only for package @ttoss/openapi-codegen

## [0.5.1](https://github.com/ttoss/ttoss/compare/@ttoss/openapi-codegen@0.5.0...@ttoss/openapi-codegen@0.5.1) (2026-09-28)

**Note:** Version bump only for package @ttoss/openapi-codegen

# [0.5.0](https://github.com/ttoss/ttoss/compare/@ttoss/openapi-codegen@0.4.0...@ttoss/openapi-codegen@0.5.0) (2026-09-27)

### Features

- pin server-managed body properties and add whole-body CLI flags ([#1263](https://github.com/ttoss/ttoss/issues/1263)) ([521022f](https://github.com/ttoss/ttoss/commit/521022f7beca7fc0e5c63299135a4798375e07e8))

# [0.4.0](https://github.com/ttoss/ttoss/compare/@ttoss/openapi-codegen@0.3.2...@ttoss/openapi-codegen@0.4.0) (2026-09-22)

### Features

- **openapi-codegen:** pull referenced files into the merged document ([#1249](https://github.com/ttoss/ttoss/issues/1249)) ([0da2566](https://github.com/ttoss/ttoss/commit/0da25663f72e22e403c7182eee9951b58c9c14e1))

## [0.3.2](https://github.com/ttoss/ttoss/compare/@ttoss/openapi-codegen@0.3.1...@ttoss/openapi-codegen@0.3.2) (2026-09-22)

### Bug Fixes

- **openapi-codegen:** stop typing an untyped schema `string`, and resolve `$ref`s across files ([#1248](https://github.com/ttoss/ttoss/issues/1248)) ([21283be](https://github.com/ttoss/ttoss/commit/21283be5bd895e9dac37d73e4f1a3176df7c3e3c))

## 0.3.1 (2026-09-18)

### Bug Fixes

- **openapi-codegen:** stop silently dropping header and cookie parameters ([#1246](https://github.com/ttoss/ttoss/issues/1246)) ([96be791](https://github.com/ttoss/ttoss/commit/96be791cfcb12c9d7521c60091a2b76303fa3924))

# 0.3.0 (2026-08-31)

### Features

- **eslint-config:** enforce the quality metrics ESLint can, drop the config that does nothing ([#1211](https://github.com/ttoss/ttoss/issues/1211)) ([5673a18](https://github.com/ttoss/ttoss/commit/5673a1817b104a403466d07ac2ecd589bc4ddd49)), closes [ttoss/i18n-cli#build-config](https://github.com/ttoss/i18n-cli/issues/build-config)

# 0.2.0 (2026-07-28)

### Features

- **openapi-codegen:** add package to merge OpenAPI specs and generate CLI route manifests ([#1165](https://github.com/ttoss/ttoss/issues/1165)) ([b39c4be](https://github.com/ttoss/ttoss/commit/b39c4bef1734fa7f03e331f7258b2195ea3eb2a7))
