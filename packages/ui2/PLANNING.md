# @ttoss/ui2 — Architecture Evolution Plan

## Purpose

Make the semantic contract between `@ttoss/theme2` and `@ttoss/ui2` **deterministic, AI-enabled, and structurally enforced** — so that an AI agent (or a developer) can create any component or composite by performing a single semantic classification, with everything else derived automatically.

The goal: **classify once, resolve everything, validate automatically.**

---

## Core Architectural Decisions

### D1. Two axes of token application

Tokens divide into two groups by a single criterion: **does the value vary by Responsibility?**

| Axis                              | Varies by Responsibility? | Governed by       | Applied via                                    |
| --------------------------------- | ------------------------- | ----------------- | ---------------------------------------------- |
| **Identity tokens** (TokenSpec)   | Yes                       | `resolveTokens()` | Component CSS consuming specific `--tt-*` vars |
| **Behavioral tokens** (universal) | No                        | `BehavioralClass` | CSS `@layer` targeting `data-ui2-*` attributes |

**Identity tokens** (8 fields in TokenSpec): `color`, `textStyle`, `spacing`, `sizing`, `radii`, `elevation`, `motion`, `zIndex`.

**Behavioral tokens** (universal, same value for all components in the class): `border.focus`, `border.input`, `opacity.interaction.hover`, `opacity.feedback.disabled`.

This separation is structural, not cosmetic. Adding `border` or `opacity` to `TokenSpec` would create fields that never vary — false distinctions that increase API surface without delivering expressiveness.

### D2. BehavioralClass — derived from Responsibility

Every Responsibility implies exactly one behavioral class. No manual assignment.

```typescript
type BehavioralClass = 'interactive' | 'formControl' | 'static';

const BEHAVIORAL_CLASS: Record<Responsibility, BehavioralClass> = {
  Action: 'interactive',
  Input: 'formControl', // formControl ⊃ interactive
  Selection: 'formControl',
  Navigation: 'interactive',
  Disclosure: 'interactive',
  Collection: 'static',
  Overlay: 'interactive',
  Feedback: 'static',
  Structure: 'static',
};
```

### D3. ComponentContract — single point of declaration

The `tokens` field is **removed** from `ComponentContract`. Token namespaces are derived from `resolveTokens(responsibility)` + Host composition. The contract becomes:

```typescript
interface ComponentContract {
  name: string;
  kind: ComponentKind;
  responsibility: Responsibility;
  cssSlug: string;
  arkPrimitive?: string;
  host?: Host;
  // tokens: removed — derived from responsibility + host
}
```

### D4. Ark UI as the primitive layer

Ark UI is the right choice for this architecture because:

- `data-*` attributes on DOM elements enable behavioral CSS layers without JS runtime
- Compound `Component.Part` pattern maps 1:1 to Host.Role composition
- Multi-framework support (React/Solid/Vue) means the semantic contract survives framework migrations
- Catalog of ~40 primitives covers the majority of standard components

---

## Implementation Spec

### Phase 1: BehavioralClass + CSS @layer

**Goal**: Universal behavioral tokens (border, opacity) applied automatically via classification, not per-component CSS.

#### 1.1 Add `BehavioralClass` to `_model/index.ts`

```typescript
export type BehavioralClass = 'interactive' | 'formControl' | 'static';

export const BEHAVIORAL_CLASS: Record<Responsibility, BehavioralClass> = {
  Action: 'interactive',
  Input: 'formControl',
  Selection: 'formControl',
  Navigation: 'interactive',
  Disclosure: 'interactive',
  Collection: 'static',
  Overlay: 'interactive',
  Feedback: 'static',
  Structure: 'static',
};

/** Resolve the behavioral class for a given Responsibility. */
export const resolveBehavioralClass = (r: Responsibility): BehavioralClass => {
  return BEHAVIORAL_CLASS[r];
};
```

#### 1.2 Create `styles/behavioral.css`

CSS `@layer` rules that apply universal tokens based on `data-ui2-behavioral` attribute.

**Critical design constraint**: Behavioral rules target **only** the element that carries `data-ui2-behavioral`, which is always the **interactive sub-part** (e.g., `__control`, `__trigger`, `__input`), **not** the component root. For simple components (Button), this is the root. For composites (Checkbox), it's the control sub-part.

This means each component decides **where** to place `data-ui2-behavioral` — the behavioral layer decides **what** happens.

**Second constraint**: Only `disabled` opacity and `focus-visible` outline are universal. Hover behavior (opacity vs background-color vs color change) **varies by component identity** — it is NOT universal. Hover stays in component CSS as an identity concern.

```css
@layer ui2.behavioral {
  /* Disabled — all interactive elements */
  [data-ui2-behavioral='interactive'][data-disabled],
  [data-ui2-behavioral='interactive']:disabled,
  [data-ui2-behavioral='formControl'][data-disabled],
  [data-ui2-behavioral='formControl']:disabled {
    opacity: var(--tt-opacity-feedback-disabled-element);
    cursor: not-allowed;
    pointer-events: none;
  }

  /* Focus ring — all interactive elements */
  [data-ui2-behavioral='interactive'][data-focus-visible],
  [data-ui2-behavioral='interactive']:focus-visible,
  [data-ui2-behavioral='formControl'][data-focus-visible],
  [data-ui2-behavioral='formControl']:focus-visible {
    outline-width: var(--tt-border-focus-width);
    outline-style: var(--tt-border-focus-style);
    outline-offset: 2px;
  }
}
```

**What is NOT in the behavioral layer** (stays in component CSS):

- Hover behavior (identity-specific: opacity, background-color, or text color change)
- Input border (applied by component CSS to the specific sub-part, not universal)

#### 1.3 Component wrapper utility

Create a helper that components use to apply the correct data attribute:

```typescript
// _shared/behavioral.ts
import { BEHAVIORAL_CLASS, type Responsibility } from '../_model/index';

/** Returns data attributes for behavioral CSS layer. */
export const behavioralAttrs = (responsibility: Responsibility) => {
  const bc = BEHAVIORAL_CLASS[responsibility];
  return bc !== 'static' ? { 'data-ui2-behavioral': bc } : {};
};
```

**Placement rule**: The attribute goes on the **interactive element itself**, not necessarily the component root.

```tsx
// button.tsx — simple component, root IS the interactive element
<button
  ref={ref}
  className={cn('ui2-button', className)}
  data-variant={variant}
  data-size={size}
  {...behavioralAttrs('Action')}
  {...props}
>

// checkbox.tsx — composite, __control is the interactive element
<Checkbox.Root className={cn('ui2-checkbox', className)} ...>
  <Checkbox.Control
    className="ui2-checkbox__control"
    {...behavioralAttrs('Selection')}
  />
  ...
</Checkbox.Root>
```

#### 1.4 Remove per-component behavioral CSS

After adding the CSS layer, remove **only** the rules now handled by the behavioral layer:

| Rule                                                 | Remove from component CSS? | Reason                                        |
| ---------------------------------------------------- | -------------------------- | --------------------------------------------- |
| `:disabled` / `[data-disabled]` opacity              | ✅ Yes                     | Universal — same for all interactive          |
| `:focus-visible` / `[data-focus-visible]` outline    | ✅ Yes                     | Universal — same for all interactive          |
| `:hover` opacity/background/color change             | ❌ No — keep               | Identity-specific — varies per component      |
| Input border (`border: 1px solid var(--tt-input-*)`) | ❌ No — keep               | Applied to specific sub-parts by identity CSS |

Affected files:

- `button.css`: remove `:disabled` opacity, remove `:focus-visible` outline. Keep hover rules.
- `checkbox.css`: remove `[data-disabled]` opacity on root. Keep `[data-focus-visible]` on `__control` only if behavioral layer targets it correctly; otherwise move focus to behavioral.
- `switch.css`: same as checkbox.
- `accordion.css`: remove `[data-disabled]` opacity on `__trigger`, remove `:focus-visible` on `__trigger`.
- `tabs.css`: remove `[data-disabled]` opacity on `__trigger`, remove `:focus-visible` on `__trigger`.
- `dialog.css`: remove `:focus-visible` on `__close-trigger`.
- `field.css`: remove `:disabled` opacity on `__input`.

#### 1.5 Import `behavioral.css` in `styles.css`

```css
/* Behavioral layer (must come before component styles) */
@import './styles/behavioral.css';
```

---

### Phase 2: Derive `tokens` from Responsibility

**Goal**: Eliminate manual `tokens` field from `ComponentContract`.

#### 2.1 Create `deriveTokenNamespaces()` function

```typescript
// _model/tokenDerivation.ts

/**
 * Derives the set of token namespaces a component is allowed to use,
 * based on its Responsibility and optional Host composition.
 *
 * This replaces the manual `tokens` field in ComponentContract.
 */
export const deriveTokenNamespaces = ({
  responsibility,
  host,
}: {
  responsibility: Responsibility;
  host?: Host;
}): Set<TokenNamespace> => {
  const spec = resolveTokens({ responsibility });
  const namespaces = new Set<TokenNamespace>();

  // Extract namespace from color prefix (e.g. 'action.primary' → 'action')
  if (spec.color) {
    namespaces.add(spec.color.split('.')[0] as TokenNamespace);
  }
  // spacing and radii are always namespace-level
  if (spec.spacing) namespaces.add('spacing');
  if (spec.radii) namespaces.add('radii');
  if (spec.elevation) namespaces.add('elevation');

  // If composite with Host, collect namespaces from all composition roles
  if (host) {
    const roles = hostRoles[host];
    for (const role of roles) {
      const override = compositionTokens[`${host}.${role}`];
      if (override?.color) {
        namespaces.add(override.color.split('.')[0] as TokenNamespace);
      }
    }
  }

  return namespaces;
};
```

#### 2.2 Update `ComponentContract` — remove `tokens`

Remove the `tokens` field from the interface and all entries in `componentContracts`.

#### 2.3 Update test P6 (CSS token compliance)

Replace manual `contract.tokens` lookup with `deriveTokenNamespaces(contract)`:

```typescript
// componentContracts.test.tsx — updated P6
test('only uses --tt-* namespaces allowed by its classification', () => {
  const allowed = deriveTokenNamespaces({
    responsibility: contract.responsibility,
    host: contract.host,
  });
  // ... same validation logic, using derived set instead of manual list
});
```

---

### Phase 3: Simplify component creation workflow

**Goal**: Reduce from 8 steps to 4 for creating a new component.

#### Current workflow (8 steps)

1. Classify component (Responsibility + Host)
2. Choose folder (components/ or composites/)
3. Create `.tsx` + `.css` files
4. Write component code
5. Write CSS using correct `--tt-*` vars (manual lookup)
6. Export from `src/index.ts`
7. Register in `componentContracts` in `_model/index.ts`
8. Register in `componentRegistry.tsx` for tests

#### Target workflow (4 steps)

1. **Classify** — Responsibility + Host (if composite)
2. **Create files** — `.tsx` + `.css` in correct folder
3. **Register** — single entry in `componentContracts` (name, kind, responsibility, cssSlug, arkPrimitive, host)
4. **Done** — tokens derived, behavioral layer automatic, tests validate

#### 3.1 Auto-derive test registry from componentContracts

The `componentRegistry.tsx` currently duplicates metadata that already exists in `componentContracts`. Reduce duplication while preserving framework-agnostic model.

**Critical constraint**: `_model/index.ts` must remain framework-agnostic (no React imports). Test render metadata lives in test files.

Recommended approach — `componentRegistry.tsx` extends `componentContracts`:

```typescript
// tests/unit/tests/componentRegistry.tsx
import { componentContracts } from 'src/_model/index';

// Extend contracts with render-specific metadata
export const componentRegistry = componentContracts.map((contract) => {
  // Map contract → render entry. Only render-specific fields added here.
  switch (contract.name) {
    case 'Button':
      return {
        ...contract,
        render: () => <Button>Click</Button>,
        expectedClasses: ['ui2-button'],
        classNameTargets: [{ name: 'Button', baseClass: 'ui2-button', ... }],
      };
    // ...
  }
});
```

This way:

- `componentContracts` (model) stays framework-agnostic with no React imports
- `componentRegistry` (test) extends it with render metadata
- Adding a new component = add contract entry + add render case
- Test P1 validates both are in sync

#### 3.2 Auto-export via barrel convention

Consider replacing manual `src/index.ts` barrel with a glob-based pattern or a codegen script that scans `components/` and `composites/` directories. This eliminates step 6.

Alternative (simpler): keep the barrel manual but make forgetting it a test failure. The current test P1 (registry ↔ export sync) already does this in the reverse direction. Extend it to check that every `componentContracts` entry has a matching export.

---

### Phase 4: Update CONVENTIONS.md

**Goal**: Rewrite the AI-facing guide to reflect the 4-step workflow.

The new CONVENTIONS.md should reflect:

```
## How to create a new component

### 1. Classify
Determine the Responsibility. If it's a multi-part compound UI, determine the Host.

### 2. Create files
- components/{slug}/{slug}.tsx + {slug}.css  (for simple primitives)
- composites/{slug}/{slug}.tsx + {slug}.css  (for compound components)

### 3. Write code
- Use `resolveTokens({ responsibility })` to query token paths
- Use `colorVar()`, `textStyleVars()`, `spacingVar()` etc. to get CSS var names
- Apply `behavioralAttrs(responsibility)` on the root element
- Write CSS using only the resolved --tt-* vars
- DO NOT write :focus-visible, :disabled opacity, or :hover opacity — the behavioral layer handles it

### 4. Register
Add a single entry to componentContracts in _model/index.ts.
Export from src/index.ts and import CSS in src/styles.css.
Contract tests validate everything automatically.
```

---

### Phase 5: CSS var name validation for role-level renames

**Goal**: Catch renames at the `{role}` level (e.g. `primary` → `main`) in CSS files, not just namespace level.

#### 5.1 Enhance test P6 to validate full var patterns

Add an optional deeper validation pass that checks CSS var names against the actual `colorVar()`, `textStyleVars()`, etc. output for the component's resolved `TokenSpec`.

```typescript
// Optional P7: CSS var path validation
// For each resolved TokenSpec field, generate expected CSS var prefixes
// and check that CSS file vars match one of the expected patterns
```

This ensures that renaming `action.primary` → `action.main` in theme-v2 produces test failures for CSS files that still reference `--tt-action-primary-*`.

---

## Implementation Order

```
Phase 1 → BehavioralClass + CSS @layer        (removes duplicated behavioral CSS from all components)
Phase 2 → Derive tokens from Responsibility   (removes manual tokens field, simplifies contracts)
Phase 3 → Merge registries                    (reduces to single registration point)
Phase 4 → Rewrite CONVENTIONS.md              (updates AI workflow guide)
Phase 5 → Enhanced CSS var validation          (catches role-level renames)
```

Phases 1–2 are structural changes. Phase 3 is organizational simplification. Phases 4–5 are documentation and testing refinements. Each phase is independently shippable and testable.

---

## What This Enables

### For AI creating 80+ components

- Classify Responsibility → `resolveTokens()` returns exact token paths → `colorVar()` etc. generate CSS var names → behavioral layer auto-applied
- Zero ambiguity, zero lookup, deterministic on first pass

### For composites

- Host.Role composition resolves tokens per sub-part
- Adding new Hosts requires: new type + roles + composition token entries (~15 lines)

### For patterns

- Patterns compose existing components — no new contracts needed
- Layout uses spacing/structure tokens, each inner component keeps its own contract

### For exotic components (canvas, charts, gamification)

- The contract governs the **chrome** (wrapper, focus, spacing, typography)
- Domain-specific content (canvas, data visualization, particle effects) is free-form
- `behavioralAttrs('Input')` on the wrapper gives focus ring + disabled state for free

### For theme-v2 semantic token renames

- TypeScript catches all `.ts` references (PairwisePaths-derived types)
- Enhanced test P7 catches CSS var references
- The compiler guides the find-and-replace across the entire codebase

---

## Architecture Diagram

```
Responsibility          BehavioralClass           Host.Role
     │                       │                       │
     ▼                       ▼                       ▼
TokenSpec               CSS @layer              compositionTokens
(identity tokens)    (universal tokens)        (role overrides)
     │                       │                       │
     ▼                       ▼                       ▼
─────────────────── Component CSS ───────────────────
                         │
                         ▼
                  Contract Tests
              (validate all invariants)
```

Two inputs (Responsibility + Host.Role) → everything derived → everything validated.

---

## Files Affected

### New files

- `src/_shared/behavioral.ts` — `behavioralAttrs()` helper
- `src/styles/behavioral.css` — universal behavioral CSS layer

### Modified files

- `src/_model/index.ts` — add `BehavioralClass`, `BEHAVIORAL_CLASS`, `resolveBehavioralClass()`; remove `tokens` from `ComponentContract`; merge test metadata into contracts
- `src/_model/tokenResolution.ts` — add `deriveTokenNamespaces()` (or separate file)
- `src/styles.css` — import `behavioral.css`
- `src/components/button/button.tsx` — add `behavioralAttrs('Action')`
- `src/components/button/button.css` — remove behavioral rules (focus, disabled, hover opacity)
- `src/components/checkbox/checkbox.tsx` + `.css` — same pattern
- `src/components/switch/switch.tsx` + `.css` — same pattern
- `src/components/tooltip/tooltip.tsx` + `.css` — same pattern
- `src/composites/*/` — same pattern for all composites
- `src/_model/CONVENTIONS.md` — rewrite to 4-step workflow
- `tests/unit/tests/componentContracts.test.tsx` — update P6 to use derived namespaces; add P7 for var-level validation
- `tests/unit/tests/componentRegistry.tsx` — merge into `componentContracts` or simplify to render-only extensions

### Removed files

- `src/_model/responsibilityDefaults.json` — data already inlined as `responsibilityDefaults` const in `tokenResolution.ts`; the JSON file is redundant

### Unchanged files

- `src/_model/composition.ts` — Host/Role model unchanged
- `src/_model/tokenResolution.ts` — TokenSpec, responsibilityDefaults, compositionTokens, resolveTokens(), all CSS var utilities unchanged
- `@ttoss/theme-v2` — no changes needed

---

## Critical Design Constraints

These constraints emerged from analyzing the real component CSS. They **must not** be violated during implementation.

### C1. Behavioral attributes go on the interactive element, not the root

For simple components (Button), root = interactive element. For composites (Checkbox, Tabs), the interactive element is a sub-part (`__control`, `__trigger`). The `data-ui2-behavioral` attribute must be placed on the element that receives focus and responds to gestures.

### C2. Hover is identity, not behavioral

Hover effects vary by component: Button solid uses opacity, Button outline uses background-color, Accordion trigger uses background-color, Tabs trigger uses text color. A universal hover rule would conflict with all of these. Hover stays in component CSS.

### C3. Input border is identity, not behavioral

Inputs (`field__input`, `checkbox__control`) apply `border` to specific sub-parts with specific semantic tokens (`--tt-input-primary-border-default`). This is not universal — it's identity-level, tied to the specific color prefix from `resolveTokens()`.

### C4. Model layer remains framework-agnostic

`_model/` types and data must not import React, JSX, or any framework-specific code. Test metadata (render functions) lives in test files and extends model metadata.
