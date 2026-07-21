# ADR-0004: Compact, metadata-only AI context packet

Status: proposed (2026-07-08)
Tags: context-packet, serialization, explainability, ai-readiness

## Context and Problem Statement

For an AI to steer, explain, or repair a map it needs to know the current state. Today the only complete representation is the full `VisualizationSpec` — GeoJSON data or URLs, paint-level layer details, legend stops. Feeding that to a model violates the strategy's "small context over large context" principle: high token cost, engine internals exposed, and explanation degenerating into the model guessing from raw config.

The strategy defines the alternative as a first-class product artifact: a compact packet summarizing the current map and the allowed next actions.

## Decision Drivers

- Small context: the model receives only what the next decision needs.
- Grounded explanation: "what does this map show" must be answered from resolved metadata, not model inference over config.
- kepler.gl precedents, positive and cautionary: its Schema Manager shows the value of a versioned serialization boundary that is _derived_ from runtime state and deliberately excludes ephemeral `uiState` — and its `dataId` coupling shows that a serialized artifact without stable identifiers breaks silently. Its AI Assistant's core privacy rule — the LLM sees dataset, layer, and variable _names_, never rows — is the right default for a product-embedded surface too.

## Considered Options

1. Hand the model the full spec — token-expensive, leaks internals, scales with data size instead of decision size.
2. Let each application hand-build its own summary — duplicated, divergent, and unverifiable by package-level evals.
3. A first-class, derived `ContextPacket` produced by the runtime — chosen.

## Decision Outcome

The runtime exposes `getContextPacket()`: a versioned, read-only artifact derived on demand from the current resolved spec and runtime state. It contains metadata and aggregates only — never raw features or geometry: map type, source and layer summaries (stable ids, roles, source types), active data bindings (which dataset drives which dimension), a legend summary (scale kind, domain, unit), active policy violations and warnings, the current selection, the allowed actions for this spec and adapter (the ADR-0003 vocabulary filtered by the ADR-0002 capability tree), and the last structured error (ADR-0001).

The packet is a contract, not a debug dump: its schema is versioned like the spec schema, its ids are the same stable ids the action surface accepts (what the packet names, an action can target), and UI state and engine internals are excluded by construction.

### Consequences

- Good: generate/steer/explain/repair all read from one grounded artifact; token cost becomes measurable per turn, giving future evals their budget metric.
- Good: applications embedding an assistant get the AI-facing state for free instead of each rebuilding it.
- Bad: a second versioned schema to maintain — every spec vocabulary change must decide whether and how it appears in the packet; summarization (e.g. legend domains) must stay cheap enough to derive per turn.

Anchors: `src/runtime/createRuntime.ts`, `src/spec/types.ts`, `src/spec/schema.json`
