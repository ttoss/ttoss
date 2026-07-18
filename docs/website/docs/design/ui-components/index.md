---
title: ttoss UI Components
---

`@ttoss/fsl-ui` is the React implementation of the [FSL component model](/docs/design/design-system/components/component-model): a component library built on [React Aria Components](https://react-spectrum.adobe.com/react-aria/) where every component declares a formal semantic identity — its Entity — and that identity determines which [`@ttoss/fsl-theme` tokens](/docs/design/design-system/design-tokens/model) it may consume. Authors choose meaning (`evaluation`, `consequence`, `composition`); the theme chooses appearance. The package ships an AI-readable contract (`llms.txt` and `src/tokens/CONTRACT.md` in the published tarball) so that agents generate semantically correct UI on the first pass.

## Catalog

| Entity     | Components                                                                                                                                                                                                                                                                                     |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Action     | `Button`, `ToggleButton`, `FileTrigger`, `MenuItem`, `FormSubmit`                                                                                                                                                                                                                              |
| Navigation | `Link`, `Breadcrumbs` / `Breadcrumb`, `Tabs` / `TabList` / `Tab`                                                                                                                                                                                                                               |
| Disclosure | `Accordion` (`AccordionItem` / `AccordionTrigger` / `AccordionPanel`), `Disclosure` (`DisclosureTrigger` / `DisclosurePanel`)                                                                                                                                                                  |
| Selection  | `Checkbox`, `CheckboxGroup`, `RadioGroup` / `Radio`, `Switch`, `Select` / `SelectItem`, `ToggleButtonGroup`, `TagGroup` / `Tag`                                                                                                                                                                |
| Collection | `ListBox` / `ListBoxItem`, `GridList` / `GridListItem` (container is Collection, selectable items are Selection — ADR-007)                                                                                                                                                                     |
| Input      | `TextField`, `TextArea`, `SearchField` (each with `*Label` / `*Control` / …), `NumberField`, `Slider`                                                                                                                                                                                          |
| Overlay    | `Dialog` family (`DialogModal` / `DialogHeading` / `DialogBody` / `DialogActions`), `Menu`, `ConfirmationDialog`, `Popover`, `Tooltip`                                                                                                                                                         |
| Feedback   | `ProgressBar`, `Meter`, `Toast` / `ToastRegion`                                                                                                                                                                                                                                                |
| Structure  | **Presentational primitives** — `Surface` (depth container), `Heading` / `Text` (type scale), `Stack` (layout rhythm) — plus `Form` / `FormActions`, `Wizard` (`WizardStep` / `WizardSummary` / `WizardNavigation`), `Separator`, `Group`, `Toolbar`, `TabPanel` (the content the tabs reveal) |

Waves 1 and 2 of the full React Aria atomic catalog are complete; the heavier components (`ComboBox`, `Table`, `Tree`) and the date/time suite follow under the same pattern. Every component lands with contract tests, keyboard tests, and an axe accessibility suite.

## Customization model

Components have no `style`, `className`, or `size` props. Colors, spacing, and typography come from the theme; a different density is a different semantic component. Geometry the host legitimately owns (dialog width, menu popover sizing) is exposed as `--fsl-*` CSS custom properties with built-in fallbacks:

```css
[data-scope='dialog'] {
  --fsl-dialog-max-width: 720px;
}
```

Every element renders `data-scope` / `data-part` (plus `data-evaluation`, `data-consequence`, `data-composition` where the dimension applies) — the stable public surface for CSS targeting and tests.

## Where to go next

- [Composition guidelines](/docs/design/ui-components/composition) — how to compose the primitives and controls so "semantically correct" also reads as "well designed".
- [Component model](/docs/design/design-system/components/component-model) — the theory this package implements, including the Entity → token projection.
- [Design tokens](/docs/design/design-system/design-tokens/model) — the `@ttoss/fsl-theme` grammar the components consume.
- The package's `README.md` (quickstart) and `CONTRIBUTING.md` (authoring rules, ADRs) in `packages/fsl-ui/`.
