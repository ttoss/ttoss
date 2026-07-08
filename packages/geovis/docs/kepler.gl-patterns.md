# Kepler.gl Patterns in GeoVis ADRs

How the kepler.gl architecture influenced the four ADRs: which patterns to replicate (good), which problems to avoid (antipatterns), and how each feeds into the GeoVis AI-native operating model.

## Good Patterns Replicated

### 1. State Separation (`visState`, `mapState`, `mapStyle`, `uiState`) → ADR-0004

**What kepler.gl does:**

- `visState`: datasets, layers, filters — persisted
- `mapState`: viewport, drag/rotate, split — persisted
- `mapStyle`: basemap, visual layers — persisted
- `uiState`: open/close panels — **deliberately not persisted**

**Why:** Each owns an independent domain; `uiState` is ephemeral and reopens with defaults, never "remembered."

**Current geovis state:** No separation. `VisualizationSpec` is monolithic: everything together, no boundary between "map state" and "UI transport data."

**What ADR-0004 proposes:**

The `ContextPacket` operationalizes this separation at the AI layer: `mapData` (visState), `filters/view` (mapState), `style` (mapStyle), but **never** includes panel position, tooltip selection, or legend scroll. Maintains kepler.gl's principle (persisted ≠ UI) at the AI context level: data to make the next decision, never transport state.

**Consequence:** An LLM sees "map shows population, filtered by year, with categorical legend" — never sees "legend panel open at x:340px."

---

### 2. Granular Actions with Undo/Redo → ADR-0003

**What kepler.gl does:**

```
layerOpacityChange({ opacity: 0.5 })
layerVisConfigChange({ prop: 'colorField', value: 'income' })
setFilter({ id: 'age-filter', value: [18, 65] })
```

Each property change is an action, composing into an **action log** that supports undo/redo replay.

**The problem kepler.gl accidentally solves:** Undo/redo only works when each change is named and granular. If it were "updateLayerAndFilterAndLegend(spec)", there's no rollback.

**Current geovis state:** `applyPatch` — raw paths, no named granularity. A patch `{ op: 'replace', path: 'layers.0.paint.color', value: '#ff0000' }` doesn't call itself "change color," it's just a JSON path.

**What ADR-0003 proposes:**

Named action values (`layer-color-change({ layerId, color })`) that compile internally to `SpecPatch` — the inverse. Enables:

- Undo/redo by action, not patch.
- Auditability ("what was done and why") via `rationale`.
- A human click → `dispatch(action)` and an AI turn → `dispatch(action)` produce identical logs.

**Consequence:** Undo is not "erase a JSON path," it's "revert to the prior action."

---

### 3. Versioned Serialization with Schema Boundary → ADR-0001 + ADR-0004

**What kepler.gl does:**

`SchemaManager.save()` → versioned JSON that can load in future versions. It is a contract: "this JSON is valid from v1.2 onward."

**Current geovis state:** `VisualizationSpec` is TypeScript-typed but unversioned — no guarantee a v1 spec opens in v2 without mutations.

**What ADR-0001 proposes:** Each `GeoVisResult` carries version metadata and can report "this spec is from a kepler I don't understand, needs upgrade."

---

## Antipatterns to Avoid

### 1. Silent Config Failures Dependent on dataId → ADR-0001 (Repair Field)

**What kepler.gl does (the problem):**

```
// Saved
{ datasets: [{ id: 'urban-population', ... }], config: { layers: [...] } }

// Loaded with different dataset
{ datasets: [{ id: 'rural-income', ... }] }

// Result: config ignored silently, map opens empty
// No error, no explanation
```

**Why it happens:** `config` references `dataId`; if the `dataId` doesn't match, the config is discarded without warning. An LLM says "reconfigure it" instead of "your old config doesn't apply to this dataset because the ID changed from X to Y."

**What ADR-0001 proposes:**

Structured fallback: instead of silent, return `{ status: 'mismatch', issues: [{ code: 'source-reference-not-found', subject: 'layer-income-map', repair: ['use-dataset:1', 'create-new-layer'] }] }`.

**Consequence:** An AI surface that can say "you loaded new data, the old config doesn't work, your options are [1] reuse with that dataset [2] create new."

---

### 2. AI Assistant as Retrofit → ADR-0003 (Actions as Primary Contract)

**What kepler.gl does:**

1. First: granular engine actions (`layerOpacityChange`, `setFilter`, etc.)
2. Then: AI Assistant as a layer above, assembling these actions from function tools
3. Problem: AI tool list (`createLayer`, `filterData`, `classifyVariable`) is built _outside_ the engine, not the source of truth

**What the code reveals:**

- Human applications discover actions by trial and error ("click here to change color").
- AI Assistant discovers actions by re-coding a small list into function tools.
- If a new action type emerges, the list doesn't self-update.

**What ADR-0003 proposes:**

Invert the pyramid: semantic actions (`change-metric`, `apply-filter`, `set-time-range`) _are_ the primary contract. `SpecPatch` is derived (the escape hatch). React hooks dispatch actions. AI actions come from the same list. The definition of "what is possible" lives in one place.

**Consequence:** In kepler, UI and AI must agree on actions, and each codes them. In GeoVis, there is a single contract both implement.

---

### 3. Full Context vs. Economic Context → ADR-0004

**What kepler.gl does (the cost):**

When an AI Assistant needs to explain the map or generate an action, it receives:

- Entire config JSON (layers, styles, filters)
- Dataset metadata (names, types)
- Sometimes the entire small dataset (to "understand" the values)

**Result:**

- Token cost scales with dataset size, not decision size
- Explanation = model guessing from raw JSON, not resolved data
- Each independent assistant rebuilds its own summary

**What ADR-0004 proposes:**

`ContextPacket` — derived, versioned, metadata-only (dataset names, layer roles, legend domain, not rows):

```ts
{
  mapType: 'choropleth',
  dataBinding: { metric: 'population', dimension: 'color' },
  legend: { kind: 'quantitative', domain: [0, 1000000], unit: 'people' },
  activeFilters: [{ name: 'region', value: 'South' }],
  allowedActions: ['change-metric', 'apply-filter', 'set-view'],
  lastError: { code: 'unsupported', ... }
}
```

**Consequence:** Token cost is constant per map, not per dataset. Explanation comes from resolved metadata, not guessing. Each application reuses it.

---

### 4. State Management vs. Spec-as-Contract → ADR-0002

**What kepler.gl does:**

- Adapters (WebGL, Deck.gl, Mapbox) implement what they want
- Capabilities are discovered by trial (try 3D rendering, fail, discover it's unsupported)
- What is supported becomes human documentation, not code

**Current geovis state:**

```ts
interface CapabilitySet {
  supports3D: boolean;
  supportsRaster: boolean;
  supportsVectorTiles: boolean;
  supportsCustomLayers: boolean;
}
```

But nowhere uses it. It is dead code.

**What ADR-0002 proposes:**

Transform `CapabilitySet` into a consumed contract:

- `MapLibreAdapter.getCapabilities()` returns: "geojson yes, vector-tiles yes, raster-dem no (no layer type), 3D yes if pitch declared"
- `validateSpec(spec, adapter.getCapabilities())` rejects before mount: `{ status: 'unsupported', issues: [{ code: 'raster-dem-no-layer', repair: ['remove-source', 'use-raster-tiles'] }] }`

**Consequence:** Adding a new adapter (deck.gl) comes with a verifiable contract, not runtime surprises. An AI builder knows the surface before generating specs.

---

## Influence Summary: Pattern Mapping

| Kepler Pattern                                | GeoVis Status                    | ADR Operationalizes | Transformation                                                        |
| --------------------------------------------- | -------------------------------- | ------------------- | --------------------------------------------------------------------- |
| State separation (visState/mapState/mapStyle) | Does not exist                   | 0004                | Specifies which fields enter ContextPacket                            |
| Granular actions with undo/redo               | Exists partial (`applyPatch`)    | 0003                | Renames paths into named actions, undo by action not patch            |
| Versioned schema boundary                     | Does not exist                   | 0001 + 0004         | Adds versioning and repair field                                      |
| AI Assistant function tools                   | Does not exist                   | 0003 + 0004         | Makes action list part of public contract, derived from ContextPacket |
| **Silent config failure** (problem)           | ⚠️ Can happen                    | 0001                | Transforms into status enum + repair suggestions                      |
| **Capabilities dead code** (problem)          | ✅ Exists (`CapabilitySet` dead) | 0002                | Makes it consumed by validateSpec, honest and tested                  |
| **Full context to AI** (inefficient)          | Would be default without 0004    | 0004                | Metadata-only, saves tokens, grounded explanation                     |

---

## The Core Pattern

Kepler.gl demonstrates **simultaneously how to do it right** (separation, actions, schema) and **how to get it wrong** (silent failures, dead capabilities, context inflation). The ADRs replicate the "right" and block the "wrong" at the product specification layer — before implementation, so the choices are deliberate and the contract is enforceable from day one.
