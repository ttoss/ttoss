# Friction log — FSL Studio (P1 adoption)

> The Studio evidence channel — Program P1 and every `BLUEPRINT.md` slice
> after it (see `packages/fsl-ui/INTERNAL/ROADMAP.md` §Program). Every
> hand-rolled style, missing component, confusing API, or `llms.txt`/CONTRACT
> gap found while building the Studio is filed here.
> **This log is the fsl-ui v1 backlog.** Doc gaps are fixed immediately;
> package gaps stay open until shipped. One entry per finding — append only.

Severity: `blocker` (cannot express the flow inside the system) ·
`gap` (expressible only with a workaround) · `paper-cut` (works, reads wrong).

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

- **Date:** 2026-07-22 · **Surface:** `@ttoss/fsl-ui` `Select` (+ `Text` tones) · **Severity:** gap · **Status:** open
- `TextField` composes `TextFieldError`; `Select` only tints its trigger via the `invalid` State — there is nowhere to render the message. The invite form hand-assembles a live-region `Text` under the Select, and `Text` has no negative/danger tone, so the message cannot even be tinted in-system.
- **Backlog:** a `SelectError` part (mirroring `TextFieldError`), and/or a negative tone in the `Text` vocabulary for error copy.

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
