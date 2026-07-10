---
sidebar_position: 1
title: PRD-001 · Repairable Errors
---

# PRD-001: Repairable Errors and Honest Capabilities

Status: draft · Priority: **P1** (roadmap R1) · Capability: strategy §5.7 · Package: `@ttoss/geovis`

## Problem

Validation returns prose strings, policies use a separate shape, patches fail as runtime warnings, and `CapabilitySet` is dead code. Neither an AI nor a UI can tell "malformed spec" from "unsupported by this adapter" from "broken reference" — so every failure is a dead end instead of a repair loop, and the advertised capability surface does not match what actually works.

## Outcome and success metrics

Every failure is machine-actionable and every declared capability is real.

- 100% of resolution-affecting entry points return the typed result taxonomy; zero silent failures.
- Repair options present on every failure where alternatives are computable.
- Capability table has no entry that is declared but untested (declared = fixture-backed).
- A spec requiring an unsupported capability is rejected before mount.

## Requirements

### Must

- `GeoVisResult` discriminated union with the closed status enum from [ADR-0001](https://github.com/ttoss/ttoss/blob/main/packages/geovis/docs/adr/0001-structured-resolution-results.md); issues carry `code`, `subject`, `message`, and `repair` when computable.
- `validateSpec`, `runtime.update`, and `runtime.applyPatch` migrated to the taxonomy; nothing renders on failure.
- `CapabilitySet` expanded to the structured tree from [ADR-0002](https://github.com/ttoss/ttoss/blob/main/packages/geovis/docs/adr/0002-capabilityset-enforced-contract.md) and consumed by validation (`unsupported` issues).
- One official fixture per declared capability entry.

### Should

- Spec schema versioning so results can report version mismatch.
- Policy violations reported through the same issue shape.

### Won't (non-goals)

- Permission/authorization statuses (application-level), retry logic, or any UI presentation of errors (PRD-003).

## Dependencies

None — this is the foundation. Accepting ADR-0001 and ADR-0002 is the entry gate.

## Open questions

- Final list of issue `code` values (product + engineering review).
- Which policy violations block rendering vs. attach as warnings.
