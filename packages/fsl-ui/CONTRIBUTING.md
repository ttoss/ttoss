# Contributing to `@ttoss/ui2`

> **To author a component you need exactly two files: this file + `src/tokens/CONTRACT.md`.
> FSL docs are reference philosophy — you do not need them.**

Two source-of-truth files drive every change:

1. **`src/semantics/taxonomy.ts`** — FSL vocabulary + legality matrices. Zero imports.
2. **`src/tokens/CONTRACT.md`** — Given an Entity, tells you which `vars.*` paths to use.

Contract tests in `tests/unit/tests/components.contract.test.tsx` auto-discover every `*Meta` export. If TypeScript compiles and tests pass, the component is conformant.

---

## 1 — Architecture

Three layers, upward-only dependency:

```
Layer 3 · src/components/   React Aria components. Consume L1 + L2.
Layer 2 · src/tokens/       Entity → vars.* projection + CONTRACT.md.
Layer 1 · src/semantics/    Vocabulary + legality. No imports.
```

**Layer 1 (`src/semantics/`)** — 5 authorial dimensions as `as const` tuples (`ENTITIES`, `STRUCTURAL_ROLES`, `EVALUATIONS`, `COMPOSITION_ROLES`, `CONSEQUENCES`) + 1 runtime vocabulary (`STATES`). Each authorial dimension has an `ENTITY_*` matrix `satisfies Record<Entity, …>` — a new Entity is a compile error until every matrix covers it. Types derive via `(typeof X)[number]`. Public API (`index.ts`) exports only `ComponentMeta`, `EvaluationsFor`, `CompositionsFor`, `ConsequencesFor`.

**Layer 2 (`src/tokens/`)** — `projection.ts` maps each Entity to `{ cognitiveMode, uxContext, surfaceType }`. `CONTRACT.md` is the flat authoring guide (§1 Entity→Token map, §2 path formulas, §3 state cascade, §5 `data-*`, §7 Button example). `resolveInteractiveStyle.ts` is the one canonical implementation of the state priority cascade — used by every interactive component.

### Cross-cutting decisions (registered, don't re-process)

| Decision                                         | Rule                                                                                                                        |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| **`Evaluation` ≠ `Consequence`**                 | Authorial voice vs effect-on-state. A destructive Action is `consequence: 'destructive'`, **not** `evaluation: 'negative'`. |
| **`invalid` is State, `negative` is Evaluation** | `<TextField isInvalid />` — never `<TextField evaluation="negative">`. Validation is runtime.                               |
| **`Input` and `Selection` have no Evaluation**   | Data-entry surfaces, not decision hierarchies. `ENTITY_EVALUATION.Input = []` / `.Selection = []`.                          |
| **`State` is runtime-only**                      | Emitted by React Aria, resolved by `resolveInteractiveStyle`. No per-entity matrix.                                         |
| **No `size` prop**                               | One fixed step per component (CONTRACT.md §4). A different density is a different semantic identity (different component).  |
| **No runtime token resolver**                    | Components read CONTRACT.md §1 and consume `vars.*` directly.                                                               |
| **Identity vs variance**                         | If it varies per instance (`evaluation`, `consequence`) → runtime prop. If fixed by the source file → field on `*Meta`.     |

---

## 2 — Authoring

### 2.1 — Component vs Composite

- **Component** — one semantic identity, one `*Meta` export. Example: `Button`.
- **Composite** — multiple `*Meta` exports, one per structural part, sharing a `data-scope`. Example: `Dialog` (Overlay host + `DialogHeading` + `DialogBody` + `DialogActions`).

Rule: if a part could be placed inside a different parent, it's a Composite sub-part with a `composition` field.

### 2.2 — Create a Component (four steps)

```tsx
// src/components/Chip/Chip.tsx
import { vars } from '@ttoss/theme2/vars';
import { Button as RACButton } from 'react-aria-components';
import type { ComponentMeta, EvaluationsFor } from '../../semantics';
import { resolveInteractiveStyle } from '../../tokens/resolveInteractiveStyle';

// 1. Identity — picks the CONTRACT.md §1 row via `entity`.
export const chipMeta = {
  displayName: 'Chip',
  entity: 'Action',
  structure: 'root',
} as const satisfies ComponentMeta<'Action'>;

// 2. Derive evaluations from the taxonomy — never a hand-written union.
type ChipEvaluation = EvaluationsFor<(typeof chipMeta)['entity']>;

export interface ChipProps {
  evaluation?: ChipEvaluation;
  onPress?: () => void;
  children: React.ReactNode;
}

// 3. Read CONTRACT.md §1 row for 'Action':
//    colors=action, radii=control, border=outline.control, sizing=hit.base,
//    spacing=inset.control.md, typography=label.md, motion=feedback, elevation=flat.
// 4. Wire data-* (§5) + state cascade (§3) via resolveInteractiveStyle.
export const Chip = ({
  evaluation = 'primary',
  onPress,
  children,
}: ChipProps) => {
  const c = vars.colors.action[evaluation];
  return (
    <RACButton
      onPress={onPress}
      data-scope="chip"
      data-part="root"
      data-evaluation={evaluation}
      style={({ isHovered, isPressed, isDisabled, isFocusVisible }) => ({
        display: 'inline-flex',
        borderRadius: vars.radii.control,
        borderWidth: vars.border.outline.control.width,
        borderStyle: vars.border.outline.control.style,
        minHeight: vars.sizing.hit.base,
        paddingBlock: vars.spacing.inset.control.md,
        paddingInline: vars.spacing.inset.control.md,
        ...(vars.text.label.md as React.CSSProperties),
        transitionProperty: 'background-color, border-color, color',
        transitionDuration: vars.motion.feedback.duration,
        transitionTimingFunction: vars.motion.feedback.easing,
        backgroundColor: resolveInteractiveStyle(c?.background, {
          isHovered,
          isPressed,
          isDisabled,
        }),
        borderColor: resolveInteractiveStyle(c?.border, {
          isDisabled,
          isFocusVisible,
        }),
        color:
          resolveInteractiveStyle(c?.text, {
            isHovered,
            isPressed,
            isDisabled,
          }) ?? c?.text?.default,
        outline: isFocusVisible
          ? `${vars.focus.ring.width} ${vars.focus.ring.style} ${vars.focus.ring.color}`
          : 'none',
      })}
    >
      {children}
    </RACButton>
  );
};
Chip.displayName = chipMeta.displayName;
```

Export from `src/index.ts`:

```ts
export { Chip, chipMeta } from './components/Chip/Chip';
export type { ChipProps } from './components/Chip/Chip';
```

Contract tests auto-discover `chipMeta`. No bespoke test needed unless the component carries a component-specific invariant.

### 2.3 — Create a Composite

Every sub-part has its own `*Meta`, reuses the host's `data-scope`, and declares its own `structure` + (optionally) `composition`.

```tsx
export const bannerMeta = {
  displayName: 'Banner',
  entity: 'Feedback',
  structure: 'root',
} as const satisfies ComponentMeta<'Feedback'>;

export const bannerTitleMeta = {
  displayName: 'BannerTitle',
  entity: 'Feedback',
  structure: 'title',
  composition: 'heading', // Fixed slot identity.
} as const satisfies ComponentMeta<'Feedback'>;

export const BannerTitle = ({ children }: { children: React.ReactNode }) => (
  <h3
    data-scope="banner"
    data-part="title"
    style={{ margin: 0, ...(vars.text.title.md as React.CSSProperties) }}
  >
    {children}
  </h3>
);
BannerTitle.displayName = bannerTitleMeta.displayName;
```

Export every `*Meta` from `src/index.ts`.

**`structure` vs `composition`.** `structure` = what this part **is** (`'title'`, `'body'`). `composition` = what slot it **plays** inside a parent (`'heading'`, `'primaryAction'`). If the answer needs "…inside a X", you're talking Composition.

**Evidence rule.** Never declare `composition` or `consequence` on a `*Meta` unless **some runtime** dispatches on it (behavior, coloring, or DOM reorder). Nominal declaration is dead weight — that is what killed the `Interaction` dimension.

#### Host scope contract — `createPresenceScope` / `createCompositeScope`

Composite sub-parts (`DialogHeading`, `WizardStep`, `AccordionItem`, `TextFieldLabel`, `MenuItem`, `FormSubmit`, …) only make sense inside their host. The runtime gate lives at [`src/composites/scope.ts`](./src/composites/scope.ts) and exposes **two builders, picked by name**:

| Builder                         | Use when                                                                     | Provider                 | `use()` returns |
| ------------------------------- | ---------------------------------------------------------------------------- | ------------------------ | --------------- |
| `createPresenceScope(host)`     | Host has **no value** to share. Sub-parts only need to assert "I am inside." | `<Provider>`             | `void`          |
| `createCompositeScope<T>(host)` | Host shares **typed state** with sub-parts (evaluation, controlled step, …). | `<Provider value={ctx}>` | `T`             |

**Rule:** if you reach for `createCompositeScope<true>('X')`, you wanted `createPresenceScope('X')`. The `<true>` sentinel is forbidden — its only purpose is to satisfy the type system, and the dedicated builder communicates intent at the call site instead.

```ts
// Presence-only — Form / Dialog / Menu / TextField pattern
const bannerScope = createPresenceScope('Banner');

export const Banner = ({ children }: { children: React.ReactNode }) => (
  <div data-scope="banner" data-part="root">
    <bannerScope.Provider>{children}</bannerScope.Provider>
  </div>
);

export const BannerTitle = ({ children }: { children: React.ReactNode }) => {
  bannerScope.use(bannerTitleMeta.displayName);
  return <h3 data-scope="banner" data-part="title">{children}</h3>;
};
```

```ts
// Stateful — Wizard / Accordion pattern
interface GaugeContextValue { level: 'low' | 'high'; setLevel: (l: 'low' | 'high') => void }
const gaugeScope = createCompositeScope<GaugeContextValue>('Gauge');

export const Gauge = ({ children }: { children: React.ReactNode }) => {
  const [level, setLevel] = React.useState<'low' | 'high'>('low');
  return (
    <gaugeScope.Provider value={{ level, setLevel }}>
      <div data-scope="gauge" data-part="root">{children}</div>
    </gaugeScope.Provider>
  );
};

export const GaugeReadout = () => {
  const { level } = gaugeScope.use('GaugeReadout');
  return <span data-scope="gauge" data-part="readout">{level}</span>;
};
```

Rules common to both builders:

1. **One scope per host.** Created at module scope, key = host's `displayName`.
2. **Host wraps subtree.** The Provider sits inside the host's rendered DOM.
3. **Every sub-part calls `scope.use('<DisplayName>')`** as the first line of its render. Renders outside the host throw `<DisplayName> must be rendered inside <HostName>.`.
4. **`composition` flat vocabulary is preserved.** Scope is a _runtime presence guard_, never a Host × Role legality matrix — that decision belongs to the data model (see `docs/.../component-model.md` §"Parent disambiguation").

The contract is exercised by [`tests/unit/tests/compositeScope.test.tsx`](./tests/unit/tests/compositeScope.test.tsx): every exported sub-part has a `throws-when-standalone` test, a smoke check confirms it does not throw inside its host, and the two builders themselves have direct unit tests.

#### Composition dispatch — two patterns

**Pattern A · Leaf reorder (DialogActions).** Leaves accept `composition` as a runtime **prop** and emit `data-composition`. The host reads `child.props.composition` and reorders the DOM.

```tsx
// Leaf
<Button composition="primaryAction" onPress={save}>
  Save
</Button>;

// Host — reads prop, reorders children
const rank = (child.props as { composition?: string }).composition;
```

**Pattern B · Fixed-slot selection (Wizard).** Sub-parts pin `composition` on their `*Meta` **and** advertise it at runtime by attaching a static `.composition` to the component function. The host reads `type.composition` and dispatches by identity.

Use the local `defineWizardSlot` helper (or the equivalent for a new composite) to attach the literal — no cast, no post-declaration mutation. The dispatcher walks through `React.memo` / `React.forwardRef` wrappers so consumer-side memoisation does not silently break classification.

```tsx
const WizardStepBase = (props: WizardStepProps) => (
  <div
    data-scope="wizard"
    data-part="content"
    data-composition="step"
    {...props}
  />
);
// `Object.assign` keeps the literal type and avoids a cast; the helper is
// just a typed wrapper around it.
export const WizardStep = defineWizardSlot(WizardStepBase, 'step');

// Host — classifies children by fixed identity, walking through memo/forwardRef.
// See `getChildComposition` in Wizard.tsx for the canonical implementation.
const composition = getChildComposition(child); // 'step' | 'summary' | 'navigation' | undefined
if (composition === 'step') steps.push(child);
```

Pick A when the slot varies per call site (a button's role in a dialog). Pick B when the sub-part IS the slot (a wizard step is never a "summary").

#### Consequence dispatch (ConfirmationDialog)

The host reads its own `consequence` prop to select a mechanism — `neutral`/`committing` confirm on first click; `destructive` arms and requires a second click. There is no separate `requireArming` prop — **flipping `consequence` alone flips the mechanism**. Same contract for any future consequence-driven composite: `consequence` must be the only thing the author changes to switch behavior.

---

## 3 — Editing `src/semantics/`

**Add a term to an existing dimension** — append to the `as const` tuple, then add it to every relevant matrix row. TS + tests catch gaps.

**Add a new Entity** — five additions or it won't compile:

```ts
export const ENTITIES = [..., 'MyEntity'] as const;
export const ENTITY_STRUCTURE   = { ..., MyEntity: ['root', /* … */] };
export const ENTITY_EVALUATION  = { ..., MyEntity: [] };
export const ENTITY_COMPOSITION = { ..., MyEntity: [] };
export const ENTITY_CONSEQUENCE = { ..., MyEntity: [] };
```

Then add `ENTITY_TOKEN_MAPPING[MyEntity]` in `src/tokens/projection.ts` and the matching CONTRACT.md §1 row.

---

## 4 — Hard rules

- `taxonomy.ts` imports nothing. `src/semantics/` never learns colors, `vars`, or CSS.
- Types derive from arrays via `(typeof X)[number]` — never a standalone union.
- Components consume only `vars.*`. No hex/rgb literals. No `var(--x, fallback)`. Contract tests enforce.
- State-dependent colors go through `resolveInteractiveStyle`. Structural tokens (`radii`, `border.*`, `sizing`, `spacing`, `typography`, `motion`) are literal `vars.*` reads.
- Every exported component has a matching `*Meta` export. Name pair is camelCase meta ↔ PascalCase component (`chipMeta` ↔ `Chip`) — enforced by the contract test's auto-discovery.
- Every rendered element carries `data-scope` + `data-part`. Sub-parts of a composite reuse the host's `data-scope`.
- Never declare `composition` or `consequence` on a `*Meta` unless a runtime dispatches on it (§2.3 evidence rule). The same rule applies to `evaluation` props on composite roots: omit until a real chrome consumer reads `vars.colors.*[evaluation]`.
- No runtime `validateExpression` / `SemanticExpression` — TS + the contract test's direct matrix lookups cover legality.

---

## 5 — Running tests locally

`tests/unit/jest.config.ts` pins `coverageThreshold` to **100%** on every dimension. Those numbers are calibrated for the **full suite** (`pnpm run test`); narrowing the run with `--testPathPatterns=...` will fail the threshold check by design — the missing files are never executed, not actually uncovered. Treat threshold failures as authoritative only when the full suite ran.
