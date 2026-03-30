# @ttoss/ui2 — Component Conventions

> This file is **AI-readable**. It teaches AI assistants and developers
> the exact steps to create or modify ui2 components.

## Architecture Overview

```
src/
├── _shared/         Internal utilities (cn, icons)
├── _model/          Component Model, Composition, Token Resolution
├── components/      Single-concept primitives
├── composites/      Multi-part compound components
└── styles/          Shared CSS (animations)
```

## Component vs Composite

| Aspect     | Component (`components/`)         | Composite (`composites/`)           |
| ---------- | --------------------------------- | ----------------------------------- |
| API        | `<Button>`, `<Checkbox>`          | `<Dialog.Root>`, `<Dialog.Content>` |
| Parts      | Single root element               | Multiple namespace sub-parts        |
| Complexity | Low — wraps one Ark UI primitive  | Higher — orchestrates several parts |
| Examples   | Button, Checkbox, Switch, Tooltip | Dialog, Tabs, Accordion, Field      |

## Component Model — Three Dimensions

Every component is classified by three dimensions:

1. **Responsibility** — what the component IS (identity)
2. **Host** — what compositional structure it participates in (optional)
3. **Role** — what the instance does inside that host (optional)

### Responsibility (required)

| Responsibility | Purpose                      | Default color prefix | Default text style |
| -------------- | ---------------------------- | -------------------- | ------------------ |
| Action         | Triggers commands            | `action.primary`     | `label.md`         |
| Input          | Direct user input            | `input.primary`      | `body.md`          |
| Selection      | Choosing options             | `input.primary`      | `label.md`         |
| Collection     | Structured sets of items     | `content.primary`    | `body.md`          |
| Navigation     | Movement across views        | `navigation.primary` | `label.md`         |
| Disclosure     | Reveal/hide content in-place | `content.primary`    | `body.md`          |
| Overlay        | Temporary layered UI         | `content.primary`    | `body.md`          |
| Feedback       | Communicating state/outcome  | `feedback.primary`   | `body.md`          |
| Structure      | Interface scaffolding        | `content.primary`    | `body.md`          |

### Host + Role (optional — for composition)

| Host             | Roles                                                                                           |
| :--------------- | :---------------------------------------------------------------------------------------------- |
| **ActionSet**    | `primary`, `secondary`, `dismiss`                                                               |
| **FieldFrame**   | `control`, `label`, `description`, `leadingAdornment`, `trailingAdornment`, `validationMessage` |
| **ItemFrame**    | `label`, `description`, `supportingVisual`, `trailingMeta`, `selectionControl`                  |
| **SurfaceFrame** | `media`, `heading`, `body`, `actions`, `status`                                                 |

## Token Resolution

Use `resolveTokens()` to query which tokens a component part should use:

```ts
import { resolveTokens, colorVar, textStyleVars } from '@ttoss/ui2';

// Standalone button
resolveTokens({ responsibility: 'Action' });
// → { color: 'action.primary', textStyle: 'label.md', spacing: 'inset.control', sizing: 'hit.default', radii: 'control' }

// Button in a dialog footer (secondary action)
resolveTokens({
  responsibility: 'Action',
  host: 'ActionSet',
  role: 'secondary',
});
// → { color: 'action.secondary', textStyle: 'label.md', ... }

// Field label
resolveTokens({
  responsibility: 'Structure',
  host: 'FieldFrame',
  role: 'label',
});
// → { color: 'content.primary', textStyle: 'label.md', ... }
```

### CSS var name utilities

Convert token spec values to actual `--tt-*` CSS custom property names:

```ts
colorVar('action.primary', 'background'); // '--tt-action-primary-background-default'
colorVar('action.primary', 'background', 'hover'); // '--tt-action-primary-background-hover'
textStyleVars('label.md'); // { fontFamily: '--tt-text-label-md-fontFamily', ... }
spacingVar('inset.control', 'md'); // '--tt-spacing-inset-control-md'
radiiVar('control'); // '--tt-radii-semantic-control'
elevationVar('modal'); // '--tt-elevation-modal'
sizingVar('hit.default'); // '--tt-sizing-hit-default'
```

## Step-by-step: Adding a New Component

### 1. Classify the component

Determine its **Responsibility** and whether composition matters (Host.Role):

```ts
// Example: building an Alert component
// Responsibility: Feedback
// No Host.Role needed (standalone)
resolveTokens({ responsibility: 'Feedback' });
// → { color: 'feedback.primary', textStyle: 'body.md', spacing: 'inset.surface', radii: 'surface' }
```

### 2. Choose the right folder

- If simple API with no namespace sub-parts → `src/components/{slug}/`
- If compound API with `Component.Root/Part` pattern → `src/composites/{slug}/`

### 3. Create the files

```
src/{components|composites}/{slug}/
├── {slug}.tsx     # React component
└── {slug}.css     # Styles consuming --tt-* tokens
```

### 4. Write the component (.tsx)

```tsx
import { SomeArk } from '@ark-ui/react/{slug}';
import * as React from 'react';
import { cn } from '../../_shared/cn';

export interface {Name}Props extends SomeArkRootProps {
  // custom props
}

export const {Name} = React.forwardRef<HTMLElement, {Name}Props>(
  ({ className, ...props }, ref) => {
    return (
      <SomeArk.Root
        ref={ref}
        className={cn('ui2-{slug}', className)}
        {...props}
      />
    );
  }
);

{Name}.displayName = '{Name}';
```

### 5. Write the CSS (.css)

Use the token resolution to choose the correct `--tt-*` vars:

```css
/* ---------------------------------------------------------------------------
 * {Name} — Responsibility: {Responsibility}
 * Token namespaces: {tokens}
 * Host: {host (if composite)}
 * ------------------------------------------------------------------------- */

.ui2-{slug} {
  font-family: var(--tt-font-sans);
  color: var(--tt-{color-prefix}-text-default);
  background-color: var(--tt-{color-prefix}-background-default);
  border-radius: var(--tt-radii-semantic-{radii});
  padding: var(--tt-spacing-{spacing}-md);
}
```

**BEM convention**: `.ui2-{slug}` for root, `.ui2-{slug}__{element}` for sub-parts.

### 6. Register in barrel and styles

1. **`src/index.ts`** — Add export:

   ```ts
   export type { {Name}Props } from './{components|composites}/{slug}/{slug}';
   export { {Name} } from './{components|composites}/{slug}/{slug}';
   ```

2. **`src/styles.css`** — Add import:
   ```css
   @import './{components|composites}/{slug}/{slug}.css';
   ```

### 7. Register in \_model

Add to `componentContracts` array in `src/_model/index.ts`:

```ts
{
  name: '{Name}',
  kind: 'component',  // or 'composite'
  responsibility: '{Responsibility}',
  cssSlug: '{slug}',
  tokens: ['{namespace1}', '{namespace2}'],
  arkPrimitive: '{slug}',
  host: '{Host}',  // composites only — omit for components
},
```

### 8. Register in test registry

Add an entry to `tests/unit/tests/componentRegistry.tsx`.
All generic contract tests run automatically.

## Token Grammar

CSS custom properties follow this grammar:

| Pattern                                   | Example                                  |
| ----------------------------------------- | ---------------------------------------- |
| `--tt-{ux}-{role}-{dimension}-{state}`    | `--tt-action-primary-background-default` |
| `--tt-text-{style}-{size}-{property}`     | `--tt-text-label-md-fontSize`            |
| `--tt-spacing-{pattern}-{context}-{step}` | `--tt-spacing-inset-control-md`          |
| `--tt-radii-semantic-{alias}`             | `--tt-radii-semantic-control`            |
| `--tt-elevation-{alias}`                  | `--tt-elevation-modal`                   |
| `--tt-sizing-{key}`                       | `--tt-sizing-hit-default`                |
| `--tt-font-{family}`                      | `--tt-font-sans`                         |
| `--tt-font-size-text-{step}`              | `--tt-font-size-text-2`                  |
| `--tt-duration-{step}`                    | `--tt-duration-md`                       |
| `--tt-easing-{name}`                      | `--tt-easing-standard`                   |

## Composition Examples

### Dialog footer buttons

```
Button "Save"    → Action + ActionSet.primary   → color: action.primary
Button "Cancel"  → Action + ActionSet.dismiss    → color: action.muted
Button "Back"    → Action + ActionSet.secondary  → color: action.secondary
```

### Field

```
Label       → Structure + FieldFrame.label            → color: content.primary, text: label.md
Input       → Input     + FieldFrame.control           → color: input.primary, text: body.md
Helper text → Structure + FieldFrame.description       → color: content.muted, text: body.sm
Error text  → Structure + FieldFrame.validationMessage → color: feedback.negative, text: body.sm
```

### Card / Panel

```
Container → Structure + (standalone)           → radii: surface, elevation: resting
Title     → Structure + SurfaceFrame.heading   → text: title.md
Body      → Structure + SurfaceFrame.body      → text: body.md
Actions   → Action    + SurfaceFrame.actions   → spacing: separation.interactive.min
```
