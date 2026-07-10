---
title: PRD-008 · Workspace–AI Convergence
---

# PRD-008: Workspace–AI Convergence

Status: draft · Priority: **P4** (roadmap R3b) · Capability: strategy §8 (convergence) · Package: `@ttoss/geovis-workspace`

## Problem

Workspace mutations flow through `onSelectionChange` → the application rebuilds the entire `visualizationSpec` — regeneration instead of actions. Human edits share no pathway with AI steering, so the two surfaces drift, view and selection continuity is destroyed on every change, and there is no common log: a human click and an AI turn are unrelated events that cannot be audited, compared, or undone together.

## Outcome and success metrics

A human click and an AI turn are the same operation.

- 100% of workspace mutations dispatch PRD-002 semantic actions; human and AI operations produce identical log entries.
- Rejected dispatches render through the PRD-003 repair surface — no silent failures.
- The action log is visible in the workspace (audit trail), with `rationale` shown for AI-originated actions.
- View and selection survive metric/filter changes (no full-spec re-render).

## Requirements

### Must

- All controls compile interactions to semantic actions dispatched on the shared runtime; no direct spec mutation ([workspace ADR-0004](https://github.com/ttoss/ttoss/blob/main/packages/geovis-workspace/docs/adr/0004-semantic-action-mutations.md)).
- Menu groups bind to action templates in config (menu item → action + value).
- `onSelectionChange` demoted to an observer notification; documented as such.
- Repair affordances from PRD-003 migrate to dispatching semantic actions, so human repairs are logged like AI repairs.

### Should

- Undo/redo UI derived from the action log (substrate defined in PRD-002).
- Coverage report: any workspace control not expressible as an action is filed as an action-vocabulary gap against PRD-002.

### Won't (non-goals)

- LLM clients, chat UI, or prompt templates (application-level); the action vocabulary itself (PRD-002).

## Dependencies

PRD-002 (action vocabulary and `dispatch()`), PRD-003 (slots and repair surface to wire into).

## Open questions

- Shape of the menu→action binding schema (declarative config vs. render-prop).
- Whether undo/redo state lives in `@ttoss/geovis` (runtime log) or the workspace (UI history).
