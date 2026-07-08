# ADR-0002: `CapabilitySet` becomes an enforced, introspectable contract

Status: proposed (2026-07-08)
Tags: capabilities, adapters, validation, ai-readiness

## Context and Problem Statement

`CapabilitySet` exists in `runtime/adapter.ts` as four boolean flags (`supports3D`, `supportsRaster`, `supportsVectorTiles`, `supportsCustomLayers`) that no code path consumes — dead code. Meanwhile the real capability surface has holes the flags cannot express: `raster-dem` sources are accepted but no layer type renders them, `mapData`/`sizeBy`/companion layers work only for GeoJSON sources, and `supports3D: false` coexists with `pitch`/`bearing` being passed to the engine unchecked.

The v1 quality criteria require adapters to fail explicitly when they do not support a capability, and the strategy requires external AI tools to know what is mappable before generating a spec. With a second adapter (deck.gl) planned, spec portability across adapters cannot rest on trial and error.

## Decision Drivers

- Anti-hallucination: an AI generating specs must be constrained to what the runtime actually supports, the same way kepler.gl's AI Assistant only exposes a fixed list of function tools to its LLM.
- Explicit failure: a spec requesting an unsupported capability must be rejected with a structured `unsupported` result (ADR-0001), not rendered partially.
- kepler.gl needs no capability negotiation because it has a single engine and a human operator who discovers limits interactively; GeoVis has multiple adapters and non-human operators, so the contract must be declarative.
- Honesty: a declared capability that is untested is indistinguishable from a hallucinated one.

## Considered Options

1. Delete `CapabilitySet` (YAGNI) — forfeits adapter negotiation and AI introspection, both explicit strategy requirements.
2. Keep boolean flags as advisory documentation — flags cannot express per-source-type support (`featureState` for `geojson` but not `vector-tiles`) and advisory contracts drift.
3. Expand to a structured capability tree consumed by validation and exposed for introspection — chosen.

## Decision Outcome

`CapabilitySet` becomes a structured tree whose vocabulary mirrors the spec: supported source types, layer geometries, data features (`featureState`, `sizeBy`, companion layers, hot update) keyed by source type, and view features (`pitch`, `bearing`, projections). `validateSpec` accepts the active adapter's capabilities and emits `unsupported` issues for anything the spec requires but the adapter does not declare, so rejection happens before mount, not as engine misbehavior.

The rule that keeps the contract honest: **declared means tested**. A capability entry may only be `true` if an official fixture exercises it. The current status table in the package documentation (declared / enforced / tested) becomes the acceptance checklist for this ADR — entries that cannot get a fixture are declared `false` until they can.

### Consequences

- Good: adapters fail explicitly (quality criterion 6); AI tools and builders can introspect before generating; the deck.gl adapter gets a concrete contract to implement against.
- Good: consumers can detect adapter incompatibility at provider creation instead of at runtime.
- Bad: the honest table will temporarily shrink the advertised surface (e.g. `raster-dem`, heatmap) until fixtures exist, and validation gains a small runtime cost per spec.

Anchors: `src/runtime/adapter.ts`, `src/spec/validateSpec.ts`, `src/fixtures/`
