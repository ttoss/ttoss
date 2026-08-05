# Contributing to `@ttoss/fsl-ui`

> **To author a component you need exactly two files: this file + `src/tokens/CONTRACT.md`.**
> That covers _mechanics_ — which `vars.*` path a part reads, which matrices must
> cover a new Entity, which attributes it publishes.
>
> It does **not** cover _decisions_. The moment a question is "should this be a
> colour or a valence", "may a component paint nothing", "does size come from a
> fixed ramp", you are outside these two files and inside
> `docs/website/docs/design/design-system/design-tokens/`, which is already
> opinionated on all three. `INTERNAL/ROADMAP.md` →
> "Before deciding anything — read the authorities first" maps each recurring
> question to the document that answers it. Read it before escalating anything as
> an owner decision; that section exists because two questions were escalated that
> the docs had already settled.

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

Status: superseded-by:ADR-027 (2026-08-02)
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

### ADR-010: `Icon` is a public export; the standalone package stays deferred

Status: accepted (2026-07-22) — narrows ADR-005's "internal-only" clause
Tags: icons, public-api, evidence, governance

Decision: `Icon` (+ `iconMeta`, `IconProps`, `IconSize`, `IconIntent`, `ICON_INTENTS`) is exported from `src/index.ts`. The evidence rule fired: the Studio Pricing block needed glyphs outside shipped components (feature-list checkmarks — friction F-015), which is exactly the promotion trigger ADR-005 left open. The intent registry stays curated and grows one consumer-demanded intent at a time (`status.success` landed with this ADR); `ensureIconGlyphs`/`iconifyName` remain internal plumbing.
Rejected: extracting `@ttoss/fsl-icon` now — its trigger is a consumer that wants icons _without_ fsl-ui, which does not exist; keeping Icon internal and letting blocks hand-author SVG — recreates the exact drift ADR-005 eliminated; exporting the whole glyph/registry plumbing — consumers need the component and the intent vocabulary, not the provider wiring.
Cost: the intent vocabulary becomes public API — renames/removals now follow the deprecation rules; the curated-registry discipline ("grows slowly and shrinks never", icon-system.md) is load-bearing against icon sprawl.
Anchors: `src/components/Icon/`, `src/index.ts`, `docs/design/design-system/components/icon-system.md`, `docs/fsl-studio/FRICTION.md` F-015.

Re-litigation answers:

- "ADR-005 says Icon is internal" → that clause is narrowed here, on the named trigger (real external-to-components demand); the rest of ADR-005 (provider, offline registration, intent contract) stands.
- "Why not ship `@ttoss/fsl-icon` while we're at it?" → no consumer wants icons without fsl-ui; the module boundary is already package-shaped (`intents.ts` is dependency-free), so extraction later costs the same as extraction now.
- "Can an app add its own intents?" → not through this package — app-specific intents are icon-system.md extensions in app space; this registry only admits intents a shipped component or block demands.

### ADR-011: Definite-width layout primitives establish size containment

Status: accepted (2026-07-24)
Tags: layout, container-queries, fluid-scales, fsl-theme-interop

Decision: layout primitives whose inline size is **definite** establish `container-type: inline-size` — `Grid` wraps each child in a `data-part="item"` container (track width is definite), `AppShell` marks its four regions (named-scale/track widths), and `Container` marks its root (stretch + max-width) — so fsl-theme's container-fluid scales (`cqi` clamps, fsl-theme ADR-019/020) finally resolve against a real container instead of silently falling back to the viewport (friction F-018: type/inset inside a 220px grid tile rendered at page scale and overflowed).
Rejected: `Surface` as a container — it is content-sized in horizontal Stacks, and `inline-size` containment would collapse it (containment only where width is definite by construction); a `container` prop consumers opt into — the fluid engine is the theme's declared default, not a per-use choice; telling hosts to add containers in app CSS — recreates the hand-rolled-CSS drift this package exists to prevent.
Cost: theme `cqi` scales now resolve locally — type/spacing inside narrow grid tracks, sidebars, and asides render at the clamp's lower range (the declared behavior, but a visible change for existing consumers); `Grid` children gain a wrapper element (fragments-as-children become a single item; per-child DOM selectors cross one more level).
Anchors: `src/components/Grid/Grid.tsx`, `src/components/AppShell/AppShell.tsx`, `src/components/Container/Container.tsx`, `packages/fsl-theme/CONTRIBUTING.md` ADR-019/ADR-020, `docs/fsl-studio/FRICTION.md` F-018.

Re-litigation answers:

- "Why not put the container on the Grid root?" → `cqi` would resolve to the whole grid's width (≈ the page), not the tile — the per-item container is the entire point.

### ADR-012: A freeform channel makes a picker `Input`, not `Selection`

Status: accepted (2026-07-24)
Tags: entity, input, selection, combobox, governance

Context: the ROADMAP called `ComboBox` "the accordion-vs-select of ambiguity cases" — it is a text field and an option list at once, and `Select` (the neighbouring component) is `Selection`. Both entities project to the same `input` ux context, so the choice changes no colour; it changes what the component _claims to be_, which is what every later picker (`Autocomplete`, `DatePicker`, `SearchField`-with-suggestions) will copy.

Decision: **the discriminant is whether a freeform channel exists.** A control the user can type an arbitrary value into is `Input`, even when it also offers a list; a control whose only act is picking from a closed set is `Selection`. `ComboBox` is therefore `Input`/`root`: the text field is the control and the filtered list is an affordance that narrows what the user types (with `allowsCustomValue` it can commit a value the set does not contain — something no `Selection` can do). `Select` stays `Selection`. The options themselves are `Selection`/`item` under the ADR-007 per-part split, identical to `SelectItem`/`ListBoxItem`, because option-selection semantics do not change with the host.

Rejected: `Selection` for the whole composite — it would make `allowsCustomValue` incoherent (a "selection" that selects nothing in the set) and would misfile the part the user actually operates; a new `Combo`/`Hybrid` entity — nominal growth with nothing dispatching on it, the dead weight that killed the `Interaction` dimension; declaring the chevron an `Action` identity — `trigger` is not a legal `Input` role and a second entity in the file would buy nothing, so it ships as an internal data-part exactly as NumberField's steppers and Slider's track do (ADR-008).

Cost: two sibling components with near-identical DOM carry different root entities, so "which entity is my picker?" is a judgement call at authoring time rather than a lookup — this ADR is that lookup.

Anchors: `src/components/ComboBox/ComboBox.tsx` (header block), ROADMAP ComboBox row, `docs/fsl-studio/FRICTION.md` F-008.

Re-litigation answers:

- "Select and ComboBox look the same — why differ?" → they read the same tokens; only the claimed identity differs, and it differs because one accepts typed input and the other cannot.
- "Is `SearchField` then also a picker?" → no — it has the freeform channel but no option set, so it stays a plain `Input` with adornments.
- "What about `Autocomplete` (deferred)?" → same rule: it has a freeform channel, so it is `Input`. This ADR is the learning the ROADMAP said to wait for.
- "Doesn't ADR-019 forbid container-fluidity?" → no — it forbids it for **control geometry** (rem-anchored `hit`/inset, unaffected here); layout/type fluidity by container is exactly what ADR-019/020 declare.
- "Why does Stack not establish containment?" → a Stack's items size by content on the main axis (no definite width), the same reason Surface is rejected; containment is added only where the box's inline size is definite by construction.

### ADR-013: `ButtonGroup` owns the action row — fixed rhythm, adaptive axis, and the first measured layout in the package

Status: accepted (2026-07-25)
Tags: structure, layout, action, overflow, measurement, P3

Context: P3 Slice 4 ③. The action row — a form footer, a page header's cluster, a card's controls — had no component. `Stack direction="horizontal"` covers the arrangement but takes the gap from the caller, so every action row in a product can pick a different rhythm; `Toolbar` is a named `role="toolbar"` region with arrow-key navigation, which is not what a Save/Cancel pair is (see ADR-014); `DialogActions` reorders by `composition` per platform and throws outside a `<Dialog>`; `Group` paints a labelled boundary. The reference system ships `ButtonGroup` as its own component, and the behaviour that justifies it there is not layout but **overflow**: a row that does not fit becomes a column.

Decision: `ButtonGroup` is `Structure`/`root` with exactly two props — `orientation` (`horizontal` default, `vertical`) and `align` (`start` default, `center`, `end`) — and **no `gap` prop**. The separation between sibling actions is one product-wide decision made by the theme (`gap.inline.sm`), which is the component's reason to exist over a Stack preset; both axes read that same token, because a row that columnised for space is the same set of actions and not a new stacking rhythm (the one place a Structure component deliberately does not follow `Stack`'s inline/stack split). `horizontal` is adaptive: the group measures its children against its own box and lays them out in a column when any child sticks out, publishing the rendered axis as `data-orientation` and marking a forced column `data-collapsed="true"`; `vertical` pins the column and skips the measurement entirely, which is also the escape hatch. Because the measurement needs children that hold their natural width, the group turns off shrinking on grouped triggers — via **context** (`ActionTriggerGroupProvider` in the shared trigger anatomy), the ecosystem's pattern, so it survives a `Tooltip` or `DialogTrigger` wrapper that `cloneElement` over children could not reach. `flexShrink: 0` is imposed _by the group_, never globally: a lone trigger in a narrow container should still give way rather than overflow the page — the same line the reference draws with `flexShrink: { default: 1, isInGroup: 0 }`.

Rejected: a CSS-only `flex-wrap: wrap` (wrapping mid-row reads as a mistake where a column reads as a decision, and wrapping cannot right-align the remainder); a container query (the threshold depends on the buttons' own content width, which CSS cannot know); `role="group"` by default (an unnamed group is screen-reader noise — pass `role`/`aria-label` yourself, or use `Group`); `inline-flex` as the reference uses (it makes `align` inert in a row, since a content-sized box has no free space to distribute — ours is block-level so `align` works where authors expect it); propagating `isDisabled` to children (no consumer yet — §2.3 evidence rule; readmission criterion: a real "disable the whole footer while submitting" case, which `FormSubmit`'s `isPending` may produce); `align="stretch"` for full-width stacked CTAs (same rule — no consumer yet).

Cost: the first component in the package that reads layout, so it carries a `ResizeObserver` on its container and a `useLayoutEffect` (degraded to `useEffect` on the server, where there is no layout to read and hydration re-measures). A collapse costs two renders — one row-shaped pass to measure, one to settle. jsdom reports every box as zero, so the unit suite stubs `offsetWidth`/`offsetLeft` and drives the observer callback directly: the _decision_ is unit-tested, the _measurement_ is verified in a real browser (collapse at 260px, recovery at 700px, both modes). Three trigger components gained a `useIsGroupedActionTrigger()` call.

Implementation note that is easy to get wrong: the measurement state must be a **monotonic pass counter**, not an `isMeasuring` boolean. With a boolean, a request arriving in the same flush as the previous settle sets the atom `false` then `true`, React sees no net change, skips the re-render, and the machine sticks in "measuring" forever — the group then never collapses. A counter cannot cancel itself out.

Anchors: `src/components/ButtonGroup/ButtonGroup.tsx`, `src/components/ActionTrigger/anatomy.tsx` (group context + `flexShrink`), `src/tokens/CONTRACT.md` §5, `packages/fsl-ui/INTERNAL/ROADMAP.md` P3 Slice 4 ③.

Re-litigation answers:

- "Why no `gap` prop when ADR-009 sanctions token-key props on Structure?" → sanctioned is not required. A gap prop would make this a Stack preset; the fixed rhythm _is_ the deliverable.
- "Why does the vertical form not use the `gap.stack` family?" → because it is not a stack. It is the same action row with no horizontal room.
- "Isn't measuring layout against the package's grain?" → the grain is _no hand-rolled visual CSS_; behaviour has always been allowed (`DialogActions` reorders children, `Wizard` tracks steps). What CSS cannot express, a component may.
- "Why watch the container instead of the group?" → the group's own width does not change when the space around it does; in a collapsed column its width is the widest child, which says nothing about what is available.

### ADR-014: `Toolbar` _is_ the Action family's group of utility actions; it paints nothing, and chrome is composed

Status: accepted (2026-07-25)
Tags: structure, action, toolbar, grouping, chrome, P3

Context: P3 Slice 4 ④ asked for "ActionGroup — a group of ActionButtons". Reading the reference system's source settled what that component is there: its `ActionButtonGroup` is built on React Aria's `Toolbar`, carries **no selection**, and paints **no chrome** (its props are `density`, `isJustified`, `isQuiet`, `orientation`); selection lives in a separate `ToggleButtonGroup` that shares the same style recipe. It also ships a `Toolbar` that is a bare pass-through with zero styling. So the reference's split is: unstyled ARIA container · styled action cluster · styled selectable set.

Decision: **we do not add a component.** `Toolbar` already is that cluster — same entity, same `role="toolbar"`, same keyboard affordance — so a second Structure component on the same role, differing only in whether it painted, would be the duplicate this package's doctrine rejects. The name stays `Toolbar` because that is the role it renders and the word a reader searches for; the queue's "ActionGroup" maps onto it. What changed is the component: (1) **the chrome is gone.** It painted an `informational` bar — background, 1px border, `radii.surface`, `inset.surface` — and measured **80px tall around 34px controls** in the browser: a card wrapping controls, which then read as bare text inside it (the buttons in a bar are `muted`, and ADR-021's ladder gives `muted` no resting edge). Whether a bar has a background depends on the surface it sits on, not on the bar, so chrome is now composed: `Surface level="overlay"` + `Toolbar` for a floating bar, nothing for a bar on the page. (2) Painting nothing means no colour is evaluated, so the `evaluation` prop is gone (§2.3 evidence rule). (3) It gained `align` — the same vocabulary `ButtonGroup` uses — and became block-level so `align` has free space to act on. (4) The three group containers (`ButtonGroup`, `Toolbar`, `ToggleButtonGroup`) now take their arrangement from one shared source, `buildActionGroupStyle` in the trigger anatomy: one gap token, one align mapping, one axis rule, plus the no-shrink context, so the family cannot drift apart the way the triggers did before ADR-013.

Rejected: a new `ActionGroup`/`ActionButtonGroup` component (two identities, one role — and it would have to forbid the mixed controls a real bar carries: a `Select` for a filter, a `Separator` between clusters); keeping the painted bar behind a `variant`/`hasChrome` prop (a visual axis as an author decision, which CONTRACT §4 gives to the theme, and the composition already exists); `density`/`isJustified` from the reference (real patterns, no consumer yet — readmission criterion: a segmented view-switch that needs its options nearly touching, or a mobile bar whose controls must divide the width); the adaptive column `ButtonGroup` has (a toolbar that overflows moves its tail into an overflow menu — `ActionMenu`, queue item ⑤ — it does not restack; columnising a formatting strip turns a bar into a wall).

Cost: a **breaking change** for anything that passed `evaluation` to `Toolbar` or relied on its bar (pre-1.0, no consumers in the repo; the Studio never used it). A bar that wants chrome now needs one more element. And the realignment exposed that the component does not implement the APG toolbar's single-tab-stop requirement — `useToolbar` supplies the arrow keys but cannot manage arbitrary children's `tabindex` — which was silently claimed in three places and is now documented and asserted instead (F-028).

Anchors: `src/components/Toolbar/Toolbar.tsx`, `src/components/ActionTrigger/anatomy.tsx` (`buildActionGroupStyle`), `src/components/ToggleButtonGroup/ToggleButtonGroup.tsx`, `docs/fsl-studio/FRICTION.md` F-028, ROADMAP P3 Slice 4 ④.

Re-litigation answers:

- "Where is ActionGroup, then?" → it is `Toolbar`. The reference's `ActionButtonGroup` is a styled React Aria `Toolbar`; ours is the same thing under the role's own name.
- "A toolbar with no background looks unfinished." → measure it against the page it sits on. The chrome that read as "finished" was a card, and the controls inside it lost their own edges to it. Compose `Surface` when the bar genuinely floats.
- "Why does `ToggleButtonGroup` stay `inline-flex` when the other two are block-level?" → a segmented control is an object sized by its options; a command row and a toolbar are bands across their container. That is the one parameter `buildActionGroupStyle` takes.
- "Should `Toolbar` collapse like `ButtonGroup`?" → no. Its overflow answer is an overflow menu, not a second axis.

### ADR-015: `ActionMenu` ships as a composite (the overflow affordance is a convention); a menu row's resting rung is `muted`

Status: accepted (2026-07-25)
Tags: action, overlay, menu, icon, a11y, i18n, P3

Context: P3 Slice 4 ⑤. The overflow menu — a row's trailing "…", a card's corner menu, the tail of a toolbar that ran out of room — was expressible by composing `MenuTrigger` + an icon-only `ActionButton` + `Menu`, and every call site would have had to pick the glyph, remember the icon-only square, and supply an accessible name. The reference system ships it as a component for the same reason.

Decision: **`ActionMenu` is a composite with a narrow surface** — the open-state props of `MenuTrigger`, the item props of `Menu`, and the trigger's `evaluation`/`isDisabled`. Its single `*Meta` is the **trigger** (Action/root, `data-scope="action-menu"` via `ActionButton`'s documented scope override), because the surface it opens keeps `Menu`'s Overlay identity — it composes two identities instead of inventing a third. Three choices inside it are the point of the component: the glyph is the new **`action.more`** intent (the icon registry grows only when a component needs it — icon-system.md's change rule), the trigger is the utility silhouette's icon-only square, and **`aria-label` is a required prop**. The reference defaults that label to a translated "More actions", which it can because it ships an i18n runtime; ours cannot, and a hardcoded English default would ship untranslated copy into every product — so the type system asks (ADR-001). The trigger defaults to `evaluation="secondary"`, matching the reference's non-quiet default, which also means the shipped default is correct on every surface and does not wait on F-024.

Second decision, forced by looking at an open menu for the first time since the P3 retune: **`MenuItem`'s default evaluation moves `primary` → `muted`.** With `primary` it painted every row a solid `neutral.1000` chip in light and a solid white one in dark — a menu that read as a stack of buttons, shipped in the Studio's own user menu without anyone noticing. `muted` is not merely quieter, it is _correct_: its resting background resolves to exactly the popover's colour in both modes (`neutral.0` / `neutral.900`), so the row borrows the surface and materialises on hover. Contrast holds (ink `#3d3d3d` on white ≈ 10.4:1, `#d0d0d0` on `#161616` ≈ 13.6:1).

Rejected: documenting the composition instead of shipping the component (the glyph, the square and the name would drift per call site — the same argument that gives `ButtonGroup` a fixed rhythm); an `icon` prop on `ActionMenu` (the overflow glyph _is_ the convention; a caller who wants a different trigger composes `MenuTrigger` + `ActionButton` directly, which this is shorthand for and never a replacement of); a default `aria-label` in English (ADR-001); `evaluation="negative"` for a destructive row (it fills the row red — the missing rung is "negative ink on a surface", logged as F-029 rather than papered over).

Cost: one intent added to the registry (`action.more` → Lucide `more-horizontal`); `MenuItem`'s visual default changed, which is a **breaking visual change** for any consumer that relied on filled rows (in-repo: the Studio's user menu, which was the bug); the destructive row currently has no colour of its own.

Anchors: `src/composites/ActionMenu/ActionMenu.tsx`, `src/composites/Menu/Menu.tsx` (`MenuItem` default), `src/components/Icon/intents.ts` + `glyphs.ts`, `docs/fsl-studio/FRICTION.md` F-024 / F-029, ROADMAP P3 Slice 4 ⑤.

Re-litigation answers:

- "Why is the meta the trigger and not the whole thing?" → the composite renders no wrapper of its own; `MenuTrigger` is an orchestrator with no DOM. The button is the only root there is, and the popover already has an identity.
- "Why does a menu row default to the _quiet_ rung — isn't a menu item a normal action?" → its container is the emphasis. A row inside an overlay surface is already prominent; painting it again makes a button of it.
- "Then how do I make one row louder?" → pass `evaluation` explicitly (a primary "Create…" at the top of a menu). The default is the common case, not the only one.
- "Why not add `action.more` speculatively along with a few other glyphs?" → icon-system.md: the registry grows slowly and shrinks never; add an intent when a component needs it.

### ADR-022: A field's geometry comes from one shared anatomy; `control` names the element the user operates

Status: accepted (2026-07-26)
Tags: input, field, anatomy, geometry, a11y, addressability, P3

Context: P3 Slice 5 ⓠ+①. The Input family had grown to eleven components, each declaring the field row for itself, and measuring it in Chromium (light + dark, 1920 / 900 / 390) turned up five class-level defects that no per-component fix would have stopped. Four are geometry drift: a control that declared `minBlockSize` where its siblings declared `minHeight` (computing the same box, invisible to the row guard); a focus ring floated 2px on four members and flush 0px on two; two host-element UA defaults nobody had declared (a `<button>` centring its value, an `<input>` keeping its 2px inline padding); and three in-field triggers at 20 / 25.33 / 32px. The fifth is addressability: three components wrap an `<input>` in a painted `<div>` and name **both** `data-part="control"`, so the anatomy the package publishes cannot address either one (F-026).

Decision: **one shared anatomy module owns field geometry** — `components/Field/anatomy.tsx`, the counterpart of `ActionTrigger/anatomy.tsx` for the Action family. It exports `FIELD_ROW` (the four tokens that _are_ the row) plus builders for the two shapes a field control takes: _self-painted_, where one element is both the painted box and the operated element, and _split_, where a frame paints and hosts adornments while a borderless inner input carries the value. The row is asserted against that source by contract invariant **#11**, not against a peer component — which is what lets it widen past the two members invariant #10 could reach.

Second decision, which the addressability defect forces: **`data-part="control"` names the element the user operates** — the one that takes focus and holds the value. A test, a host stylesheet or an agent told "type into the email field" resolves `[data-part="control"]`, and a `<div>` frame there would break that. The frame becomes an **internal part** (`data-part="frame"`), the treatment Slider's `track`/`fill` already get under ADR-008; the contract test checks `data-part` legality only for declared metas, so an internal part is free to use a name outside the entity's role vocabulary. Contract invariant **#12** then states the general rule: no element may contain a descendant carrying the same `(data-scope, data-part)`. Sibling repeats stay legal — two radios, two steppers, two glyph hosts — because the defect is ambiguity within a subtree, not repetition in a document.

`textAlign` is declared rather than inherited, which is the whole fix for the UA-default class: a field displays a value at the reading edge, and when nothing states it the host element decides — `<input>` starts its text, `<button>` centres it.

Rejected: keeping the row as a per-component declaration with a lint rule (the drift was in _which property_ was used, not in the values, so a value lint cannot see it); making the frame `control` and the input a `value` internal part (it inverts addressability — the operated element is what callers and agents reach for, and ADR-008 already pins `control` to Slider's thumb rather than its track); a `(scope, part)` uniqueness rule scoped per document (sibling repeats are the normal case and would have to be exempted one by one, which is the same as having no rule); standardising the floor on `minBlockSize` rather than `minHeight` (the logical-property rule the contract enforces governs _directional_ placement, which breaks RTL — sizing has no such failure mode, and `minHeight` is what the Action anatomy and five of six field members already read; the choice now lives in one place, so reversing it is a one-line change).

Cost: an internal module with no public export, so the package's surface is unchanged and existing call sites keep compiling — but every future field must go through it or invariant #11 fails, which is the intent. Invariant #12 shipped with four **named** known violations rather than a silent exemption list: the three field cases above, each annotated with the queue item that removes it, plus `menu/root`, which this invariant found and the browser audit had missed — the Menu popover and every `MenuItem` both resolved `[data-scope="menu"][data-part="root"]`, because §5 has sub-parts reuse the host's scope while `MenuItem` also declared `structure: 'root'` (a different family and a different cause — F-030). A companion test asserts every listed violation is still real, so a fixed one must be deleted rather than left as a permanent exemption, and the list has since shrunk to **two**: `combo-box/control` fell in forms C1 and `menu/root` in forms round R3, where `MenuItem` moved to `structure: 'control'` — legal on Action already, and the word ADR-022 itself defines as the element the user operates.

Anchors: `src/components/Field/anatomy.tsx`, `src/composites/TextField/TextField.tsx`, `src/composites/TextArea/TextArea.tsx`, `tests/unit/tests/components.contract.test.tsx` (invariants #11 and #12), `src/tokens/CONTRACT.md` §5, `docs/fsl-studio/FRICTION.md` F-026 / F-030, ROADMAP P3 Slice 5.

Re-litigation answers:

- "Why not one `Field` component wrapping any control, the way the design drafts model it?" → because React Aria wires label to control to description to error through context supplied by **the field root itself**. Read in `react-aria-components@1.19.0`: `LabelContext`, `TextContext` and `FieldErrorContext` are context-generic consumers, and all three are provided by `TextField`, `Select`, `ComboBox`, `NumberField`, `RadioGroup`, `SearchField` and `CheckboxGroup`. A wrapper outside that root cannot participate, so the envelope is the root each composite already renders plus parts mounted inside it.
- "Then how does one label cover two controls?" → that is a `role="group"` with `aria-labelledby`, not a field. It is the only shape the context model allows, and it is also the correct ARIA.
- "Does invariant #11 replace #10?" → no. #10 asserts the _Action_ side of the row (a utility trigger matches a field); #11 asserts the _field_ side against the shared source. They meet on the same tokens from opposite directions.
- "Why does the row assert token strings instead of computed pixels?" → jsdom has no layout. The pixel check is the browser measurement that gates each queue item; the unit invariant guards the declaration, which is what actually drifts.
- "Slider only provides `LabelContext` — is that a bug?" → no, it is the boundary. Slider has no validation in React Aria, so it takes a label and nothing else from the envelope.

**Addendum 2026-07-26 — the authoring surface (forms item A).** The family had three shapes for one idea: `TextField`/`TextArea`/`SearchField` composed by slots, `Select`/`ComboBox`/`NumberField` took props, and `Select` had nowhere to render a message at all (F-009). Both shapes are legitimate — one line for the common field, slots when the arrangement is unusual — so the decision is **not to pick one** but to make every field support both from one code path, with the meaningless combination rejected at compile time. `FieldAuthoring<TChildren>` in the anatomy is a discriminated union: the `children` branch forbids `label`/`description`/`errorMessage`/`placeholder` and the copy branch forbids `children`, so "I passed both, which wins?" is a type error rather than a runtime precedence rule nobody can see. Existing per-component slot exports are unchanged and stay exported, so the surface only grows.

Two details that are decisions, not incidents. `placeholder` is forwarded to the control rather than spread onto the root, because React Aria deliberately **omits** `placeholder` (and `label`, `description`, `errorMessage`) from `TextFieldProps` — they belong to the parts, and the one-line form is what puts them back. And the one-line form **always mounts the message slot**, even with no `errorMessage`: React Aria's `FieldError` renders only while invalid, so mounting it costs nothing and buys the platform's own constraint copy for `isRequired`/`type="email"` — already localized, which is copy we could never ship ourselves (ADR-001). Asserted by `fieldAuthoring.test.tsx` against a real failed submit, because a controlled `isInvalid` alone produces no message and would have made a weaker test pass.

**Addendum 2026-07-28 — the envelope parts (forms item C2).** Item A rejected an
**exported** generic `FieldLabel`, on the grounds that it would need its own
`data-scope` and re-scoping the published per-component parts is a break bought
for nothing. That holds. What it did not settle is whether the parts may share an
_implementation_, and measuring the family answered that they must: probing all
nine field roots showed the necessity marker reaching **three** of them, `Select`
and `RadioGroup` with nowhere to render a message (F-009 and its sibling shape),
and three files carrying a private helper computing the colours
`buildFieldTextPartStyle` already computes.

So the anatomy gains three **internal** parts — `FieldLabelPart`,
`FieldDescriptionPart`, `FieldValidationMessagePart` — which take `scope` as a
**prop** rather than owning one. That is the whole difference from what A
rejected: `text-field/label` is still `text-field/label`, so every attribute a
test, a stylesheet or an agent can address is byte-identical either side of the
refactor, while the nine copies become one. The per-component slot exports remain
the composable surface and now render through these.

The guard is a class guard, `fieldEnvelope.test.tsx`, driven by a table whose axis
is _every field root whose React Aria root supplies `TextContext` and
`FieldErrorContext`_ — with `Switch` and `Slider` named as exceptions plus the
mechanism excluding each, so the list can only shrink. A per-component test cannot
catch this class of defect, because each component passes on its own.

Two measured details that are decisions. A split control's **frame** now declares
the row's type although it renders no text: without it the same `ComboBox`
resolved `16px` in Storybook and `18px` inside the Studio's invite dialog, because
an undeclared frame inherits the host's paragraph size and hands it to every
adornment placed in it — invariant #11 now asserts the type on both control
shapes. And `Select`'s label stopped tinting itself `text.invalid`: it was the
only label in the family that did, the divergence was invisible because F-032
measures that token as the same ink as `text.default` in both modes, and when
F-032 lands a real negative ink a whole label turning red is not the language the
reference uses — it tints the message and the chrome, never the name of the field.

Anchors: `src/components/Field/anatomy.tsx`, `tests/unit/tests/fieldEnvelope.test.tsx`, `docs/fsl-studio/FRICTION.md` F-009 / F-032, `INTERNAL/FORMS.md` §3 and C2.

### ADR-023: A picker's popover takes the field row's width, read from a named allowlist of upstream custom properties

Status: accepted (2026-07-28)
Tags: input, field, overlay, escape-hatch, governance, P3, forms

Context: forms item C3 / F-019. Measured in Chromium at 1280 and 390, light and dark: `Select`'s dropdown came out **102.11px under a 1200px trigger** and 79.61px under 310px; `ComboBox`'s 142.88px and 115.27px. In the Studio's invite dialog the Role dropdown was a small detached box under a 426px field. All four cases had `--trigger-width` published **on the popover element itself** the whole time, correct and live, and read by nobody.

Two questions, and only the second is governance. What should the width be, and may the package read a custom property from a namespace it does not own?

Decision, part one: **a picker's popover takes the field row's width, and a menu's does not.** Both authorities draw that line in the same place, which is why it is the line. React Aria's own `Select` and `ComboBox` examples style their popovers `width: var(--trigger-width)`; its `Menu` example sets no width. Spectrum 2's `Picker` and `ComboBox` document `menuWidth` as "By default, matches width of the trigger. Note that the minimum width of the dropdown is always equal to the trigger's width"; its `Menu` has no such prop. The discriminant is what the popover shows: a picker shows the field's **value space**, so it belongs to the field's geometry; a menu shows **things to do**, so it sizes to its own content. Our `Menu` keeps `--fsl-menu-min-width` (measured 192px against a 108.88px trigger — correct, and unchanged), and `Popover` keeps its own max-width.

S2's two sentences are two different rules, so they become two declarations: `min-width` is the unconditional floor, `width` is the default and is knob-overridable (`--fsl-select-popover-width`, `--fsl-combo-box-popover-width`). A host can therefore widen the list for long options but can never make it narrower than the row it hangs from — a dropdown narrower than its own trigger reads as a rendering fault.

Decision, part two: **reading a custom property published as documented API by a direct dependency is legal, from a named allowlist.** `CONTRACT.md` §7 rule 2 reserves `--fsl-` and bans a third namespace because an unnamed one is an unreviewable side channel. That reasoning does not reach `--trigger-width`, which is not a side channel but the sanctioned way to read a value **only the dependency can compute** — a layout measurement of a different subtree, unavailable to CSS by any other means. It appears in React Aria's Popover documentation in a "CSS Variables" table, described as "The width of the popover trigger element". So the rule gains an exemption shaped as an allowlist: a fixed union (`UpstreamCssVar`), read through `upstreamVar(name, fallback)`, one row per name in §7 with the documentation that publishes it.

The fallback is mandatory as it is for `fslVar`, but it means something else: not "the host did not customise this" but "the dependency did not publish it". For `--trigger-width` it is `auto`, which is the behaviour the package had before F-019 — degradation is a step back, not a break.

**These properties are read-only, and that is a mechanism rather than a convention.** React Aria resolves `--trigger-width` as `props.style['--trigger-width'] || measured`, and supplying our own value _also_ switches off the `ResizeObserver` keeping it current — so writing it would silently freeze the popover at the trigger's first-paint width.

Rejected: `min-width` alone with the popover still sizing to content (satisfies S2's floor sentence and contradicts its default sentence — and leaves the measured defect in place for any list narrower than its field); `width` alone with no floor (a host knob could then produce a dropdown narrower than its trigger); forwarding a `menuWidth`-style prop instead of a knob (geometry the host owns goes through §7's channel, and a prop would be a visual prop on a composite, which §4 forbids); reading the property without an allowlist (that is the unnamed namespace §7 rule 2 exists to prevent); putting the two-line style in each picker (third instance of the same duplication class in this family — the field row and the envelope were the first two, and both drifted).

Cost: one entry in a governance allowlist, which must be argued each time it grows. The **enforcement** cost is where the real lesson is: the pre-existing rule was a source-text regex over `src/components/**`, and routing the read through a helper in `src/tokens/` slipped past it silently — the suite stayed green through a change the rule was written to catch. So the binding check is now over the **rendered** inline styles of every DOM fixture, where a value lands regardless of what composed it, plus a source check that nothing assigns an allowlisted name. All three guards were verified to fail on an injected violation before being trusted.

Deliberate no-change: **the open popover overlays the description below the field, and stays that way.** React Aria anchors it to the trigger (`placement: 'bottom start'`, `triggerRef: buttonRef`, read in `Select.mjs`), so an overlay covers what is beneath the trigger — which is what an overlay is, and what both reference implementations do. F-019's original note mentioned the overlap alongside the width defect; only the width was a defect.

Anchors: `src/components/Field/anatomy.tsx` (`buildPickerPopoverStyle`), `src/tokens/escapeHatch.ts` (`upstreamVar`, `UpstreamCssVar`), `src/tokens/CONTRACT.md` §7, `tests/unit/tests/components.contract.test.tsx` (§4b), `docs/fsl-studio/FRICTION.md` F-019, `INTERNAL/FORMS.md` C3.

Re-litigation answers:

- "Why not just always match trigger width for every anchored overlay?" → because a menu is not a picker. Both authorities exclude `Menu` explicitly, and the measurement agrees: our Menu's 192px floor against an 108.88px trigger is right, and forcing it to 108.88px would make every action label wrap.
- "A long option now wraps instead of widening the list — is that a regression?" → it is the rule working, and it was measured: at a 140px trigger the option "Administrator with billing access" wraps to three lines with no overflow in either direction (`scrollWidth === clientWidth` on both the list and the item). A host that prefers a wider list has the knob. S2 behaves the same way.
- "Does this make the Storybook Select dropdown absurdly wide at 1200px?" → the story canvas is full-bleed, so yes, and that is the field's own width — in a real layout (the Studio's 426px field) it is exactly right. Sizing the dropdown to content is what made the field look broken.
- "Why not import `UpstreamCssVar` into the contract test instead of repeating the names?" → a test that imports the thing it polices passes by construction the day someone widens the type.

### ADR-025: The `Form` publishes field layout as static context; a required field marks itself

Status: accepted (2026-07-26)
Tags: input, field, form, context, a11y, i18n, P3, forms

> ADR-024 (the validation language) is reserved for forms item F. Numbers are allocated when a decision is planned, not when it lands.

Context: forms item B1. Label layout and the necessity convention are one product decision, not a per-field one — a form where some labels sit above and others beside, or where one field marks required and the next does not, is a form nobody proofread. The reference system puts exactly these on its `<Form>` (`labelPosition`, `labelAlign`, `necessityIndicator`, `size`) and has each field inherit them, which is also this ecosystem's own pattern: applications configure once at the root, packages consume context, and no visual prop travels down a tree.

Decision: **`Form` publishes a field-layout context and every field reads it — with a default, so a field outside any `Form` still works.** The read goes through a dedicated context in `Field/anatomy.tsx` rather than through `formScope`, because `formScope.use()` throws when its host is absent — correct for `FormActions`/`FormSubmit`, wrong for a field: a lone age input or a confirmation checkbox in a modal is a first-class case (FORMS.md §2b). The standalone default is that a required field still marks itself, because the marker states a fact about the field rather than a preference about the form. The shape is `ActionTriggerGroupProvider`/`useIsGroupedActionTrigger` from the Action anatomy — a container publishes, a member reads with a fallback.

**The context carries static configuration only, and that is load-bearing rather than stylistic.** Every field in the form reads it, so a value whose identity changed per render would re-render all of them. The provider value is memoised on its inputs, and two tests hold the line: a keystroke in one field does not re-render its siblings, and the value survives a Form re-render by identity. TanStack Form can afford field _state_ in context because its values are static class instances with reactive properties; plain React context is not that, and validation state stays where React Aria already tracks it — on each field.

First consumer, so the context is not reserved API: **`necessityIndicator: 'icon' | 'none'`, default `'icon'`.** The reference marks the _required_ fields rather than the optional ones, and so do we. The marker is a text asterisk rather than an `Icon`: the glyph registry does not grow for a character every font already has, and text inherits the label's size and weight for free. It is `aria-hidden`, because — **measured** — React Aria marks the control with the **native `required` attribute** and sets no `aria-required`; the native attribute is announced by assistive technology on its own, a second announcement is noise, and an asterisk absorbed into the accessible name is worse than no asterisk.

Rejected: a `'label'` variant rendering the words "(required)" — that is copy, and copy is caller-supplied (ADR-001), so a translated string is not ours to ship. Readmission criterion: a consumer that needs it, plus a prop carrying its localized text. Also rejected: putting `labelPosition`/`labelAlign` in the context now — the grid that makes side labels work is item B2, and a context key with no consumer is reserved API (§2.3).

Cost, and it is real: the marker lives **inside** the label element, so the label's text content grows an asterisk. The accessible name is unaffected — `aria-hidden` nodes are excluded from name computation, verified by a role query for the bare label still matching — but `getByLabelText('Email')` with an exact string stops matching for **required** fields. Four such queries in the Studio's own suite moved to `getByRole('textbox', { name: 'Email' })`, which follows the accessible-name algorithm and is the robust query regardless. Consumers marking a field required meet the same edge; a product that wants none of it sets `necessityIndicator="none"` on its `Form`.

To carry the flag to the label, `TextField`'s and `TextArea`'s scopes moved from `createPresenceScope` to `createCompositeScope<{ isRequired: boolean }>` — the host now has something its parts need, which is the authoring rule in `composites/scope.ts` verbatim. The root publishes `isRequired` from its **render props** rather than from its prop, so the value is the one React Aria resolved. `Checkbox` needed separate wiring because its label is inline children rather than a `Label` part; it reads `isRequired` from its own render props.

Anchors: `src/components/Field/anatomy.tsx` (`FieldLayoutProvider`, `useFieldLayout`, `FieldNecessityMarker`), `src/composites/Form/Form.tsx`, `src/composites/TextField/TextField.tsx`, `src/composites/TextArea/TextArea.tsx`, `src/components/Checkbox/Checkbox.tsx`, `tests/unit/tests/fieldLayout.test.tsx`, `INTERNAL/FORMS.md` items B1–B4.

Re-litigation answers:

- "Why not read the Form through `formScope`?" → it throws without the host, and a field without a Form is a supported case. The parts that genuinely require the host still use it.
- "Why does a standalone field mark required at all — nobody configured it?" → the marker states a fact about the field. A field that is required and does not say so is the defect.
- "Then why offer `none`?" → some products carry the convention in prose above the form, or mark the optional fields instead. That is a product call, made once, in the place that makes it once.
- "Why is the asterisk not an `Icon`?" → the registry grows when a component needs a _glyph_; this needs a character, and text also keeps the marker on the label's own type scale.
- "Why did `Checkbox` need wiring separately?" → its label is inline children, so it does not pass through the composite scope. `Switch` follows when it gets the envelope (F-033).

### ADR-026: Field formats are a named, locale-scoped registry; the invalid box is marked by a shared glyph; `TextField`/`TextArea` take the split shape

Status: accepted (2026-07-29)
Tags: forms, input, formats, a11y, anatomy

Decision, in three coupled parts (forms item H):

(1) **The format registry** (`src/components/Field/formats.ts`) is the `Icon`-intent pattern applied to input shapes: a format is named by what it is (`{locale}.{format}` — `br.cep`, `br.cpf`, `br.cnpj`, `br.phone`), grows by one entry when a real consumer needs one, and resolves everything a formatted field must declare **together** — the mask, `inputMode` (the keyboard a phone raises) and `autoComplete` — because declared separately at each call site they drift apart. `TextField` takes `format` in both authoring forms; the field runs internally controlled, the caret is restored by **digit position** (a literal the mask inserts to the caret's left cannot displace it), and backspacing over a literal deletes the digit before it — the classic masked-input trap, pinned by test. The **submitted value is the masked string**; normalization is the consumer's decision, and `formatDigits`-style stripping is one line at the boundary that owns it.

(2) **What a format deliberately does not resolve.** _Validation:_ a `validate` function returns the message the user reads, and the package ships no user-facing copy in any language (ADR-001) — so a format cannot ship the CPF/CNPJ checksum without shipping untranslated copy with it; callers own `validate`. _Currency:_ not a mask at all — grouping separators move as digits are typed, which is Intl's job, and `NumberField` already owns it (`formatOptions={{ style: 'currency', currency: 'BRL' }}`). Both were candidates for the registry and both are exclusions with a mechanism, not omissions.

(3) **The invalid box is marked by `FieldInvalidGlyph`**, one shared source in the anatomy, gated on each member's own `isInvalid` render prop. The reference names the alert icon at the _field_ level (`field-edge-to-alert-icon`, whose medium step is 12px — exactly `inset.control.md` under fsl-theme ADR-022), so it is a family adornment: `aria-hidden` (the semantics already travel twice — `aria-invalid` and the message's words; the glyph is the WCAG 1.4.1 reinforcement F-032's fix deferred here), inked with the **reporting valence** (`input.negative.text`, the same §3.2 split as the message — a part that reports the outcome, never the control re-voiced). The three members without a field box — `RadioGroup`, `CheckboxGroup`, `Switch` — are named exceptions in the class guard.

**The enabling change: `TextField` and `TextArea` moved to the split shape** (frame + borderless value, the D-item anatomy), because a glyph — and the `prefix`/`suffix` adornments item A deferred — needs a lawful home, and the alternative is the reserved-padding-and-absolute-positioning hack item D deleted from `SearchField`. Verified as behaviour-preserving in Chromium, both modes: frame 34×1200 at 1px border and 8px radius, value inset 6/12 at 16px `start`, the reading edge byte-identical to the pre-conversion baseline. `data-part="control"` stays on the element the user types into (ADR-022). The conversion surfaced a **latent drift and fixed its class**: a split member's value pinned its ink to `text.default`, so `input.primary.text.invalid` — the readable-invalid ink the theme annotates for exactly this — was read by self-painted members and silently ignored by split ones; `buildFieldValueStyle` is now flag-aware and every member resolves it. The frames also now pass `isHovered` (all three pre-existing split members had silently stopped hover-reacting while the self-painted members did — the same one-family-two-behaviours drift, closed in the same pass).

Rejected: a `type`-prop explosion (`type="cpf"` beside the HTML `type` attribute — two vocabularies on one prop name); shipping checksum validation (blocked by ADR-001, see (2)); masking via absolute positioning or `input` event DOM surgery (the D-item anti-pattern); marking the invalid box only on naturally-split members (one family, two behaviours — the drift this package exists to prevent).

Cost: `TextField`/`TextArea` gain an internal `frame` part (published attributes unchanged — additive); invariant #10's field-row baseline moved from `TextField` to the `Select` trigger (the family's remaining self-painted member); invariant #11's classification moved two members from self-painted to split.

Anchors: `src/components/Field/formats.ts`, `src/components/Field/anatomy.tsx` › `FieldInvalidGlyph` / `buildFieldValueStyle` / `buildFieldFrameStyle(multiline)`, `src/composites/TextField/TextField.tsx`, `src/composites/TextArea/TextArea.tsx`, `tests/unit/tests/fieldFormats.test.tsx`, `tests/unit/tests/fieldEnvelope.test.tsx` › "the in-control validation glyph" (injection-verified), `components.contract.test.tsx` › invariants #10/#11.

Re-litigation answers:

- "Why is the submitted value masked rather than raw digits?" → the field submits what the user sees, which is what every server-side Brazilian-format consumer already parses; a hidden raw twin doubles the FormData surface for a one-line strip at the boundary. Reverse it only with a consumer whose backend rejects masked input and cannot strip.
- "Why no `br.currency`?" → it is not a fixed pattern (see (2)); adding it to this registry would re-implement Intl badly. `NumberField` is the answer, documented in the registry header.
- "Why does the glyph not render on `RadioGroup`/`CheckboxGroup`/`Switch`?" → no field box to sit in: the groups' members mark themselves and `Switch`'s control _is_ the mark. Their message carries the valence — the named-exception rows in the class guard.

### ADR-027: The form bridge names its upstreams directly; fsl-ui takes no form-library dependency

Status: accepted (2026-08-02)
Tags: forms, integration, react-hook-form, supersedes:ADR-004, F-005

Decision: the react-hook-form recipe imports `react-hook-form`, `zod` and
`@hookform/resolvers/zod` by name. `@ttoss/forms` leaves this package entirely,
including as a devDependency.

ADR-004's substance survives untouched — the bridge is a documented recipe
living as an integration test, no adapter entry ships, and consumers wire
`Controller` by hand. What it got wrong is one line: it named `@ttoss/forms` as
"the monorepo's form standard" and therefore as the import site. That package
has a single entry which also exports the legacy `FormField*` suite, carrying
`@ttoss/ui`, `@ttoss/components` and `@ttoss/react-i18n` as peers — so an app
following the documented recipe inherited the entire legacy stack to obtain four
re-exported symbols (F-005).

**The premise also expired.** `@ttoss/forms` is legacy alongside `@ttoss/ui` and
is being discontinued (owner ruling, `INTERNAL/FORMS.md` § Ground rules), and
fsl-ui takes no form-library dependency ever. The bridge is not how fsl-ui does
validation — React Aria's native validation is the default and needs no library
at all, which is what the Studio runs on. This recipe exists for an app that
_already_ runs react-hook-form, and such an app has those packages directly.

Rejected: keep importing from `@ttoss/forms` and document the peer cost — the
cost is unavoidable at the import, not a documentation problem; add a lean
subpath (`@ttoss/forms/core`) — changes a package that is being discontinued, to
serve a re-export nobody needs once the recipe names its upstreams.
Cost: one more devDependency here (`@hookform/resolvers`), where a single
workspace import used to cover three.
Anchors: `tests/unit/tests/formsBridge.test.tsx`, `INTERNAL/FORMS.md`,
`docs/fsl-studio/FRICTION.md` F-005.

Re-litigation answers:

- "Should fsl-ui ship a react-hook-form adapter now?" → no, and less than
  before: the default path uses no form library, so an adapter would serve a
  minority integration.
- "Does this make react-hook-form a dependency of fsl-ui?" → no. It is a
  devDependency of the test that proves the recipe; the package ships no import
  of it.

### ADR-028: A part that paints no surface borrows the stratum's ink; `consequence` selects it

Status: accepted (2026-08-03)
Tags: colors, taxonomy, consequence, F-029, closes:F-029

Decision: **a part that paints no surface of its own takes its ink from the
surface it renders on, and when that part carries a valence, `consequence` is
what selects it.** Implemented once in `tokens/consequenceInk.ts`, written into
`CONTRACT.md` §3.3, and bounded three ways: the quiet rung only
(`evaluation="muted"`, which `colors.md` names as the system's idiom for "no
fill"), the `color` dimension only, and yielding to the host's own cascade at
`disabled`, `active` and `expanded`.

This is not a new idea in the system. §3.2's validation message has always read
`input.negative.text` and rendered on whatever informational surface the form
sits on; F-036 built the contrast inventory that makes such a pairing
verifiable. ADR-028 is that pattern stated as a rule and given a second family.

**The 2026-08-02 governance recommendation is retracted.** It proposed splitting
"static ink on a coloured fill" out of `{ux}.{valence}.text`, freeing the
dimension to be the standalone valence ink the loudness ladder promises. Stress-
tested against a second theme, it is circular: the ink is only static while the
fill is known, and `action.primary` (neutral.1000 light / neutral.0 dark),
`action.accent` (brand.500) and `feedback.caution` (a yellow) do not share one.
The split immediately needs per-role on-fill ink — one token per role per mode —
which is `{ux}.{role}.text` renamed, at the cost of every published Action and
Feedback label.

What shipped is the proposal's own alternatives (a) and (b), which it costed in
a line each and dismissed. Neither works alone. (b) supplies the licence, (a)
supplies the trigger. (a)'s objection — "a fourth axis on a three-axis token
path" — does not apply, because nothing is added to the path:
`informational.negative.text.default` already exists, and `consequence` is
already declared per entity, already emitted as `data-consequence`, already
driving `ConfirmationDialog`'s arming. It gains reach, not vocabulary. (b)'s
objection — "it weakens the entity→ux alignment the contract test enforces" —
was real, and is answered by making the crossing **licensed and singular**: the
read lives in one module, and the contract suite fails any component that
reaches for `informational.negative` by hand, or that emits `data-consequence`,
paints from `vars.colors.action`, and does not route its ink through that
module. `Menu.tsx` would previously have passed such a read by coincidence,
because it declares an Overlay part and the alignment test unions the contexts.

The engaged-state bound is measured, not stylistic. `action.muted` materialises
a real fill on engagement and the theme lifts its own ink to clear it — in the
dark alternate the fill is `neutral.500` and the muted ink goes pure white. A
fixed valence ink cannot follow: rest reads 10.02 light / 9.53 dark and hover
9.43 / 5.72, while the engaged fill reads **2.65**, under every floor. `disabled`
yields for a different reason — unavailability outranks valence, the same ground
WCAG 2.2 §1.4.3 exempts it on.

Enabling refactor: `resolveStateKey` is split out of `resolveInteractiveStyle`,
so "which state is the host painting" has one answer derived from
`STATE_PRIORITY` rather than two readers guessing whether `isPressed` means
`active` or `pressed`. No behaviour change.

Rejected: the static-ink split (circular, see above); a `negativeQuiet`
evaluation (grows the taxonomy for one case and reads as a variant axis the
system does not have); `action.negative.textOnSurface` (a dimension-registry
change — governance — for what an existing token already holds); tinting the
border too (the quiet rung's border mirrors its background by construction, so
this invents an outlined-destructive language and needs its own non-text
pairing); extending the tint to `secondary` (the rule is "paints no surface",
and `colors.md` gives that meaning to `muted` alone — widening later is
additive, retracting is breaking).

Cost: `consequence` is no longer colour-free, which four JSDoc blocks and
`llms.txt` asserted. Every one of them is corrected rather than left ambiguous,
because "drives mechanism, not colour" was load-bearing guidance. The rule's
surface inventory is now a thing fsl-theme must keep passing — a theme that
retunes `action.muted`'s hover fill will fail `quiet destructive control` before
it ships, which is the intent.

Anchors: `src/tokens/consequenceInk.ts`, `src/tokens/CONTRACT.md` §3.3,
`tests/unit/tests/consequenceInk.test.ts`,
`tests/unit/tests/components.contract.test.tsx` (§4c),
`packages/fsl-theme/tests/unit/tests/theme/families/colors.test.ts`
(`quiet destructive control`), `docs/fsl-studio/FRICTION.md` F-029.

Re-litigation answers:

- "Why not just let authors use `evaluation="negative"` on a menu row?" → it
  fills the row solid red. In `action` the valence **is** the filled destructive
  command; a menu row is a peer of "Duplicate" and "Rename". Both shapes are
  real and the system now expresses both.
- "Does this mean `consequence` is a colour prop?" → no. It carries colour in
  exactly one case, on the one rung that has no surface to carry it. On every
  filled rung the fill is the voice and `evaluation` owns it.
- "Why does the tint disappear when I press the row?" → the quiet rung paints a
  real fill there and the theme raises its own ink to clear it; the valence ink
  measures 2.65:1 against that fill. The press lasts a moment and the row is
  already tinted at rest and on hover.
- "Can a Structure or Feedback part use this?" → not today. The helper is scoped
  to parts that read `vars.colors.action`, because that is where the evidence
  is. A second family needs a consumer and its own inventory entry.

### ADR-029: The consequence ink moves to the cross-cutting token; the licensed crossing retires

Status: accepted (2026-08-04)
Tags: colors, consequence, cross-cutting, refines:ADR-028, fsl-theme ADR-025

Decision: `resolveConsequenceInk` reads `vars.consequence.destructive.ink` —
the cross-cutting token fsl-theme ADR-025 mints under model.md §6 — instead of
`vars.colors.informational.negative.text.default`. Everything behavioural in
ADR-028 stands unchanged: the rule ("a part that paints no surface takes its
ink from the surface it renders on; `consequence` selects it"), the bounds (the
quiet rung, `color` only, yielding at `disabled`/`active`/`expanded`), the
measurements, the consumers, the retraction of the static-ink split. What
changes is the **address** of the ink, and with it the one cost ADR-028
conceded without an answer.

ADR-028 answered the entity→ux objection by making the crossing licensed and
singular. That was the right mitigation and the wrong final state: model.md §6
already provides the mechanism for exactly this question — "a system-wide
default that no `{ux}` owns" — with the focus ring as the typed precedent, and
the ring is this ink's structural twin (both render against the stratum, not a
fill; that is why one system-wide colour serves). Read through §6, the day-old
"unprecedented cross-ux read" was a cross-cutting token that hadn't been minted
yet. Minting it means the §1 alignment goes back to zero exceptions, the
contract test's job simplifies from "keep the crossing singular" to "keep the
conditional read inside the helper that owns its bounds", and a theme can
retune the destructive ink without touching validation messages (the base alias
keeps them identical by default).

Resolved values are byte-identical in both modes and both bundles — the token
aliases the exact source the helper read before — so no visual change, no
measurement invalidated, no Studio or story edit. fsl-theme's `quiet
destructive control` inventory now pairs the token itself, auditing what
components actually render even after a theme repoints the alias.

Rejected: leaving ADR-028's read in place (guarded, but spends a constitutional
exception the model prices at one registered token); widening component access
to `vars.consequence.*` (the read stays confined to the helper — unlike the
ring it is conditional, and the bounds live where the condition does).

Cost: none at the component surface; fsl-ui's floor version of `@ttoss/fsl-theme`
must include the token, which the workspace guarantees and the `vars` typing
enforces at compile time.

Anchors: `src/tokens/consequenceInk.ts`, `src/tokens/CONTRACT.md` §1
(cross-cutting table) + §3.3, `tests/unit/tests/components.contract.test.tsx`
(§4c), fsl-theme ADR-025, model.md §6, colors.md § Cross-cutting.

Re-litigation answers:

- "Is this a behaviour change?" → no. Same resolved hex in every mode and
  bundle; only the CSS custom property a component emits changes
  (`--tt-consequence-destructive-ink`). Hosts targeting the old var name in
  overrides were targeting a token no component documented reading.
- "Why keep the helper if the token is now lawful to read?" → the ring is
  unconditional; this ink is not. The helper owns the rung and the yield set,
  and §4c fails any component that reads the token directly.

### ADR-030: The surface contract — hosts publish what they paint; the quiet rung follows at rest

Status: accepted (2026-08-04)
Tags: colors, surfaces, F-024, CONTRACT §3.4, closes:F-024

Decision: the element that paints a **hosting surface** publishes it on
`--fsl-surface` (`publishSurface(fill)` — the fill plus its publication), and
the quiet rung's resting `background`/`border` read
`var(--fsl-surface, <own token>)` (`resolveSurfaceBoundStyle`). Outside a
publisher nothing changes — the fallback is the exact value the rung painted
before. Inside one, the control borrows the real composite the cascade
produced, which is always one of the opaque values fsl-theme audits.

The owner ruling (2026-07-29) is kept whole, not relaxed: a component always
paints; no `transparent`; no omitted background; every declared token stays an
auditable hex; the theme's own `muted.text ↔ background` pairs stay in the
suite untouched. What the ruling called the lawful fix — "a stratum-aware
opaque value" — turned out to be impossible to mint **in the theme**, by the
theme's own doctrine: `colors.md` § Stacking pays depth in `elevation.tonal.*`
over one shared background token, so the effective surface is a composite "no
colour token names or can name" (F-024's 2026-07-29 analysis). And the
consumer that finally fired shows the class is wider than tonal strata anyway:
the Studio's table row paints `input.primary` — another family's fill — under
the quiet `Remove`. Only the painter knows the surface. So the stratum-aware
value lives where the knowledge lives: published by the painter, consumed by
the rung, opaque end to end.

Bounds, each load-bearing:

- **Resting state only.** Engaged fills are how a quiet control materialises;
  they stay absolute.
- **The muted rung only.** Every other rung's fill is its voice.
- **A publisher's transient states do not republish.** The first draft had
  rows publish whatever fill the render resolved — elegant, and the inventory
  killed it: the dark row hover fill measures 2.65:1 against the destructive
  ink. A row paints its resolved fill and publishes its resting one (spread
  order does the work).
- **Selection fills never publish.** A selected row inverts to near-white in
  dark, where the muted ink measures 1.5–1.8:1 — seeded into the inventory as
  a mutation and caught. A quiet control on a selected row keeps its own
  legible pill (today's rendering).
- **Voiced fills never publish.** A toast's red, and a Menu's or Box's
  non-primary informational fill, are voices — the dark muted fill fails the
  destructive ink's floor. Only the page-like `primary` voice and Surface's
  tonal strata publish.

`--fsl-surface` deliberately sits in the §7 host-facing namespace: a host
application that paints its own panel publishes the same property and every
quiet control inside follows, with no fsl-ui change.

Guards: fsl-theme's cross-role inventory gains `quiet control on published
surfaces` — the quiet ink against every publishable surface (the
informational strata and the row family's resting fill), at the rung's own
floor, per bundle and per mode — and the destructive-ink entry gains the row
surface for the same reason.
fsl-ui's `surfaceScope` suite pins both halves: publishers publish what they
painted, consumers read the var at rest and their own fills everywhere else.

Rejected: minting the value in the theme (cannot be expressed — see above);
`transparent` or omission (the ruling, twice over); publishing from Feedback
fills and selection fills (measured illegible — the exclusions are the design);
re-scoping the `--tt-colors-action-muted-*` theme variables per subtree (a
component doing the theme's job, N variables where one property suffices, and
`--tt-` fallbacks are forbidden by contract test); extending the ink to follow
the surface as well (an ink needs a _pairing_, not a variable — the inventory
is what makes the fill-follow lawful, and no equivalent exists for arbitrary
host inks).

Cost: `Surface` and painted `Box` now emit `backgroundColor` + the property
where they emitted a `background` shorthand — behaviour-identical, assert-
visible. The publisher list is a convention future surface components must
join (CONTRACT §3.4 states it; the surfaceScope suite holds the ones that
exist). The known limit stays known: on a mid-tone host surface the rung's
absolute hover fill can coincide with the host (dark row hover), where hover
feedback is carried by the cursor and the press step — unchanged from before.

Anchors: `src/tokens/surfaceScope.ts`, CONTRACT §3.4,
`tests/unit/tests/surfaceScope.test.tsx`, fsl-theme `colors.test.ts`
(`quiet control on published surfaces`), `docs/fsl-studio/FRICTION.md` F-024.

Re-litigation answers:

- "Why does the quiet control still show a pill on a selected row?" → because
  the alternative is worse and measured: the selection fill inverts, the muted
  ink fails against it, and an illegible control is a worse outcome than a
  visible chip. The selection fill is a voice.
- "Can a host make its own panel behave like a stratum?" → yes — publish
  `--fsl-surface: <your fill>` on the panel. That is why the property lives in
  the host-facing namespace.
- "Why not follow the surface on hover too?" → the hover fill is the rung
  _materialising_ — the affordance itself. Following the surface there would
  make a quiet control permanently invisible.

### ADR-031: The two kinds of surface — occluding and embedded — and what each owes

Status: accepted (2026-08-04)
Tags: colors, spacing, overlay, P3, F-044, F-045, F-046, F-047, closes:F-044, closes:F-045, closes:F-046, closes:F-047

Decision: the package distinguishes a surface that **covers content** from one
that sits **in the flow**, and the distinction drives three things — the edge,
the padding, and the size envelope (CONTRACT §3.5, and §3.4's companion step).

|         | Occluding                                                                                                            | Embedded                                 |
| ------- | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| Members | popover, menu, tooltip, dialog panel, drawer panel, toast                                                            | `Surface`, `Box`, dividers, field frames |
| Edge    | `vars.overlay.outline` via `OCCLUDING_OUTLINE`                                                                       | `{ux}.{role}.border.*`, unchanged        |
| Padding | `inset.surface.xs` (fixed, anchored) — except `Dialog` and `Toast`, which frame prose rather than rows and keep `md` | `inset.surface.{sm,md,lg}` (fluid)       |
| Size    | a floor as well as a ceiling                                                                                         | caller-chosen                            |

**The root cause behind all four findings is one sentence: `elevation` is the
only family that knows a surface floats.** Every other family treats "surface"
as one thing, so an occluding surface inherited an embedded one's hairline
(F-044), its page-scaled and fluid padding (F-045), and had no shared notion of
a size envelope at all, which is why each component invented its own literals
(F-046, F-047).

What each finding cost, measured rather than argued:

- **F-044** — an overlay's fill is byte-identical to the page by design, and its
  only edge read **1.31:1 light / 1.67:1 dark** against that page, while
  `colors.md` § Stacking assigns exactly that edge a ≥3:1 duty _"even when
  shadow is suppressed (high-contrast preferences, print)"_. Under
  `forced-colors` a menu was an unbounded rectangle of page-coloured text. The
  fix is a cross-cutting token (fsl-theme ADR-027), not a retune of every
  `informational` edge — and it costs nothing that existed: all three
  informational roles resolved the _same_ border value in both modes, so
  `evaluation` never varied an overlay's edge.
- **F-045** — the menu's gutter was 24px around fixed 32px rows (34% of the
  surface's height); after, 6px and 13%, and the surface fell 146px → 110px for
  the same three rows. The mechanism half is ADR-022's own ruling one scale out:
  the gutter moved 16 → 24px across viewports while every row stayed 32.0px.
- **F-046** — `Dialog` had a max width and height and no minimum, so a short
  confirm collapsed to its content and the action row became the widest thing
  in it. `--fsl-dialog-min-width` now ships beside the two knobs it pairs with,
  defaulting to the reference's 288px.
- **F-047** — `Tooltip` capped at 280px against a 160px desktop reference. It
  takes **200px**, the reference's mobile value, because our label type is a
  step larger than theirs, so the same phrase needs the wider of their two
  numbers to hold the same line count.

Guarded by `tests/unit/tests/occludingSurface.test.tsx`, which pins **both**
sides of the discriminant: every occluding surface reads the boundary, and an
embedded one does not. Without the second half, "put the boundary everywhere"
would pass — and that is exactly the theme-wide retune this contract exists to
avoid.

Verified in Chromium off the fsl Storybook, both modes: menu 192×110 with a
`rgb(111,111,111)` boundary in light and `rgb(208,208,208)` in dark, tooltip a
bounded hint chip instead of a white slab, Dialog unchanged at its `md` inset.

Rejected: a `size` prop on the overlays (CONTRACT §4 — a different envelope is
a different semantic identity, and these are the same one); per-component
boundary colours (the boundary is infrastructure, one system colour, like the
ring); giving `Tooltip` `inset.control.md` on the inline axis to match the
reference's 6/12 pair (an entity-row violation — Overlay's §1 row is
`inset.surface`, and the reference's own anchored padding is uniform anyway).

Cost: the six occluding components stop reading their role's border. That is a
visible change (the edge is now defined rather than nearly invisible) and it is
the point; nothing about the `evaluation` prop's other duties moves.

Anchors: `src/tokens/occludingSurface.ts`, `src/tokens/CONTRACT.md` §3.5 + §1
cross-cutting table, `tests/unit/tests/occludingSurface.test.tsx`, fsl-theme
ADR-027, `docs/fsl-studio/FRICTION.md` F-044…F-047.

Re-litigation answers:

- "Should `Surface level="overlay"` take the boundary?" → no, and that is the
  discriminant working: `Surface` is the embedded primitive. A host that wants
  a floating panel composes `Popover`/`Drawer`, which occlude by construction.
- "Why does the Dialog keep 36px?" → it frames prose and a title, not rows. The
  anchored step is for a gutter beside children that carry their own inset.
- "What about the overlays painting the flat stratum's fill?" → real, separate,
  and filed as F-048: `Surface` reads `elevation.tonal.*` and no overlay does,
  so two components claiming the same stratum paint different colours in dark.
  It cannot close F-044 (1.67:1 at best) and it changes what `evaluation` drives
  on an Overlay, so it is its own decision.

**Addendum 2026-08-06 — F-054 closed, `Toast` named as a second `md`
exception.** F-054 filed two things together, both this table's own
contradiction: `Toast` reads `inset.surface.md` while this table's original
text named `Dialog` as the sole exception, with `Toast` still listed among
the plain `xs` members. Measured in Chromium: forcing `ToastRegion` to the
reference's desktop `toast-maximum-width` (336px) wraps a real description
("Check the build log for details.") from one line to two — the same
type-runs-a-step-larger relationship F-021/F-047 already established, now
verified for Toast's own copy. So both halves close the same way: the code
was right and the table was incomplete. `Toast` frames a title + description
the way `Dialog` frames prose — neither is a row-framer — and the table above
now says so. `TOAST_REGION_MAX_WIDTH` stays `420px` at every viewport,
deliberately, with the wrap measurement recorded next to the constant.

### ADR-032: The Overlay family's behaviour is a published promise, so it is pinned as wiring; modality is asserted as reachability, not as `aria-modal`

Status: accepted (2026-08-05)
Tags: a11y, overlay, behaviour, P3, review-round-2, F-049

Decision: the Overlay family's **behavioural** contract — dismiss semantics,
focus containment, and the APG contract each role publishes — is guarded by
`tests/unit/tests/overlayBehaviour.test.tsx`, which asserts the _wiring_ our
composites own rather than React Aria's correctness, and asserts **modality as
whether outside content is still reachable by assistive technology** rather than
as the presence of `aria-modal`.

Round 2 of the P3 component review measured this half and **found no defect**:
every member already holds its promise. That is the reason the file exists. Each
component's JSDoc tells a consumer the surface dismisses, contains focus, or
never takes it, and until now nothing failed if a refactor took that away —
the same class as the geometry promises Round 1 found unguarded, one dimension
over. A behavioural contract nobody can break by accident is not a contract; it
is a coincidence that currently holds.

What only this suite pins, member by member:

| Contract                                          | Members                             | The regression it catches                                                   |
| ------------------------------------------------- | ----------------------------------- | --------------------------------------------------------------------------- |
| Outside content leaves the accessibility tree     | Menu, DialogModal, Drawer, Popover  | a surface handed `isNonModal`, or a portal swapped in for `ModalOverlay`    |
| Escape dismisses and focus returns to the trigger | Drawer, Popover, ConfirmationDialog | the three members `keyboard.test.tsx` never reached                         |
| An outside press light-dismisses                  | Popover                             | a `Popover` that starts behaving like a modal prompt                        |
| Tab cycles inside the surface                     | Popover                             | focus escaping into a page the reader can no longer see                     |
| Dismissal never commits the effect                | ConfirmationDialog                  | an abandoned destructive confirmation that fires `onConfirm` anyway         |
| `aria-controls` resolves to the menu itself       | Menu                                | the trigger pointing at the surface wrapper instead of the list (see F-049) |
| The surface's name resolves to rendered text      | Dialog, Drawer                      | a dangling `aria-labelledby`, which an attribute assertion cannot see       |
| The hint describes its trigger and is no tab stop | Tooltip                             | interactive content migrating into a surface that cannot be reached         |

**Modality is asserted as reachability because no member carries `aria-modal`.**
React Aria hides the rest of the tree with `ariaHideOutside` instead, which is
the more robust mechanism and the one the reference ships. A contributor reading
APG will look for `aria-modal`, not find it, and "fix" it; the assertion is
written so that the _outcome_ is pinned and the mechanism stays upstream's to
choose. This is the unstated invariant the round's measurement surfaced.

Three discriminants are asserted from the other side, as in ADR-031's guard: a
Tooltip must **not** blank the page, a modal prompt must **not** light-dismiss,
and a Tooltip must **never** hold focus. Without them, "make every overlay modal
and dismissable" would pass, which is the family-wide flattening this avoids.

Rejected: asserting `aria-modal` (fails on a correct implementation — see
above); a per-component behaviour test per member (the contract is a family
relation, and eight files would restate the same setup and hide which member
diverged); publishing the behavioural contract in `CONTRACT.md` (§1–§7 are the
token contract; behaviour has no token to name, and the suite is the readable
statement of it).

Cost: one more integration suite on real timers (+17 tests, ~4s) and a second
place — beside `keyboard.test.tsx` — where an Overlay interaction may be
asserted. The boundary between them is stated in the suite header: `keyboard`
owns key-by-key navigation within a member, `overlayBehaviour` owns the family
relation and the discriminants.

Anchors: `tests/unit/tests/overlayBehaviour.test.tsx`,
`tests/unit/tests/keyboard.test.tsx`, `docs/fsl-studio/FRICTION.md` F-049,
`INTERNAL/ROADMAP.md` §P3 round 2.

Re-litigation answers:

- "Our dialogs are missing `aria-modal` — bug?" → no. Outside content is hidden
  with `aria-hidden`; the suite pins that outcome. Adding `aria-modal` on top
  duplicates the guarantee and reintroduces the VoiceOver bugs upstream avoids.
- "Why does a Menu popover announce as a dialog?" → upstream default (RAC 1.19
  renders `role="dialog"` on any popover not marked `isNonModal`), matched by the
  reference. F-049 records it with a readmission criterion.
- "Should `keyboard.test.tsx` absorb this?" → no. That suite is per-member key
  handling; this one is the family relation, and its discriminants only make
  sense read together.

### ADR-033: A rail is one silhouette in `src/tokens/rail.ts`, and its fill is the entity's quiet **surface** — not its border

Status: accepted (2026-08-05)
Tags: colors, spacing, feedback, input, P3, review-round-3, F-050, F-051, F-052, closes:F-050

Decision: the thin pill track a value travels along — `ProgressBar`'s activity
bar, `Meter`'s level bar, `Slider`'s range track — is stated once in
`src/tokens/rail.ts` (`TRACK_RAIL`, `RAIL_BASE`, `FEEDBACK_RAIL_FILL`), and the
two `Feedback` rails read `feedback.muted.background.default` rather than
`feedback.muted.border.default`.

**The colour half fixed a blocker.** The rail read the entity's quiet _border_,
which the dark alternate remaps **lighter** — correct for an edge on a dark
canvas — landing on `neutral.500`, which is also
`feedback.primary.background.default` in dark. Measured **1.00:1**:
`<ProgressBar evaluation="primary" value={40} />` painted a uniform grey rail
with no visible fill, in both the base and `bruttal` bundles. Only the
achromatic evaluation was affected, and that asymmetry is the finding's own
evidence: the other four fills sit at 1.02–1.04:1 against the old rail and stay
perfectly legible, because a contrast ratio measures luminance and they differ
in hue. `primary` is the one evaluation where luminance is the only channel.

So the rule pinned is **identity, not contrast**. How much a fill must differ
from its rail is a design judgement the reference itself does not hold
uniformly (its own dark accent-on-track measures 2.56:1), but a fill that
resolves to the rail's own value renders nothing, in any theme.

**Reuse, not growth.** `feedback.muted.background` is what both the family docs
and `baseTheme`'s own `feedback` comment already called the rail — _"`muted`
stays a tinted neutral surface — the rail/track color for Feedback fills
(ProgressBar, Meter)"_. The code had diverged from a ruling written in two
places, which `CLAUDE.md`'s own rule says to read before deciding anything. Dark
lands on `neutral.700` (`#3d3d3d`), four units off the reference's dark track
(`rgb(57,57,57)`), and the reference confirms the direction: a rail **darkens**
in dark while a border lightens.

**The geometry half retires three copies of one ruling.** P3 slice 3 decided
"three rails, one answer" and the answer was then written out three times in two
units — `'6px'` in `ProgressBar`, `'6px'` in `Meter`, `'0.375rem'` in `Slider`.
`TRACK_RAIL.thickness` is now the single source. `TRACK_RAIL.minWidth` adds the
floor the reference sets (48px) and we had none of: a rail is `width: 100%`, so
in a narrow cell it collapsed toward zero while the component still rendered —
F-046's shape one family over. The 768px **ceiling** was deliberately not taken;
it is authorial, it needs a default width to pair with, and F-052 records it.

`RAIL_BASE` is shared by the two `Feedback` rails only, and the guard asserts
why: it clips its fill to the pill, which is right for a bar and wrong for
`Slider`, whose thumb overflows the rail on purpose. `Slider` takes the
thickness and nothing else — its rail colour is still a borrow
(`input.primary.background.disabled`, a _state_ standing in for a _part_), which
is F-051's open half.

Guarded twice, because the two claims live in different packages. fsl-ui
`rail.test.tsx` pins **which token** each part reads, from both sides — the
quiet surface is read and the quiet border is not — since asserting only the
first would let a refactor reach the border by another path. fsl-theme's colour
suite pins **the values differ**, which only resolved tokens can see: no
`feedback` role's resting fill may equal the rail, in every mode of every
bundle. That guard was verified to fail on injection, reproducing the shipped
defect verbatim (`feedback.primary.background.default == rail (#6f6f6f)`) in
both bundles' dark alternate.

Rejected: a dedicated rail token now (F-051's option (a) — it is the right end
state and the analysis is written, but nothing about it is urgent once the
user-visible half is closed and guarded, and it changes fsl-theme's published
surface); retuning the dark alternate's `feedback.primary.background`
(`neutral.500` is deliberate there — the filled neutral chip must stand off the
dark strata, with a documented 5.0:1 against its own ink, and `Badge`/
`StatusLight` read it); a contrast threshold on the fill/rail pair (the
reference does not hold one, and a bar's value is also published as text).

Cost: in light the rail is quieter than the reference's — **1.14:1** against the
page versus their 1.40:1 — so a bar's total extent reads more faintly than
before. That is the half a dedicated address would recover, and it is stated in
F-050 rather than absorbed.

Anchors: `src/tokens/rail.ts`, `tests/unit/tests/rail.test.tsx`,
`packages/fsl-theme/tests/unit/tests/theme/families/colors.test.ts`
(§"a Feedback fill differs from the rail behind it"),
`docs/fsl-studio/FRICTION.md` F-050…F-052, `INTERNAL/ROADMAP.md` §P3 round 3.

Re-litigation answers:

- "Why not give the rail its own token?" → it should have one; F-051 costs the
  options and recommends it at the version boundary. The reuse closes the
  defect today without changing another package's public surface.
- "The other four fills measured ~1.03:1 too — why were they fine?" → hue.
  Contrast ratio is luminance-only, so it understates a chromatic pair. The
  screenshots are in the round entry; only `primary` was invisible.
- "Should `Slider` spread `RAIL_BASE`?" → no, and the guard says so: the base
  clips, and the Slider thumb must overflow its rail.

### ADR-034: A Collection row's resting fill borrows the container's colour, not its own entity's idiom

Status: accepted (2026-08-06)
Tags: colors, collection, selection, P3, review-round-4, F-055, closes:F-055

Decision: `GridListItem`, `ListBoxItem` and `TableRow` — the three Selection
entities ADR-007 splits out of a Collection container — read their resting
background through `resolveCollectionRowBackground` (`src/tokens/collectionRow.ts`),
which overrides only the `default` key of `input.primary.background` with the
hosting container's own resolved background before running the state cascade.
Hover, active, selected and checked keep exactly the values they had — only
the row's rest state changes, from the entity's own idiom to the container's.

**The finding.** All three called `resolveInteractiveStyle(c?.background, flags)`
with `c = vars.colors.input.primary`; with every flag `false` at rest that
returns `input.primary.background.default` unconditionally. Measured in
Chromium, both modes: in light that value is `core.colors.neutral.0`, byte-
identical to the container's `informational.primary.background.default` — the
row read flush against its container, correctly, and correctly by luck. The
dark alternate remaps `input.primary.background.default` to `neutral.700` (a
text field's filled-box look) while the container stays `neutral.900` — every
row in `GridList`/`ListBox`/`Table` rendered a solid lighter block, at rest,
with no hover or selection. The reference has no "row background, resting"
token — `table-row-hover-color`/`-opacity` and `table-selected-row-background-*`
exist; nothing for the unselected, unhovered state, because rows are
transparent at rest by construction there.

**Why not the `MenuItem`/ADR-015 fix.** That defect was identical in shape —
a row painted a filled default it should not have — and closed by moving
`MenuItem`'s default `evaluation` from `primary` to `muted`, because
`action.muted.background.default` happens to equal the popover's own fill in
both modes. `Selection` has no `evaluation` dimension to swap
(`ENTITY_EVALUATION.Selection = []`, CONTRIBUTING §1), and no `input.*` role's
`default` matches `informational.primary.background`'s dark value either —
checked, this is F-051's shape one family over: the model has no address for
"the container's own colour, read from inside an item that belongs to a
different entity."

**The fix is composition, not a new token.** The container's background is
already in scope at every call site — the root component (`GridList`,
`ListBox`, `Table`) reads the identical token to publish its own surface via
`publishSurface`, and the item components now read the same static token
directly. `resolveCollectionRowBackground` is the one place that override
happens, so a future Collection member composes it instead of re-deriving the
rule. `publishSurface`'s own call at each row moved from the item's own
`c?.background?.default` to `containerBackground` to match — the published
value must be what actually renders, per CONTRACT §3.4.

Guarded from both sides in `tests/unit/tests/collectionRow.test.tsx`: the
resting read matches the container, and the entity's own `default` is
asserted **not** reached — without the second half, a refactor that
reintroduced `c?.background?.default` at rest would pass the first assertion
by coincidence in light and still be wrong in dark.

Verified in Chromium: `Table`'s dark row fill went from `rgb(61,61,61)` to
`rgb(22,22,22)` on its `rgb(22,22,22)` container; `GridList`/`ListBox` the
same. Screenshotted both modes: rows sit flush against the surface at rest,
the `checked` white pill and hover tint are unchanged.

Rejected: a dedicated `semantic.rail`-style cross-cutting token for "no fill
inside an Overlay's/Collection's own item" (F-051's own recommendation is
already the registered analogue for the rail; this defect closes with data
already in scope, so a new registration is not the minimal fix — revisit
together with F-051 at the version boundary if a third shape needing the same
address turns up); giving `Selection` an `evaluation` dimension solely to
reach `muted` (nominal vocabulary growth for a mechanism `resolveCollectionRowBackground`
already provides without it — the evidence rule); leaving it — the dark
defect is real and visible, not a taste judgement call.

Anchors: `src/tokens/collectionRow.ts`, `src/components/GridList/GridList.tsx`,
`src/components/ListBox/ListBox.tsx`, `src/components/Table/Table.tsx`,
`tests/unit/tests/collectionRow.test.tsx`, `docs/fsl-studio/FRICTION.md` F-055,
`INTERNAL/ROADMAP.md` §P3 round 4.

Re-litigation answers:

- "Isn't this the same fix as ADR-015?" → same defect shape, different
  mechanism. ADR-015 swapped which role's colours the row reads by changing
  an `evaluation` prop that exists on `Action`. `Selection` has no such prop,
  so the override happens once, inside the cascade, at the one key that was
  wrong.
- "Why not add a `Selection` `muted` idiom instead?" → there is no consumer
  demanding a second Selection appearance — the row still reads
  `input.primary` for every non-resting state. Only the resting key was wrong.
- "Does this contradict `muted` being the system's 'no fill' idiom?" → no —
  it implements the same idiom (rest = the surface's own colour) by the only
  mechanism available to an entity that carries no emphasis dimension.

### ADR-035: P3 review round 7 (Structure) — one component-by-component pass across 18+ members, one filed finding, zero code changes

Status: accepted (2026-08-06)
Tags: P3, review-round-7, structure, F-057

Decision: round 7 covered the Structure entity's full published surface —
`AppShell`, `Badge`, `Box`, `ButtonGroup`, `Code`, `Container`, `Grid`,
`Group`, `Heading`, `Icon`, `List`, `Separator`, `Stack`, `Surface`, `Text`,
`Toolbar`, `Wizard`, the `Tabs` panel and the `Form` field-row — against the
same instrument as rounds 1/3/4: `@adobe/spectrum-tokens@14.15.0` flattened
to resolved values, and a Chromium probe over the fsl Storybook at
390/640/900/1280/1920, both modes, dumping every `[data-part]`'s box and
colour. This is the largest round by member count and the one with the
fewest defects: every member but one measured clean, several because prior
rounds' fixes already reach them (`Box`/`Container`/`Group`/`Toolbar` publish
or read `publishSurface`; the `Tabs` panel and `Code` were already named
"right" in ADR-031's own inset audit; `List` shipped this session cycle with
no colour opinion to be wrong about).

**The one finding — F-057, `Surface`'s elevated boundary — is filed, not
fixed, and the attempted-and-reverted repair is itself the evidence worth
keeping.** `Surface`'s edge reads a fixed `informational.{evaluation}.border.default`
regardless of `level`; its fill reads `elevation.tonal[level]`. In the dark
alternate, `overlay` and `blocking` both resolve `tonal` to `neutral.700`,
which is _also_ the dark value of every `informational.*.border.default` —
so the boundary and the fill are byte-identical at exactly the two highest
strata. Measured in Chromium, `structure-surface--levels`, dark: **1.00:1**
border-vs-fill at `overlay` and `blocking`; `raised`/`flat` unaffected. Light
is unaffected too — every tonal level shares `neutral.0` there by design (the
theme's own comment: elevation is carried by shadow in light).

**Why it was not fixed here, stated as a measurement rather than a refusal.**
The direct repair — extend the dark ramp to three distinct, progressively
lighter steps (`raised: 800, overlay: 600, blocking: 500`, continuing the
direction `baseTheme.ts`'s own comment already states) — was implemented,
guarded (`elevation.test.ts` gained a "tonal ramp never lands on the
informational border step" assertion, verified to fail on the pre-fix
values), and then **reverted**: it passes that guard and breaks three
unrelated cross-role legibility pairings in `colors.test.ts` ("validation
message", "focus ring", "quiet destructive control" legible on every
informational stratum) in both bundles — measured **4.12:1** against the new
`neutral.600` overlay step and **2.65:1** against `neutral.500` blocking,
both under those pairings' 4.5:1 floor. Those inks are tuned against
`neutral.700` specifically; lightening the fill to clear the border
collision moves it further from the value the ink contract depends on. No
single existing ramp step satisfies both contracts for both strata at once.

**This is F-051's shape, one family over, and is documented as such rather
than re-argued from scratch.** F-051 found the rail borrowing a token whose
meaning was something else because the model has no dedicated address for
"the unfilled part of a track". F-057 finds `Surface`'s elevated boundary
borrowing the _flat card's_ edge token — never designed to track a rising
tonal fill — for the identical reason: no address exists for "the boundary
of a surface at a tonal depth". Costed options and the recommendation
(a cross-cutting `semantic.elevation.edge.*`, sibling of `tonal`, at the
version boundary) are in `docs/fsl-studio/FRICTION.md` F-057, not repeated
here.

**Method note, since the failed repair is the round's most useful output.**
"Instrument first" cuts both ways: the same discipline that writes the guard
before the value also means testing the value against _every_ guard it could
plausibly touch before calling a fix minimal. A change that satisfies the
suite it was written for and silently fails a suite three files away is not
a smaller version of the right fix — it is evidence that the two suites are
guarding a genuine tension in the model, which is exactly what got written
down instead of shipped.

No source files changed; `pnpm run test` (fsl-ui, unaffected) and fsl-theme's
full suite (1228/1228, after the revert) both green, coverage unchanged on
both packages.

Anchors: `docs/fsl-studio/FRICTION.md` F-057, F-051, F-048; `INTERNAL/ROADMAP.md`
§P3 round 7; `packages/fsl-theme/tests/unit/tests/theme/families/elevation.test.ts`
(guard written and reverted, per the finding above — the _shape_ of the guard
this fix needs is recorded in F-057's entry for whoever builds the cross-
cutting token); `packages/fsl-theme/tests/unit/tests/theme/families/colors.test.ts`
("Color contrast — cross-role text pairings").

Re-litigation answers:

- "Why file a finding with no guard, unlike every prior round?" → a guard
  for a value that does not exist yet has nothing to pin. The guard this
  needs is the one written and reverted here (assert no tonal stratum equals
  the informational border step) — it belongs beside whichever token
  F-057's (a) ships, not as a standing assertion against values known not to
  satisfy it.
- "Does the reverted commit's diff exist anywhere?" → no — reverted in the
  same working session before any commit, per the instrument-before-value
  rule: the numbers it produced are preserved in F-057 and here, which is
  the artefact that matters, not the rejected diff.
