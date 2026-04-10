# ui2 — Review: State of the Art Assessment

> **Objective**: Define what needs to be built, changed, or killed to make ui2 a genuine game-changer — not a sophisticated prototype. Brutally honest. No fake progress.

---

## Over-engineering, redundancy, and simplification

This section was added after a critical analysis of whether ui2 is more complex than it needs to be, and whether redundancies exist within ui2 and between ui2 and theme-v2.

**Verdict: Yes. Significant over-engineering and redundancy exist.**

### R-01 — The resolver re-invents what theme-v2 `vars` already provides

**The redundancy:** theme-v2 exports `vars` from `@ttoss/theme2/vars` — a deeply-typed, autocomplete-enabled map of ALL semantic tokens as `var(--tt-*)` references. Example:

```typescript
import { vars } from '@ttoss/theme2/vars';
vars.colors.action.primary.background.default
// → 'var(--tt-colors-action-primary-background-default)'
```

The resolver's `colorVarRef()` function manually reconstructs the exact same string: `var(--tt-colors-${ux}-${role}-${dim}-${state})`. There is a "drift guard" test (test #7) that verifies resolver output matches theme-v2's `toCssVarName()` output. **The existence of the drift guard test is the proof that the code is duplicated — if they must agree, why have two implementations?**

**Actual value the resolver adds beyond `vars`:**
1. `RESPONSIBILITY_UX_MAP` — maps `'Action'` → `'action'` (so you don't hardcode the ux segment)
2. `CONSEQUENCE_ROLE_OVERRIDE` — maps `'destructive'` → `'negative'` (auto-fallback)
3. State set filtering — only emits states valid for the ux context

These three capabilities are real and valuable. But they can be implemented as a thin lookup layer that reads from `vars` instead of re-deriving the var names from scratch.

**What changes:** Make the resolver a thin adapter over `vars`, not a var-name generator. This means `@ttoss/theme2` moves from `devDependencies` to `peerDependencies` — which it should be anyway, since any app using ui2 already needs theme-v2 for the CSS vars.

---

### R-02 — Every component injects 21–27 CSS vars into `style`, CSS uses 2–9

**Measured:**

| Component | Vars injected | Vars used by CSS | Waste |
|---|---|---|---|
| Button | 27 | 9 | 18 (67%) |
| Input | 27 + 4 invalid | 12 | 19 (61%) |
| Label | 21 | 2 (`--_text`, `--_text-disabled`) | 19 (90%) |
| HelperText | 21 | 2 | 19 (90%) |
| ValidationMessage | 21 | 1 (`--_text`) | 20 (95%) |

The resolver emits ALL states for ALL 3 dimensions for the ux context. Button gets `selected`, `droptarget`, `pressed`, `expanded` for `background`, `border`, AND `text` — none of which Button uses. Label gets 7 states × 3 dimensions = 21 vars, but only uses text default + text disabled.

**Why it matters:** Every render of every component instance writes 20+ unused CSS custom properties to the DOM. For a form with 10 TextFields (each containing Label + Input + HelperText + ValidationMessage = 4 components), that's 40 component instances × ~20 wasted vars = **800 unused inline style declarations per form render.** DevTools inspection becomes noisy. Style serialization is heavier than necessary.

**Root cause:** `resolveTokens()` treats every component as if it might use all dimensions and all states. It optimizes for generality over precision. `toScopeVars()` blindly flattens everything.

**Fix:** Either (a) let components specify which dimensions they need (`toScopeVars(colors, { dimensions: ['text'] })` for Label), or (b) accept the overhead as an intentional design trade-off. Option (a) is simple — 3 lines of filtering in `toScopeVars()`. But the deeper question is: if Label only needs one var, does it need the resolver at all? (see R-04)

---

### R-03 — `taxonomy.ts` has ~130 lines of V1-unused vocabulary

**Dead code inventory:**
- `HOSTS`, `Host`, `RoleOf<H>`, `HostRole` — compositional vocabulary (HOSTS const, 4 types, union type). **Zero usage** in any component. Resolver explicitly says "V1 deferred." ~50 lines.
- `ActionSetRole`, `FieldFrameRole`, `ItemFrameRole`, `SurfaceFrameRole` — convenience types. **Zero usage.** ~10 lines.
- `BEHAVIORAL_CLASS`, `BehavioralClass` type — maps Responsibility → CSS behavioral class. Defined, exported, tested, **used nowhere in components or CSS**. The `@layer ui2.behavioral` targets `[data-scope]` directly — it doesn't use BehavioralClass at all. ~20 lines + tests.
- `CONSEQUENCES` const (vs `Consequence` type) — the const is exported but only used in taxonomy tests. Components import the `Consequence` type only. ~10 lines.

**Total:** ~130 lines of code + ~50 lines of tests for vocabulary that exists only in the model layer and is never consumed by any component, CSS rule, or runtime logic.

**Why this matters:** Every line of idle code has maintenance cost. It creates the illusion of a more complete system than exists. An AI agent reading this codebase concludes `BEHAVIORAL_CLASS` affects CSS — it doesn't. `HOSTS` suggests composition is implemented — it isn't.

**Fix:** Move to a `_future/` directory or remove entirely. Keep `Responsibility`, `Evaluation`, `Consequence`, `ComponentExpression` — these are used. Kill the rest until V2.

---

### R-04 — Label, HelperText, and ValidationMessage don't need the resolver

**The pattern in these components:**

```typescript
// Label.tsx
const { colors } = resolveTokens({
  responsibility: 'Structure',
  evaluation: 'secondary',
});
const scopeVars = toScopeVars(colors) as unknown as React.CSSProperties;
```

This calls a function that traverses `RESPONSIBILITY_UX_MAP`, validates the role against `UX_VALID_ROLES`, iterates 3 dimensions × 7+ states, produces 21 CSS var strings — all to inject `--_text` and `--_text-disabled` into the DOM. The other 19 vars are never read.

Label's responsibility and evaluation are hardcoded. They cannot change at runtime. The resolver adds zero dynamic value here — it's a static lookup being performed on every render.

**The direct alternative:**

```typescript
// Label.tsx — without the resolver
const scopeVars = {
  '--_text': 'var(--tt-colors-content-secondary-text-default)',
  '--_text-disabled': 'var(--tt-colors-content-secondary-text-disabled)',
} as unknown as React.CSSProperties;
```

Two lines. Zero function calls. Zero wasted vars. Zero runtime overhead. The var names can come from `vars` (typed, autocomplete) or be literal strings verified by the cross-system test (B-10).

**Counter-argument:** "But if the var naming formula changes, you'd need to update every component." Valid — but the naming formula has never changed and is a W3C-style convention. And the drift guard test would catch it.

**The real question:** Is the resolver's value in *generating the var names* or in *governing which vars a component is allowed to use*? If it's governance, the cross-system validator test (B-10) provides stronger governance without runtime overhead. If it's generation, `vars` from theme-v2 does it better (typed, not computed).

**Fix:** For components with hardcoded (responsibility, evaluation), replace the `resolveTokens()` call with direct `vars` lookups or literal strings. Reserve the resolver for components where (evaluation) or (consequence) varies at runtime — currently only Button and Input.

---

### R-05 — `componentContract.tsx` has a duplicate interface declaration

The file declares `ComponentContractConfig` **twice** — lines 27–67 and lines 135–148. The second declaration is a stale leftover from before `evaluation`, `isVoid`, and `wrapper` were added. This is a lint-invisible bug (TypeScript merges interfaces with the same name in the same scope).

**Fix:** Delete the second declaration.

---

### R-06 — `model.ts` exports everything "for AI agents" — but no agent uses it

`model.ts` re-exports 8 types and 5 consts from the `_model/` layer. The stated purpose is "AI agents that generate or validate component code." No AI agent, codegen script, or external tool imports from `@ttoss/ui2/model`. The only consumer is `resolver.test.ts` (which imports directly from `src/_model/resolver` anyway).

**Fix:** Not urgent — the file is small and harmless. But it should be justified by actual usage before adding more exports.

---

## What actually works (do not touch)

| Artifact | Why it works |
|---|---|
| `_model/taxonomy.ts` (Responsibility, Evaluation, Consequence, ComponentExpression) | Closes the vocabulary space. TypeScript enforces exhaustiveness. Zero ambiguity. The compositional vocabulary (HOSTS, BehavioralClass) should be pruned — see R-03. |
| `resolveTokens()` core logic | The UX mapping, consequence override, and role validation are genuinely valuable. The var-name generation should delegate to theme-v2 `vars` — see R-01. |
| `toScopeVars()` | One line to inject all color vars. Should gain a `dimensions` filter — see R-02. |
| `STATE_SELECTORS` | Ark ↔ FSL state bridge. Normative, auditable, tested. |
| `@layer ui2.behavioral` | Zero-cost cross-cutting rules. Any new component gets focus ring and disabled cursor for free. |
| `testComponentContract()` | 3 lines to register a new component in the contract suite. Scales correctly. Remove the duplicate interface — see R-05. |
| `Ark UI Field` pattern | Eliminates all ARIA manual work. The TextField proof shows this is the right primitive layer. |

---

## What is broken or fake

### B-01 — The CSS authoring problem is real and unsolved

**Current state:** Every component requires ~80–120 lines of hand-written CSS for layout and state selectors. The state selectors (`:hover`, `[data-invalid]`, `:focus-visible`, `:disabled`) are **identical in structure** across all components and differ only in the `data-scope` value.

**Why it matters at scale:** 100 components = ~10,000 lines of mechanically identical CSS. Not a maintenance problem today — a catastrophic authoring and onboarding problem at scale. The AI will produce errors. Humans will copy-paste wrong. There is no enforcement.

**Root cause:** `resolver.ts` already has `STATE_SELECTORS` — the exact mapping from FSL state → Ark CSS selector. The information needed to generate the state-selector CSS block exists in code. It is not being used for CSS generation.

**What needs to happen:** A `generateComponentCss(scope, responsibility)` function in `resolver.ts` that produces the complete state-selector CSS block for any component. Button's 35 lines of state selectors become:

```typescript
// In Button's CSS section: (layout rules only, hand-written)
// [data-scope='button'][data-part='root'] { display: inline-flex; min-height: ...; ... }

// Generated block (never hand-written):
// generateComponentCss('button', 'Action') →
// [data-scope='button'][data-part='root']:hover { background: var(--_bg-hover); }
// [data-scope='button'][data-part='root'][data-focus-visible] { border-color: var(--_border-focused); }
// [data-scope='button'][data-part='root'][data-disabled] { background: var(--_bg-disabled); color: var(--_text-disabled); }
// ... etc, derived from action ux context states
```

This function can be used at build time (Vite plugin, PostCSS, or a `pnpm generate:css` script) to produce the state selectors. The layout block stays hand-written (it is inherently per-component). The color state block becomes zero-authoring.

---

### B-02 — No visual proof

**Current state:** The entire lib is semantically correct and visually unverified. The theme-v2 token values may not be defined for the namespaces ui2 consumes (`--tt-colors-action-primary-background-default`, etc.). If they are not, every component renders with browser defaults — transparent backgrounds, no borders, system fonts.

**This is the most dangerous blind spot.** Architecture can be perfect. Output can be invisible.

**What needs to happen:**
1. A Storybook story for Button with the real theme-v2 applied — confirms the token chain works end to end.
2. A Storybook story for TextField with valid/invalid/disabled states — confirms the Ark context propagation and CSS state selectors work together.

Until these exist, ui2 is a hypothesis, not a library.

---

### B-03 — `Input.tsx` has a seam that reveals the abstraction is not closed

**Current state:** Input manually merges two `resolveTokens()` calls and manually constructs the invalid-state var names:

```typescript
const scopeVars = {
  ...toScopeVars(colors),
  '--_bg-invalid': negColors.background.default,
  '--_border-invalid': negColors.border.default,
  '--_border-invalid-focused': negColors.border.focused,
  '--_text-invalid': negColors.text.default,
};
```

This is a naming contract leak. The `--_*-invalid` suffix is defined here, and also expected in `styles.css`, with no single source of truth enforcing the connection. If the same pattern appears in Checkbox, Select, and TextArea (all of which need invalid-state styles from Ark), each will need to re-implement this pattern — with the risk of divergence.

**What needs to happen:** A `resolveInvalidOverlay(responsibility)` helper (or a second argument to `toScopeVars()`) that produces the `--_*-invalid` vars using the same canonical formula. The invalid-state naming contract must live in code, not in each component's head.

---

### B-04 — `styles.css` has a structure/architecture problem, not just a size problem

**Current state:** The file mixes two categorically different types of rules:
1. **Layout rules** — spacing, sizing, typography. Hand-written. Never changes per evaluation. Per-component.
2. **Color state rules** — `:hover`, `[data-invalid]`, `[data-disabled]`. Structurally identical across components. Could be generated.

These are in the same `@layer ui2.components` with no sub-structure.

**What needs to happen:** Split `styles.css` into two files:
- `layout.css` — hand-written, per-component layout. The part that is inherently manual and safe to maintain.
- `states.css` — generated at build time from `generateComponentCss()`. Never hand-edited.

Or, more pragmatically, add a clear comment boundary and a `pnpm generate:states` script that overwrites the state-selector section. The layout section is protected by being above the comment boundary.

---

### B-05 — The semantic contract covers colors but not layout

**Current state:** Colors are governed end-to-end: FSL → `resolveTokens()` → `toScopeVars()` → CSS vars. A component cannot use the wrong color without an explicit violation.

Layout (sizing, spacing, typography, radii) is governed by: *copy the Button example and use the right `--tt-*` var name*. There is no enforcement, no allowlist, no type checking.

**Why this matters less than colors, but still matters:** A `--tt-spacing-inset-control-md` typo silently renders with zero padding. A wrong `--tt-text-label` scale silently applies wrong font size. These bugs are visible, but not caught at development time.

**What needs to happen:** A typed `LAYOUT_TOKENS` const (previously dismissed — reconsider). Its value is not for runtime use. It is for authoring assistance: TypeScript autocomplete in a typed style object, and a reference document that is the single source of truth for which layout tokens exist and what they map to. Not a guardrail — a guide. The CSS still uses the string directly. But the const serves as the index that prevents typos and documents the available set.

**Decision point:** If `generateComponentCss()` (B-01) is implemented, it can also accept layout token specs from a typed object, which closes this gap without a separate const.

---

### B-06 — No `defineComponent()` abstraction — the core DX problem

**Current state:** Creating a new component requires touching 5 separate files:
1. `src/components/{Name}/{Name}.tsx` — the component
2. `src/styles.css` — the CSS (layout block + state block)
3. `src/index.ts` — the export
4. `tests/unit/tests/components.contract.test.tsx` — the contract registration
5. Optionally: `docs/storybook/stories/ui2/{Name}.stories.tsx` — the story

Each step is a site for error. Each step requires knowing the pattern from memory or copying Button/Input.

**What needs to happen:** A `defineComponent()` factory in `_model/` that encodes the component definition and derives everything else:

```typescript
// The entire definition of a new component in one place:
const buttonDef = defineComponent({
  scope: 'button',
  responsibility: 'Action',
  element: 'button',          // the HTML element or Ark part
  hasConsequence: true,
  hasSizes: ['sm', 'md', 'lg'],
  layout: {
    sm: { minHeight: '--tt-sizing-hit-min', paddingInline: '--tt-spacing-inset-control-sm' },
    md: { minHeight: '--tt-sizing-hit-base', paddingInline: '--tt-spacing-inset-control-md' },
    lg: { minHeight: '--tt-sizing-hit-prominent', paddingInline: '--tt-spacing-inset-control-lg' },
  },
});

// Derived automatically from buttonDef:
// - The component's CSS (state selectors + layout selectors)
// - The contract test registration
// - The export declaration
// - The Storybook story template
```

This is the game-changer. Not because it reduces the number of files — it reduces the number of decisions. A developer (or AI) that calls `defineComponent()` cannot get the state selectors wrong, cannot forget to export the types, cannot produce an invalid `data-scope`. The definition is the component.

---

### B-07 — No composite pattern defined

**Current state:** TextField exists as a proof of concept. There is no defined pattern for:
- How composites declare their composition in the model
- How composites expose their parts for independent styling
- How a composite's `data-scope` relates to its parts' scopes
- When to use Ark's multi-part component (Checkbox, Select, Menu) vs assembling ui2 primitives

**What needs to happen:** A `defineComposite()` counterpart to `defineComponent()`, or at minimum a written composite pattern that answers these questions definitively. The TextField should be documented as the reference implementation, not just a working file.

---

### B-08 — `action.accent` is a ghost: valid in the resolver, absent from the theme

**This is an active silent bug.**

`UX_VALID_ROLES.action` in `resolver.ts` includes `'accent'`. A developer who writes `<Button evaluation="accent">` will:

1. Get no TypeScript error — `evaluation: 'accent'` is a valid `Evaluation` type.
2. Get no runtime warning — resolver checks `UX_VALID_ROLES`, which includes `accent`, so it succeeds silently.
3. Get a component that renders with `background-color: var(--tt-colors-action-accent-background-default)` — which is never defined in `baseTheme.ts`. The `action` block defines only `primary`, `secondary`, `negative`, and `muted`.
4. Get a transparent, borderless, invisible button with no diagnostic information.

**Root cause:** `UX_VALID_ROLES` was derived from `Types.ts` interfaces (where `accent` is typed as an optional field — it _can_ exist). But "can" ≠ "does". `baseTheme.ts` — the actual data — does not define `action.accent`. The resolver trusts the type system. The type system says the field is optional, not that it is populated. The result is a lying validator: it accepts expressions that produce undefined CSS vars at runtime.

The same orphaned pattern exists across other contexts. `navigation.accent`, `guidance.*`, `discovery.*` are in `UX_VALID_ROLES` but are either partially or completely absent from `baseTheme`.

**What needs to happen:** Either (1) add all missing roles to `baseTheme.ts`, (2) remove the roles from `UX_VALID_ROLES` that have no baseTheme definition, or (3) add a build-time cross-validation test. Option 3 is the most robust — the validation layer should be the enforcement mechanism, not the resolver.

---

### B-09 — baseTheme has asymmetric state coverage: `action/*` is rich, `content/*` and `feedback/*` are default-only

**Verified by inspection of `baseTheme.ts`:**

| Token family | States defined |
|---|---|
| `action.primary` | default, hover, active, focused, disabled |
| `action.secondary` | default, hover, active, focused, disabled |
| `action.negative` | default, hover, active, focused, disabled |
| `action.muted` | default, hover, active, focused, disabled |
| `input.primary` | default, hover, focused, disabled |
| `input.negative` | default, focused only |
| `input.positive` | default only |
| `input.caution` | default only |
| `input.muted` | default only |
| `content.*` (all roles) | **default only** |
| `feedback.*` (all roles) | **default only** |
| `navigation.primary` | default, current |

**Current impact on existing components:**

- **Label** uses `content.secondary`. CSS rule `[data-disabled] { color: var(--_text-disabled) }` references `--tt-colors-content-secondary-text-disabled`, which is undefined. Because `color` is an inherited CSS property, an undefined var falls back to inherited value — the disabled Label shows the same color as the enabled label. **Disabled label is visually identical to enabled label.**
- **HelperText** uses `feedback.muted`. Same disabled-state gap. **Disabled helper text is visually identical to enabled helper text.**
- **Any Selection component** (Checkbox, Radio) built on `input.primary` will have no hover, active, or interactive color contrast on the control itself — only the validated `--_border-hover`, `--_border-focused` are defined.

**Root cause:** The action context was designed first, and its interactive states were specified completely. The content and feedback contexts are informational (not interactive) so interactive state coverage wasn't prioritized. But `BASE_STATES` in the resolver includes `disabled` for all contexts — and Label and HelperText genuinely need disabled states. The theme and the resolver make different assumptions about which token families are interactive.

**What needs to happen:** For every token family currently consumed by ui2 components, every state that appears in a CSS rule must be defined in `baseTheme`. At minimum:
- `content.secondary.text.disabled` — required for Label
- `feedback.muted.text.disabled` — required for HelperText
- `input.negative.text.disabled`, `input.negative.background.disabled` — required for invalid-but-disabled Input

---

### B-10 — No cross-system consistency layer: the resolver, Types.ts, and baseTheme are three separate sources of truth that are never validated against each other

**The meta-gap that caused B-08 and B-09.**

The resolver test verifies formula correctness: it checks that `colorVarRef('action', 'primary', 'background', 'default')` produces `var(--tt-colors-action-primary-background-default)`, and that this matches `toCssVarName('semantic.colors.action.primary.background.default')`. This test is correct and valuable.

What no test verifies:
1. Every role in `UX_VALID_ROLES[ux]` is actually defined in `baseTheme.semantic.colors[ux]`.
2. Every state a role emits (via `BASE_STATES + UX_EXTRA_STATES`) for a dimension is actually defined in `baseTheme.semantic.colors[ux][role][dimension]`.
3. Every `--_*` var referenced in `styles.css` is emitted by `toScopeVars()` for the relevant responsibility.
4. Every CSS var name in `styles.css` (e.g. `--tt-text-label-md-fontOpticalSizing`) corresponds to a resolved non-undefined value in `toCssVars(baseTheme)`.

Without these validations, B-08 is undetectable at development time. B-09's disabled-state failures are invisible unless visually tested.

**What needs to happen:** A dedicated validator test (not a unit test of the resolver, but a cross-system integration test) that:
- Imports `resolveTokens()` and `UX_VALID_ROLES`
- Imports `baseTheme` and `toCssVars(baseTheme)` (the full flat CSS var record)
- For every `(ux, role)` pair in `UX_VALID_ROLES`, verifies that `toCssVars(baseTheme)` contains a non-null entry for `--tt-colors-{ux}-{role}-{dimension}-default`
- For every CSS var reference in `styles.css`, verifies that a corresponding entry exists in `toCssVars(baseTheme)`

This test is the validation layer documented in the FSL architecture but never implemented in code.

---

### B-11 — `semantic.opacity.disabled` and `semantic.border.selected` are documented contracts that ui2 ignores

**`semantic.opacity.disabled`:**

The token contract says `opacity.disabled` is for "dimmed disabled media" (`Types.ts` JSDoc). It resolves to `0.5` in `baseTheme`. Currently, no ui2 component applies `opacity: var(--tt-opacity-disabled)` anywhere. The action components use dedicated disabled-state color tokens (gray background, gray text) — a valid approach.

The problem is when icon or media support is added. An Icon inside a disabled Button needs visual dimming. The current approach (color-only disabled) has no mechanism for this. The token exists. The contract exists. The component pattern doesn't use it.

**`semantic.border.selected`:**

A dedicated semantic contract: border width for selected/checked state that must be strictly greater than `outline.control`. Defined in `baseTheme.border.selected = { width: '{core.border.width.selected}' }` → `2px` (vs `outline.control` → `1px`). Used nowhere in ui2.

When Checkbox is implemented, its checked state indicator needs a thicker border to visually convey selection weight. Using `--tt-border-outline-control-width` (the default 1px) for a Checkbox in checked state is a semantic contract violation. The system explicitly provides `--tt-border-selected-width` (`2px`) for this purpose.

---

## Priority order (what to do first)

### P0 — Simplify before fixing: prune dead code, fix duplicate interface (R-03, R-05)
Remove `HOSTS`, `BehavioralClass`, `BEHAVIORAL_CLASS`, convenience role types from taxonomy.ts. Delete the duplicate `ComponentContractConfig` from componentContract.tsx. This is a 15-minute cleanup that reduces the surface area before any architectural work. Less code = fewer things to maintain during the fixes that follow.

### P1 — Fix baseTheme missing states (B-09) and remove orphaned roles (B-08)
These are active bugs. Add `content.secondary.text.disabled`, `feedback.muted.text.disabled` to baseTheme. Remove `accent` from `UX_VALID_ROLES.action` (or add `action.accent` to baseTheme — decide which). Audit all other roles.

### P2 — Cross-system validation test (B-10)
The test that prevents B-08 and B-09 from ever recurring. Imports baseTheme + resolver and verifies every (ux, role) pair has populated token values. Must exist before adding any new components.

### P3 — Reduce var injection waste: add dimension filter to `toScopeVars()` (R-02) and simplify static components (R-04)
Label, HelperText, ValidationMessage don't need the resolver — replace with direct var references. Add optional `dimensions` parameter to `toScopeVars()` so Button only injects background+border+text states it actually uses, not all 27. This is a quick win that reduces DOM weight by ~70% per component.

### P4 — Storybook story for Button and TextField (B-02)
Visual proof that the token chain works end-to-end. Now that vars are correct (P1) and validated (P2), this becomes meaningful.

### P5 — Evaluate resolver → `vars` delegation (R-01)
Decide whether `resolveTokens()` should read from theme-v2 `vars` (typed tree) instead of re-computing var names. This reduces code duplication and eliminates the drift guard test. Trade-off: adds `@ttoss/theme2` as peerDependency for runtime (it's already required for CSS vars).

### P6 — `generateComponentCss(scope, responsibility)` (B-01)
CSS state selector generation. Deferred because the simplifications in P0–P3 may reduce the CSS surface enough that the generation becomes less urgent.

### P7 — `resolveInvalidOverlay()` helper (B-03)
Closes the naming contract leak for invalid-state vars.

### P8 — `defineComponent()` factory (B-06)
The DX game-changer. Deferred until P5–P7 stabilize.

### P9 — Composite pattern documentation (B-07) + `LAYOUT_TOKENS` (B-05)
Deferred until real usage demands it.

---

## What would make this genuinely innovative

The claim is that most systems fail because they never define the semantic contract layer. The current ui2 defines it for colors. That is real and valuable. But the implementation is heavier than it needs to be.

What would elevate this to genuine state-of-the-art:

1. **Minimal runtime, maximum compile-time guarantees.** The resolver runs on every render. For static components (Label, HelperText, ValidationMessage), the var references are known at write time. Move the resolver's value to compile/test time — the cross-system validator (B-10) provides stronger guarantees. The lightest component at runtime is the most scalable.

2. **Use theme-v2's existing typed tree instead of reconstructing it.** `vars` from `@ttoss/theme2/vars` already provides autocomplete, type safety, and the canonical var names. The resolver should navigate this tree, not rebuild it. One source of truth, not two.

3. **The three truth sources agree by construction, not by testing.** If the resolver reads from `vars` (which is built from `baseTheme`), then ghost roles (B-08) and missing states (B-09) manifest as `undefined` at the lookup site — a runtime `TypeError`, not a silent invisible CSS var. The cross-system test (B-10) becomes simpler: it's testing the union of what `vars` offers, not reconstructing the formula.

4. **CSS is derived, not authored** — the state-selector portion of styles.css is generated from the model. Only layout CSS is hand-written.

5. **The AI recipe is a single call** — `defineComponent()` with no decisions about state selectors, tokens, or tests.

None of these require inventing new technology. They require removing unnecessary abstraction and delegating to what already exists.

---

## What to stop doing

- **Stop building infrastructure for V2 during V1.** HOSTS, BehavioralClass, composition refinement — none of it is used. It creates the illusion of progress. Remove it. Add it back when the first component needs it.
- **Stop injecting 27 vars when 9 are used.** The generality of "emit all states for all dimensions" is elegant in theory and wasteful in practice. Filter.
- **Stop running `resolveTokens()` in components that have static, hardcoded expressions.** Label will always be `Structure/secondary`. The resolver adds zero value at runtime. Two literal var references are simpler, faster, and more debuggable.
- **Stop adding components before the validator (P2) exists.** Every new component may silently consume undefined tokens.
- **Stop treating styles.css as a single file.** The boundary between hand-written layout and generatable state selectors must be established now.
- **Stop assuming the resolver is a complete validator.** It validates formula correctness, not data completeness. Without the cross-system test (B-10), the resolver's "no warning" output is not a safety signal.
