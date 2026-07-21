# Contributing to `@ttoss/fsl-ui`

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
import { vars } from '@ttoss/fsl-theme/vars';
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
//    colors=action, radii=control, border=outline.control, sizing=hit,
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
        minHeight: vars.sizing.hit,
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
// Spread `props` FIRST, identity attributes after — a caller must never be
// able to override `data-scope`/`data-part`/`data-composition`.
const WizardStepBase = (props: WizardStepProps) => (
  <div
    {...props}
    data-scope="wizard"
    data-part="content"
    data-composition="step"
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
- Components consume only `vars.*`. No hex/rgb literals. No `var(--tt-*, fallback)`. Host knobs use `--fsl-*` custom properties **only** through `fslVar` and always with a fallback (CONTRACT.md §7 / ADR-002). Contract tests enforce.
- **Layout-literal rule.** A layout literal (`12rem`, `500px`, `1.2s`, `40%`, …) is allowed only as a **named module-level constant with a justification comment** (the `TRACK_W` pattern in `Switch.tsx`). Magic inline literals in style objects are forbidden — a reviewer must be able to ask "why this number?" and find the answer next to the name. Focus-ring `outlineOffset` micro-nudges (`'2px'`, `'-1px'`) are the sole tolerated inline exception.
- **Logical CSS properties only.** `insetInlineStart`, `marginBlockEnd`, `paddingInline`, … — never `left`, `top`, `marginRight`, `borderLeftWidth`, etc. RTL correctness is a contract-test invariant.
- Every `animation:` references a name from `ANIMATION_NAMES` (`src/tokens/keyframes.ts`), whose `@keyframes` ships via `ensureKeyframes()` — never a bare string (contract invariant #8).
- State-dependent colors go through `resolveInteractiveStyle`. Structural tokens (`radii`, `border.*`, `sizing`, `spacing`, `typography`, `motion`) are literal `vars.*` reads.
- Every exported component has a matching `*Meta` export. Name pair is camelCase meta ↔ PascalCase component (`chipMeta` ↔ `Chip`) — enforced by the contract test's auto-discovery.
- Every rendered element carries `data-scope` + `data-part`. Sub-parts of a composite reuse the host's `data-scope`.
- Never declare `composition` or `consequence` on a `*Meta` unless a runtime dispatches on it (§2.3 evidence rule). The same rule applies to `evaluation` props on composite roots: omit until a real chrome consumer reads `vars.colors.*[evaluation]`.
- No runtime `validateExpression` / `SemanticExpression` — TS + the contract test's direct matrix lookups cover legality.

---

## 5 — Running tests locally

`tests/unit/jest.config.ts` pins `coverageThreshold` to **100%** on every dimension. Those numbers are calibrated for the **full suite** (`pnpm run test`); narrowing the run with `--testPathPatterns=...` will fail the threshold check by design — the missing files are never executed, not actually uncovered. Treat threshold failures as authoritative only when the full suite ran.

---

## 6 — Internationalization (i18n)

Components in this package **never** depend on `@ttoss/react-i18n` (or any i18n runtime). All user-facing text is caller-supplied. The rule, per ADR-001:

1. **Flow-critical labels are required props with no defaults.** A label the user must read to complete or cancel a flow (confirm/cancel buttons, wizard navigation) has no English fallback — TypeScript forces the caller to supply localized copy (`ConfirmationDialog.confirmLabel/cancelLabel/armedLabel`, `WizardNavigation.prevLabel/nextLabel/finishLabel`).
2. **Supplementary text may ship a documented English fallback.** Hint/AT text whose absence does not block the flow (the `Select` placeholder, the Wizard's `announceStep` live-region copy) defaults to English, is documented as a fallback in its JSDoc, and always has an override prop.
3. **Decorative glyphs are not text.** Unicode chevrons/checks (`▸ ✓ ✕`) are `aria-hidden` visuals — no i18n applies.

When adding a component, classify every string it renders into 1–3 before writing the props.

---

## 7 — Decisions (ADRs)

Canonical trade-off record for this package, mirroring the `@ttoss/fsl-theme` convention: IDs sequential, never reused; append only; superseded entries keep their ID with `Status: superseded-by:ADR-NNN`. Search here before re-litigating a decision.

### ADR-001: All user-facing copy is caller-supplied; flow-critical labels are required props

Status: accepted (2026-07-15)
Tags: i18n, api-design, labels

Decision: the package ships no i18n runtime and no English defaults for flow-critical labels — `ConfirmationDialog` (`confirmLabel`, `cancelLabel`, `armedLabel` when destructive) and `WizardNavigation` (`prevLabel`, `nextLabel`, `finishLabel`) require them at the type level. Supplementary text (Select placeholder, Wizard step announcement) keeps a documented English fallback with an override prop.
Rejected: depending on `@ttoss/react-i18n` — would couple the base layer to one i18n stack and violate the layer boundary (fsl-ui sits below application concerns); shipping English defaults for everything — silently produces mixed-language UIs in localized apps, the worst failure mode because it passes review.
Cost: slightly noisier call sites; every consumer types three extra props on `WizardNavigation`.
Anchors: `src/composites/ConfirmationDialog/ConfirmationDialog.tsx` (props union), `src/composites/Wizard/Wizard.tsx` (`WizardNavigationProps`), §6 above.

### ADR-002: Escape hatches are composite-scoped `--fsl-*` CSS custom properties

Status: accepted (2026-07-15)
Tags: styling, escape-hatch, api-design

Decision: composites expose no `style`/`className`; the single sanctioned customization channel is a `--fsl-<scope>-<knob>` custom property consumed through `fslVar(knob, fallback)` — fallback mandatory, `--tt-` theme tokens still never take fallbacks. Safe React Aria positioning props (`placement`, `offset`, `crossOffset`, `shouldFlip`, `containerPadding`) are forwarded as ordinary props. Full policy: CONTRACT.md §7.
Rejected: re-adding `style`/`className` to composites — reopens the unreviewable styling side channel the no-visual-props doctrine exists to close; a `size`/`width` prop per composite — every knob would become permanent API surface with bespoke names.
Cost: knob discoverability depends on documentation (CONTRACT.md §7 table + llms.txt); CSS-only overrides are less greppable than props.
Anchors: `src/tokens/escapeHatch.ts`, `src/composites/Dialog/Dialog.tsx`, `src/composites/Menu/Menu.tsx`, CONTRACT.md §7.

### ADR-003: `react-aria-components` is pinned to `~1.19.0` while Toast rides `UNSTABLE_` APIs

Status: accepted (2026-07-15)
Tags: dependencies, toast, stability

Decision: the dependency range is `~1.19.0` (patch-only) because `Toast` consumes `UNSTABLE_Toast*` exports that React Aria may rename in any minor. A canary test imports every `UNSTABLE_` symbol we consume and fails with an upgrade note if one disappears. Widen the range back to `^` only when RAC stabilizes Toast (drop of the `UNSTABLE_` prefix) — then delete the canary.
Rejected: keeping a caret range — a transitive minor bump could break production toasts without any code change on our side; vendoring a toast implementation — duplicates RAC's queue semantics for a temporary problem.
Cost: fsl-ui consumers do not receive RAC minor features until the pin is revisited.
Anchors: `package.json` (`react-aria-components`), `tests/unit/tests/racCanary.test.ts`, `src/components/Toast/Toast.tsx`.

### ADR-004: `@ttoss/forms` interop is a documented recipe, not an adapter entry point

Status: accepted (2026-07-15)
Tags: forms, integration, react-hook-form

Decision: fsl-ui controls connect to the monorepo's form standard (`@ttoss/forms` = react-hook-form + Zod) through the plain react-hook-form `Controller`, mapping `field.value/onChange/onBlur` and `fieldState.invalid` onto the controls' controlled props (`isInvalid`, `value`, `onChange`). The pattern lives as an integration test (`tests/unit/tests/formsBridge.test.tsx`) that consumes `@ttoss/forms` as a devDependency — no `@ttoss/fsl-ui/forms` entry ships.
Rejected (for now): an adapter entry (`@ttoss/fsl-ui/forms` with `FormFieldTextField` etc.) — premature until real apps reveal which field wrappers earn their existence; modifying `@ttoss/forms` — out of scope by the plan's scope guard.
Cost: consumers write the `Controller` wiring by hand (≈6 lines per field) until an adapter is justified.
Anchors: `tests/unit/tests/formsBridge.test.tsx`, ROADMAP A11.

### ADR-005: Iconify is the official glyph provider; an internal intent layer wraps it

Status: accepted (2026-07-15)
Tags: icons, provider, semantics, iconify, lucide

Decision: glyphs are never hand-authored SVG inside this package. **Iconify is the official provider**, consumed through `@iconify-icon/react` (the same integration `@ttoss/react-icons` already uses in the monorepo). An internal semantic layer (`src/components/Icon/`) implements the `icon-system.md` intent contract (`icon.{family}.{intent}`): `intents.ts` declares the provider-agnostic intent vocabulary, `glyphs.ts` maps each intent to a **Lucide** glyph (per-icon `@iconify/icons-lucide/*`, tree-shakeable) and registers it offline via `addIcon` behind an idempotent `ensureIconGlyphs()` — no runtime API fetch, SSR-safe. The `Icon` component is Entity=Structure (`data-scope`/`data-part="icon"`, `currentColor`, sized by `vars.sizing.icon.*`). It is **internal**: not exported from `src/index.ts`. The layer is the seed of a future standalone `@ttoss/fsl-icon` package (promotion is a separate, governed step — see ROADMAP D-line).
Rejected: hand-drawn inline SVGs per glyph — the maintenance burden and inconsistency the provider model exists to eliminate; unicode glyphs as v1 (`▸ ✓ ✕ −`) — no sizing/color control, inconsistent cross-platform rendering, and no path to the DatePicker/SearchField icon needs of later waves; putting the glyph mapping in `@ttoss/fsl-theme` — glyphs are renderable SVG, not serializable design tokens (`icon-system.md`: a token "resolves to CSS"; Icon "renders visual UI"), so they do not belong in the token layer; runtime Iconify API fetch — a network dependency incompatible with SSR and the offline guarantee; reusing `@ttoss/react-icons` — would couple the FSL stack to the legacy `@ttoss/ui` icon package (string-name API, not intent-based) that the ROADMAP treats as read-only.
Cost: a curated intent→glyph map must be maintained (kept minimal — only the intents live components consume); adding an intent for a future component is a two-line edit in `intents.ts` + `glyphs.ts`.
Anchors: `src/components/Icon/intents.ts`, `src/components/Icon/glyphs.ts`, `src/components/Icon/Icon.tsx`, `docs/design/design-system/components/icon-system.md`, ROADMAP B1.

### ADR-006: The build emits one module per file (`unbundle`) so `dist` tree-shakes

Status: accepted (2026-07-16)
Tags: build, tree-shaking, tsdown, packaging

Decision: `tsdown.config.ts` sets `unbundle: true`, emitting one output file per source module with `dist/index.mjs` as a pure re-export barrel. A consumer importing only `Button` pulls Button's chunk and its transitive deps — nothing else. This makes the shakeability guarantee hold at the **published-artifact** level, not just from `src`: `verify:treeshake` now measures `dist` (Button-only = 1 812 bytes, zero composite leakage) identical to the `src` measurement. `'use client'` stays on the barrel (the public entry), so the Next.js RSC client boundary is preserved exactly as with the previous single bundle.
Rejected: single bundled chunk (tsdown default) — one `dist/index.mjs` (~100 KB) that does not tree-shake per export; a `Button`-only import dragged Wizard/ConfirmationDialog/ToastRegion into the consumer bundle. The regression was invisible while local builds were blocked (the probe fell back to `src`); it surfaced once Node 24 made `dist` locally buildable. Per-component `entry` globs — also works, but bloats the `exports` map with one entry per component and shifts the import surface; `unbundle` keeps the single barrel entry.
Cost: `dist/` is now many small files instead of one; a redundant CJS build is still emitted by the shared config but is never referenced (`publishConfig.exports` is ESM-only).
Anchors: `tsdown.config.ts`, `scripts/verify-treeshake.mjs`, ROADMAP A10.

### ADR-007: A Collection container may host Selection-pattern items (per-part entity split)

Status: accepted (2026-07-16)
Tags: entity, collection, selection, composition, listbox, gridlist

Decision: a selectable list composite declares **two entities across its parts** — the container root is `Collection` (a content-carrying `informational` surface, the "Reading" cognitive mode) and each selectable item is `Selection` (`input` chrome, set-membership with a `selected` State, the "Providing" mode). This is the split the ROADMAP flags for `ListBox` and `GridList`. Precedent: `Select` already renders `Selection` items (`SelectItem`), and the option-selection semantics are identical; only the _container_ differs (a standalone `ListBox`/`GridList` is a surface, whereas `Select`'s whole identity is `Selection`). The entity→ux-context contract test unions the color contexts of every entity declared in a source file, so a Collection+Selection file lawfully reads both `vars.colors.informational.*` (container) and `vars.colors.input.*` (items) — no taxonomy change, no new role.
Rejected: styling items as `Collection`/`informational` too — `informational` does carry a `selected` state token, but option selection is data provision, not content reading; using `input` keeps the selection chrome identical to `Select`/`Checkbox`/`RadioGroup`, the consistency users rely on. Making the container `Selection` — the container is a surface that _holds_ choices, it is not itself a single data-entry control; that is why `Collection` (not `Selection`) is the FSL Entity for a list. Adding a `cell`/`row` role or a shared "selectable content" entity — premature; the two existing entities compose cleanly (this is the finding, not a gap).
Cost: one composite file legitimately declares two entities; a reader must note that item color reads (`input`) differ from container reads (`informational`). Documented in CONTRACT.md §1 ("Collection containers with Selection items").
Anchors: `src/components/ListBox/ListBox.tsx`, `src/components/GridList/GridList.tsx`, `src/tokens/CONTRACT.md` §1, ROADMAP ListBox/GridList rows.

### ADR-008: Slider ships track/output as internal parts; Input `track`/`status` roles are deferred, not proposed

Status: accepted (2026-07-16)
Tags: entity, input, slider, structural-role, governance

Context: the ROADMAP flagged Slider's part mapping for FSL §17 governance — thumb→`control`, track→`surface`(part), output→`status`. But the `Input` entity's structural roles are `root`/`control`/`label`/`description`/`leadingAdornment`/`trailingAdornment`/`validationMessage` — it has neither `surface` nor `status`. So the proposed mapping cannot be expressed as _declared_ metas without widening `ENTITY_STRUCTURE.Input`.
Decision: Slider declares only `sliderMeta` (`Input`/`root`) and renders the label, track, fill, thumb, and output as **internal data-parts** carrying no `*Meta` (no legality claim) — the same treatment ProgressBar/Meter/NumberField give their internal structure. The thumb's `data-part="control"` uses a role that IS legal for Input, so promoting the thumb to a declared meta later is a non-breaking change; the track/output would each need a new Input role first.
Governance disposition: **the widening is NOT proposed at this time.** Per the evidence rule, a structural role is admitted only when a component must dispatch on it (behavior/coloring/DOM). No runtime dispatches on a Slider track/output _identity_ today, so adding `track`/`status` to Input would be nominal vocabulary — exactly the dead weight that killed the `Interaction` dimension. This ADR records the friction as FSL-validation data (Workstream D1): the flat per-entity vocabulary expresses Slider fine via `root` + internal parts; the "missing" roles are a documentation artifact of the ROADMAP's descriptive part list, not a real expressivity gap. Re-open as a governance proposal if a future component needs a slider track or a status readout as a _dispatched_ identity.
Rejected: adding `surface`/`status` (or a new `track`) to `ENTITY_STRUCTURE.Input` now — nominal, unevidenced vocabulary growth; declaring the track as `Input`/`surface` or output as `Input`/`status` — illegal today (contract test fails), and the whole point of the matrices is that they fail.
Cost: Slider's track/output are not auto-discovered identities (no contract-test row); they are covered by the component's behavior + axe tests instead.
Anchors: `src/components/Slider/Slider.tsx`, ROADMAP Slider row, `src/semantics/taxonomy.ts` (`ENTITY_STRUCTURE.Input`).

### ADR-009: A token-constrained presentational layer (Box/Grid/Container) is the sanctioned composition escape hatch

Status: accepted (2026-07-18)
Tags: presentational-layer, structure, escape-hatch, composition, governance

Context: FSL Studio — the first real consumer — needed **827 lines of `studio.css`** with zero token redefinitions and zero library overrides (measured, EVOLUTION.md §1). The CSS filled a _vacuum_: the package shipped 34 interactive controls but nothing for composition (no `Box`/`Grid`/`Container`), so every shell, layout, and one-off region had no library answer and fell to raw CSS. The doctrine simultaneously forbade variation (§4 "no size prop") and free escape (§7 host-knobs only for composites), leaving no way to express a padded/sized/grouped region.
Decision: ship a **presentational layer** — `Box` (generic block escape hatch), `Grid` (2D), `Container` (page shell), alongside the existing `Stack`/`Surface`/`Text`/`Heading` — all Entity = `Structure`. The escape hatch is real but **token-constrained**: every visual prop accepts _only_ a token key (`padding="md"`, `background="muted"`, `radius="surface"`, `columns={3}`, `maxWidth="reading"`) — never a raw `style`/`className`/hex/px. Layout _behaviour_ keywords that are not design tokens (flex/grid alignment, `auto`/`100%`/`fit-content`, `text-align`, `tabular-nums`) are allowed as literals, exactly as `Stack` already maps `align`/`justify` to flex keywords. This supersedes "no style at all": expressive enough to compose any app layout, constrained enough that no arbitrary value can enter a consumer.
Rejected: a free `style`/`className` prop (re-admits arbitrary hex/px — the exact drift the token contract exists to prevent); a component-per-layout explosion (does not scale — the Studio proved 38 hand-rolled selectors); leaving composition to host CSS (the status quo that produced 827 lines); a `weight` prop on Text/Heading (weight belongs to the type-scale step — a free weight knob is the same "no size prop" violation §4 forbids).
Cost: a broader public surface (four+ layout primitives) and a standing judgement call at review time — "is this prop a token key or a layout keyword?" (the contract tests still forbid hex/rgb/`var(--tt-*,fallback)` in every component source, which catches the dangerous cases). `Box` overlaps `Surface` on padding/background/border, disambiguated by intent: `Surface` bears elevation/depth; `Box` is a plain container.
Anchors: `src/components/{Box,Grid,Container,Stack,Surface,Text,Heading}`, `src/tokens/CONTRACT.md` §4/§7, `packages/fsl-ui/INTERNAL/EVOLUTION.md` §3 (D1).

Re-litigation answers:

- "Doesn't an escape hatch break 'no arbitrary values in consumers'?" → no — Box accepts only token keys and layout keywords; there is no channel for a raw hex/px. The principle is preserved; only "no style prop at all" is superseded.
- "Why is `columns={3}` allowed but `width: 300px` is not?" → a track _count_ is structural (like flex order), not a length; `300px` is an arbitrary length. Box exposes the former and forbids the latter.
- "When should I use Box vs Surface vs Stack vs Grid?" → Stack = 1D flex rhythm; Grid = 2D; Container = centered page shell; Surface = depth-bearing card; Box = everything else (a plain padded/sized/grouped region).
