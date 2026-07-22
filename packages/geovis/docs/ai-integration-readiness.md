# GeoVis AI Integration Readiness Guide

How to enable any LLM to understand, operate, and generate GeoVis specs with the same metadata-only, contract-based safety that kepler.gl's AI Assistant uses for function tools.

Three operating modes (Generate → Steer → Explain → Repair), three integration patterns (prompt engineering + structured output + function calling), one design: **the model never sees raw data or engine internals, only stable metadata and allowed operations.**

## The Three Modes

### 1. Generate: Natural Language → Spec

**User asks:** "Show me a choropleth of population by county, filtered to states with > 1M people."

**What the model needs:**

1. **Schema introspection** — the set of valid `mapType`, `geometry`, color/size encoding, legend kinds
2. **Catalog metadata** — available datasets, metrics, geographies, how they join
3. **Resolver defaults** — what the system will auto-fill (legend type, paint colors, tooltip fields)
4. **Intent schema** — a compact intermediate representation the model creates (not the full spec)

**Flow:**

```
query
→ [LLM + intent schema + catalog metadata]
→ constrained intent (mapType, metric, geography, filters)
→ [Resolver (deterministic product logic)]
→ GeoVisResult (resolved spec or structured error)
→ [Validation + Policy checks]
→ Rendered map or repair prompt
```

**What the LLM produces:** structured intent, not spec code.

```typescript
// Model output (structured)
{
  mapType: 'choropleth',
  metric: 'population',
  geography: 'county',
  filters: [{ field: 'state_pop', op: '>', value: 1000000 }],
  rationale: 'user asked for choropleth filtered to large states'
}
```

**What it does NOT produce:** a raw spec with layer names, paint stops, legend arrays — those are resolver output.

---

### 2. Steer: Current Map + Action → Updated Map

**User clicks "show by income instead"** or tells the assistant **"change the metric to median income."**

**What the model needs:**

1. **Current context packet** — map summary, active filters, legend, current metric, selection
2. **Allowed actions list** — what operations are valid for this spec and adapter
3. **Action schema** — typed vocabulary of semantic operations
4. **Validation scope** — which action properties are checked against what

**Flow:**

```
action request
→ [LLM reads ContextPacket: metric=population, dimension=color, adapter=maplibre]
→ dispatch(action: { type: 'change-metric', metric: 'income', ... })
→ [Runtime validates against CapabilitySet + current spec]
→ GeoVisResult (updated spec or structured error)
→ Render or repair
```

**What the LLM produces:** a typed action from the closed vocabulary.

```typescript
// Model output (typed, validated)
{
  type: 'change-metric',
  metric: 'income_median',
  dimension: 'color',
  rationale: 'user requested income instead'
}
```

**Not:** `{ op: 'replace', path: 'layers.0.paint.color-stops[2][1]', value: '#fff' }` (raw patch).

---

### 3. Explain: Current Map → Grounded Explanation

**User asks:** "What does this map show?" or "Why is this region gray?"

**What the model needs:**

1. **Context packet** — the SAME packet used for steering (not full spec)
2. **Resolved metadata** — what was auto-filled by resolver (legend domain, unit, formatters)
3. **Data summary** — not rows, only stats (min/max population, % missing)
4. **Last error** — if the map is incomplete, why

**Flow:**

```
explain request
→ [ContextPacket + map metadata]
→ [LLM generates prose explanation from resolved data, not raw config]
→ "Choropleth of median household income by county,
    filtered to states with > 1M residents. Values range from
    $32k to $97k. 3 counties have no data (shown in gray)."
```

**Cost:** constant (context packet is bounded), not scaling with data size.

---

### 4. Repair: Structured Error → Corrected Intent

**Resolution fails:** user asks for "property tax by postal code" but postal code is not joinable to the geometry layer.

**What the model needs:**

1. **Structured error from ADR-0001** — code, subject, repair suggestions
2. **Catalog metadata** — to suggest alternatives
3. **Current intent** — to patch only what broke

**Flow:**

```
failed intent
→ [Resolver returns { status: 'mismatch', code: 'join-not-found', repair: ['postal-to-county', 'postal-to-state'] }]
→ [LLM reads error + repair options]
→ offer user: "Postal code layer not available. I can show this by [county / state]"
→ user picks
→ refined intent → resolve → success
```

---

## Three Integration Patterns

### Pattern 1: Prompt Engineering + In-Context Examples

**Best for:** batch spec generation, lightweight apps, offline LLMs.

**Cost:** highest token usage (full examples in prompt).

**Implementation:**

```typescript
function createGeneratePrompt(
  catalogMetadata: Catalog,
  contextPacket?: ContextPacket
): string {
  return `
You are a GeoVis spec generator. Your job is to convert user intent into a constrained
analytical map request.

## Map Types
${JSON.stringify(catalogMetadata.mapTypes, null, 2)}

## Available Datasets
${JSON.stringify(catalogMetadata.datasets, null, 2)}

## Available Metrics
${JSON.stringify(catalogMetadata.metrics, null, 2)}

## Action Vocabulary (for steering)
${JSON.stringify(contextPacket?.allowedActions ?? [], null, 2)}

## Example 1: Choropleth
User: "Show population by state"
Your intent:
{
  "mapType": "choropleth",
  "metric": "population",
  "geography": "state",
  "filters": []
}

[more examples...]

## Rules
- Only use datasets, metrics, geographies in the metadata above.
- Never invent field names.
- If ambiguous, ask the user for clarification instead of guessing.
`;
}
```

**Model output:** JSON intent, parsed and validated against schema.

**Validation:**

```typescript
function validateIntent(intent: unknown, catalog: Catalog): GeoVisResult {
  // Check mapType in allowedMapTypes
  // Check metric in catalog.metrics
  // Check geography in catalog.geographies
  // Check filter fields exist
  // If valid, pass to resolver
  // If not, return { status: 'needs-clarification', issues: [...] }
}
```

---

### Pattern 2: Structured Output (Claude, GPT, Gemini)

**Best for:** production accuracy, cost efficiency, typed guarantees.

**Cost:** lower (model constrained to schema upfront).

**Implementation:**

```typescript
import intentSchema from '@ttoss/geovis-catalog/intent.schema.json';
import { validateIntent } from '@ttoss/geovis-catalog';

// Pass schema + catalog to LLM
async function generateSpec(
  userQuery: string,
  catalog: Catalog,
  model: AnthropicClient
): Promise<GeoVisResult> {
  const response = await model.messages.create({
    model: 'claude-opus-4-1',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `
You are a GeoVis spec generator.

Available datasets: ${catalog.datasets.map((d) => d.id).join(', ')}
Available metrics: ${catalog.metrics.map((m) => m.id).join(', ')}
Available geographies: ${catalog.geographies.map((g) => g.id).join(', ')}

User query: ${userQuery}

Respond with a JSON intent matching this schema:
${JSON.stringify(intentSchema)}
`,
      },
    ],
    tools: [
      {
        name: 'generate_intent',
        input_schema: intentSchema,
      },
    ],
  });

  const intent = extractToolInput(response, 'generate_intent');
  const validation = validateIntent(intent, catalog);

  if (validation.status !== 'valid') return validation;

  return resolver.resolve(intent, catalog);
}
```

---

### Pattern 3: Function Calling (LLM + Tool Runtime)

**Best for:** interactive steering, web apps, tight LLM-engine loop.

**Cost:** low per call (small context), high in total (many turns).

**Implementation (mimics kepler.gl AI Assistant):**

```typescript
// Define tools the LLM can call
const geovisTools = [
  {
    name: 'change_metric',
    description: 'Change the metric displayed on the map',
    inputSchema: {
      type: 'object',
      properties: {
        metric: {
          type: 'string',
          description: 'Metric ID from catalog',
        },
        dimension: {
          type: 'string',
          enum: ['color', 'size'],
          description: 'Which visual channel',
        },
      },
      required: ['metric'],
    },
  },
  {
    name: 'apply_filter',
    description: 'Add or update a data filter',
    inputSchema: {
      type: 'object',
      properties: {
        field: { type: 'string' },
        op: { type: 'string', enum: ['=', '>', '<', 'in'] },
        value: { type: ['string', 'number', 'array'] },
      },
      required: ['field', 'value'],
    },
  },
  {
    name: 'set_view',
    description: 'Move camera to region',
    inputSchema: {
      type: 'object',
      properties: {
        preset: {
          type: 'string',
          enum: ['initial', 'fit_data', 'current_selection'],
        },
      },
    },
  },
  // ... more tools matching ADR-0003 semantic actions
];

// Tool runtime loop
async function steerWithAI(
  userMessage: string,
  currentContextPacket: ContextPacket,
  model: AnthropicClient
): Promise<ContextPacket> {
  let messages = [{ role: 'user' as const, content: userMessage }];

  while (true) {
    const response = await model.messages.create({
      model: 'claude-opus-4-1',
      max_tokens: 1024,
      system: `You are steering a GeoVis map. You have access to tools to change
the metric, add filters, select features, etc.

Current map: ${JSON.stringify(currentContextPacket, null, 2)}

Allowed actions: ${currentContextPacket.allowedActions.join(', ')}`,
      messages,
      tools: geovisTools,
    });

    // If model asks to call a tool
    if (response.stop_reason === 'tool_use') {
      const toolUse = response.content.find((b) => b.type === 'tool_use');
      if (!toolUse) break;

      // Dispatch the action
      const result = runtime.dispatch({
        type: toolUse.name as any,
        ...toolUse.input,
      });

      if (!result.valid) {
        // Tool failed, tell the model why
        messages.push(
          { role: 'assistant', content: response.content },
          {
            role: 'user',
            content: `Tool ${toolUse.name} failed: ${result.issues[0].message}.
Try a different approach.`,
          }
        );
        continue;
      }

      // Success: update packet
      currentContextPacket = result.spec as ContextPacket; // simplified
      messages.push(
        { role: 'assistant', content: response.content },
        { role: 'user', content: `Action applied. Map updated.` }
      );
    }

    // If model stops (end_turn), we're done
    if (response.stop_reason === 'end_turn') break;
  }

  return currentContextPacket;
}
```

---

## What the Package Must Expose (AI Layer)

### 1. **Introspection API** (read-only, no side effects)

```typescript
// What can be mapped?
runtime.getCatalog(): Catalog

// What can I do with this spec?
runtime.getContextPacket(): ContextPacket

// What formats are valid?
runtime.getSchemas(): {
  intent: JSONSchema,
  spec: JSONSchema,
  action: JSONSchema,
  result: JSONSchema
}

// How do I use this?
runtime.getExamples(): {
  minimal: VisualizationSpec,
  choropleth: VisualizationSpec,
  'with-filters': VisualizationSpec
}
```

### 2. **Mutation API** (dispatches validated operations)

```typescript
// Generate from intent
runtime.resolve(intent: AnalyticalIntent, catalog: Catalog): GeoVisResult

// Steer with action
runtime.dispatch(action: SemanticAction): GeoVisResult

// Validate before committing
runtime.validate(spec: VisualizationSpec, adapter: EngineAdapter): GeoVisResult
```

### 3. **Result Shape** (all three return this)

```typescript
type GeoVisResult =
  | { valid: true; spec: VisualizationSpec; context: ContextPacket }
  | {
      valid: false;
      status:
        | 'invalid'
        | 'mismatch'
        | 'unsupported'
        | 'insufficient-data'
        | 'needs-clarification';
      issues: Array<{
        code: string;
        subject: string;
        message: string;
        repair?: string[] | { label: string; value: any }[];
      }>;
      partialSpec?: VisualizationSpec; // best-effort
    };
```

---

## Catalog Format (AI-Facing)

The **Catalog** is what models read to know what's possible. It is **not a database dump** — it is a curated summary:

```typescript
interface Catalog {
  // Metadata about this catalog
  version: '1.0';
  domain: 'us-census'; // organization-specific

  // Available analytical dimensions
  datasets: Array<{
    id: string;
    label: string;
    description: string;
    recordCount: number;
    geometry: 'point' | 'polygon' | 'line';
    geographies: string[]; // ['state', 'county']
    temporal?: { start: string; end: string };
  }>;

  metrics: Array<{
    id: string;
    label: string;
    description: string;
    unit?: string;
    kind: 'count' | 'rate' | 'ratio' | 'index';
    range: [number, number];
    nullPolicy: 'hide' | 'zero' | 'explain';
  }>;

  // How things join
  joins: Array<{
    from: string; // metric dataset
    to: string; // geography dataset
    on: { left: string; right: string };
    cardinality: '1:1' | '1:m';
  }>;

  // Constraints
  mapTypes: Array<{
    name: 'choropleth' | 'dotDensity' | 'proportionalCircles';
    supportedGeometries: string[];
    metricKinds: string[]; // what kinds of metrics work
    example: VisualizationSpec;
  }>;

  filters: Array<{
    field: string;
    kind: 'categorical' | 'numeric' | 'temporal';
    domain?: any;
  }>;
}
```

---

## Implementation Sequence (for the package)

### Phase 1: Expose Introspection (Unblocks Prompt Engineering)

- [ ] Export `getSchemas()` → Intent, Spec, Action, Result JSON Schemas
- [ ] Export `getCatalog()` → Curated catalog metadata
- [ ] Implement `getExamples()` → 3-4 runnable fixture specs
- [ ] Document intent shape: `{ mapType, metric, geography, filters, rationale }`

**AI Integration Level:** Prompt engineering works; model sees what's valid.

### Phase 2: Implement Resolve & Dispatch (Unblocks Structured Output)

- [ ] **ADR-0001:** Implement `GeoVisResult` discriminated union
- [ ] **ADR-0003:** Implement semantic `dispatch(action)` → compiles to internal patch
- [ ] Implement `resolve(intent, catalog)` → uses existing resolver logic
- [ ] Both return `GeoVisResult` (valid or structured error)

**AI Integration Level:** Structured output works; model calls resolve/dispatch, gets typed responses.

### Phase 3: Package as Tool Runtime (Unblocks Function Calling)

- [ ] Export tool definitions (change_metric, apply_filter, select_feature, set_view, etc.)
- [ ] Wrap `dispatch` in a tool handler that returns human-readable results
- [ ] Provide example LLM loop (Claude, OpenAI, Ollama)
- [ ] Document cost: ~500 tokens per turn (context packet + tool schema + response)

**AI Integration Level:** Function calling works; LLM loops with the runtime, steering is interactive.

### Phase 4: Eval Framework (Validates AI Reliability)

- [ ] Eval: intent → spec → map renders (generation success)
- [ ] Eval: random intent + catalog changes → model degrades gracefully (robustness)
- [ ] Eval: action dispatch chains (steering consistency)
- [ ] Token cost per mode (budget tracking)

---

## Example: Enable Claude to Generate a GeoVis Spec

### Step 1: Introspect (Model Reads)

```typescript
const catalog = runtime.getCatalog();
const schemas = runtime.getSchemas();

const prompt = `
You are a GeoVis spec generator.

Available datasets:
${catalog.datasets.map(d => \`- \${d.id}: \${d.description}\`).join('\n')}

Available metrics:
${catalog.metrics.map(m => \`- \${m.id}: \${m.label} (\${m.unit})\`).join('\n')}

Map types: choropleth, dotDensity, proportionalCircles

When the user describes a map, respond with this JSON:
${JSON.stringify(schemas.intent, null, 2)}

User: "Show me median income by county, filtered to the South"
`;
```

### Step 2: Model Responds (Structured Output)

```typescript
const response = await claude.messages.create({
  model: 'claude-opus-4-1',
  messages: [{ role: 'user', content: prompt }],
  tools: [
    {
      name: 'generate_intent',
      input_schema: schemas.intent,
    },
  ],
});

const intent = extractToolInput(response, 'generate_intent');
// { mapType: 'choropleth', metric: 'income_median', geography: 'county',
//   filters: [{ field: 'region', op: '=', value: 'South' }] }
```

### Step 3: Runtime Resolves

```typescript
const result = runtime.resolve(intent, catalog);

if (result.valid) {
  // result.spec is the VisualizationSpec
  // result.context is the ContextPacket for the next turn
  mount(container, result.spec);
} else {
  // result.issues explain what went wrong
  // result.repair suggests fixes
  console.log(`Failed: ${result.issues[0].message}`);
  console.log(`Try: ${result.repair}`);
}
```

---

## Cost & Safety Model

| Mode                                     | Tokens per Turn | Safety                     | Steering Speed                  |
| ---------------------------------------- | --------------- | -------------------------- | ------------------------------- |
| **Prompt engineering** (full examples)   | 2k–5k           | Model learns from examples | Slow (regenerate spec)          |
| **Structured output** (intent → resolve) | 500–1k          | Schema enforced            | Slow (resolve is deterministic) |
| **Function calling** (dispatch loop)     | 200–500         | Each action validated      | Fast (tight loop)               |

**Privacy:** All three patterns keep raw data in the browser. The LLM sees only metadata, allowed operations, and error codes.

**Reliability:** Model cannot hallucinate layers, joins, or colors — it can only invoke allowed operations. Failures are structured and human-readable.

---

## Next Steps (Post-ADR)

1. **ADR-0005** (proposed): "AI Gateway" — thin wrapper exposing introspection + resolve + dispatch as a unified surface for all three patterns.
2. **Fixtures** — one JSON spec per pattern (prompt-engineered, structured-output, function-called).
3. **Eval suite** — accuracy and cost metrics per mode, per model.
4. **LLM examples** — Claude, GPT-4, Gemini, Ollama templates.
5. **Catalog builder** — helper to curate catalog from a data warehouse (Postgres, BigQuery, etc.).
