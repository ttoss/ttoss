# Contributing to @ttoss/ui2

## Architecture Invariants

These invariants are enforced by the test suite. Breaking them will fail CI.

### 1. No inline color styles

Components never inject `--_*` or any color-related CSS custom properties into
inline `style`. Colors are driven by `data-variant` + static CSS selectors
referencing `var(--tt-*)` theme tokens directly.

**Why:** Inline styles have higher specificity than stylesheets, making theme
switching and custom styling difficult. Static CSS is cacheable, DevTools-readable,
and compatible with SSR.

### 2. `data-variant` carries the resolved role

The `data-variant` attribute value is the **color role** (`primary`, `secondary`,
`negative`, etc.), NOT the evaluation prop value verbatim. For example,
`consequence='destructive'` resolves to `data-variant='negative'` via
`CONSEQUENCE_ROLE_OVERRIDE`.

**Why:** The CSS selectors and theme token grammar are organized by role, not by
consequence. The resolver collapses the FSL expression into a single role string.

### 3. `styles.css` is a build artifact

Never edit `src/styles.css` manually. Run `pnpm run generate:css` to regenerate.
The cross-system test (section 4) enforces that the file matches the generator
output.

**Why:** The CSS is a function of component definitions (layout + color metadata).
Having a single source of truth prevents layout/color CSS from drifting apart
from component code.

### 4. One file per component

Adding a component requires exactly one file: `src/components/Name/Name.tsx`
with a `defineComponent()` call. Everything else — barrel exports, contract
tests, CSS — is auto-discovered from the filesystem.

**Why:** Manual registration in multiple files is error-prone. Auto-discovery
guarantees that adding a component cannot be "half-done".

### 5. `resolveTokens()` is build-time only

The render path uses `resolveRole()` (lightweight, no ColorSpec computation).
`resolveTokens()` is used by the CSS generator and by tests.

**Why:** `resolveTokens()` builds a full `ColorSpec` including all state vars —
unnecessary work at render time when the component only needs a role string.

### 6. Theme switching is pure CSS

`data-variant` stays identical across themes. Only the CSS custom property values
behind `--tt-colors-*` change. Zero component re-renders needed for theme
switching.

**Why:** This is the fundamental value proposition of token-native components.
Theme switching should not involve React state or re-resolution.

### 7. `@layer ui2.behavioral` is the only static CSS concept

Focus ring and disabled cursor live in the behavioral layer. Everything else in
`styles.css` is generated from component definitions.

### 8. Semantic attrs are immutable

`data-scope`, `data-part`, `data-variant` are spread AFTER `{...rest}` in the
component render — consumers cannot override them.

**Why:** These attributes are the component's identity in the CSS system.
Allowing consumers to override them would break styling.

### 9. Contract tests are auto-discovered

No manual registration. Export a `*ContractConfig` from your component's
`.tsx` file and it's picked up automatically by `components.contract.test.tsx`.

### 10. Selected/checked deduplication

Both `selected` and `checked` FslStates produce `[data-state="checked"]` in CSS.
The generator deduplicates — one CSS rule block, not two. The `FslState`
type retains both values (the semantic distinction matters in the token grammar),
but the CSS generator handles the collision.

### 11. Scope uniqueness

Each `defineComponent()` call must have a unique `scope` value. The cross-system
test enforces that no two component or composite metas share a scope, and that
component and composite scopes do not overlap. Duplicate scopes cause silent CSS
selector collisions.

### 12. Ref forwarding

All components use `React.forwardRef`. The inner component produced by
`defineComponent()` and each wrapper component both forward refs to the root
DOM element. Contract tests verify ref forwarding automatically.

**Why:** Consumers need refs for focus management, animation libraries, form
libraries, and measurement. A UI library without ref forwarding is unusable in
real-world applications.

### 13. `extraCss` for component-specific CSS overrides

Components that need CSS rules that cannot be expressed via the `layout` spec
(e.g. custom focus ring behavior) declare them in `extraCss`. The CSS generator
emits these blocks alongside the layout and color CSS. Never hardcode
component-specific CSS in `generate-css.ts`.

**Why:** When new components need similar overrides, the mechanism is already
data-driven. No generator modification required.

---

## Adding a New Component

1. Create `src/components/Name/Name.tsx`
2. Use `defineComponent()` with `layout`, `responsibility`, `dimensions`, etc.
3. Export the component (wrapped in `React.forwardRef`), `*ContractConfig`, and `*ComponentMeta`
4. Run `pnpm run generate:css` to include layout + color CSS
5. Run `pnpm run generate:barrel` to include in public exports
6. Run `pnpm test` — contract tests auto-discover the new component

```tsx
// src/components/Name/Name.tsx
import * as React from 'react';
import { defineComponent } from '../../_model/defineComponent';
import { COMPONENT_TOKENS as T } from '../../_model/componentTokens';

export interface NameProps extends React.HTMLAttributes<HTMLDivElement> {}

const {
  Component: NameBase,
  contractConfig: nameContractConfig,
  componentMeta: nameComponentMeta,
} = defineComponent({
  name: 'Name',
  scope: 'name', // must be unique across all components
  responsibility: 'Action', // or Input, Feedback, Structure
  element: 'div',
  layout: {
    base: {
      display: 'block',
      // ... layout properties using T.* tokens
    },
  },
});

export { nameContractConfig, nameComponentMeta };

export const Name = React.forwardRef<HTMLDivElement, NameProps>(
  (props, ref) => {
    return <NameBase ref={ref} {...props} />;
  }
);
Name.displayName = 'Name';
```

## COMPONENT_TOKENS Usage Guide

`COMPONENT_TOKENS` (aliased as `T`) is the typed catalog of `--tt-*` CSS custom
property names available for component layout declarations. Organized by concern:

- `T.sizing.hit.*` — hit-target heights (`min`, `base`, `prominent`)
- `T.spacing.inset.control.*` — internal padding (`sm`, `md`, `lg`)
- `T.spacing.gap.inline.*` — inline gaps between elements
- `T.radii.*` — border radii (`control`, `surface`, `round`)
- `T.border.outline.control.*` — border geometry (`width`, `style`)
- `T.text.label.*` — typography tokens by size (`sm.fontFamily`, `md.fontSize`, etc.)
- `T.motion.feedback.*` — transition timing (`duration`, `easing`)
- `T.focus.*` — focus ring tokens (`width`, `style`, `color`)
- `T.opacity.*` — opacity values (`disabled`)

All values in `T` are verified by cross-system tests to have backing theme token
definitions. Using a value from `T` guarantees it will resolve in all themes.

## `withInvalidOverlay`

Set `withInvalidOverlay: true` in `defineComponent()` for components that
participate in Ark's `[data-invalid]` state (Input, Select, TextArea). The CSS
generator will emit additional rules that override color tokens with the
`negative` role when `[data-invalid]` is present.

## Cross-Theme Testing

Every new component is automatically tested across all 4 brand themes (bruttal,
corporate, oca, ventures) plus the base theme. The cross-theme test verifies:

1. `data-variant` stays identical across themes
2. Every UX_VALID_ROLE has backing tokens in every theme
3. Every `var(--tt-*)` reference in `styles.css` resolves in every theme

No manual test registration required — add the component, run `pnpm test`.

## Running Tests

```bash
pnpm test                # all tests
pnpm run generate:css    # regenerate styles.css
pnpm run generate:barrel # regenerate src/index.ts
```

## Storybook

```bash
cd docs/storybook2 && pnpm storybook
```

Use the paintbrush toolbar icon to switch between Base, Bruttal, Corporate,
Oca, and Ventures themes.
