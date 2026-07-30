# @ttoss/fsl-ui

Semantic, token-native component library for ttoss. Built on [React Aria Components](https://react-spectrum.adobe.com/react-aria/) with `@ttoss/fsl-theme` tokens.

Components are not visual variants of widgets — they are executable expressions of the [FSL](https://ttoss.dev/docs/design/design-system/fsl) semantic model. A component's identity (`Entity`, `Structure`, `Composition`, `Consequence`) determines which tokens it may consume.

## Install

```bash
pnpm add @ttoss/fsl-ui @ttoss/fsl-theme react-aria-components
```

Peer dependencies: `react >= 18`, `react-dom >= 18`. The package is ESM-only, ships `sideEffects: false`, and tree-shakes: a Button-only import costs ≈ 2.3 KB minified before shared dependencies (React Aria Components is the dominant cost and is shared across every component you use).

## Quickstart

Components read CSS-variable tokens, so the theme must be mounted once at the root:

```tsx
import { createTheme } from '@ttoss/fsl-theme';
import { ThemeProvider } from '@ttoss/fsl-theme/react';
import { Button, Icon } from '@ttoss/fsl-ui';

const theme = createTheme(); // base theme + dark alternate

export const App = () => {
  return (
    <ThemeProvider theme={theme} defaultMode="system">
      <Button
        evaluation="primary"
        icon={<Icon intent="status.success" />}
        onPress={() => {
          console.log('pressed');
        }}
      >
        Save
      </Button>
    </ThemeProvider>
  );
};
```

`icon` takes an `<Icon>` element — a glyph named by _intent_, never by file —
and Button owns its scale. `leading` (default) reinforces the command;
`iconPlacement="trailing"` announces what follows the press. Dropping
`children` gives the icon-only form: a square at the ergonomic `hit` floor,
with `aria-label` then required by the type system.

Three props carry the semantic model everywhere:

- `evaluation` — authorial emphasis (`primary`, `muted`, `negative`, …). Data-entry components (`TextField`, `Select`, `Checkbox`, …) intentionally have none: validation is the runtime `isInvalid` state, never a color prop.
- `consequence` — effect on state (`neutral`, `committing`, `destructive`). It drives mechanism: a `destructive` `ConfirmationDialog` requires a two-click armed confirmation.
- `composition` — the slot an element plays inside a parent (`primaryAction`, `dismissAction`, …). `DialogActions` reorders its children by it per platform convention.

Flow-critical labels are required props with no English defaults — `ConfirmationDialog` and `WizardNavigation` force the caller to supply localized copy (see `CONTRIBUTING.md` §6).

### Fields

Every field is one line, and every field is the same five parts — root, label,
control, description, validation message:

```tsx
<Form onSubmit={save}>
  <TextField label="Email" name="email" type="email" isRequired />
  <Select label="Role" name="role" isRequired placeholder="Choose a role">
    <SelectItem id="admin">Admin</SelectItem>
  </Select>
  <FormSubmit>Save</FormSubmit>
</Form>
```

A required field marks its own label; turn the marker off for a whole form with
`<Form necessityIndicator="none">` and the field stays required either way. Omit
`errorMessage` and the browser's own constraint message is shown instead —
already localized, and usually the better copy. A field works on its own too,
but `Form` is the validation scope: that is what turns a required field's empty
value into a blocked submit, with focus landing on the first field that failed.

Reach for the slot form (`TextFieldLabel`, `TextFieldControl`, …) when the
arrangement is unusual. The two are mutually exclusive by type, so passing copy
props _and_ children is a compile error rather than a precedence rule.

Fields that share their box with something else — `SearchField`'s glyph and clear
button, `NumberField`'s steppers, `ComboBox`'s chevron — split it in two:
`data-part="frame"` paints and holds the adornments, and `data-part="control"` is
the element you operate. `control` names the operated element on every field, so
a selector that types into one always resolves something typeable.

## Customization

Composites accept no `style`/`className`. Geometry the host legitimately owns is exposed as `--fsl-*` CSS custom properties with built-in fallbacks:

```css
[data-scope='dialog'] {
  --fsl-dialog-max-width: 720px;
}
```

The registered knobs and the full policy live in `src/tokens/CONTRACT.md` §7.

Icons are semantic: `Icon` (public since ADR-010) is named by intent (`<Icon intent="status.success" />`), never by glyph. The theme maps intents to [Iconify](https://iconify.design/) glyphs (default set: Lucide), registered offline (no runtime network fetch); color inherits via `currentColor` and size comes from `vars.sizing.icon.*`.

## AI-first surface

The published tarball ships the machine-readable ground truth:

- **`llms.txt`** — distilled contract: semantic model, component catalog, Entity → token map, state cascade, integration rules.
- **`src/tokens/CONTRACT.md`** — the full Layer-2 authoring contract. Given an `Entity`, it specifies the exact `vars.*` paths, state cascade, and `data-*` conventions a component must use.

## Contributing

- **`src/semantics/taxonomy.ts`** — the FSL vocabulary and legality matrices.
- **`CONTRIBUTING.md`** — how to add components, entities, and taxonomy terms; hard rules; package ADRs.

Contract tests auto-discover every `*Meta` export from `src/index.ts` and validate it against the taxonomy + token hygiene rules. No manual registry. `pnpm run verify:treeshake` proves the barrel still tree-shakes.
