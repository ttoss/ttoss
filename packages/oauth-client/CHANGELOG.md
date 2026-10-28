# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# 0.7.0 (2026-10-27)

### Features

- **openapi-codegen:** refuse items without type: array ([#1353](https://github.com/ttoss/ttoss/issues/1353)) ([2b00f2a](https://github.com/ttoss/ttoss/commit/2b00f2af65002c7c6b4750904b4464b229cd7387))

# 0.6.0 (2026-10-21)

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

## [0.5.2](https://github.com/ttoss/ttoss/compare/%40ttoss%2Foauth-client%400.5.1...%40ttoss%2Foauth-client%400.5.2) (2026-10-15)

**Note:** Version bump only for package @ttoss/oauth-client

## [0.5.1](https://github.com/ttoss/ttoss/compare/%40ttoss%2Foauth-client%400.5.0...%40ttoss%2Foauth-client%400.5.1) (2026-10-14)

**Note:** Version bump only for package @ttoss/oauth-client

# [0.5.0](https://github.com/ttoss/ttoss/compare/%40ttoss%2Foauth-client%400.4.4...%40ttoss%2Foauth-client%400.5.0) (2026-10-14)

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

## [0.4.4](https://github.com/ttoss/ttoss/compare/@ttoss/oauth-client@0.4.3...@ttoss/oauth-client@0.4.4) (2026-10-09)

**Note:** Version bump only for package @ttoss/oauth-client

## [0.4.3](https://github.com/ttoss/ttoss/compare/@ttoss/oauth-client@0.4.2...@ttoss/oauth-client@0.4.3) (2026-10-07)

**Note:** Version bump only for package @ttoss/oauth-client

## [0.4.2](https://github.com/ttoss/ttoss/compare/@ttoss/oauth-client@0.4.1...@ttoss/oauth-client@0.4.2) (2026-10-07)

**Note:** Version bump only for package @ttoss/oauth-client

## 0.4.1 (2026-10-06)

**Note:** Version bump only for package @ttoss/oauth-client

# 0.4.0 (2026-10-01)

### Features

- **i18n-core:** tell whether a reference renders in the instance's locale ([#1276](https://github.com/ttoss/ttoss/issues/1276)) ([21f046f](https://github.com/ttoss/ttoss/commit/21f046ffde3266f6a4180d0ea080f860a3a10327))

## 0.3.2 (2026-09-30)

**Note:** Version bump only for package @ttoss/oauth-client

## [0.3.1](https://github.com/ttoss/ttoss/compare/@ttoss/oauth-client@0.3.0...@ttoss/oauth-client@0.3.1) (2026-09-28)

**Note:** Version bump only for package @ttoss/oauth-client

# 0.3.0 (2026-09-28)

### Features

- **openapi-codegen:** pull referenced files into the merged document ([#1249](https://github.com/ttoss/ttoss/issues/1249)) ([0da2566](https://github.com/ttoss/ttoss/commit/0da25663f72e22e403c7182eee9951b58c9c14e1))

## [0.2.5](https://github.com/ttoss/ttoss/compare/@ttoss/oauth-client@0.2.4...@ttoss/oauth-client@0.2.5) (2026-08-31)

**Note:** Version bump only for package @ttoss/oauth-client

## 0.2.4 (2026-08-31)

**Note:** Version bump only for package @ttoss/oauth-client

## [0.2.3](https://github.com/ttoss/ttoss/compare/@ttoss/oauth-client@0.2.2...@ttoss/oauth-client@0.2.3) (2026-07-30)

**Note:** Version bump only for package @ttoss/oauth-client

## [0.2.2](https://github.com/ttoss/ttoss/compare/@ttoss/oauth-client@0.2.1...@ttoss/oauth-client@0.2.2) (2026-07-29)

**Note:** Version bump only for package @ttoss/oauth-client

## [0.2.1](https://github.com/ttoss/ttoss/compare/@ttoss/oauth-client@0.2.0...@ttoss/oauth-client@0.2.1) (2026-07-29)

**Note:** Version bump only for package @ttoss/oauth-client

# 0.2.0 (2026-07-29)

### Features

- **http-server-mcp-openapi:** generate MCP tools from OpenAPI specs ([#1157](https://github.com/ttoss/ttoss/issues/1157)) ([1de1203](https://github.com/ttoss/ttoss/commit/1de1203d19065e095a2ff10090b48465fc2c4300))

## [0.1.3](https://github.com/ttoss/ttoss/compare/@ttoss/oauth-client@0.1.2...@ttoss/oauth-client@0.1.3) (2026-06-28)

**Note:** Version bump only for package @ttoss/oauth-client

## [0.1.2](https://github.com/ttoss/ttoss/compare/@ttoss/oauth-client@0.1.1...@ttoss/oauth-client@0.1.2) (2026-06-27)

**Note:** Version bump only for package @ttoss/oauth-client

## 0.1.1 (2026-06-19)

**Note:** Version bump only for package @ttoss/oauth-client

# 0.1.0 (2026-06-15)

### Features

- **oauth-client:** add reusable third-party OAuth client package ([#1074](https://github.com/ttoss/ttoss/issues/1074)) ([11a4ab7](https://github.com/ttoss/ttoss/commit/11a4ab7879571419b31a6f188aafadf4bdc75588))
