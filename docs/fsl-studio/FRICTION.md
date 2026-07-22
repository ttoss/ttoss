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
