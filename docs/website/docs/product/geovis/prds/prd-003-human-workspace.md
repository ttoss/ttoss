---
sidebar_position: 3
title: PRD-003 · Human Workspace
---

# PRD-003: Human Workspace

Status: draft · Priority: **P3** (roadmap R3) · Capability: strategy §5.5 · Package: `@ttoss/geovis-workspace`

## Problem

`@ttoss/geovis-workspace` is a layout shell (sidebars, provider, context) not yet wired to GeoVis maps. Applications embedding GeoVis rebuild legend placement, warnings display, and inspection UI themselves — and human edits share no pathway with AI steering, so the two surfaces can drift.

## Outcome and success metrics

The workspace is the default human surface for a GeoVis map.

- An application renders an operable map (map + legend + tooltip + warnings + inspection) with the workspace and no custom map UI.
- 100% of workspace mutations dispatch PRD-002 semantic actions — a human click and an AI turn produce identical logs.
- Structured errors and policy violations are visible and understandable in the UI.
- Core flows are keyboard-operable (v1 quality criterion).

## Requirements

### Must

- Workspace slots render the GeoVis runtime: canvas, legend, hover tooltip, warnings panel, selected-feature inspection.
- All controls dispatch semantic actions; no direct spec mutation.
- Failures from the PRD-001 taxonomy surface as actionable UI (show repair options).
- All user-facing text via `@ttoss/react-i18n`; components follow the context-first pattern.

### Should

- Metadata panel and layer list; Storybook stories for every component.

### Won't (non-goals)

- Dashboard building, app business logic, or an AI chat UI (application-level).

## Dependencies

PRD-001 (error taxonomy to display), PRD-002 (actions to dispatch).

## Open questions

- Which panels are v1 vs. later (inspector vs. metadata vs. layer list).
- Whether the accessibility policy (strategy-planned) gates this PRD or follows it.
