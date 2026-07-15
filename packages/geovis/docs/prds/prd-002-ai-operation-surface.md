---
title: PRD-002 · AI Operation Surface
---

# PRD-002: AI Operation Surface

Status: implemented ([plan](../plans/plan-prd-002-ai-operation-surface.md)) · Priority: **P2** (roadmap R2) · Capability: strategy §5.6 + §10 · Package: `@ttoss/geovis`

## Problem

The only way to steer a live map is raw `SpecPatch` paths, which require knowing spec internals — exactly what an AI should not do. The only complete state representation is the full spec, which is too large and too low-level to hand to a model. Steering and explanation are therefore impossible without hallucination risk and unbounded context cost.

## Outcome and success metrics

An LLM operates an existing map through a bounded, validated interface.

- Every map mutation the UI can perform is expressible as a semantic action; invalid actions are rejected before touching the map.
- Context packet is metadata-only and bounded (target: hundreds of tokens, never scaling with data size).
- Every dispatched action is logged with optional `rationale` (audit + undo substrate).
- Explain answers come from the packet, not the spec.

## Requirements

### Must

- Closed, typed action vocabulary with `runtime.dispatch(action): GeoVisResult`, validated against the capability tree and current spec ([ADR-0003](https://github.com/ttoss/ttoss/blob/main/packages/geovis/docs/adr/0003-semantic-action-surface.md)).
- `runtime.getContextPacket()`: versioned, read-only, metadata-only summary including allowed actions and last structured error ([ADR-0004](https://github.com/ttoss/ttoss/blob/main/packages/geovis/docs/adr/0004-ai-context-packet.md)).
- Packet IDs are the same stable IDs actions accept.
- `SpecPatch` demoted to documented escape hatch.

### Should

- React hooks migrated to dispatch the same actions (human/AI convergence). Done for the click hook (`useMapClick`/`useGeoVisClick` dispatch `select-feature`, converging with `dispatch()`). `useBoundaryToggle` was evaluated and **not** migrated — see the plan's implementation notes for why forcing it would be a breaking redesign, not a convergence.
- Undo/redo derived from the action log. Not built — the log is the substrate; deriving undo/redo is left to a workspace-level consumer (PRD-008).

### Won't (non-goals)

- LLM clients, provider integrations, or prompt templates inside the package (see [AI integration research](../research/ai-integration-readiness.md)); catalog knowledge (PRD-004).

## Dependencies

PRD-001 (actions report through the result taxonomy; validation needs the capability tree).

## Open questions

- ~~Exact v1 action vocabulary (naming is product work).~~ Resolved: `toggle-layer`, `select-feature`, `set-map-data`, `set-filter`, `set-view-preset`.
- Packet schema evolution policy relative to spec schema versioning. Still open — `getContextPacket()` ships `schemaVersion: 1` but no migration policy has been decided.
