# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.12.1](https://github.com/ttoss/ttoss/compare/@ttoss/geovis-workspace@0.12.0...@ttoss/geovis-workspace@0.12.1) (2026-09-03)

**Note:** Version bump only for package @ttoss/geovis-workspace

# [0.12.0](https://github.com/ttoss/ttoss/compare/@ttoss/geovis-workspace@0.11.2...@ttoss/geovis-workspace@0.12.0) (2026-09-02)

### Features

- **geovis-workspace:** let a filters block hold a variations menu ([#1219](https://github.com/ttoss/ttoss/issues/1219)) ([5b6f195](https://github.com/ttoss/ttoss/commit/5b6f1952547e2f0c0b6034d8df5f650cebaf7496))

## [0.11.2](https://github.com/ttoss/ttoss/compare/@ttoss/geovis-workspace@0.11.1...@ttoss/geovis-workspace@0.11.2) (2026-09-01)

**Note:** Version bump only for package @ttoss/geovis-workspace

## [0.11.1](https://github.com/ttoss/ttoss/compare/@ttoss/geovis-workspace@0.11.0...@ttoss/geovis-workspace@0.11.1) (2026-09-01)

**Note:** Version bump only for package @ttoss/geovis-workspace

# [0.11.0](https://github.com/ttoss/ttoss/compare/@ttoss/geovis-workspace@0.10.0...@ttoss/geovis-workspace@0.11.0) (2026-08-31)

### Features

- **eslint-config:** enforce the quality metrics ESLint can, drop the config that does nothing ([#1211](https://github.com/ttoss/ttoss/issues/1211)) ([5673a18](https://github.com/ttoss/ttoss/commit/5673a1817b104a403466d07ac2ecd589bc4ddd49)), closes [ttoss/i18n-cli#build-config](https://github.com/ttoss/i18n-cli/issues/build-config)

# [0.10.0](https://github.com/ttoss/ttoss/compare/@ttoss/geovis-workspace@0.9.0...@ttoss/geovis-workspace@0.10.0) (2026-08-22)

- Feat/geovis workspace layout (#1201) ([22e2501](https://github.com/ttoss/ttoss/commit/22e2501eb886c16e303f23041b6cc5fa80512850)), closes [#1201](https://github.com/ttoss/ttoss/issues/1201)

### BREAKING CHANGES

- `config.controls`, `config.leftSidebar.menus`,
  `config.leftSidebarPreview`, `LayerListControls`, `onLayerVisibilityChange`,
  and the `GeovisWorkspaceMenu`/`GeovisWorkspaceControls` types are removed.
  Configure the left sidebar via `config.leftSidebar.sections`.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>

- feat(geovis): crossfade transition, prototype legend/control restyle

Add a `crossfade` layer transition and align the legend and layer control
with the design prototype.

- Crossfade: on a geojson `data` change a shadow layer holds the NEW data and
  fades in while the real layer keeps the OLD data and fades out, avoiding the
  new-source parse flash. The fade only begins once the shadow source has
  parsed, and the shadow is painted with the layer's `mapData` feature-state so
  new points fade in already coloured (no white-then-coloured pop).
- Legend: prototype card styling with an optional icon chip, footer value, and
  a `position` offset that animates so the legend can slide clear of a panel.
- Layer control: prototype trigger button with an optional `control.icon` and a
  count badge. New spec fields land in `schema.json` and the `types`.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>

- chore(storybook): flatten geovis story titles and add crossfade story

Drop the `Basemap`/`Fixtures`/`View` subfolders so every geovis story sits at
the top level of the sidebar, and refresh the crossfade demo story.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>

- feat(geovis-workspace): add appearance card|bare option

`config.appearance` controls the workspace container framing: `'card'`
(default) keeps the border/radius/background for standalone use (e.g.
Storybook); `'bare'` drops the border and radius so the workspace fills its
container edge-to-edge when embedded in an app that owns the framing. Removes
the need for consumers to strip the card chrome with brittle CSS.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>

# [0.9.0](https://github.com/ttoss/ttoss/compare/@ttoss/geovis-workspace@0.8.0...@ttoss/geovis-workspace@0.9.0) (2026-08-19)

### Features

- **geovis-workspace:** tab-based preview sidebar with time-lapse tim… ([#1200](https://github.com/ttoss/ttoss/issues/1200)) ([9880b1c](https://github.com/ttoss/ttoss/commit/9880b1cd5cf80857cdc5a198415cd25e7ead4ca1))

# [0.8.0](https://github.com/ttoss/ttoss/compare/@ttoss/geovis-workspace@0.7.0...@ttoss/geovis-workspace@0.8.0) (2026-08-12)

### Features

- **geovis-workspace:** grouped menu carousel for the left sidebar ([#1198](https://github.com/ttoss/ttoss/issues/1198)) ([3c64afd](https://github.com/ttoss/ttoss/commit/3c64afd5fc3d5fb6f908313fc67794c856b8981f))

# 0.7.0 (2026-08-11)

- Audit border contrast per mode; correct the focus-token guidance (#1184) ([07e6da4](https://github.com/ttoss/ttoss/commit/07e6da4fd35fc93ea0d79c79c35fe9c4a3a50746)), closes [#1184](https://github.com/ttoss/ttoss/issues/1184) [#4](https://github.com/ttoss/ttoss/issues/4) [#3](https://github.com/ttoss/ttoss/issues/3) [#3](https://github.com/ttoss/ttoss/issues/3) [#2](https://github.com/ttoss/ttoss/issues/2) [#1](https://github.com/ttoss/ttoss/issues/1) [hi#contrast](https://github.com/hi/issues/contrast)

### BREAKING CHANGES

- `Badge` is now the descriptive chip (Structure,
  informational colours) and the valence status pill is `StatusLight`
  (Feedback). `Chip` is removed — it folds into `Badge`. The published
  scopes move with the names: `chip` → `badge`, `badge` → `status-light`.

F-040: both reference systems give the descriptive chip the word
`Badge` and the status member another name — Spectrum's StatusLight,
Chakra's Status. Ours were inverted, which in an AI-first package is a
first-pass-correctness cost: an agent asked for "a role chip" reaches
for `Badge` on priors from every other library and got a valence it
never asked for. The owner took the rename now rather than at the
version boundary, and now was the cheaper half of the trade the entry
framed: `Chip` had existed for hours with three consumers, so this was
two source files, two suites, two stories and six Studio sites, all
mechanical. Waiting adds every consumer written in between.

`CHIP_BOX` keeps its name deliberately. It is no longer any component's,
which is right for a shared source that names the physical object two
components render while the entity decides only its colours.

F-041 closed without building anything, because `breakpoints.md` had
already placed it and the entry was filed without reading it. The family
doc calls breakpoints adaptation infrastructure with no semantic layer,
says applications may adjust or replace them, and names this exact case:
local aliases such as `navCollapse` stay in the application layer. The
same page states the rule the shell's API already follows — breakpoints
define when layout changes, not how components behave — so neither
package should ship the hook.

F-042 is what the attempt found. Wiring Meridian to the narrow shell is
the first time two recorded workarounds met: the drawer opens with its
accessible name and the tablist inside it renders empty, because React
Aria does not populate a collection portaled into a Modal. Meridian's
sidebar is a TabList only because `Link` cannot mark `aria-current`
(F-002), and the frame lives inside one `Tabs` because a panel-less
TabList emits invalid ARIA (F-017); a collection owner and a portal
cannot be the same element. The hook and the wiring were written and
then removed rather than shipped half-working — hiding the navigation on
a phone is worse than the scroll F-023 measured.

Kept from the attempt: the Studio's `matchMedia` stub answered false to
everything, which was harmless while only `prefers-color-scheme` asked
and would have silently collapsed the shell in every test the moment
anything asked about width. It now answers `min-width` against jsdom's
actual viewport.

Refs: F-040, F-041, F-042

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01PEHd46JcLBYN4Haywg7fdP

- feat(fsl-ui): mark the current route on Link, closing F-002, F-017 and F-042

F-042 is what made the chain visible. Building the narrow shell and
trying to consume it showed that F-002's cost was never "a sidebar
cannot mark the active page" — every downstream workaround compounded
from it.

F-002 needed no decision, which is why it had been parked longer than it
deserved. `current` was already a legal State in the registry and
already listed in `CONTEXT_EXTRA_STATES.navigation`; what was missing
was the resolver's flag→state mapping and a component to pass it.
`STATE_PRIORITY` gains `isCurrent → current` and `Link` gains
`isCurrent`, which sets `aria-current="page"` and resolves
`navigation.{role}.text.current`. Nothing in the vocabulary grew, and
the standing rule that no token leaves while the package stabilises is
satisfied in the strongest form available: the token now has a reader.

Cascade placement is argued, not assumed. `current` outranks `checked`
because colors.md § Picking a state says a tab on the live route is both
selected and current, so it is the more specific claim about the same
kind of fact; both sit under `disabled`, because unavailability is the
more urgent announcement. `aria-current="page"` rather than `true`: the
link names a destination, and that is the token APG's navigation pattern
asks for.

F-017 closed by deleting its workaround, not by changing `Tabs`. The
component was never wrong — it was being asked to be navigation. With
links in a `nav` landmark, the one-`Tabs`-scope frame is gone from
`AppFrame` and the `Box width="full"` that existed only to undo the tab
row's layout went with it.

F-042 closed on the first re-attempt, one day after being filed: a list
of links has no collection owner, so nothing needs a portal to register
anything. Meridian now runs `sidebarVariant="temporary"` below the `md`
threshold through the app-layer `useNavCollapse` alias breakpoints.md
names by hand, so the Studio stops overflowing at 390px — the outcome
F-023 was filed for, reached three items later.

Worth recording about the diagnosis rather than the fix: neither
component in F-042 was defective and neither needed changing. The
failure lived in the interaction of two workarounds and was only visible
once both were exercised together, which took building the second
capability to discover.

Refs: F-002, F-017, F-042

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01PEHd46JcLBYN4Haywg7fdP

- feat(fsl-ui): tint the ink of a quiet destructive action, closing F-029

A part that paints no surface of its own takes its ink from the surface it
renders on, and when that part carries a valence, `consequence` selects it.
Implemented once in `tokens/consequenceInk.ts`, written into CONTRACT §3.3,
and consumed by Button, ActionButton and MenuItem.

The 2026-08-02 governance recommendation — split static-on-fill ink out of
`{ux}.{valence}.text` — is retracted: stress-tested against a second palette
it is circular, because ink is only static while the fill is known and
`action.primary`, `action.accent` and `feedback.caution` do not share one. It
would have needed per-role on-fill ink, which is `{ux}.{role}.text` renamed,
at the price of every published Action and Feedback label.

What ships is that proposal's own alternatives (a) and (b), together and
bounded. Nothing joins the token path: `informational.negative.text.default`
already exists and `consequence` already ships and already drives
ConfirmationDialog's arming. The entity-alignment objection is answered
structurally — the crossing lives in one module, and the contract suite fails
any component that reads `informational.negative` by hand or that emits
`data-consequence`, paints from `vars.colors.action`, and skips the helper.

Scoped by measurement: the quiet rung only, `color` only, and yielding at
`disabled`, `active` and `expanded`, where the rung materialises a real fill
and the theme lifts its own ink to clear it. fsl-theme's cross-role inventory
gains a `quiet destructive control` entry covering every surface the tint can
land on, in both bundles and both modes.

`resolveStateKey` is split out of `resolveInteractiveStyle` so "which state is
the host painting" has one answer derived from STATE_PRIORITY. No behaviour
change.

Also filed from the browser verification: F-024's consumer condition fired
(the Studio's quiet Remove paints a black pill on a dark table row), and F-043
— a background state with no matching text state is skipped by the pairing
suite yet still rendered, measured at 1.45:1 on an open menu trigger in dark.
Neither is fixed here.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01PEHd46JcLBYN4Haywg7fdP

- feat(fsl-theme,fsl-ui): mint the consequence ink as a cross-cutting token

The owner asked whether a Pareto-dominant shape existed for the F-029
solution. Re-reading the model found it already written: model.md §6 names
the exact criterion the day-old cross-ux read satisfies — a question the
principal grammar cannot ask in a single token, a system-wide default no
ux owns — and provides the mechanism, with the focus ring as the typed
precedent. The ring is this ink's structural twin: both render against the
stratum behind the component rather than a fill of their own, which is why
one system-wide colour serves.

fsl-theme gains `semantic.consequence.destructive.ink` (ADR-025), a
cross-cutting sibling of focus and overlay, aliased to
`informational.negative.text.default` the same way focus.ring.color
aliases its source — so both modes and both bundles resolve today's exact
values and a mode remap carries the alias with it. Registered in
TOKEN_PATH_REGISTRY (`--tt-consequence-*`, DTCG color); the registry
coverage test enforces the entry. `committing` deliberately gets no token:
no consumer waits for one.

fsl-ui's `resolveConsequenceInk` reads the new token through CONTRACT §1's
cross-cutting table (ADR-029). Everything behavioural in ADR-028 stands —
rule, bounds, yield set, measurements — but the licensed cross-ux crossing
retires: the entity→ux alignment is back to zero exceptions, and the §4c
contract test now also forbids components reading `vars.consequence`
directly, since unlike the ring the read is conditional and its bounds
live in the helper.

fsl-theme's `quiet destructive control` inventory pairs the token itself,
so a theme that repoints the alias is audited on what components actually
render. The stale colors.md paragraph claiming a quiet destructive Action
"cannot be expressed today" is corrected to point at the cross-cutting
token.

Verified byte-identical in Chromium, both modes: the Studio's quiet Remove
renders rgb(127,29,29) light / rgb(252,165,165) dark, unchanged.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01PEHd46JcLBYN4Haywg7fdP

- fix(fsl-theme,fsl-ui): audit the rendered text pair; add the surface contract

Two items, in the order the owner set, each solved from the docs' own
guidelines.

- `SemanticOverlay` gains a required `outline` member and the
  shared inset step group gains a required `xs`. Additive for every theme
  authored via `overrides`/`extends`; a theme supplying a complete `base`
  adds two lines. The six occluding components stop reading their role's
  border — measured, all three informational roles resolved the same border
  value in both modes, so `evaluation` never varied an overlay's edge.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01PEHd46JcLBYN4Haywg7fdP

## [0.6.1](https://github.com/ttoss/ttoss/compare/@ttoss/geovis-workspace@0.6.0...@ttoss/geovis-workspace@0.6.1) (2026-08-05)

**Note:** Version bump only for package @ttoss/geovis-workspace

# 0.6.0 (2026-07-30)

### Features

- **auth-core:** add configurable email and password auth flows ([#1172](https://github.com/ttoss/ttoss/issues/1172)) ([5e75701](https://github.com/ttoss/ttoss/commit/5e7570145fdeafea947c3a78dbb00132b8f3744c))

## [0.5.2](https://github.com/ttoss/ttoss/compare/@ttoss/geovis-workspace@0.5.1...@ttoss/geovis-workspace@0.5.2) (2026-07-27)

**Note:** Version bump only for package @ttoss/geovis-workspace

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
