# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# 0.16.0 (2026-08-11)

- Audit border contrast per mode; correct the focus-token guidance (#1184) ([07e6da4](https://github.com/ttoss/ttoss/commit/07e6da4fd35fc93ea0d79c79c35fe9c4a3a50746)), closes [#1184](https://github.com/ttoss/ttoss/issues/1184) [#4](https://github.com/ttoss/ttoss/issues/4) [#3](https://github.com/ttoss/ttoss/issues/3) [#3](https://github.com/ttoss/ttoss/issues/3) [#2](https://github.com/ttoss/ttoss/issues/2) [#1](https://github.com/ttoss/ttoss/issues/1) [hi#contrast](https://github.com/hi/issues/contrast)

### Bug Fixes

- **geovis:** reconcile maplibre layer paint order to spec.layers on u… ([#1195](https://github.com/ttoss/ttoss/issues/1195)) ([d9d82d1](https://github.com/ttoss/ttoss/commit/d9d82d1911c87d69d805eefcc98593e6a5dcdef8)), closes [#1129](https://github.com/ttoss/ttoss/issues/1129)

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

## [0.15.1](https://github.com/ttoss/ttoss/compare/@ttoss/geovis@0.15.0...@ttoss/geovis@0.15.1) (2026-08-05)

**Note:** Version bump only for package @ttoss/geovis

# 0.15.0 (2026-07-30)

### Features

- **auth-core:** add configurable email and password auth flows ([#1172](https://github.com/ttoss/ttoss/issues/1172)) ([5e75701](https://github.com/ttoss/ttoss/commit/5e7570145fdeafea947c3a78dbb00132b8f3744c))

## [0.14.1](https://github.com/ttoss/ttoss/compare/@ttoss/geovis@0.14.0...@ttoss/geovis@0.14.1) (2026-07-27)

**Note:** Version bump only for package @ttoss/geovis

# [0.14.0](https://github.com/ttoss/ttoss/compare/@ttoss/geovis@0.13.0...@ttoss/geovis@0.14.0) (2026-07-22)

- Feat geovis prd 002 ai operation surface (#1140) ([f6fd35a](https://github.com/ttoss/ttoss/commit/f6fd35a7014887eaf0fad549f23bd2b9b7f0ca6e)), closes [#1140](https://github.com/ttoss/ttoss/issues/1140)

### Bug Fixes

- **geovis:** use absolute ADR URLs in README to unblock docs build ([#1158](https://github.com/ttoss/ttoss/issues/1158)) ([07cfb2a](https://github.com/ttoss/ttoss/commit/07cfb2ae640a0c5b500b49ddcc3b2194ad373f94))

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

- Add implementation plan for PRD-002 AI Operation Surface

Six tracer-bullet phases covering the closed action vocabulary
(set-map-data, set-filter, toggle-layer, select-feature, set-view-preset),
dispatch() validation, the action log, and an incrementally-built
context packet covering map type, sources/layers, legends, data
bindings, filters, view presets, selection, allowed actions, and the
last structured result.

- feat(geovis): add dispatch() core, action log, and toggle-layer (PRD-002 phase 1)

Adds GeoVisRuntime.dispatch()/getActionLog()/getContextPacket() (ADR-0003,
ADR-0004) and the first action, toggle-layer, compiled to the existing
SpecPatch mechanism.

Non-trivial decision made without synchronous confirmation (AskUserQuestion
failed twice in this session, no interactive user available): toggle-layer
needed a way to patch layer.visible, which did not exist before (the only
replace SpecPatch handled paint properties). Extended the existing
mechanism -- applyLayerPatchToSpec (createRuntime.ts) and applyLayerPatch
(patchDispatch.ts) now also accept a 3-part layer.<id>.visible path,
re-syncing outline/click-anchor companion layers -- rather than routing
toggle-layer through a full update() re-mount, honoring ADR-0003's rule that
actions must not require re-emitting the whole spec. Flagged for review.

Also adds the unknown-layer-id issue code (mismatch category, same
allowed-values repair shape as unknown-map-data-id/unknown-source).

Coverage threshold raised to match (never decreases per package convention).

- feat(geovis): add select-feature and runtime-level selection (PRD-002 phase 2)

Promotes selection out of GeoVisClickContext into the framework-agnostic
runtime (getSelection()), so dispatch({type:'select-feature'}) and a human
click share one source of truth. useMapClick/GeoVisClickContext now dispatch
select-feature instead of mutating feature-state directly; the MapLibre
adapter gains setSelection(), consolidating the swap logic previously
duplicated in the click hook into adapters/maplibre/selection.ts.
getContextPacket() gains `selection`.

Two non-trivial decisions made without synchronous confirmation
(AskUserQuestion keeps failing with no interactive user available in this
session) -- flagged for review:

1. Dropped the needsSelectedState gate that used to limit
   feature-state.selected writes to layers with selectedPaint/clickAnchor.
   Every click now dispatches select-feature unconditionally; the write is
   inert for layers without a companion layer consuming it (verified no
   other consumer reads feature-state.selected), so this is not expected to
   be user-visible, but it is a behavior change from before.

2. Found and fixed a real gap from Phase 1: GeoVisContextValue had no
   `dispatch`, so a React consumer calling `useGeoVis().runtime.dispatch(...)`
   directly for a spec-changing action (toggle-layer) would go stale --
   `committed.spec`/`result` never re-synced, unlike applyPatch/setView.
   Added `dispatch` to GeoVisContextValue/GeoVisProvider, mirroring
   applyPatch's existing sync pattern.

Also adds the unknown-feature-id issue code (mismatch category), only
checked when the target layer has mapDataId (cheap: rows already loaded).

Coverage threshold raised to match (never decreases per package convention).

- feat(geovis): add set-map-data action (PRD-002 phase 3)

dispatch({type:'set-map-data', layerId, mapDataId}) rebinds which mapData
entry drives a layer's styling -- "swap the joined dataset" (ADR-0003).
Compiles to a new top-level layer.<id>.mapDataId SpecPatch (extends the
same replace mechanism toggle-layer's visible field added in Phase 1, now
generalized to a small field->applier lookup table on both the runtime and
MapLibre adapter sides to keep dispatch complexity flat as fields grow).

Only the action-level layerId check is bespoke; an invalid mapDataId or a
source-scope conflict is caught by the same validateSpec pass every patch
already goes through -- no duplicated referential logic.

On the live map, rebinding only recomputes the layer's paint
(reapplyLayerPaint, extracted from syncSourcesAndLayers' upsertLayers for
reuse) -- no feature-state write needed, since every mapData entry's rows
are already resident on their source regardless of which layer points at
it today (reapplyAllMapData applies all of them unconditionally).

getContextPacket().layers[] gains mapDataId/dimension; allowedActions
includes set-map-data once the spec has a layer and a mapData entry.

Coverage threshold raised to match (never decreases per package convention).

- feat(geovis): add set-filter action and layer.filter spec concept (PRD-002 phase 4)

Introduces the plan's first genuinely new spec concept: VisualizationLayer.filter
({property, operator, value}), compiled to the engine's native filter expression
via a new adapters/maplibre/layerFilter.ts translation module. Reads
feature.properties[property] directly -- the same access path propertyName
already uses, not the mapData-joined feature-state value.

Gated by a new CapabilitySet.dataFeatures.filter (declared ['geojson'] on the
MapLibre adapter, mirroring featureState's "declared means tested" scoping,
even though MapLibre's native filter works on any source type -- the narrower
declaration reflects what's fixture-tested today). set-filter is the first
producer of the unsupported-data-feature code, reserved since PRD-001.

dispatch({type:'set-filter', layerId, filter}) extends the layer.<id>.<field>
replace mechanism (now a 3-entry lookup table on both runtime and adapter
sides) alongside visible/mapDataId. filter: null clears the filter -- compiled
to patch.value: null specifically, since value: undefined is treated as a
no-op by the existing applyPatchToRuntime guard.

Full update() now also syncs an existing layer's native filter via
map.setFilter (upsertLayers previously never touched this field for
already-mounted layers), and toMaplibreLayer sets it at mount/add time.

getContextPacket().layers[] gains filter; allowedActions gains set-filter,
now gated on both spec shape and the active adapter's declared capability
(buildContextPacket's signature grows a capabilities parameter).

Coverage threshold raised to match (never decreases per package convention).

- feat(geovis): add set-view-preset action (PRD-002 phase 5, completes v1 vocabulary)

Introduces VisualizationSpec.viewPresets (ViewPreset[]: {id, label?, view}) --
named camera positions the AI (or a UI control) can jump to by id, bounded to
what the application actually curated instead of raw coordinates an AI would
have to invent. Factored the inline view schema into $defs/ViewState so both
spec.view and viewPresets[].view share one definition.

dispatch({type:'set-view-preset', presetId}) resolves presetId against
spec.viewPresets and compiles to the existing runtime.setView() mechanism --
no new engine code. This is a third kind of action outcome (ActionOutcome
gains setViewOptions, alongside patch and selection), reusing setRuntimeView
directly rather than duplicating its camera-move/spec.view-sync logic. Only
center/zoom/pitch/bearing carry over; view.projection does not -- setView()'s
imperative camera move never supported it, a pre-existing limitation this
action doesn't attempt to fix.

Adds the unknown-view-preset issue code (mismatch), repair listing declared
preset ids -- never the presets' raw view values, consistent with the packet
never handing back coordinates either.

getContextPacket() gains viewPresets ({id, label} only); allowedActions gains
set-view-preset once the spec declares at least one entry.

This completes the plan's v1 action vocabulary: toggle-layer, select-feature,
set-map-data, set-filter, set-view-preset all implemented and dispatchable.

Coverage threshold raised to match (never decreases per package convention).

- docs(geovis): demote SpecPatch, close out PRD-002 plan (phase 6)

Reclassifies SpecPatch/applyPatch in README and TSDoc (GeoVisRuntime,
GeoVisContextValue) as the low-level escape hatch dispatch() supersedes for
anything expressible as one of its five actions -- mirrors getNativeInstance's
"available, not primary" framing. README's Action log section now says
explicitly that undo/redo is not built on the log yet.

Non-trivial scoping decision, flagged for review (AskUserQuestion unavailable
throughout this session): the plan's Phase 6 called for migrating
useBoundaryToggle to dispatch(). On inspection it's a pre-runtime
spec-composition hook (derives a VisualizationSpec for the caller to pass
into <GeoVisProvider>) with no access to a live runtime -- dispatch() only
exists on one. Migrating it would mean a breaking redesign of its public API,
not a convergence. Left as-is; only useMapClick/useGeoVisClick (Phase 2)
actually fit the "runtime-mutating hook" pattern this Should item targets.
Documented in the plan's new Implementation notes section, along with every
other correction found while implementing phases 1-5.

Marks PRD-002 status as implemented, resolves its "exact v1 action
vocabulary" open question, and updates the roadmap's "Where we are" to
reflect R2 as built.

No functional code changes -- tests/type-check unchanged at 711 passing.

- feat(geovis): remove optional id property from VisualizationSpec

- test(geovis): remove id property in GeoVisCanvas and fitBoundsToBboxLifeCycle tests

- test(geovis): update validateSpec assertion to check status instead of valid property

- docs: clarify context value sync and adjust coverage thresholds for prd-002

# [0.13.0](https://github.com/ttoss/ttoss/compare/@ttoss/geovis@0.12.0...@ttoss/geovis@0.13.0) (2026-07-20)

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

# [0.12.0](https://github.com/ttoss/ttoss/compare/@ttoss/geovis@0.11.0...@ttoss/geovis@0.12.0) (2026-07-17)

### Features

- **geovis, geovis-workspace:** add cursor control, shouldOpen guard,… ([#1147](https://github.com/ttoss/ttoss/issues/1147)) ([92136f8](https://github.com/ttoss/ttoss/commit/92136f8aba7928617b05921722a4691c55ba293b))

# [0.11.0](https://github.com/ttoss/ttoss/compare/@ttoss/geovis@0.10.0...@ttoss/geovis@0.11.0) (2026-07-15)

### Features

- **geovis:** spec-driven layer click via layer.click.onSelect ([#1131](https://github.com/ttoss/ttoss/issues/1131)) ([b8b2ae0](https://github.com/ttoss/ttoss/commit/b8b2ae001156cfb3cc9a3fb1d2fd98cf70ba10f7))

# [0.10.0](https://github.com/ttoss/ttoss/compare/@ttoss/geovis@0.9.0...@ttoss/geovis@0.10.0) (2026-07-11)

### Features

- **geovis:** refine mapType defaults and fix fallback logic for circle color and legends ([#1120](https://github.com/ttoss/ttoss/issues/1120)) ([e161747](https://github.com/ttoss/ttoss/commit/e1617475f356eaf7421b8009776e646132ef81e6))

# [0.9.0](https://github.com/ttoss/ttoss/compare/@ttoss/geovis@0.8.2...@ttoss/geovis@0.9.0) (2026-07-03)

### Features

- **geovis:** Add proportional circles map type auto-configuration ([#1105](https://github.com/ttoss/ttoss/issues/1105)) ([df2850d](https://github.com/ttoss/ttoss/commit/df2850d1094f660c71bc8000f2165e819483535d))

## [0.8.2](https://github.com/ttoss/ttoss/compare/@ttoss/geovis@0.8.1...@ttoss/geovis@0.8.2) (2026-07-01)

### Bug Fixes

- **geovis:** Complete removal of the root ID field from VisualizationSpec ([#1101](https://github.com/ttoss/ttoss/issues/1101)) ([ebbd6ce](https://github.com/ttoss/ttoss/commit/ebbd6ce447e6728215a73c12bf290ac521f403ec))

## [0.8.1](https://github.com/ttoss/ttoss/compare/@ttoss/geovis@0.8.0...@ttoss/geovis@0.8.1) (2026-07-01)

### Bug Fixes

- changing geovisLegend structure ([#1111](https://github.com/ttoss/ttoss/issues/1111)) ([fd90668](https://github.com/ttoss/ttoss/commit/fd90668837740c1e0fcd66f72275266564c4ab84))

# [0.8.0](https://github.com/ttoss/ttoss/compare/@ttoss/geovis@0.7.1...@ttoss/geovis@0.8.0) (2026-06-30)

### Features

- **geovis:** Add dot map type auto-configuration ([#1104](https://github.com/ttoss/ttoss/issues/1104)) ([f1f12d8](https://github.com/ttoss/ttoss/commit/f1f12d8f2d0cac041630f7acca7c5b21e07575de))

## [0.7.1](https://github.com/ttoss/ttoss/compare/@ttoss/geovis@0.7.0...@ttoss/geovis@0.7.1) (2026-06-30)

**Note:** Version bump only for package @ttoss/geovis

# [0.7.0](https://github.com/ttoss/ttoss/compare/@ttoss/geovis@0.6.0...@ttoss/geovis@0.7.0) (2026-06-26)

### Features

- **geovis:** spec-driven basemap label visibility via basemap.labels ([#1106](https://github.com/ttoss/ttoss/issues/1106)) ([c5edb01](https://github.com/ttoss/ttoss/commit/c5edb01a069bdcbe4e0bb0ab2614f8555a20761f))

# [0.6.0](https://github.com/ttoss/ttoss/compare/@ttoss/geovis@0.5.0...@ttoss/geovis@0.6.0) (2026-06-25)

### Features

- **geovis:** Add choropleth map type auto-configuration ([#1099](https://github.com/ttoss/ttoss/issues/1099)) ([cf43365](https://github.com/ttoss/ttoss/commit/cf4336560da549d4edd62322bf7fada8e7f1de44))

# [0.5.0](https://github.com/ttoss/ttoss/compare/@ttoss/geovis@0.4.0...@ttoss/geovis@0.5.0) (2026-06-23)

### Features

- **geovis:** spec-driven hover tooltip via layer.hoverTooltip ([#1102](https://github.com/ttoss/ttoss/issues/1102)) ([36f435f](https://github.com/ttoss/ttoss/commit/36f435f2511a9b7f8a4e8e2e728dc5b83e9bed1c))

# [0.4.0](https://github.com/ttoss/ttoss/compare/@ttoss/geovis@0.3.1...@ttoss/geovis@0.4.0) (2026-06-23)

### Features

- Support proportional circles creation with size and color related to distinct variables ([#1088](https://github.com/ttoss/ttoss/issues/1088)) ([19abcc9](https://github.com/ttoss/ttoss/commit/19abcc920e5051006f3fcef7c0d96fecd002d4fc))

## [0.3.1](https://github.com/ttoss/ttoss/compare/@ttoss/geovis@0.3.0...@ttoss/geovis@0.3.1) (2026-06-19)

**Note:** Version bump only for package @ttoss/geovis

# [0.3.0](https://github.com/ttoss/ttoss/compare/@ttoss/geovis@0.2.1...@ttoss/geovis@0.3.0) (2026-06-19)

### Features

- **geovis:** configurable legend — labelFormat, normalization, position, reference ([#1012](https://github.com/ttoss/ttoss/issues/1012)) ([d6ea06a](https://github.com/ttoss/ttoss/commit/d6ea06a02861bbfe79692de2032340b09065b913))

## [0.2.1](https://github.com/ttoss/ttoss/compare/@ttoss/geovis@0.2.0...@ttoss/geovis@0.2.1) (2026-06-18)

**Note:** Version bump only for package @ttoss/geovis

# 0.2.0 (2026-06-17)

### Features

- **geovis:** basemap presets and administrative boundaries of Brazil layers ([#1049](https://github.com/ttoss/ttoss/issues/1049)) ([8d33e8a](https://github.com/ttoss/ttoss/commit/8d33e8a8bc2837e63050e0331707501af7582b16))
- **http-server-mcp:** public MCP methods and RFC 9728 discovery in createMcpRouter ([#1068](https://github.com/ttoss/ttoss/issues/1068)) ([d78a476](https://github.com/ttoss/ttoss/commit/d78a4767400bed67cbe5a1dfef822b76f26366a3)), closes [#1065](https://github.com/ttoss/ttoss/issues/1065)

## [0.1.20](https://github.com/ttoss/ttoss/compare/@ttoss/geovis@0.1.19...@ttoss/geovis@0.1.20) (2026-06-10)

**Note:** Version bump only for package @ttoss/geovis

## [0.1.19](https://github.com/ttoss/ttoss/compare/@ttoss/geovis@0.1.18...@ttoss/geovis@0.1.19) (2026-06-09)

### Bug Fixes

- add rolldown/vite 8 export conditions and move @ttoss/components to peerDep ([c85efe3](https://github.com/ttoss/ttoss/commit/c85efe3b91f4af2405515bd6fa20227579869583))

## [0.1.18](https://github.com/ttoss/ttoss/compare/@ttoss/geovis@0.1.17...@ttoss/geovis@0.1.18) (2026-06-09)

**Note:** Version bump only for package @ttoss/geovis

## [0.1.17](https://github.com/ttoss/ttoss/compare/@ttoss/geovis@0.1.16...@ttoss/geovis@0.1.17) (2026-06-05)

### Bug Fixes

- **@ttoss/http-server-mcp:** improve test coverage and fix peerDependencies ([#1022](https://github.com/ttoss/ttoss/issues/1022)) ([253bd98](https://github.com/ttoss/ttoss/commit/253bd98eaa29f690d4e198ad994b5d1aed4e89c5))

## [0.1.16](https://github.com/ttoss/ttoss/compare/@ttoss/geovis@0.1.15...@ttoss/geovis@0.1.16) (2026-06-05)

**Note:** Version bump only for package @ttoss/geovis

## [0.1.15](https://github.com/ttoss/ttoss/compare/@ttoss/geovis@0.1.14...@ttoss/geovis@0.1.15) (2026-06-05)

**Note:** Version bump only for package @ttoss/geovis

## [0.1.14](https://github.com/ttoss/ttoss/compare/@ttoss/geovis@0.1.13...@ttoss/geovis@0.1.14) (2026-06-05)

### Bug Fixes

- update publishConfig.exports for tsdown output format ([#1017](https://github.com/ttoss/ttoss/issues/1017)) ([982c7fc](https://github.com/ttoss/ttoss/commit/982c7fc5d5a40adf3b61a3ebbbef6d649a04d65d))

## [0.1.13](https://github.com/ttoss/ttoss/compare/@ttoss/geovis@0.1.12...@ttoss/geovis@0.1.13) (2026-06-03)

**Note:** Version bump only for package @ttoss/geovis

## [0.1.12](https://github.com/ttoss/ttoss/compare/@ttoss/geovis@0.1.11...@ttoss/geovis@0.1.12) (2026-06-02)

**Note:** Version bump only for package @ttoss/geovis

## [0.1.11](https://github.com/ttoss/ttoss/compare/@ttoss/geovis@0.1.10...@ttoss/geovis@0.1.11) (2026-05-18)

**Note:** Version bump only for package @ttoss/geovis

## [0.1.10](https://github.com/ttoss/ttoss/compare/@ttoss/geovis@0.1.9...@ttoss/geovis@0.1.10) (2026-05-13)

**Note:** Version bump only for package @ttoss/geovis

## [0.1.9](https://github.com/ttoss/ttoss/compare/@ttoss/geovis@0.1.8...@ttoss/geovis@0.1.9) (2026-05-11)

**Note:** Version bump only for package @ttoss/geovis

## [0.1.8](https://github.com/ttoss/ttoss/compare/@ttoss/geovis@0.1.7...@ttoss/geovis@0.1.8) (2026-05-11)

**Note:** Version bump only for package @ttoss/geovis

## [0.1.7](https://github.com/ttoss/ttoss/compare/@ttoss/geovis@0.1.6...@ttoss/geovis@0.1.7) (2026-05-11)

**Note:** Version bump only for package @ttoss/geovis

## [0.1.6](https://github.com/ttoss/ttoss/compare/@ttoss/geovis@0.1.5...@ttoss/geovis@0.1.6) (2026-05-04)

**Note:** Version bump only for package @ttoss/geovis

## [0.1.5](https://github.com/ttoss/ttoss/compare/@ttoss/geovis@0.1.4...@ttoss/geovis@0.1.5) (2026-04-29)

**Note:** Version bump only for package @ttoss/geovis

## [0.1.4](https://github.com/ttoss/ttoss/compare/@ttoss/geovis@0.1.3...@ttoss/geovis@0.1.4) (2026-04-23)

**Note:** Version bump only for package @ttoss/geovis

## [0.1.3](https://github.com/ttoss/ttoss/compare/@ttoss/geovis@0.1.2...@ttoss/geovis@0.1.3) (2026-04-23)

**Note:** Version bump only for package @ttoss/geovis

## 0.1.2 (2026-04-22)

**Note:** Version bump only for package @ttoss/geovis

## 0.1.1 (2026-04-15)

### Features

- init `@ttoss/geovis` package with MapLibre adapter, spec validation, and React integration
