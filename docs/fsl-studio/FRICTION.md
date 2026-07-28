# Friction log — FSL Studio (P1 adoption)

> The Studio evidence channel — Program P1 and every `BLUEPRINT.md` slice
> after it (see `packages/fsl-ui/INTERNAL/ROADMAP.md` §Program). Every
> hand-rolled style, missing component, confusing API, or `llms.txt`/CONTRACT
> gap found while building the Studio is filed here.
> **This log is the fsl-ui v1 backlog.** Doc gaps are fixed immediately;
> package gaps stay open until shipped. One entry per finding — append only.

Severity: `blocker` (cannot express the flow inside the system) ·
`gap` (expressible only with a workaround) · `paper-cut` (works, reads wrong).

## Open items (derived — the entry below is always the source of truth)

Twenty open, grouped by the _kind of decision_ each one needs rather than by
severity, because that is what makes a review round plannable. Regenerate by
grepping `Status:** open`; do not edit an entry through this list.

**Needs an owner decision on the colour/type model** — measured, options written, nothing to build until one is picked:

| #     | What                                                                                                                                                                                                                                           | Where the evidence is                                                  |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| F-024 | How the action tree expresses "borrow the surface, paint nothing". Recommended answer: **omit** `action.muted.background.default` rather than add a `transparent` primitive; the named cost is the audit that proves the quiet ink is legible. | `Overlay/ActionMenu` → `Emphasis`, dark: `#161616` on a `#262626` card |
| F-029 | Same question for a valence: a destructive menu row has no "negative **ink** on a surface" rung, so it either looks like every other row or fills red. Four candidate shapes written.                                                          | `Overlay/ActionMenu`, any mode                                         |
| F-027 | The border-vs-background contrast inventory audits the **light** bundle only; the dark alternate has ~90 undecided sub-threshold contexts, which is the hole that let a dark-mode collapse in.                                                 | `colors.test.ts` reads `entry.base`, never `entry.alt`                 |
| F-021 | Control **type** is container-fluid, so it shrinks in narrow containers while the hit target grows for touch. ADR-019 settled this for control _geometry_ and never extended the ruling to type.                                               | measured 14–16px across the range                                      |

**Component gaps — something to build, scope already understood:**

| #     | What                                                                                                                                                                                           |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-002 | `Link` cannot mark `aria-current`: the theme ships `navigation.*.text.current` and nothing reads it. (F-017 is its evidence: the Studio uses vertical `Tabs` as navigation to work around it.) |
| F-004 | No named narrow width step (an auth card, ~20–26rem) between `reading` and `surface`.                                                                                                          |
| F-010 | No neutral tag primitive for descriptive (non-status) labels.                                                                                                                                  |
| F-016 | No semantic list primitive for content lists.                                                                                                                                                  |
| F-019 | Anchored popovers size to content, not to their trigger — needs the `--trigger-width` namespace decision.                                                                                      |
| F-023 | `AppShell` has no narrow-container behaviour: the shell overflows at 390px (442px scroll width). The owner deferred the IA decision — drawer vs off-canvas vs stacking.                        |

**Contract / a11y debt — the component works but its published promise does not hold:**

| #     | What                                                                                                                                                                                                                                                                                                         |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| F-026 | `data-part="control"` on two nested elements — measured in three components, not one. The class guard exists (invariant #12, P3 Slice 5 ⓠ). **`ComboBox` fixed** (forms C1: the frame is `data-part="frame"`, `control` stays on the operated input); `SearchField` and `NumberField` remain, and fall in D. |
| F-030 | A composite sub-part that is its own root collides with its host's root: `menu/root` addresses the popover **and** every row. §5's scope-reuse convention vs `MenuItem.structure`.                                                                                                                           |
| F-028 | `Toolbar` claims `role="toolbar"` but is not a single tab stop — `useToolbar` cannot manage arbitrary children's `tabindex`. Either upstream fixes it or we own a roving model for _all_ children.                                                                                                           |

| F-033 | A standalone/required `Checkbox` or `Switch` turns invalid (measured `aria-invalid`) but has **no message part** — parts are `root, selectionControl, label`. F-009's shape, one family over. |
| F-032 | The validation message is the same ink as the label (measured light **and** dark), so the invalid state rests on border colour alone. Second half of F-009, on a component whose message part exists. |
| F-031 | `invalid` outranks `focused`/`active`/`hover` in `STATE_PRIORITY`, so an invalid field goes dead to hover and press. S2 keeps a full cascade inside its negative valence (six tokens). |

**Ecosystem / token vocabulary:**

| #     | What                                                                                |
| ----- | ----------------------------------------------------------------------------------- |
| F-005 | The ADR-004 forms recipe drags the legacy field suite into a consumer.              |
| F-020 | The focus-ring gap is a component literal (`FOCUS_RING_OFFSET`), not a theme token. |

---

## Entries

### F-001 — `llms.txt` catalog missing the composition layer

- **Date:** 2026-07-22 · **Surface:** `packages/fsl-ui/llms.txt` · **Severity:** gap · **Status:** ✅ fixed (same day)
- The machine-readable catalog omitted `AppShell`, `Box`, `Grid`, `Container` (Structure), `Badge` (Feedback), and `Code` (Structure) — the ADR-009 presentational layer never landed in the AI surface. An agent consuming only `llms.txt` (the shipped promise) cannot discover the layout primitives and would hand-roll layout CSS.
- **Action:** entries added to the `llms.txt` catalog.

### F-002 — `Link` has no `current`-state affordance

- **Date:** 2026-07-22 · **Surface:** `@ttoss/fsl-ui` `Link` / `resolveInteractiveStyle` · **Severity:** gap · **Status:** open
- The theme ships `colors.navigation.*.text.current`, but `InteractiveStates` has no `current` entry and `Link` never reads it — `aria-current` renders identically to any other link. A sidebar built from `Link`s cannot mark the active page without host CSS.
- **Workaround:** the Studio shell uses a vertical `Tabs` as primary navigation (Navigation entity; selected state and keyboard support from React Aria).
- **Backlog:** support `current` on `Link` (RAC exposes no `isCurrent`, so likely via an explicit prop mapped to `aria-current` + the `current` color).

### F-003 — `Tab` selected indicator is block-end even in vertical orientation

- **Date:** 2026-07-22 · **Surface:** `@ttoss/fsl-ui` `Tab` · **Severity:** paper-cut · **Status:** ✅ fixed (P3 polish pass)
- The selected-tab indicator is positioned `insetBlockEnd: 0` unconditionally, so in `orientation="vertical"` (sidebar use) it underlines each item instead of marking the start edge — the conventional affordance for vertical navigation.
- **Action:** `Tabs` now provides its orientation through a context; `Tab` renders the indicator on the inline-start edge when vertical (block-end underline stays for horizontal). Regression tests cover both edges.

### F-004 — no named width threshold for a narrow centered card

- **Date:** 2026-07-22 · **Surface:** `@ttoss/fsl-ui` `Box`/`Container` sizing vocabulary · **Severity:** gap · **Status:** open
- `Box.maxWidth` and `Container.size` offer only `surface` (page cap) and `reading` (long-form measure). An auth card (~20–26 rem, centered) — one of the most common real layouts — has no in-system cap.
- **Workaround:** the Blocks gallery places the login card in `Grid minColumnWidth="lg"` beside a companion panel, so the card never spans the page. A standalone centered auth page still cannot be expressed.
- **Backlog:** a named narrow step in the width vocabulary (e.g. `card`), or `Grid`-level column caps.

### F-005 — ADR-004 forms recipe drags the legacy field suite

- **Date:** 2026-07-22 · **Surface:** fsl-ui ADR-004 / `@ttoss/forms` packaging · **Severity:** gap · **Status:** open
- The sanctioned bridge recipe imports `Controller`/`useForm`/`z`/`zodResolver` from `@ttoss/forms`, whose only entry also exports the legacy `FormField*` suite with `@ttoss/ui`, `@ttoss/components`, and `@ttoss/react-i18n` as peer dependencies — unacceptable baggage for an fsl-first app.
- **Workaround:** the Studio imports `react-hook-form`, `zod`, and `@hookform/resolvers/zod` directly (same versions syncpack enforces).
- **Backlog:** a lean re-export subpath (e.g. `@ttoss/forms/core`) or update ADR-004's recipe to name the direct imports.

### F-006 — `TabList` ignored vertical orientation

- **Date:** 2026-07-22 · **Surface:** `@ttoss/fsl-ui` `TabList` · **Severity:** blocker (for sidebar navigation) · **Status:** ✅ fixed (same day)
- The JSDoc promised "a row (or column when the parent `Tabs` is vertical)", but the style was a static row with a block-end divider — `orientation="vertical"` rendered the sidebar tabs horizontally, overflowing the rail. Found by the Studio shell's visual check, invisible to the DOM-level test suite.
- **Action:** `TabList` style now reads the RAC `orientation` render prop — column direction, `gap.stack`, and an inline-end divider when vertical. Regression tests added for both orientations.

### F-007 — multi-field rows have no column alignment: Table demanded

- **Date:** 2026-07-22 · **Surface:** `@ttoss/fsl-ui` catalog (Settings block) · **Severity:** gap · **Status:** ✅ fixed (same day — `Table` shipped, Settings retrofitted)
- The team-members list is name + email + role + actions per row. `GridList` rows are independent flex lines, so fields do not column-align across rows (badges and actions sit ragged, scanning down a column is impossible), and there is no columnheader semantics or sorting. This is the evidence the ROADMAP predicted: a Settings/CRUD flow demands `Table` (root + columnheader + row + cell), not a list.
- **Action:** `Table`/`TableHeader`/`TableColumn`/`TableBody`/`TableRow`/`TableCell` shipped in fsl-ui (ADR-007 split, sorting via `action.sortAscending`/`sortDescending` intents, row-click selection). The Settings block now renders a sortable table. Deferred until demanded: checkbox selection column, column resizing, virtualization.

### F-008 — `Select` without typeahead: ComboBox demanded

- **Date:** 2026-07-22 · **Surface:** `@ttoss/fsl-ui` catalog (Settings block) · **Severity:** gap · **Status:** ✅ fixed (2026-07-24 — `ComboBox` shipped, invite flow retrofitted)
- The invite flow was designed with a timezone field and the field was **dropped** because a 30+-option `Select` popover is scan-only — no typeahead, no filtering. A component gap changed the product design; that is the strongest form of adoption evidence. Role (3 options) stayed a `Select`, which is its correct scale.
- **Action:** `ComboBox`/`ComboBoxItem` shipped in fsl-ui (Wave 3) — text input with a typeahead-filtered list, a `validationMessage` part `Select` still lacks (F-009), and the `--fsl-combo-box-max-height` knob so a long list scrolls instead of running off-screen. The Meridian invite dialog now carries the restored **Timezone** field over 35 zones, and the roster shows the column. **ADR-012** records the governing call the component forced: a freeform channel makes a picker `Input`, not `Selection` — so `ComboBox` is Input while `Select` stays Selection, and the deferred `Autocomplete` inherits the rule.
- **FSL validation note:** the ROADMAP's anatomy claimed "taxonomy additions needed: none", which held only half. `item` was already legal on Selection, but `trigger` is not a legal `Input` role — the chevron ships as an internal data-part with no `*Meta`, the same resolution NumberField's steppers and Slider's track reached (ADR-008). Zero taxonomy changes, third component in a row.

### F-009 — `Select` has no validation-message part

- **Date:** 2026-07-22 · **Surface:** `@ttoss/fsl-ui` `Select` (+ `Text` tones) · **Severity:** gap · **Status:** ✅ fixed (2026-07-28 — forms C2)
- `TextField` composes `TextFieldError`; `Select` only tinted its trigger via the `invalid` State — there was nowhere to render the message. The invite form hand-assembled a live-region `Text` under the Select, and `Text` has no negative/danger tone, so the message could not even be tinted in-system.
- **Action:** `Select` takes `description` + `errorMessage`, rendering React Aria's `Text slot="description"` and `FieldError` — which work here although they are dead on a lone `Checkbox`, because `Select` supplies a `FieldErrorContext` holding its real validation state (read in `Select.mjs`). Both are INTERNAL data-parts, the resolution `CheckboxGroup` already reached: the Selection entity has no `description`/`validationMessage` structural role and the evidence still does not justify widening the vocabulary.
- **The gap was a class, not an instance, and measuring it is what showed that.** Probed across all nine field roots before writing anything: the necessity marker B1 shipped reached **three** of them, `RadioGroup` had F-009's exact shape one family over, and three files carried a private helper computing colours the anatomy already computed. So the fix is one shared envelope (`FieldLabelPart` / `FieldDescriptionPart` / `FieldValidationMessagePart` in `Field/anatomy.tsx`), taking `scope` as a prop so no published attribute changes, with a table-driven guard over the family and a named exception list for `Switch` and `Slider`.
- **Found while measuring it, and fixed in the same pass:** a split control's **frame** declared no type, so the same `ComboBox` resolved `16px` in Storybook and `18px` inside the Studio's invite dialog — an undeclared frame inherits the host's paragraph size and hands it to every adornment in it. The row's type now sits on the frame too, asserted by invariant #11 for both control shapes.
- **What is still open here** is the second half, tracked as F-032: the message renders in the same ink as the label. Re-measured on `Select`'s new part in both modes — `rgb(22,22,22)` light, `rgb(255,255,255)` dark — while its trigger border carries `rgb(220,38,38)` / `rgb(252,165,165)`, byte-identical to `TextField`'s invalid border.

### F-010 — no neutral tag primitive for descriptive labels

- **Date:** 2026-07-22 · **Surface:** `@ttoss/fsl-ui` `Badge` semantics · **Severity:** paper-cut · **Status:** open
- Role chips ("Admin", "Editor") are descriptive, not evaluative — but the only chip-shaped primitive is `Badge` (Entity = Feedback, valence vocabulary). The block uses `Badge` with the neutral `primary` evaluation, which renders fine but blurs the Feedback entity. `TagGroup` is Selection (interactive), so it is not the answer either.
- **Backlog:** decide whether descriptive chips are a legitimate `Badge` use (document it) or a small Structure-entity `Tag` primitive.

### F-011 — Table sorting types leaked a react-aria-components import

- **Date:** 2026-07-22 · **Surface:** `@ttoss/fsl-ui` `Table` API · **Severity:** paper-cut · **Status:** ✅ fixed (same day)
- Typing `sortDescriptor`/`onSortChange` state required importing `SortDescriptor` from `react-aria-components` — a transitive dependency the consumer would have to install directly (pnpm isolation blocks the import otherwise). Found while retrofitting this block.
- **Action:** fsl-ui re-exports `SortDescriptor`/`SortDirection` from its root entry.

### F-012 — icons never rendered in production builds (silent addIcon rejection)

- **Date:** 2026-07-22 · **Surface:** `@ttoss/fsl-ui` Icon layer (`glyphs.ts`) · **Severity:** blocker · **Status:** ✅ fixed (same day)
- Two stacked silent failures, found only by checking a real browser (the Table sort arrow was missing — then so was every other glyph: Select chevron, Toast close, Checkbox check): (1) camelCase intents produced Iconify-invalid registry names (`fsl-ui:action-sortAscending` — Iconify allows only lowercase `[a-z0-9-]`); (2) far worse, Node-mode CJS interop in Vite/Rolldown bundles wraps the per-icon lucide modules so `addIcon` received `{ __esModule, default: data }` instead of the icon data — **every registration since B1 was silently rejected in production builds** and every icon fell back to a (blocked) Iconify API fetch. Jest never saw it: Babel interop unwraps `.default`, and jsdom asserts attributes, not rendered glyphs.
- **Action:** `iconifyName` kebab-cases camelCase humps; `unwrapGlyph` normalizes both interop shapes; `ensureIconGlyphs` now **throws** when `addIcon` returns false (registration failure is a hard bug, never silent); regression tests for name validity. Verified in the built Studio: glyph status `rendered`, sort arrow visible.
- **Lesson for the gate:** DOM-level suites cannot see this class of failure — the per-block visual check in a real browser is load-bearing, not cosmetic.

### F-013 — dataviz extension ships no typed vars mirror

- **Date:** 2026-07-22 · **Surface:** `@ttoss/fsl-theme/dataviz` · **Severity:** gap · **Status:** ✅ fixed (2026-07-24 — `datavizVars` shipped)
- The foundation ships `vars` (typed CSS-var mirror), but the first-party dataviz extension does not — chart code must hand-roll the README's `buildVarsMap` recipe, including an `as CssVarsMap<Extended>` cast (the documented direct assignment does not type-check against the widened shape). Every dataviz consumer will repeat this boilerplate.
- **Workaround:** `src/theme.ts` builds `studioVars` with the cast.
- **Action:** `datavizVars` shipped from `@ttoss/fsl-theme/dataviz` — a typed `var(--tt-dataviz-*)` mirror of the dataviz semantic subtree (names derive from paths, so it is theme-independent). The Studio chart consumes it; the cast recipe stays documented for third-party extensions.

### F-014 — no display-scale Text variant for stat values

- **Date:** 2026-07-22 · **Surface:** `@ttoss/fsl-ui` `Text` vocabulary · **Severity:** gap · **Status:** ✅ fixed (P3 polish pass)
- KPI tiles want a large numeral, but `Text` caps at `body-lg` and the display/headline type steps are reachable only through `Heading` (h1–h6 document semantics — a stat value is not a heading). The dashboard's numbers render at body scale, visibly under-weighted for the pattern.
- **Action:** `Text` gained `variant="display-sm"` — the display type step without heading semantics, documented as the stat step. The dashboard KPIs and pricing amounts now use it with `numeric="tabular"`.

### F-015 — feature-list glyphs demanded a public Icon

- **Date:** 2026-07-22 · **Surface:** `@ttoss/fsl-ui` Icon (ADR-005 internal-only clause) · **Severity:** gap · **Status:** ✅ fixed (same day — ADR-010)
- The Pricing block's feature lists need checkmark glyphs outside any shipped component — the exact promotion trigger ADR-005 left open. Without a public `Icon`, blocks would hand-author SVG (the drift ADR-005 exists to prevent).
- **Action:** `Icon` promoted to a public export (ADR-010) with `iconMeta`, intent types, and the curated `ICON_INTENTS` registry; `status.success` intent added (circled check, distinct from `selection.checked`). The standalone `@ttoss/fsl-icon` package stays parked — its named trigger is a consumer that wants icons without fsl-ui.

### F-016 — no semantic list primitive for content lists

- **Date:** 2026-07-22 · **Surface:** `@ttoss/fsl-ui` catalog (Pricing block) · **Severity:** paper-cut · **Status:** open
- Marketing feature lists want `ul`/`li` semantics, but `Stack` renders a div and `Text` renders only p/span/div. The block hand-applies `role="list"`/`role="listitem"` on Stacks — accessible, but every content list will repeat this.
- **Backlog:** a `List`/`ListItem` Structure primitive, or an `as`/role affordance on `Stack`, via governance.

### F-017 — Tabs-as-navigation demands panel co-location and a width workaround

- **Date:** 2026-07-24 · **Surface:** `@ttoss/fsl-ui` `Tabs` (S2 shell) · **Severity:** gap · **Status:** open — evidence for the F-002 backlog
- Two stacked findings while wiring the S2 sidebar navigation with the recorded F-002 workaround (vertical `Tabs` as primary nav): (1) a `TabList` with **no TabPanels** emits `aria-controls` pointing at a nonexistent panel — axe fails with `aria-valid-attr-value`, so the nav-only usage v2 shipped was silently invalid ARIA; (2) fixing it by spanning one `Tabs` scope across the app frame (TabList in the AppShell sidebar, TabPanel in the main region — RAC context supports the separation) collides with the `Tabs` root's co-located layout: it imposes `display: flex; flex-direction: row`, which shrinks an `AppShell` child to content width.
- **Workaround:** the whole frame lives inside one `Tabs`; a `Box width="full"` wrapper restores the AppShell width; each route's page renders inside its real `TabPanel`, so tab semantics are genuine (selection = client-side routing) and axe passes.
- **Backlog:** strengthens F-002 — primary navigation wants a real affordance (Link `current` state or a Navigation-entity nav list), not tab semantics contorted around an app frame.

### F-018 — the container-fluid engine has no container: `cqi` resolves against the viewport everywhere

- **Date:** 2026-07-24 · **Surface:** `@ttoss/fsl-theme` fluid scales + `@ttoss/fsl-ui` layout primitives · **Severity:** gap · **Status:** ✅ fixed (same day — fsl-ui ADR-011)
- The theme's type/spacing ramps are declared **container-fluid** (`families/typography.ts`: "container query units (cqi) as the preferred fluid step"; ADR-019/020: "layout adapts to _container_ (cqi)") — but no `container-type` is ever established: not by `ThemeProvider`/preflight, not by `Surface`/`Grid`/`Container`/`AppShell`, and no doc instructs the host to create one. Per the CSS spec, `cqi` without an ancestor container resolves against the viewport, so the engine is viewport-fluid in practice.
- **Observed failure (Dashboard KPI tiles):** `display.3 = clamp(28px, calc(1.6cqi + 20px), 40px)` rendered 36.384px inside a 220px grid track at a 1024px viewport (1.6% × 1024 + 20) — type and inset sized for the page, not the tile; the value+delta row (196px min-content) overflowed the card by 11px. Had the tile been the container, the clamp would have bottomed out at 28px and the content would fit. The whole class "oversized internals in narrow containers" (grid tiles, sidebars, asides) follows.
- **Workaround (Studio):** the delta badge moved to the label row (`justify="between"`, `wrap`) and the KPI grid floor rose to `minColumnWidth="sm"` — floors must currently be picked against content min-width at the **viewport-resolved** clamp values, which is guesswork.
- **Action:** fsl-ui **ADR-011** — definite-width layout primitives establish `container-type: inline-size`: `Grid` hosts each child in a `data-part="item"` size container, `AppShell` marks its four regions, `Container` marks its root; `Surface` is explicitly rejected (content-sized in horizontal Stacks — containment would collapse it). Verified in a real browser: tile internals now scale to the track (the KPI grid returned to the `xs` floor, four-across, no overflow at 800–1920px). The containment contract is stated in fsl-ui `llms.txt`; the full resolved-type guarantee (browser-measured) is noted in ADR-011 as jsdom cannot compute container queries.

### F-019 — anchored popovers size to content, not to their trigger

- **Date:** 2026-07-24 · **Surface:** `@ttoss/fsl-ui` `ComboBox` / `Select` popovers vs the CONTRACT var-namespace ban · **Severity:** paper-cut · **Status:** open
- Found in the mandatory browser check of the S2 invite dialog: the timezone `ComboBox` popover renders **158px wide against a 307px input** (126px in dark, where the filtered set is one short label). Every reference-grade combobox matches the list width to the field — a list visibly narrower than the control it belongs to reads as unfinished. `Select` has the same behaviour, so this is a shared trait of the anchored-surface pattern, not a ComboBox regression.
- **Cause:** React Aria publishes the measured trigger width to the popover as `--trigger-width`, but CONTRACT §7 / the contract test ban reading any CSS variable outside the `--tt-`/`--fsl-` namespaces, so no component may consume it. The ban is right in the general case (it stops arbitrary vars leaking into consumers) and simply has no carve-out for vars the underlying primitive itself publishes.
- **Not worked around:** consuming `var(--trigger-width)` would need a contract change, and inventing an `--fsl-combo-box-min-width` knob would only paper over it with a number nobody can pick correctly. Filed instead of patched.
- **Backlog:** decide via governance whether the namespace rule admits a named allowlist of RAC-published positioning vars (`--trigger-width`, `--trigger-anchor-point`). One ADR would unblock both `ComboBox` and `Select`.

### F-020 — focus-ring gap is not a theme token

- **Date:** 2026-07-25 · **Surface:** `@ttoss/fsl-theme` `semantic.focus.ring` / `@ttoss/fsl-ui` `tokens/focusRing.ts` · **Severity:** paper-cut · **Status:** open
- Found in the P3 Slice 2 review: the reference system treats the gap between a control's edge and its focus ring as a first-class token (Spectrum: 2px ring + 2px gap), but `semantic.focus.ring` carries only `width`/`style`/`color` — the offset had no home, so components applied it ad hoc (11 of the ring's call sites were flush while `Select`/`Checkbox`/`Switch` floated at 2px — an inconsistency invisible to DOM-level tests).
- **Workaround (shipped with Slice 2):** `FOCUS_RING_OFFSET = '2px'` as a named constant in fsl-ui `tokens/focusRing.ts` (the ring's single owner), applied to all flush call sites; clipped-container insets (menu items, table rows) stay bespoke by design.
- **Backlog:** promote the gap to `semantic.focus.ring.offset` via governance so themes can retune it (a compact theme may want 1px, a playful one 3px). Type-level change to `ThemeTokens` — beyond a P3 value tune.

### F-021 — control text is container-fluid, so it shrinks exactly where it should grow

- **Date:** 2026-07-25 · **Surface:** `@ttoss/fsl-theme` `core.font.scale.text.*` consumed by `semantic.text.{label,action}` · **Severity:** gap · **Status:** open
- Found while measuring Button against the reference system (P3 Slice 4 ①). Control text rides the container-fluid ramp (`text.2 = clamp(14px, 0.7cqi + 11px, 16px)`), so a Button in a narrow container renders **14px** and the same Button on a wide surface renders **16px**. The reference system moves the opposite way: its control text is a fixed step per size that steps **up** on touch/mobile (14px → 17px), because a narrow viewport usually means a finger, not a smaller need.
- ADR-019/020 already ruled that _control geometry_ is not container-fluid (`hit` is rem-anchored, with a coarse-pointer override) — but the ruling was never extended to control **type**, which still rides `cqi`. The result is a control whose target grows for touch while its label shrinks.
- **Not worked around:** nothing in the Studio is broken by it today (the measured range is 14–16px, both legible), and picking a direction is a theme-model decision, not a value tune.
- **Backlog:** an ADR extending ADR-019's non-fluid ruling from control geometry to control typography — either a rem-anchored control type step, or a coarse-pointer step-up mirroring `applyCoarseHitOverrides`. Touches `families/typography.ts` and the emitter, so it is governance, not P3.

### F-022 — glyphs sat 2px high wherever their host was not a flex container

- **Date:** 2026-07-25 · **Surface:** `@ttoss/fsl-ui` `Button` / `Select` / `Disclosure` / `Accordion` / `Checkbox` glyph hosts · **Severity:** paper-cut · **Status:** ✅ fixed (same day)
- Reported by the owner on the new Button icon ("o ícone está deslocado pra cima"), then measured across every glyph-bearing component in a real browser. The offset correlated exactly with the host's `display`: hosts that happened to be flex containers measured **0**, hosts in normal flow measured **−2px** (`Button` icon, `Select` icon, `Disclosure`/`Accordion` indicator) or **−1px** (`Checkbox` indicator).
- **Cause:** `iconify-icon` is an inline-level box, so in a non-flex host it participates in **baseline** alignment — the glyph's bottom sits on the host's text baseline and the descender space of the host's inherited font falls below it. The host box ended up 4px taller than the 18.19px glyph (22.19px), and centring the _host_ therefore left the glyph high by half the difference. `Icon` already set `lineHeight: 1` on itself, which does nothing: the strut belongs to the host, not the glyph.
- **Action:** `src/tokens/iconSlot.ts` — `ICON_SLOT_STYLE` (inline-flex + centred + `flexShrink: 0`), applied to every glyph host (`Button`, `Select`, `Disclosure`, `Accordion`, `Checkbox`, and `SearchField`'s adornment for consistency). Re-measured in Chromium: **offset 0 in all 16 cases**, and each host's height now equals its glyph's. Deliberately _not_ fixed by blockifying `Icon` itself — the public `Icon` must stay usable inline within a text run (the F-015 feature-list case), so the host owns the layout and the glyph stays layout-agnostic.
- **Guard:** contract invariant #9 (`components.contract.test.tsx`) asserts every span-shaped glyph host declares the centring flex box, across all DOM fixtures — a new component cannot reintroduce the drift.
- **Lesson (again, after F-012):** this class of defect is invisible to DOM-level suites _and_ to a casual look at a screenshot — it took a measured comparison of computed boxes. The per-delivery browser check needs to include measurement, not just eyeballing.
- **Second round, same day — box-centred is not optically centred.** With the hosts fixed, the owner reported the glyph now reading _low_. Box measurement said 0 (glyph centre = label-box centre = button centre), so the answer had to come from measuring **ink**: the drawn glyph spanned 13.64px against the label's 12px cap height, overhanging the cap line by 0.82px and — the part the eye actually catches — the **baseline** by 0.82px. Anything crossing below the baseline reads as sinking. Both owner reports were correct; the second was a _size_ defect, not a _box_ defect.
- **Action (round 2):** new sizing step `semantic.sizing.icon.text` → `{core.sizing.relative.em}` (1em), exposed as `<Icon size="text">`, forced by `Button` on its glyph and adopted by the `Select`/`ComboBox` chevrons (same optical situation — a glyph beside its value text). Because the step is _relative_, the glyph's ink equals the accompanying text's cap-height band at **any** text size: re-measured overshoot is exactly **0.00 top / 0.00 bottom**, with no magic offset anywhere. The fixed steps (`sm`/`md`/`lg`) stay correct for standalone glyphs, which have no baseline to answer to. `sizing.test.ts` asserts the step resolves to the relative primitive so the ramp exemption stays deliberate; `Button.test.tsx` asserts the button overrides a caller-supplied step.

### F-023 — `AppShell` has no narrow-container behaviour: the shell overflows on a phone

- **Date:** 2026-07-25 · **Surface:** `@ttoss/fsl-ui` `AppShell` (+ Meridian's use of it) · **Severity:** gap · **Status:** open
- Found while answering an owner question about resolved type and padding at 1920×1080 vs 390×844. At 390px the document scrolls to **442px** (52px of horizontal overflow): `AppShell` composes its body as a fixed grid — `bodyColumns()` emits `<sidebarWidth> minmax(0, 1fr)` — with no breakpoint, container query, or prop that lets the start sidebar collapse. The rail keeps its full width, the main region cannot shrink below its content, and the shell pushes past the viewport. Every page inherits it, so the Meridian screens are unusable on a phone even though each individual component behaves correctly at that size (measured in isolation: the Button resolves 14px/48px-tall and stays inside its box).
- **Not worked around:** the honest fix is a component affordance, not app CSS, and the shape of it is a design decision (drawer over the content · off-canvas with a trigger · sidebar stacking above the main region · a `collapseBelow` prop vs. an automatic container query). Picking one without the owner would bake an IA decision into a layout primitive.
- **Backlog:** decide the narrow-container contract for `AppShell` and implement it; then re-run the visual ritual at a phone viewport, which the ritual does not currently require — S2 shipped with desktop-only verification (BLUEPRINT's ritual says "light and dark", never "narrow and wide").
- **Note on scope:** this is _not_ a defect in the P3 aesthetic work. Type and spacing resolve sensibly at 390px on their own (heading 28→20px, body 18→16px, control text 16→14px, `hit` 32→48px via the coarse-pointer override). What is missing is the shell's response to the width.

### F-024 — no transparent resting fill, so the "quiet" toolbar posture is approximated

- **Date:** 2026-07-25 · **Surface:** `@ttoss/fsl-theme` `semantic.colors.action.muted.background.default` · **Severity:** paper-cut · **Status:** open
- Found while shipping `ActionButton` (P3 Slice 4 ②). The reference system's quiet action button has a genuinely **transparent** resting fill, so it borrows whatever surface it sits on and only materialises on hover. Our closest posture is `action.muted`, whose resting background is `neutral.0` — indistinguishable on a white page, but a visible white patch on a tinted or raised surface (a toolbar inside a `raised` Surface, a row action on a selected row).
- **Workaround:** `ActionButton evaluation="muted"` is documented as the quiet posture and reads correctly on the page surface, which is where the Studio uses it.
- **Not fixed yet, deliberately:** making `muted`'s resting fill transparent is a theme-wide colour decision — it also changes `Button evaluation="muted"` — and the evidence rule wants a real consumer first. `ActionMenu` (queue item ⑤, an icon-only trigger that must sit invisibly in a toolbar) is the consumer that will force it; that is the moment to decide, together with whether the contrast suite can reason about a transparent token at all (it currently compares hex pairs, and `transparent` has no hex).
- **Backlog:** decide via governance when ActionMenu lands: either a `transparent` core primitive that the contrast tests treat as "inherits the adjacent surface", or a dedicated `quiet` role in the action tree.
- **Measured when ActionMenu landed (2026-07-25), and the picture is sharper than the original entry:** the quiet rung is not broadly wrong — it is wrong on exactly one class of surface, and only in dark mode. `action.muted.background.default` resolves to `neutral.0` / `neutral.900`, which is **byte-identical to the page and to the Menu popover** in both modes, so a quiet trigger on the page and a quiet row inside a menu borrow their surface correctly. The break is a _raised_ surface: in dark, a `muted` trigger paints `#161616` on a `#262626` card — a visibly darker patch (see the `Overlay/ActionMenu` → `Emphasis` story, dark). In light both the page and the raised surface are `#ffffff`, so the same code accidentally looks right; that coincidence is why this went unnoticed.
- **A third option, better than the two above:** **omit** `action.muted.background.default` rather than introduce a `transparent` value. A component that reads an absent token paints no background, so the row/trigger borrows whatever is underneath, on any surface, in any mode — and the theme still never contains the literal `transparent`, keeping ADR-015's premise that every declared colour is an auditable hex. `extractBorderBackgroundPairs` already skips pairs whose background is absent, so the suite stays green by construction. **Its cost, which is why this is still a decision and not a change:** the pair that vanishes is also the one that proves `muted`'s _ink_ is legible. Today `muted.text.default` is audited against `muted.background.default`, i.e. against the page — remove the background and that audit disappears with it, so it would have to be replaced by an explicit "quiet ink vs page surface" assertion. Governance-sized because it also changes `Button`/`ActionButton`/`ToggleButton`'s quiet rung everywhere at once.
- **Not blocking `ActionMenu`:** its trigger defaults to `secondary` (a quiet fill, matching the reference, which also makes `isQuiet` opt-in), so the shipped default is correct on every surface. `muted` stays documented as the quiet posture with the caveat above.

### F-025 — two emphasis roles rendered byte-identically, in two different contexts

- **Date:** 2026-07-25 · **Surface:** `@ttoss/fsl-theme` `semantic.colors.action.muted` / `input.secondary` (dark alternate) · **Severity:** gap · **Status:** ✅ fixed (same day)
- Owner observation while reviewing the buttons: "`secondary` looks like `muted` and `muted` looks like `secondary`". Measuring the resolved values showed two separate problems. **(a) Light mode — the ladder changed mechanism mid-way:** `primary` and `secondary` carry fills, but `muted` carried a _visible border_ over a white fill, which is precisely the outlined-secondary idiom of Material/Bootstrap. Two adjacent rungs distinguished by a different _kind_ of cue cannot be ordered by eye. **(b) Dark mode — an outright collapse:** `action.secondary` and `action.muted` resolved to the identical triple (`neutral.700` / `neutral.500` / `neutral.50`). Two documented emphasis levels, the same pixels.
- **The invariant that made the fix obvious:** the theme never uses `transparent` — not once. Where `baseTheme`'s own comments say "transparent bg" the value is `neutral.0` (light) or `neutral.900` (dark): **the surface's own colour**. Every semantic background is opaque _by design_, because that is what makes contrast auditable at the token level (ADR-015 compares hex pairs). A `transparent` ghost rung — the first thing this review proposed — would have broken it. The aligned answer was the system's existing idiom.
- **Action:** `action.muted` now mirrors its background in the `border` dimension for every state (`focused` excepted — the one state that must show on any surface), so it has no edge at rest and materialises on hover; in dark it sits **on** the canvas (`neutral.900`) instead of one stratum above it, with dimmer resting ink (`neutral.300`, 13.6:1). The ladder is now one mechanism — solid fill → light fill → surface — monotonic in both modes. `ConfirmationDialog`'s cancel and `Wizard`'s back moved `muted` → `secondary`: a flow-critical alternative needs a visible affordance, and the quiet rung is now genuinely quiet.
- **Guard:** new invariant "roles within a context are distinguishable" (`colors.test.ts`) — for every ux context and both modes, no two roles may share a resting `(background, border, text)` triple. It asserts _difference_, not degree, so it stays a defect check rather than an aesthetic one. **It immediately caught a second, unrelated collapse the review had not looked for:** `input.primary` and `input.secondary` were also identical in dark mode (the dark override had dropped the lighter-border distinction the light mode uses to make secondary recede). Fixed the same way — secondary's border mirrors its own fill until hovered.
- **Lesson:** the existing distinguishability suite compared _states within a role_ and nobody had compared _roles within a context_. A vocabulary can collapse along any axis it does not test.

### F-026 — `SearchField` names the same `data-part` twice, so its anatomy is ambiguous

- **Date:** 2026-07-25 · **Surface:** `@ttoss/fsl-ui` `SearchFieldControl` · **Severity:** paper-cut · **Status:** open
- Found while measuring `ActionButton` against the field row: `[data-scope="search-field"][data-part="control"]` matched **two** nested elements — the positioning wrapper and the `<input>` inside it. `querySelector` returned the wrapper, which reports `padding: 0` and `border-radius: 0` (the frame lives on the input), so the measurement read as a defect until the DOM was inspected. The resolved geometry is in fact correct: the input lands on the same 34px field row as `TextField` and `Select`.
- **Why it matters beyond the paper cut:** `data-part` is the published anatomy (CONTRACT §2) — the handle host CSS, tests, and Studio inspection all bind to. A duplicated name makes the contract non-addressable: a host that styles the "control" cannot say which box it means, and every future measurement hits the same trap.
- **Not fixed here:** naming the wrapper is a contract change (`frame`? `adornmentLayer`? or hoist the frame onto the wrapper and leave the input unstyled), it needs the same treatment for any other composite that wraps a field in a positioning layer, and it belongs with the field-row work rather than mid-way through the Action queue.
- **Backlog:** audit every composite for duplicated `data-part` within one scope, pick the name, then add a contract invariant asserting `(scope, part)` is unique per rendered subtree — the class of defect, not the instance.

### F-027 — the border-contrast inventory audits the light bundle only; the dark alternate is unguarded

- **Date:** 2026-07-25 · **Surface:** `@ttoss/fsl-theme` `colors.test.ts` › "Color contrast — border vs background" · **Severity:** gap · **Status:** open
- Found while fixing the dark `action.secondary` divergence (see the ROADMAP's Slice 4 ② entry). That guard is the theme's strongest colour invariant — an explicit inventory of every `{ux}.{role}.{state}` whose border sits below 3:1 against its own fill, so any delta in either direction fails the suite and forces a decision. It iterates `bundleEntries` but reads only `entry.base`: `entry.alt` is extracted in the fixtures and never compared. Both light bundles are audited (default + bruttal); **neither dark alternate is.**
- **Consequence, measured:** the dark alternate currently has ~90 sub-threshold contexts per bundle, none of them decided — the divergence this review fixed (a dark secondary action reading exactly like a text input) lived there precisely because nothing was watching. Dark is where these mistakes are easiest to make: the alternate remaps references by hand, so a pattern the light mode expresses one way can silently be expressed another.
- **Not fixed here, deliberately:** the inventory's value is that every entry was _decided_ — pasting 90 names in to make a new test green would produce a guard that documents nothing and locks in whatever dark happens to be today. Each dark context needs the same pattern classification (a)–(d) the light inventory carries.
- **Backlog:** audit the dark alternate context by context, build `KNOWN_BORDER_CONTRAST_VIOLATIONS_ALT` (per bundle, same shape as the `knownBorderViolations` override bruttal already uses), then extend the test to iterate `[base, alt]`. Governance-sized: it is a colour review of the whole dark surface, not a test edit.

### F-028 — `Toolbar` claims `role="toolbar"` but is not a single tab stop

- **Date:** 2026-07-25 · **Surface:** `@ttoss/fsl-ui` `Toolbar` (React Aria `useToolbar`) · **Severity:** gap · **Status:** open
- Found while writing the keyboard test for the realigned Toolbar (P3 Slice 4 ④). The old suite asserted only that the arrow keys move focus, which passes; the new suite additionally asserted that Tab _leaves_ the cluster, and it failed — Tab steps to the next control inside the toolbar. Reading `react-aria-components/private/Toolbar.mjs` confirms why: it renders a div with `role="toolbar"` and `useToolbar`'s arrow-key handler, and nothing manages the children's `tabindex`. It cannot, for arbitrary children.
- **Consequence:** WAI-ARIA APG's toolbar pattern asks for one tab stop with arrow-key navigation inside, so a keyboard user meets a promise the role makes and the implementation does not keep: on a ten-control bar, Tab visits ten stops. The role still buys the named region and the arrow keys, so this is an incomplete pattern rather than a broken one.
- **Not worked around:** the honest fix is to own the roving-tabindex model — track the current child, set `tabIndex` on each, restore focus on re-entry — and our `ActionTriggerGroupProvider` context could carry it for fsl-ui triggers. But a toolbar lawfully hosts a `Select` or any host-supplied control, and those would not participate, producing a _partial_ roving model that is worse than a consistent one. Half an a11y mechanism is not an improvement.
- **What was done instead:** the claim was removed everywhere it appeared. The JSDoc, the ADR-013 rationale and the ROADMAP entry all said "one tab stop with roving focus" — written from the APG pattern rather than from the code — and now describe what the component actually does: a named region with arrow-key navigation, every control its own tab stop. A test asserts the current behaviour so the gap cannot be silently "fixed" in prose again.
- **Backlog:** either upstream (React Aria adds roving tabindex to `useToolbar`, the preferred outcome — it owns the keyboard model) or a deliberate decision to own it here for _all_ children via a documented context every focusable fsl-ui component reads. Governance-sized; it changes the focus contract of every control that can sit in a bar.
- **Lesson:** the previous suite tested the feature that existed (arrow keys) and the docs described the pattern the role implies. Neither was wrong on its own; the gap lived in between. When a component adopts an ARIA role, test the role's _whole_ contract — the parts that fail are the documentation you owe the reader.

### F-029 — a destructive menu row has no way to look destructive

- **Date:** 2026-07-25 · **Surface:** `@ttoss/fsl-ui` `MenuItem` / `@ttoss/fsl-theme` `semantic.colors.action.negative` · **Severity:** gap · **Status:** open
- Found while building `ActionMenu` (P3 Slice 4 ⑤). A "Delete" row in an overflow menu should read as dangerous, and the two tools available both miss: `consequence="destructive"` is the _semantic_ marker (it drives mechanism — `ConfirmationDialog`'s arming — and deliberately carries no colour), while `evaluation="negative"` fills the **entire row** with `red.600` and white ink, because `action.negative` is a filled destructive _button_. A menu of one red block among grey rows reads as a banner, not as a row.
- **What is actually missing:** the Action colour tree has no "negative **ink** on a surface" rung. `action.negative.text.default` is `neutral.0` — correct on a red fill, useless on a menu surface. The valence exists as ink elsewhere (`informational.negative.text`), but a `MenuItem` is Action and CONTRACT §1 forbids reading another entity's row, so it cannot reach it.
- **Workaround shipped:** the destructive row uses `consequence="destructive"` alone and looks like its siblings. Honest, and the confirm mechanism still fires; it just does not warn visually.
- **Why not fixed here:** every fix touches the colour model. (a) A new evaluation (`negativeQuiet`) grows the taxonomy for one component and reads as a variant axis we do not have. (b) Making `action.negative` ink-based breaks the destructive `Button`, which must stay a filled red command. (c) Letting Action read `informational.negative.text` punches a hole in §1's one-row rule. (d) Adding a `text`-only sibling role (e.g. `action.negative.textOnSurface`) is probably the least-bad shape, and it is exactly the kind of vocabulary addition the ADR workflow exists for.
- **Backlog:** pick between (a)–(d) with the owner. Worth pairing with F-024: both are the same underlying question — how the action tree expresses "this control borrows its surface instead of painting one".

### F-030 — a composite sub-part that is itself a root collides with its host's root

- **Date:** 2026-07-26 · **Surface:** `@ttoss/fsl-ui` `Menu` / `MenuItem` vs `CONTRACT.md` §5 · **Severity:** gap · **Status:** open
- Found by contract invariant #12 the moment it was written (P3 Slice 5 ⓠ), **not** by the browser audit that preceded it — that audit only probed the field stories, so a defect one family over went unseen. `[data-scope="menu"][data-part="root"]` resolves **both** the popover and every row: §5 has composite sub-parts reuse the host's `data-scope`, while `MenuItem` also declares `structure: 'root'` because it is its own component root. Nothing is mislabelled; the convention and the meta are each correct alone.
- **Why it matters where F-026 matters:** the pair is the package's addressing scheme. A host stylesheet targeting the popover also hits every row, and an agent told to activate a menu item cannot resolve one.
- **Not the same cause as F-026.** There, one component names two nested elements `control` by hand; here, two independently correct declarations collide through the scope-reuse convention. So the fix is a §5 rule, not a component edit — which is why it is filed rather than patched inside a Slice-5 field item.
- **Recorded, not hidden:** it is a named entry in invariant #12's known-violations list, and a companion test asserts every listed violation still reproduces, so it cannot rot into a permanent exemption.
- **Backlog:** decide whether a sub-part that is its own root takes a distinguishing `data-scope` (`menu-item`) or whether §5 gains a rule for the collision. Touches the addressing convention, so it is governance — and it should be settled with F-026's fix so the family ends up with one story.

### F-031 — `invalid` is a dead end in the state cascade: an invalid field stops responding to hover and press

- **Date:** 2026-07-26 · **Surface:** `@ttoss/fsl-theme` `semantic.colors.input.primary.*` + `fsl-ui` `STATE_PRIORITY` / `resolveInteractiveStyle` · **Severity:** paper-cut · **Status:** open
- Found while checking whether Spectrum thickens a field's border on invalid (it does not — see the ROADMAP's Slice 5 correction). S2 ships **six** negative border colours — `negative-border-color-{default,hover,down,focus,focus-hover,key-focus}` — i.e. the negative valence keeps its own full interaction cascade, including a distinct colour for _invalid **and** focused_ and for _invalid **and** hovered_.
- **Ours is flat.** `input.primary.border` offers `default / hover / focused / disabled / checked / pressed / invalid` as siblings, and `STATE_PRIORITY` places `isInvalid` **above** `focused`, `active` and `hover`. So `resolveInteractiveStyle` returns `invalid` and the other three never resolve: an invalid field gives no hover feedback, no press feedback, and shows the same red on focus as at rest. The control reads as inert exactly when the user is trying to fix it.
- **Why not fixed in P3 Slice 5:** it is not a value tune. Expressing "invalid **and** hovered" needs either combination states in the token model (a `invalid.hover` sub-tree, which no family has today) or a cascade that composes rather than short-circuits — and `STATE_PRIORITY` is the single source both `CONTRACT.md` §3 and the helper derive from, so changing its semantics changes every entity at once.
- **Not a contrast risk either way:** the resting `invalid` border already passes; this is about missing feedback, not legibility.
- **Backlog:** decide between (a) combination states for the valences that need them, (b) a composing cascade where a valence narrows the palette instead of replacing the value, or (c) accepting the flat model and documenting that validation outranks interaction. Governance-sized — it is a change to §3's cascade contract.

### F-032 — the validation message carries no valence: only the border is red

- **Date:** 2026-07-26 · **Surface:** every field's `validationMessage` + `@ttoss/fsl-theme` `input.primary.text.invalid` · **Severity:** gap · **Status:** open
- Measures the second half of what **F-009** predicted ("`Text` has no negative/danger tone, so the message cannot even be tinted in-system"), on a component where the message part _does_ exist. Found while screenshotting the `Invalid` story during P3 Slice 5 ⓠ.
- **Measured** on `Input/TextField` › `Invalid` at 1280px: the validation message resolves `rgb(22,22,22)` in light and `rgb(255,255,255)` in dark — **byte-identical to the label beside it** — while the control's border carries `rgb(220,38,38)` / `rgb(252,165,165)`. So the error copy is typographically indistinguishable from the hint copy, and the whole valence rests on one border.
- **Not a bug in the component.** `input.primary.text.invalid` is _deliberately_ the control's readable-value colour — the theme's own comment says the value stays readable and the valence lives on the border. The gap is that the envelope has no ink for error copy, so `TextFieldError` reads the only `invalid` text token there is and gets neutral ink.
- **Consequence beyond aesthetics:** with the message unstyled, the invalid state is signalled by border colour alone, which is the WCAG 1.4.1 shape (colour as the only carrier) that the in-control validation glyph is meant to answer.
- **Widened, not re-found (2026-07-28, forms C2):** the same measurement on `Select`'s new message part, in both modes — `rgb(22,22,22)` light, `rgb(255,255,255)` dark, with the trigger border at `rgb(220,38,38)` / `rgb(252,165,165)` byte-identical to `TextField`'s. It is one token's absence reaching every field, which is why the fix is a token and not a component.
- **Backlog:** part of the validation-language decision (ADR-024, P3 Slice 5 ④) — a `negative` tone for envelope copy, alongside the in-control glyph. `buildFieldTextPartStyle` already takes the `tone` parameter, so the component side is a one-line change once the token exists; today `negative` resolves to the same ink as `neutral`, which its JSDoc states with the measurement above.

### F-033 — a standalone `Checkbox`/`Switch` can turn invalid but cannot say why

- **Date:** 2026-07-26 · **Surface:** `@ttoss/fsl-ui` `Checkbox`, `Switch` · **Severity:** gap · **Status:** open
- Found answering "can we use the form components individually — say a modal with a confirmation checkbox, or one age input, with field validation?" Probed rather than assumed, and the probe split into a working case and a broken one.
- **Measured.** A required `Checkbox` inside a `Form`, after a failed submit: `aria-invalid="true"` on the input, and its rendered parts are exactly `root, selectionControl, label` — **there is no `validationMessage`**. So the box turns red and the submit is blocked, and nothing on screen states the rule. `Switch` has the same three parts and the same hole. (`Slider` also has no message part, but that is a **boundary rather than a gap**: React Aria gives Slider no `FieldErrorContext`, because a slider always holds a value in range.)
- **Same shape as F-009**, one family over: there, `Select` had nowhere to render a message while its siblings did; here it is the selectables. The single `Checkbox`/`Switch` carry their label as inline children rather than through `LabelContext`, which is why they were never given the envelope in the first place.
- **The other half of the probe, which does work:** a field outside any `Form` validates through a `validate` callback with `validationBehavior="aria"` — measured `aria-invalid="true"` and the message rendered, no form element involved. What does **not** work standalone is a _native_ constraint (`isRequired`, `minValue`, `type="email"`): those need a real submit to fire, and `validationBehavior="aria"` disables them by definition. That is a platform fact, not our choice, and it is worth documenting rather than working around.
- **◐ `Checkbox` fixed 2026-07-26** (forms item A2): it takes `description` and `errorMessage`, matching S2's own vocabulary — whose documented example is this exact terms-and-conditions checkbox. Three things the work established. (a) The supporting copy cannot simply be placed inside the row: **measured**, the accessible name became `"Accept termsYou agree to the terms."` and a name query for the label alone stopped matching, because React Aria computes the name from the label's content and the label _is_ the row. Pinning the name with `aria-labelledby` and linking the copy with `aria-describedby` fixes it, verified in the Studio where the name is now the label alone. (b) React Aria's `FieldError` **cannot** be used here: it returns `null` unless its context reports invalid, and on a lone `Checkbox` that context stays quiet even while the input carries `aria-invalid="true"` and the form refuses to submit — so the message is gated on the render-prop `isInvalid`, the same flag that already tints the label. (c) The parts are **internal** (no meta), following `CheckboxGroup`, which already emits `description`/`validationMessage` that way — so `Selection` did not have to grow a role.
- **Still open for `Switch`.** An earlier revision of this entry said React Aria gives `Switch` no description/error contexts; that was wrong — it imports both. Whether it _provides_ them was not verified, so the Switch half stays open and the verification is part of the work.
- **The `validationBehavior` half of this entry is withdrawn.** It proposed defaulting the prop from Form presence; measurement showed that would be a regression, because `aria` mode does not merely stop displaying native constraints, it **removes** them (`validity.valid` reads `true` on a required field). React Aria's `native` default is already correct in both contexts — see FORMS.md §2b for the five measured cases.
