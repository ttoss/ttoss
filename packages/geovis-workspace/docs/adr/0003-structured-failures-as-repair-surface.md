# ADR-0003: Structured failures render as a repair surface keyed by issue code

Status: proposed (2026-07-10)
Tags: workspace, errors, repair-loop, i18n

## Context and Problem Statement

GeoVis [ADR-0001](../../../geovis/docs/adr/0001-structured-resolution-results.md) turns every failure into a `GeoVisResult` whose issues carry `code`, `subject`, `message`, and `repair`. PRD-001 deliberately excludes UI presentation ("Won't: … any UI presentation of errors") and delegates it here — the workspace is where the taxonomy meets humans. Today nothing surfaces: a failed update is a console warning and a blank or stale map.

Rendering the library's prose `message` in a toast would waste the taxonomy: it cannot be translated (workspace text must flow through `@ttoss/react-i18n`), it disappears, and it discards `repair` — a dead end, which is exactly the failure mode the taxonomy exists to eliminate.

## Decision Drivers

- PRD-003 Must: failures from the PRD-001 taxonomy surface as actionable UI with repair options.
- One repair loop, two surfaces: the same structured issue drives AI repair (context packet) and human repair (this panel).
- i18n: a machine `code` keys a `defineMessages` catalog; library prose cannot be localized after the fact.
- Evals (PRD-007) can measure human repair success only if repair is an observable interaction, not a re-typed spec.

## Considered Options

1. Toast the library message via `@ttoss/react-notifications` — ephemeral, untranslated, drops repair options.
2. Debug panel showing the raw result JSON — a developer surface, not a product surface.
3. A persistent warnings panel deriving severity from status, text from a code-keyed i18n catalog, and rendering `repair` candidates as one-click affordances — chosen.

## Decision Outcome

A warnings panel (default `warnings` slot, ADR-0002) subscribes to the runtime's latest results and policy violations (possible because of ADR-0001's provider position). Each issue renders: severity (blocking failure vs. warning) from the result status; a translated message keyed by issue `code` with the library `message` as fallback; the `subject` as a reference that highlights its target; and, when `repair` is present, the candidate fixes as buttons. Until ADR-0004 lands, repair buttons apply through `update`/`applyPatch`; after it, they dispatch the corresponding semantic action so human repairs are logged like AI repairs. A blocking failure renders an empty-state repair view in the `map` slot — never a silently blank canvas.

### Consequences

- Good: the repair loop closes for humans; unknown future codes degrade gracefully to the fallback message; PRD-007 gains a human-side repair-success signal.
- Bad: the i18n catalog must track the closed code enum release-by-release, and the panel must tolerate statuses it does not know — forward compatibility becomes a test obligation.

Anchors: `src/components/RightSidebar.tsx`, `src/messages.ts`, [`../geovis/src/spec/validateSpec.ts`](../../../geovis/src/spec/validateSpec.ts)
