---
sidebar_position: 3
title: PRD-003 · Human Workspace Foundation
---

# PRD-003: Human Workspace Foundation

Status: draft · Priority: **P3** (roadmap R3a — runs in parallel with PRD-002) · Capability: strategy §5.5 · Package: `@ttoss/geovis-workspace`

## Problem

`@ttoss/geovis-workspace` is a layout shell not wired to GeoVis maps: `GeoVisProvider` mounts inside the map slot, so sidebars cannot read runtime state, and the right-sidebar legend is hand-authored config that duplicates what the spec already resolves — two owners for one state, drifting by construction. Applications embedding GeoVis rebuild legend placement, warnings display, and inspection UI themselves, and failures from the runtime never reach the screen.

## Outcome and success metrics

The workspace is the default human surface for a GeoVis map, and everything it shows derives from the runtime.

- An application renders an operable map (map + legend + tooltip + warnings + inspection) with the workspace and no custom map UI — and no hand-authored duplication of resolved state.
- Structured errors and policy violations are visible, translated, and actionable (repair options shown).
- Default panels are replaceable per slot without losing runtime binding; custom panels get runtime access through public contexts.
- Core flows are keyboard-operable (v1 quality criterion).

## Requirements

### Must

- `GeoVisProvider` hoisted above the layout; panels subscribe to the runtime; config narrows to layout and annotations ([workspace ADR-0001](https://github.com/ttoss/ttoss/blob/main/packages/geovis-workspace/docs/adr/0001-runtime-derived-panels.md)).
- Named slots (`map`, `legend`, `warnings`, `inspector`, `metadata`, `controls`) with runtime-bound defaults, overridable or hideable per slot ([workspace ADR-0002](https://github.com/ttoss/ttoss/blob/main/packages/geovis-workspace/docs/adr/0002-slot-based-composition.md)).
- Failures from the PRD-001 taxonomy render as a repair surface: severity from status, text keyed by issue `code` via `@ttoss/react-i18n`, `repair` candidates as one-click affordances ([workspace ADR-0003](https://github.com/ttoss/ttoss/blob/main/packages/geovis-workspace/docs/adr/0003-structured-failures-as-repair-surface.md)).
- All user-facing text via `@ttoss/react-i18n`; components follow the context-first pattern.

### Should

- Metadata panel and layer list; Storybook stories for every component.

### Won't (non-goals)

- Changing the mutation path — controls keep the current selection mechanism until PRD-008 migrates them to semantic actions; dashboard building, app business logic, or an AI chat UI (application-level).

## Dependencies

PRD-001 only (the taxonomy to display). Deliberately **not** PRD-002: foundation work touches a different package and can run in parallel with the AI operation surface.

## Open questions

- Which panels are v1 vs. later (inspector vs. metadata vs. layer list).
- Whether the accessibility policy (strategy-planned) gates this PRD or follows it.
