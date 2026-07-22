# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.5.1](https://github.com/ttoss/ttoss/compare/@ttoss/geovis-workspace@0.5.0...@ttoss/geovis-workspace@0.5.1) (2026-07-22)

**Note:** Version bump only for package @ttoss/geovis-workspace

# [0.5.0](https://github.com/ttoss/ttoss/compare/@ttoss/geovis-workspace@0.4.0...@ttoss/geovis-workspace@0.5.0) (2026-07-20)

- Feat geovis prd-001 repairable errors (#1132) ([884a417](https://github.com/ttoss/ttoss/commit/884a417bf2da1f2c50eae69df6281c2bf7c071b3)), closes [#1132](https://github.com/ttoss/ttoss/issues/1132)

### BREAKING CHANGES

- to validateSpec's return shape, accepted by ADR-0001
  (pre-1.0). @ttoss/geovis-workspace does not consume validateSpec, so
  no dependent changes were needed.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01UPEHrtopKmL6s9RQWmdgHR

- feat(geovis): complete PRD-001 phases 2-5 (repair, runtime, capabilities, versioning)

Phase 2: round-trip test proving every D3 repair produces a spec that
re-validates cleanly.

Phase 3: runtime.update/applyPatch validate before mutating and return
GeoVisResult; the adapter is never called on failure and spec/result stay
at their last accepted value. GeoVisProvider consumes results through a
new `result` context field, retiring PolicyViolation/policyViolations —
policy violations now flow through the same GeoVisIssue shape as warnings
on a resolved result.

Phase 4: CapabilitySet becomes the ADR-0002 structured tree (sourceTypes,
layerGeometries, dataFeatures.featureState, viewFeatures), grounded in
what MapLibreAdapter actually implements and tests actually exercise.
validateSpec accepts the active adapter's capabilities and emits
unsupported-\* issues with repair straight from the tree; unsupported specs
are rejected before mount.

Phase 5: audited every declared capability against the test suite (one
raster-geometry gap found and closed rather than hidden) and added spec
schema versioning (SPEC_SCHEMA_VERSION, schemaVersion field,
invalid-schema-version issue).

Two gaps found along the way, fixed in place: layers[].sourceId had no
referential check at all (a genuine "broken reference" hole), and wiring
real validation into the runtime exposed that a top-level `id` field used
throughout tests/stories was never in the schema/type (additive fix,
matches the existing title/description convention).

Split validateSpec.ts and createRuntime.ts per the monorepo's
max-lines/max-lines-per-function rules once the new logic pushed them
over the limit.

Updated the InvalidRawCountChoropleth story to read useGeoVis().result
instead of the retired policyViolations, and fixed a latent bug where the
fixture's policy metadata never reached the spec the story actually
builds — the warning banner could never have rendered before this.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01UPEHrtopKmL6s9RQWmdgHR

- fix(geovis): update test to check for resolved status instead of valid

- test(geovis-workspace): adjust coverage thresholds to realistic values

- test(geovis): adjust coverage thresholds to realistic values

# [0.4.0](https://github.com/ttoss/ttoss/compare/@ttoss/geovis-workspace@0.3.0...@ttoss/geovis-workspace@0.4.0) (2026-07-17)

### Features

- **geovis, geovis-workspace:** add cursor control, shouldOpen guard,… ([#1147](https://github.com/ttoss/ttoss/issues/1147)) ([92136f8](https://github.com/ttoss/ttoss/commit/92136f8aba7928617b05921722a4691c55ba293b))

# [0.3.0](https://github.com/ttoss/ttoss/compare/@ttoss/geovis-workspace@0.2.10...@ttoss/geovis-workspace@0.3.0) (2026-07-15)

### Features

- **geovis:** spec-driven layer click via layer.click.onSelect ([#1131](https://github.com/ttoss/ttoss/issues/1131)) ([b8b2ae0](https://github.com/ttoss/ttoss/commit/b8b2ae001156cfb3cc9a3fb1d2fd98cf70ba10f7))

## [0.2.10](https://github.com/ttoss/ttoss/compare/@ttoss/geovis-workspace@0.2.9...@ttoss/geovis-workspace@0.2.10) (2026-07-11)

**Note:** Version bump only for package @ttoss/geovis-workspace

## [0.2.9](https://github.com/ttoss/ttoss/compare/@ttoss/geovis-workspace@0.2.8...@ttoss/geovis-workspace@0.2.9) (2026-07-03)

**Note:** Version bump only for package @ttoss/geovis-workspace

## [0.2.8](https://github.com/ttoss/ttoss/compare/@ttoss/geovis-workspace@0.2.7...@ttoss/geovis-workspace@0.2.8) (2026-07-01)

**Note:** Version bump only for package @ttoss/geovis-workspace

## [0.2.7](https://github.com/ttoss/ttoss/compare/@ttoss/geovis-workspace@0.2.6...@ttoss/geovis-workspace@0.2.7) (2026-07-01)

### Bug Fixes

- changing geovisLegend structure ([#1111](https://github.com/ttoss/ttoss/issues/1111)) ([fd90668](https://github.com/ttoss/ttoss/commit/fd90668837740c1e0fcd66f72275266564c4ab84))

## [0.2.6](https://github.com/ttoss/ttoss/compare/@ttoss/geovis-workspace@0.2.5...@ttoss/geovis-workspace@0.2.6) (2026-06-30)

**Note:** Version bump only for package @ttoss/geovis-workspace

## [0.2.5](https://github.com/ttoss/ttoss/compare/@ttoss/geovis-workspace@0.2.4...@ttoss/geovis-workspace@0.2.5) (2026-06-30)

**Note:** Version bump only for package @ttoss/geovis-workspace

## [0.2.4](https://github.com/ttoss/ttoss/compare/@ttoss/geovis-workspace@0.2.3...@ttoss/geovis-workspace@0.2.4) (2026-06-26)

**Note:** Version bump only for package @ttoss/geovis-workspace

## [0.2.3](https://github.com/ttoss/ttoss/compare/@ttoss/geovis-workspace@0.2.2...@ttoss/geovis-workspace@0.2.3) (2026-06-25)

**Note:** Version bump only for package @ttoss/geovis-workspace

## [0.2.2](https://github.com/ttoss/ttoss/compare/@ttoss/geovis-workspace@0.2.1...@ttoss/geovis-workspace@0.2.2) (2026-06-23)

**Note:** Version bump only for package @ttoss/geovis-workspace

## [0.2.1](https://github.com/ttoss/ttoss/compare/@ttoss/geovis-workspace@0.2.0...@ttoss/geovis-workspace@0.2.1) (2026-06-23)

**Note:** Version bump only for package @ttoss/geovis-workspace

# [0.2.0](https://github.com/ttoss/ttoss/compare/@ttoss/geovis-workspace@0.1.1...@ttoss/geovis-workspace@0.2.0) (2026-06-19)

### Features

- **react-notifications:** add actions support and render as buttons ([#1080](https://github.com/ttoss/ttoss/issues/1080)) ([0c8c32a](https://github.com/ttoss/ttoss/commit/0c8c32a2c6e35f740955580b72b4d0131c5ad983)), closes [#1079](https://github.com/ttoss/ttoss/issues/1079)

## [0.1.1](https://github.com/ttoss/ttoss/compare/@ttoss/geovis-workspace@0.1.0...@ttoss/geovis-workspace@0.1.1) (2026-06-19)

**Note:** Version bump only for package @ttoss/geovis-workspace

# 0.1.0 (2026-06-18)

### Features

- **geovis-workspace:** add sidebar-driven workspace package ([#1075](https://github.com/ttoss/ttoss/issues/1075)) ([1deb9ee](https://github.com/ttoss/ttoss/commit/1deb9eeec2c15ad50ae1950a40a34df4029f274d))
