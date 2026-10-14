# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.2.1](https://github.com/ttoss/ttoss/compare/%40ttoss%2Fgeovis-catalog%400.2.0...%40ttoss%2Fgeovis-catalog%400.2.1) (2026-10-14)

**Note:** Version bump only for package @ttoss/geovis-catalog

# [0.2.0](https://github.com/ttoss/ttoss/compare/%40ttoss%2Fgeovis-catalog%400.1.22...%40ttoss%2Fgeovis-catalog%400.2.0) (2026-10-14)

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

## [0.1.22](https://github.com/ttoss/ttoss/compare/@ttoss/geovis-catalog@0.1.21...@ttoss/geovis-catalog@0.1.22) (2026-10-14)

**Note:** Version bump only for package @ttoss/geovis-catalog

## [0.1.21](https://github.com/ttoss/ttoss/compare/@ttoss/geovis-catalog@0.1.20...@ttoss/geovis-catalog@0.1.21) (2026-10-13)

**Note:** Version bump only for package @ttoss/geovis-catalog

## [0.1.20](https://github.com/ttoss/ttoss/compare/@ttoss/geovis-catalog@0.1.19...@ttoss/geovis-catalog@0.1.20) (2026-10-09)

**Note:** Version bump only for package @ttoss/geovis-catalog

## [0.1.19](https://github.com/ttoss/ttoss/compare/@ttoss/geovis-catalog@0.1.18...@ttoss/geovis-catalog@0.1.19) (2026-10-08)

**Note:** Version bump only for package @ttoss/geovis-catalog

## [0.1.18](https://github.com/ttoss/ttoss/compare/@ttoss/geovis-catalog@0.1.17...@ttoss/geovis-catalog@0.1.18) (2026-10-06)

**Note:** Version bump only for package @ttoss/geovis-catalog

## [0.1.17](https://github.com/ttoss/ttoss/compare/@ttoss/geovis-catalog@0.1.16...@ttoss/geovis-catalog@0.1.17) (2026-10-06)

**Note:** Version bump only for package @ttoss/geovis-catalog

## [0.1.16](https://github.com/ttoss/ttoss/compare/@ttoss/geovis-catalog@0.1.15...@ttoss/geovis-catalog@0.1.16) (2026-10-05)

**Note:** Version bump only for package @ttoss/geovis-catalog

## [0.1.15](https://github.com/ttoss/ttoss/compare/@ttoss/geovis-catalog@0.1.14...@ttoss/geovis-catalog@0.1.15) (2026-10-01)

**Note:** Version bump only for package @ttoss/geovis-catalog

## 0.1.14 (2026-10-01)

**Note:** Version bump only for package @ttoss/geovis-catalog

## 0.1.13 (2026-09-30)

**Note:** Version bump only for package @ttoss/geovis-catalog

## [0.1.12](https://github.com/ttoss/ttoss/compare/@ttoss/geovis-catalog@0.1.11...@ttoss/geovis-catalog@0.1.12) (2026-09-28)

**Note:** Version bump only for package @ttoss/geovis-catalog

## [0.1.11](https://github.com/ttoss/ttoss/compare/@ttoss/geovis-catalog@0.1.10...@ttoss/geovis-catalog@0.1.11) (2026-09-28)

**Note:** Version bump only for package @ttoss/geovis-catalog

## [0.1.10](https://github.com/ttoss/ttoss/compare/@ttoss/geovis-catalog@0.1.9...@ttoss/geovis-catalog@0.1.10) (2026-09-28)

**Note:** Version bump only for package @ttoss/geovis-catalog

## [0.1.9](https://github.com/ttoss/ttoss/compare/@ttoss/geovis-catalog@0.1.8...@ttoss/geovis-catalog@0.1.9) (2026-09-22)

**Note:** Version bump only for package @ttoss/geovis-catalog

## [0.1.8](https://github.com/ttoss/ttoss/compare/@ttoss/geovis-catalog@0.1.7...@ttoss/geovis-catalog@0.1.8) (2026-09-21)

**Note:** Version bump only for package @ttoss/geovis-catalog

## [0.1.7](https://github.com/ttoss/ttoss/compare/@ttoss/geovis-catalog@0.1.6...@ttoss/geovis-catalog@0.1.7) (2026-09-15)

**Note:** Version bump only for package @ttoss/geovis-catalog

## [0.1.6](https://github.com/ttoss/ttoss/compare/@ttoss/geovis-catalog@0.1.5...@ttoss/geovis-catalog@0.1.6) (2026-09-11)

**Note:** Version bump only for package @ttoss/geovis-catalog

## [0.1.5](https://github.com/ttoss/ttoss/compare/@ttoss/geovis-catalog@0.1.4...@ttoss/geovis-catalog@0.1.5) (2026-09-11)

**Note:** Version bump only for package @ttoss/geovis-catalog

## [0.1.4](https://github.com/ttoss/ttoss/compare/@ttoss/geovis-catalog@0.1.3...@ttoss/geovis-catalog@0.1.4) (2026-09-11)

**Note:** Version bump only for package @ttoss/geovis-catalog

## [0.1.3](https://github.com/ttoss/ttoss/compare/@ttoss/geovis-catalog@0.1.2...@ttoss/geovis-catalog@0.1.3) (2026-09-04)

**Note:** Version bump only for package @ttoss/geovis-catalog

## [0.1.2](https://github.com/ttoss/ttoss/compare/@ttoss/geovis-catalog@0.1.1...@ttoss/geovis-catalog@0.1.2) (2026-09-03)

**Note:** Version bump only for package @ttoss/geovis-catalog

## 0.1.1 (2026-09-01)

**Note:** Version bump only for package @ttoss/geovis-catalog
