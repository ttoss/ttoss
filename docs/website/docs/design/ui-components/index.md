---
title: ttoss UI Components
---

`@ttoss/fsl-ui` is the React implementation of the [FSL component model](/docs/design/design-system/components/component-model): a component library built on [React Aria Components](https://react-spectrum.adobe.com/react-aria/) where every component declares a formal semantic identity — its Entity — and that identity determines which [`@ttoss/fsl-theme` tokens](/docs/design/design-system/design-tokens/model) it may consume. Authors choose meaning (`evaluation`, `consequence`, `composition`); the theme chooses appearance. The package ships an AI-readable contract (`llms.txt` and `src/tokens/CONTRACT.md` in the published tarball) so that agents generate semantically correct UI on the first pass.

## Catalog

| Entity     | Components                                                                                                                                                                                                                                                                                                                                                                                          |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Action     | `Button` (command silhouette), `ActionButton` (utility silhouette), `ToggleButton`, `FileTrigger`, `MenuItem` (inside `Menu`), `FormSubmit`, `ActionMenu` (overflow trigger), `ContextualHelp` (the ⓘ beside a field's label)                                                                                                                                                                       |
| Navigation | `Link`, `Breadcrumbs` / `Breadcrumb`, `Tabs` / `TabList` / `Tab`                                                                                                                                                                                                                                                                                                                                    |
| Disclosure | `Accordion` (`AccordionItem` / `AccordionTrigger` / `AccordionPanel`), `Disclosure` (`DisclosureTrigger` / `DisclosurePanel`)                                                                                                                                                                                                                                                                       |
| Selection  | `Checkbox`, `CheckboxGroup`, `RadioGroup` / `Radio`, `Switch`, `Select` / `SelectItem`, `ToggleButtonGroup`, `TagGroup` / `Tag`                                                                                                                                                                                                                                                                     |
| Collection | `ListBox` / `ListBoxItem`, `GridList` / `GridListItem`, `Table` (`TableHeader` / `TableColumn` / `TableBody` / `TableRow` / `TableCell`) — the container is Collection, selectable items (`ListBoxItem`, `GridListItem`, `TableRow`) are Selection (ADR-007)                                                                                                                                        |
| Input      | `TextField`, `TextArea`, `SearchField` (each with `*Label` / `*Control` / …), `NumberField`, `Slider`, `FieldGroup` (one label over several controls), `ComboBox` / `ComboBoxItem` (typeahead-filtered list — a freeform channel makes a picker Input, ADR-012; items are Selection, ADR-007)                                                                                                       |
| Overlay    | `Dialog` family (`DialogModal` / `DialogHeading` / `DialogBody` / `DialogActions`), `Menu`, `ConfirmationDialog`, `Popover`, `Tooltip`, `Drawer`                                                                                                                                                                                                                                                    |
| Feedback   | `ProgressBar`, `Meter`, `StatusLight`, `Toast` / `ToastRegion`                                                                                                                                                                                                                                                                                                                                      |
| Structure  | **Presentational primitives** — `Surface` (depth container), `Heading` / `Text` (type scale), `Stack` (layout rhythm), `Box`, `Grid`, `Container`, `AppShell`, `List` / `ListItem`, `Icon`, `Badge`, `Code` — plus `Form` / `FormActions`, `Wizard` (`WizardStep` / `WizardSummary` / `WizardNavigation`), `Separator`, `Group`, `ButtonGroup`, `Toolbar`, `TabPanel` (the content the tabs reveal) |

Waves 1 and 2 of the full React Aria atomic catalog are complete, and Wave 3 has landed `Table` and `ComboBox`; `Tree` and the date/time suite are deferred until an app asks for them. Every component lands with contract tests, keyboard tests, and an axe accessibility suite.

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
