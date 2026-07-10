---
sidebar_position: 7
title: PRD-007 · Evaluation Suite
---

# PRD-007: Evaluation Suite

Status: draft · Priority: **P7** (roadmap R5) · Capability: strategy §13 · Package: repo-level (location decided here)

## Problem

The strategy is explicit: GeoVis is not ready when maps render — it is ready when generation, steering, explanation, and repair pass representative evals against real catalogs. Without evals, every reliability claim in PRDs 001–006 is asserted, not proven, and regressions are invisible.

## Outcome and success metrics

Quality has numbers and regressions are caught.

The suite reports, per operating mode and model:

- schema validity, correct metric / geography / map type
- hallucinated ID rate, resolver success rate, ambiguity detection
- repair success rate, token cost, turns to rendered map, manual correction rate

## Requirements

### Must

- Eval harness covering the four modes (generate, steer, explain, repair) against fixture catalogs and golden intents/results.
- Runnable in CI with pass/fail thresholds; failures block release of the packages they cover.
- Metrics persisted so trends are visible across versions.

### Should

- Model comparison matrix (multiple LLM providers) and cost tracking per mode.

### Won't (non-goals)

- Production telemetry or user analytics (application-level).

## Dependencies

All previous PRDs — each contributes the surface it measures. Steering/explain evals need only PRD-001/002; generation/repair evals need PRD-004/005/006.

## Open questions

- Sourcing of representative catalogs and request sets (synthetic vs. anonymized real).
- Which providers run in CI vs. locally (cost and secrets policy).
