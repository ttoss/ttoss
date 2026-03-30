# @ttoss/ui2

Semantic component library for ttoss, built on [Ark UI](https://ark-ui.com) primitives. Components consume `@ttoss/theme2` semantic tokens via CSS custom properties (`--tt-*`).

## Installation

```bash
pnpm add @ttoss/ui2 @ark-ui/react
```

## Setup

1. Generate CSS variables from your theme using `@ttoss/theme2`:

```ts
import { toCssVars } from '@ttoss/theme2';
import { myTheme } from './theme';

const cssString = toCssVars(myTheme).toCssString();
```

2. Include the generated CSS variables and the component stylesheet in your app:

```tsx
import '@ttoss/ui2/styles.css';
```

## Components

### Button

Responsibility: **Action** — triggers actions or commands.

```tsx
import { Button } from '@ttoss/ui2';

<Button variant="solid" size="md" onClick={handleSave}>
  Save
</Button>

<Button variant="outline" size="sm">Cancel</Button>
<Button variant="ghost">Skip</Button>
<Button variant="danger">Delete</Button>
```

**Props**: `variant` (`solid` | `outline` | `ghost` | `danger`), `size` (`sm` | `md` | `lg`), plus all native `<button>` props.

### Checkbox

Responsibility: **Selection** — choosing one or more options.

```tsx
import { Checkbox } from '@ttoss/ui2';

<Checkbox
  label="Accept terms"
  onCheckedChange={(d) => console.log(d.checked)}
/>;
```

### Switch

Responsibility: **Selection** — toggling between two states.

```tsx
import { Switch } from '@ttoss/ui2';

<Switch label="Dark mode" onCheckedChange={(d) => console.log(d.checked)} />;
```

### Dialog

Responsibility: **Overlay** — temporary layered UI above the interface.

```tsx
import { Dialog } from '@ttoss/ui2';

<Dialog.Root>
  <Dialog.Trigger>Open</Dialog.Trigger>
  <Dialog.Content title="Confirm" description="Are you sure?">
    <Button onClick={handleConfirm}>Yes</Button>
  </Dialog.Content>
</Dialog.Root>;
```

### Tooltip

Responsibility: **Overlay** — contextual information on hover.

```tsx
import { Tooltip } from '@ttoss/ui2';

<Tooltip content="More info">
  <button>Hover me</button>
</Tooltip>;
```

### Tabs

Responsibility: **Navigation** — movement across views.

```tsx
import { Tabs } from '@ttoss/ui2';

<Tabs.Root defaultValue="tab1">
  <Tabs.List>
    <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
    <Tabs.Trigger value="tab2">Tab 2</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="tab1">Content 1</Tabs.Content>
  <Tabs.Content value="tab2">Content 2</Tabs.Content>
</Tabs.Root>;
```

### Accordion

Responsibility: **Disclosure** — revealing or hiding content in place.

```tsx
import { Accordion } from '@ttoss/ui2';

<Accordion.Root collapsible>
  <Accordion.Item value="faq-1">
    <Accordion.Trigger>What is ttoss?</Accordion.Trigger>
    <Accordion.Content>A modular platform for product teams.</Accordion.Content>
  </Accordion.Item>
</Accordion.Root>;
```

### Field

Host: **FieldFrame** — fields and their supporting elements.

```tsx
import { Field } from '@ttoss/ui2';

<Field.Root>
  <Field.Label>Email</Field.Label>
  <Field.Input type="email" placeholder="you@example.com" />
  <Field.HelperText>We'll never share your email.</Field.HelperText>
</Field.Root>

<Field.Root invalid>
  <Field.Label>Name</Field.Label>
  <Field.Input />
  <Field.ErrorText>Name is required.</Field.ErrorText>
</Field.Root>
```

## Styling

All visual styles are defined in `styles.css` using CSS classes (`ui2-*`) and `--tt-*` CSS custom properties from `@ttoss/theme2`. Components use Ark UI `data-*` attributes for state-driven styling (e.g., `data-state="checked"`, `data-disabled`, `data-focus-visible`).

### Customization

Override any `--tt-*` custom property to change the component appearance. The CSS classes follow BEM-like conventions: `ui2-{component}__{element}`.
