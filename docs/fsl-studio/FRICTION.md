# Friction log — FSL Studio (P1 adoption)

> The Program P1 evidence channel (see `packages/fsl-ui/INTERNAL/ROADMAP.md`
> §Program). Every hand-rolled style, missing component, confusing API, or
> `llms.txt`/CONTRACT gap found while building the Studio is filed here.
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

- **Date:** 2026-07-22 · **Surface:** `@ttoss/fsl-ui` `Tab` · **Severity:** paper-cut · **Status:** open
- The selected-tab indicator is positioned `insetBlockEnd: 0` unconditionally, so in `orientation="vertical"` (sidebar use) it underlines each item instead of marking the start edge — the conventional affordance for vertical navigation.
- **Backlog:** make the indicator edge-aware by orientation (`Tab` needs the group's orientation — likely a context from `Tabs` or a `data-orientation` attribute).

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

- **Date:** 2026-07-22 · **Surface:** `@ttoss/fsl-ui` catalog (Settings block) · **Severity:** gap · **Status:** open — pulls Wave-3 `ComboBox`
- The invite flow was designed with a timezone field and the field was **dropped** because a 30+-option `Select` popover is scan-only — no typeahead, no filtering. A component gap changed the product design; that is the strongest form of adoption evidence. Role (3 options) stayed a `Select`, which is its correct scale.

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
