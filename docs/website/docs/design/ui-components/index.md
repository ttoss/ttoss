---
title: ttoss UI Components
---

`@ttoss/fsl-ui` is the React implementation of the [FSL component model](/docs/design/design-system/components/component-model): a component library built on [React Aria Components](https://react-spectrum.adobe.com/react-aria/) where every component declares a formal semantic identity — its Entity — and that identity determines which [`@ttoss/fsl-theme` tokens](/docs/design/design-system/design-tokens/model) it may consume. Authors choose meaning (`evaluation`, `consequence`, `composition`); the theme chooses appearance. The package ships an AI-readable contract (`llms.txt` and `src/tokens/CONTRACT.md` in the published tarball) so that agents generate semantically correct UI on the first pass.

## Catalog

| Entity     | Components                                                                                                       |
| ---------- | ---------------------------------------------------------------------------------------------------------------- |
| Action     | `Button`, `MenuItem`, `FormSubmit`                                                                               |
| Navigation | `Link`                                                                                                           |
| Disclosure | `Accordion` (`AccordionItem` / `AccordionTrigger` / `AccordionPanel`)                                            |
| Selection  | `Checkbox`, `RadioGroup` / `Radio`, `Switch`, `Select` / `SelectItem`                                            |
| Input      | `TextField` (`TextFieldLabel` / `TextFieldControl` / `TextFieldDescription` / `TextFieldError`)                  |
| Overlay    | `Dialog` family (`DialogModal` / `DialogHeading` / `DialogBody` / `DialogActions`), `Menu`, `ConfirmationDialog` |
| Feedback   | `ProgressBar`, `Toast` / `ToastRegion`                                                                           |
| Structure  | `Form` / `FormActions`, `Wizard` (`WizardStep` / `WizardSummary` / `WizardNavigation`)                           |

The full React Aria atomic catalog is being implemented in waves under the same pattern; each component lands with contract tests, keyboard tests, and an axe accessibility suite.

## Customization model

Components have no `style`, `className`, or `size` props. Colors, spacing, and typography come from the theme; a different density is a different semantic component. Geometry the host legitimately owns (dialog width, menu popover sizing) is exposed as `--fsl-*` CSS custom properties with built-in fallbacks:

```css
[data-scope='dialog'] {
  --fsl-dialog-max-width: 720px;
}
```

Every element renders `data-scope` / `data-part` (plus `data-evaluation`, `data-consequence`, `data-composition` where the dimension applies) — the stable public surface for CSS targeting and tests.

## Where to go next

- [Component model](/docs/design/design-system/components/component-model) — the theory this package implements, including the Entity → token projection.
- [Design tokens](/docs/design/design-system/design-tokens/model) — the `@ttoss/fsl-theme` grammar the components consume.
- The package's `README.md` (quickstart) and `CONTRIBUTING.md` (authoring rules, ADRs) in `packages/fsl-ui/`.
