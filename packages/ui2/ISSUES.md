# @ttoss/ui2 — Architecture Decisions

Decisions taken during the token resolution, CSS, component library, and composition architecture review (April 2026).

---

## Decision 1: Replace the deterministic resolver with docs + typed filters + validation

### Problem

The current resolver (`resolver.ts`, `tokenMap.ts`, `cssGenerator.ts`, `resolver.types.ts`) treats token assignment as a computation: `Responsibility → UxContext → Role → data-variant → CSS`. This works for the 5 current components, but:

- It only resolves **color tokens**. Layout, typography, spacing, radii, borders, motion, elevation, z-index, opacity — all 10 other token families — are assigned manually without any formal guidance or enforcement.
- Expanding the resolver to cover all 11 families would create a lookup table so large and exception-heavy that it would be harder to maintain than what it replaces.
- A deterministic resolver for layout/typography/spacing over-constrains design decisions. A Dialog needs more `inset.surface` padding than a Tooltip — both are Overlay. Forcing the same spacing for both hurts aesthetics without semantic gain.
- With 45 components the resolver becomes the complexity bottleneck, not the simplifier.

### Decision

Replace the resolver-centric architecture with:

1. **A normative lookup table** (markdown) that maps `Responsibility → legal tokens` for ALL 11 token families. This is the primary contract — not an algorithm.
2. **Typed filters** (`COMPONENT_TOKENS` + legality constants) that give autocomplete and restrict what tokens a component CAN use.
3. **Validation tests** that verify every component uses only tokens legal for its Responsibility.
4. **Documentation** clear enough that an AI coding agent builds correct components on the first attempt.

The value shifts from "we have a deterministic resolver" to "we have a semantic contract so precise, typed filters so correct, and validation so comprehensive, that any AI builds correct components on the first attempt."

### What stays

- `data-variant` on the DOM — still carries the resolved color role.
- `consequence='destructive' → data-variant='negative'` — inline in `defineComponent`, not a resolver subsystem.
- `cross-system.test.ts` — stays and expands to validate legality rules.
- `cross-theme.test.tsx` — stays unchanged.
- `COMPONENT_TOKENS` — stays as the typed catalog of layout tokens.

### What goes

- The concept of a "resolver" as a central system. `resolveTokens()` is no longer the semantic engine — the lookup table is.
- `resolver.types.ts`, `tokenMap.ts`, `cssGenerator.ts` as separate modules.
- `buildColorSpec()` — no longer needed (color tokens are applied via render props, not CSS generation).
- The framing of "Layer 3.5" — there is no intermediate resolution layer. The component declares its tokens directly, guided by the table and validated by tests.

---

## Decision 2: Token assignment is a lookup table, not a computation

### The table

This is the normative contract. A component with a given Responsibility MUST use ONLY tokens from its row.

| Responsibility | Colors UX | Color Roles | Radii | Border | Sizing | Spacing Inset | Typography | Motion | Elevation | Z-Index |
|---|---|---|---|---|---|---|---|---|---|---|
| **Action** | `action` | primary, secondary, muted, negative | `control` | `outline.control` | `hit.*` | `inset.control` | `label` | `feedback` | `flat` | `base` |
| **Input** | `input` | primary, muted, positive, caution, negative | `control` | `outline.control` | `hit.*` | `inset.control` | `label` | `feedback` | `flat` | `base` |
| **Selection** | `input` | primary, muted, positive, caution, negative | `control` | `outline.control`, `selected` | `hit.*` | `inset.control` | `label` | `feedback` | `flat` | `base` |
| **Navigation** | `navigation` | primary | `control` | `outline.control` | `hit.*` | `inset.control` | `label` | `feedback` | `flat` | `base`, `sticky` |
| **Disclosure** | `navigation` | primary | `control` | `outline.control` | `hit.*` | `inset.control` | `label` | `transition.enter/exit` | `flat` | `base` |
| **Overlay** | `content` | primary, secondary, muted, positive, caution, negative | `surface` | `outline.surface` | — | `inset.surface` | `title`, `body`, `label` | `transition.enter/exit` | `overlay`, `blocking` | `overlay`, `blocking` |
| **Feedback** | `feedback` | primary, muted, positive, caution, negative | `surface` | `outline.surface` | — | `inset.surface` | `body`, `label` | `feedback` | `raised` | `base` |
| **Collection** | `content` | primary, secondary, muted, positive, caution, negative | `surface` | `outline.surface`, `divider` | — | `inset.surface` | `body`, `label` | — | `flat`, `raised` | `base` |
| **Structure** | `content` | primary, secondary, muted | `surface` | `outline.surface`, `divider` | — | `inset.surface` | `title`, `body`, `label` | — | `flat`, `raised` | `base` |

### Size → token step mapping (universal, all Responsibilities)

| Size prop | Hit target | Inset step | Typography step |
|---|---|---|---|
| `sm` | `hit.min` | `inset.{control\|surface}.sm` | `{family}.sm` |
| `md` | `hit.base` | `inset.{control\|surface}.md` | `{family}.md` |
| `lg` | `hit.prominent` | `inset.{control\|surface}.lg` | `{family}.lg` |

### Enforcement

The table is enforced by tests, not by runtime code:

```typescript
const LEGAL_TOKENS: Record<Responsibility, { radii: string[]; border: string[]; colorUx: string; ... }> = {
  Action: { radii: ['control'], border: ['outline.control'], colorUx: 'action', ... },
  // ...
};

test.each(allComponentMetas)('$scope uses only legal tokens', (meta) => {
  const legal = LEGAL_TOKENS[meta.responsibility];
  // validate layout references against legal set
  // validate colorVariants against legal roles
});
```

---

## Decision 3: Migrate from Ark UI to React Aria Components

### Problem

Ark UI (`@ark-ui/react` via Zag.js state machines) was adopted early when ui2 had 5 components. Scaling to 45 components reveals critical gaps:

- **Sticky hover on touch devices.** Ark UI delegates to CSS `:hover`, which "sticks" after touch on mobile. The button appears permanently hovered until the user taps elsewhere. This is a visual bug on every interactive component.
- **No i18n for components.** DatePicker, Calendar, NumberInput, Select with typeahead — all need localized strings (month names, day names, number formatting, RTL). Ark UI provides none. Implementing i18n for 30+ locales manually is impractical.
- **Zag.js overhead.** Every Ark component loads a full state machine runtime. A Button doesn't need a state machine. The runtime cost (bundle + CPU) is unnecessary for simple components.
- **No render props for `style`.** Ark UI doesn't support `style` as a function of component state. This prevents the inline token approach (Decision 4) which eliminates CSS generation entirely.
- **Limited AI tooling.** No MCP server, no Agent Skills, no llms.txt. This conflicts with the AI-first goal (Decision 1).

### Decision

Replace `@ark-ui/react` with `react-aria-components` (React Aria by Adobe).

### Why React Aria

| Capability | Ark UI | React Aria |
|---|---|---|
| Touch/pointer normalization | CSS `:hover` (sticky) | `data-hovered`/`data-pressed` (cross-modality, no sticky hover) |
| i18n | None | 30+ locales, 13 calendar systems, RTL, number formatting |
| Style render props | Not supported | `style={({ isHovered, isPressed }) => ({...})}` |
| Component coverage | ~45 | 50+ |
| AI tooling | None | MCP server, Agent Skills, llms.txt, shadcn CLI |
| A11y authority | Good | Gold standard (Adobe = W3C WAI-ARIA spec committee) |
| Collections/virtualization | ListCollection (no virtualization) | Collections API with built-in virtualizer |
| Focus management | Basic | Focus trapping, restoration, `data-focus-visible` (including virtual focus) |
| Drag and drop | Not supported | Accessible DnD (keyboard + screen reader) |
| Bundle | Heavy (Zag.js runtime per component) | Tree-shakeable, no state machine runtime |
| Maintenance | Chakra team | Adobe (long-term enterprise backing) |

### What React Aria provides beyond accessibility

12 categories of functionality that ui2 would otherwise implement manually:

1. **ARIA semantics** — roles, attributes, live regions
2. **Keyboard navigation** — arrow keys, typeahead, Home/End, Page Up/Down
3. **Focus management** — trapping in dialogs, restoration on close, focus-visible detection
4. **Touch/pointer normalization** — hover vs press vs long-press, scroll cancel
5. **Collections** — selection (single/multi), virtualization, sections, typeahead search
6. **Overlay positioning** — flip/shift/align, portal rendering, stacking context, outside-click dismiss
7. **Form integration** — native form submission, controlled/uncontrolled, validation
8. **Component i18n** — localized month/day names, number formatting, calendar systems, RTL
9. **Animation coordination** — enter/exit presence, `isExiting` for unmount wait
10. **Drag and drop** — accessible keyboard + screen reader DnD
11. **Responsive behavior** — mobile bottom sheet vs desktop popover, coarse/fine pointer
12. **Screen reader announcements** — live regions for dynamic changes

### Migration cost

Low — ui2 currently uses only `Field.*` from Ark UI (5 imports in 5 files). React Aria has `TextField`, `Label`, `Input`, `FieldError` that map 1:1. Delaying migration increases cost as more Ark-dependent components are added.

### What goes

- `@ark-ui/react` dependency.
- All Ark UI imports (`Field.Root`, `Field.Input`, `Field.Label`, `Field.HelperText`, `Field.ErrorText`).

### What stays

- `data-scope`, `data-part`, `data-variant` on the DOM — these are ui2's own conventions, not Ark's.
- `defineComponent` / `defineComposite` factory pattern — the abstraction adapts, only internals change.
- Consumer API — `<Button>`, `<TextField>`, props like `evaluation`, `consequence`, `size`. Consumers don't know which headless library is used underneath.

---

## Decision 4: All tokens via inline style using `vars` — zero CSS generation

### Problem

The current architecture splits token consumption into two paths: layout tokens via `COMPONENT_TOKENS` (converted to CSS by `generate-css.ts`), and color tokens via `cssGenerator.ts` → `styles.css`. Both paths produce generated CSS artifacts that drift, can't tree-shake, and require a separate `import '@ttoss/ui2/styles.css'` that consumers forget.

Meanwhile, `@ttoss/theme2` already provides everything needed:

| theme-v2 channel | API | What it gives |
|---|---|---|
| **`vars`** (static import) | `vars.colors.action.primary.background.default` | Typed `'var(--tt-...)'` strings. Zero runtime. |
| **`useTokens()`** (React context) | `tokens.colors.action.primary...` | Semantic tree with refs. Mode-aware. |
| **`useResolvedTokens()`** (React context) | `resolved['semantic.colors...']` | Flat map with raw values. For React Native, canvas, PDF. |
| **`ThemeProvider`** | `<style precedence="default">` | Injects all `--tt-*` CSS custom properties. Mode switching via `data-tt-mode`. |

All three channels are mode-aware. When mode changes, `ThemeProvider` updates `data-tt-mode` on `<html>`, CSS cascade flips the custom property values, and every `var(--tt-*)` reference resolves to the new mode's value automatically. Components never know which mode is active.

### Decision

Use `vars` for ALL tokens — layout AND color — via inline `style` and React Aria render props. Eliminate `cssGenerator.ts`, `generate-css.ts`, `styles.css`, and `COMPONENT_TOKENS` entirely.

### Layout tokens (static, no state dependency)

Applied via inline `style` using `vars`:

```typescript
// Inside defineComponent
const layoutStyles = {
  minHeight: vars.sizing.hit.base,
  paddingInline: vars.spacing.inset.control.md,
  borderRadius: vars.radii.control,
  fontFamily: vars.text.label.md.fontFamily,
  fontSize: vars.text.label.md.fontSize,
  borderWidth: vars.border.outline.control.width,
  borderStyle: vars.border.outline.control.style,
  transitionDuration: vars.motion.feedback.duration,
  transitionTimingFunction: vars.motion.feedback.easing,
};

// Size variants are style object merges
const sizeStyles = {
  sm: { minHeight: vars.sizing.hit.min, paddingInline: vars.spacing.inset.control.sm },
  md: { minHeight: vars.sizing.hit.base, paddingInline: vars.spacing.inset.control.md },
  lg: { minHeight: vars.sizing.hit.prominent, paddingInline: vars.spacing.inset.control.lg },
};

<button style={{ ...layoutStyles, ...sizeStyles[size] }} />
```

Every value is a typed `var(--tt-*)` string. Mode/theme switching works automatically — ThemeProvider changes the backing CSS custom property value.

### Color tokens (state-dependent)

Applied via React Aria's `style` render prop. React Aria passes interaction state as function arguments:

```typescript
const colorTokens = vars.colors.action.primary; // typed subset from vars

<RAButton
  style={({ isHovered, isPressed, isDisabled, isFocusVisible }) => ({
    ...layoutStyles,
    ...sizeStyles[size],
    backgroundColor: isDisabled ? colorTokens.background.disabled
      : isPressed ? colorTokens.background.active
      : isHovered ? colorTokens.background.hover
      : colorTokens.background.default,
    borderColor: isFocusVisible ? colorTokens.border.focused
      : isDisabled ? colorTokens.border.disabled
      : colorTokens.border.default,
    color: isDisabled ? colorTokens.text.disabled
      : colorTokens.text.default,
  })}
/>
```

### Why this works

- **`vars` values are `var(--tt-*)` strings**, not raw colors. They work in inline styles because the browser resolves the CSS custom property at paint time.
- **React Aria's `isHovered` is cross-modality** — it's NOT applied on touch devices, solving the sticky hover problem that CSS `:hover` has. The token `background.hover` is only used when hover is semantically relevant.
- **Zero CSS files.** No `styles.css`, no `generate-css.ts`, no `cssGenerator.ts`. No build step. No `import` the consumer can forget.
- **Tree-shakeable.** Only imported components reference their tokens. Unused components don't exist in the bundle.
- **Mode switching is automatic.** `ThemeProvider` manages `data-tt-mode` → CSS cascade flips `--tt-*` values → every `var()` resolves to the new mode. Components are mode-agnostic.
- **Full autocomplete.** `vars.colors.action.` gives typed suggestions. No string manipulation.

### What goes

- `cssGenerator.ts`, `generate-css.ts`, `styles.css` — all eliminated.
- `COMPONENT_TOKENS` constant — replaced by direct `vars` usage (same autocomplete, same type safety, no indirection).
- `buildColorSpec()` — no longer needed.
- The `./styles.css` export from `package.json`.
- The consumer burden of `import '@ttoss/ui2/styles.css'`.

### What stays

- `data-variant` on the DOM — useful for testing, devtools inspection, and external CSS overrides by consumers.
- `data-scope`, `data-part` — namespace for consumer CSS overrides if needed.
- Drift/contract tests — validate that component declarations use only legal tokens from the lookup table (Decision 2).

---

## Decision 5: Composition via explicit props + React Context for deep inheritance

### Problem

Composites (TextField, future Dialog, Card, Toolbar) need to pass token decisions to their children. How does a TextField tell its Label to use `evaluation="secondary"`?

### Three mechanisms evaluated

| Mechanism | How it works | Pros | Cons |
|---|---|---|---|
| **Explicit props** | Composite passes `evaluation="secondary"` to Label directly | Explicit, debuggable, zero magic | Not "inheritance" — only works for known children |
| **CSS custom property cascade** | Composite sets `--ui2-eval` and children read via `var()` | Works at any depth, works in RSC | Not typed, conflicts with semantic model |
| **React Context** | Composite provides `TokenScopeCtx` and children read as fallback | Typed, React-idiomatic, any depth | Client-only, implicit dependency |

### Decision

**Explicit props as default. React Context for deep inheritance when needed.**

Most composites know their direct children. TextField knows it has a Label, Input, HelperText, ValidationMessage. It passes the correct evaluation to each:

```typescript
// defineComposite's render function — explicit wiring
<Label evaluation="secondary">{label}</Label>
<Input evaluation="primary" size={size} {...inputProps} />
<HelperText evaluation="muted">{helperText}</HelperText>
<ValidationMessage evaluation="negative">{errorText}</ValidationMessage>
```

For rare cases of deep inheritance (a Card that influences arbitrary nested components), a React Context provides typed fallback:

```typescript
const TokenScopeCtx = React.createContext<{ evaluation?: Evaluation } | null>(null);

// Inside a component
const Component = ({ evaluation: propEval, ...props }) => {
  const ctx = useContext(TokenScopeCtx);
  const effectiveEval = propEval ?? ctx?.evaluation ?? 'primary'; // prop > context > default
  // ...
};
```

**Priority order:** prop > context > component default. Props always win.

### What this replaces

The Host.Role axis from the Component Model does NOT need a resolver dimension. Composites are the mechanism for composition — they wire correct props to children. No "composition resolver" layer.

---

## Decision 6: Consequence override stays as inline code, not a subsystem

### Decision

`consequence='destructive' → data-variant='negative'` is 2 lines of code inside `defineComponent`:

```typescript
const CONSEQUENCE_OVERRIDE: Partial<Record<Consequence, ColorRole>> = {
  destructive: 'negative',
};

const role = CONSEQUENCE_OVERRIDE[consequence] ?? evaluation ?? 'primary';
```

No separate resolver module needed.

---

## Decision 7: `defineComponent` refactored for `vars` + React Aria

### New `defineComponent` shape

```typescript
defineComponent({
  name: 'Button',
  scope: 'button',
  responsibility: 'Action',
  element: 'Button',              // React Aria component (or native tag)
  hasConsequence: true,
  sizes: ['sm', 'md', 'lg'],

  // Layout tokens — inline style, static per size
  layout: {
    base: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: vars.radii.control,
      borderWidth: vars.border.outline.control.width,
      borderStyle: vars.border.outline.control.style,
      transitionProperty: 'background-color, border-color, color, opacity',
      transitionDuration: vars.motion.feedback.duration,
      transitionTimingFunction: vars.motion.feedback.easing,
    },
    sizes: {
      sm: { minHeight: vars.sizing.hit.min, paddingInline: vars.spacing.inset.control.sm },
      md: { minHeight: vars.sizing.hit.base, paddingInline: vars.spacing.inset.control.md },
      lg: { minHeight: vars.sizing.hit.prominent, paddingInline: vars.spacing.inset.control.lg },
    },
  },

  // Color roles — resolved to vars.colors[ux][role] at module scope
  colorRoles: ['primary', 'secondary', 'muted', 'negative'],
});
```

### What `defineComponent` does internally

1. **Derives `ux`** from `responsibility` via the lookup table (Action → action).
2. **Builds `colorTokenSets`** at module scope: `{ primary: vars.colors.action.primary, secondary: vars.colors.action.secondary, ... }`.
3. **Returns a React component** that:
   - Resolves `role` from `evaluation` + `consequence` (Decision 6).
   - Picks `colorTokens = colorTokenSets[role]`.
   - Passes React Aria render prop `style` that merges layout + size + color state.
   - Sets `data-scope`, `data-part`, `data-variant` on the DOM for testing/devtools.
4. **Returns `componentMeta`** for contract tests (responsibility, legal tokens used, roles declared).

### What this eliminates

- `COMPONENT_TOKENS` indirection — replaced by direct `vars` references.
- `cssGenerator.ts` / `generate-css.ts` / `styles.css` — all gone.
- `resolver.ts` / `tokenMap.ts` / `resolver.types.ts` — simplified to 2-line consequence override.
- Separate build step for CSS.
- Consumer `import '@ttoss/ui2/styles.css'`.


