# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.2.4](https://github.com/ttoss/ttoss/compare/@docs/fsl-storybook@0.2.3...@docs/fsl-storybook@0.2.4) (2026-08-07)

**Note:** Version bump only for package @docs/fsl-storybook

## [0.2.3](https://github.com/ttoss/ttoss/compare/@docs/fsl-storybook@0.2.2...@docs/fsl-storybook@0.2.3) (2026-08-06)

**Note:** Version bump only for package @docs/fsl-storybook

## [0.2.2](https://github.com/ttoss/ttoss/compare/@docs/fsl-storybook@0.2.1...@docs/fsl-storybook@0.2.2) (2026-08-05)

**Note:** Version bump only for package @docs/fsl-storybook

## [0.2.1](https://github.com/ttoss/ttoss/compare/@docs/fsl-storybook@0.2.0...@docs/fsl-storybook@0.2.1) (2026-08-05)

**Note:** Version bump only for package @docs/fsl-storybook

# [0.2.0](https://github.com/ttoss/ttoss/compare/@docs/fsl-storybook@0.1.6...@docs/fsl-storybook@0.2.0) (2026-08-05)

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

## [0.1.6](https://github.com/ttoss/ttoss/compare/@docs/fsl-storybook@0.1.5...@docs/fsl-storybook@0.1.6) (2026-07-30)

**Note:** Version bump only for package @docs/fsl-storybook

## [0.1.5](https://github.com/ttoss/ttoss/compare/@docs/fsl-storybook@0.1.4...@docs/fsl-storybook@0.1.5) (2026-07-29)

**Note:** Version bump only for package @docs/fsl-storybook

## [0.1.4](https://github.com/ttoss/ttoss/compare/@docs/fsl-storybook@0.1.3...@docs/fsl-storybook@0.1.4) (2026-07-26)

**Note:** Version bump only for package @docs/fsl-storybook

## [0.1.3](https://github.com/ttoss/ttoss/compare/@docs/fsl-storybook@0.1.2...@docs/fsl-storybook@0.1.3) (2026-07-25)

**Note:** Version bump only for package @docs/fsl-storybook

## [0.1.2](https://github.com/ttoss/ttoss/compare/@docs/fsl-storybook@0.1.1...@docs/fsl-storybook@0.1.2) (2026-07-24)

**Note:** Version bump only for package @docs/fsl-storybook

## 0.1.1 (2026-07-23)

**Note:** Version bump only for package @docs/fsl-storybook
