# FSL Storybook

The dedicated component catalog for [`@ttoss/fsl-ui`](../../packages/fsl-ui) and [`@ttoss/fsl-theme`](../../packages/fsl-theme) — BLUEPRINT slice S1, boundary decision D-001 in [`docs/fsl-studio/BLUEPRINT.md`](../fsl-studio/BLUEPRINT.md). It answers the component-level question ("what exists, how do I use it") so the FSL Studio can be a real application instead of a catalog.

Every component exported from fsl-ui's public API has stories organized by FSL entity, browsable in light and dark and under both shipped themes (`base`, `bruttal`) via the toolbar. Autodocs derive from the components' mandatory JSDoc.

The build also ships the AI surface: `manifests/components.json` (via `features.componentsManifest`) for `@storybook/mcp` consumers, and `llms.txt` extracted from the built stories. In dev, `@storybook/addon-mcp` exposes an MCP endpoint at `/mcp` for tool-assisted story work.

```bash
pnpm dev      # storybook dev server on :6007
pnpm build    # static build + llms.txt extraction
```

## Visual sign-off sheet

`pnpm visual-signoff` (with `pnpm dev` already running) renders every story in a
real Chromium, light and dark, and writes `visual-signoff/index.html` — one row
per story, the two modes side by side, grouped by the P3 review rounds recorded
in [`packages/fsl-ui/INTERNAL/ROADMAP.md`](../../packages/fsl-ui/INTERNAL/ROADMAP.md)
§P3. It exists so the owner's pass over the catalog is one scroll instead of
~350 toolbar clicks.

It captures and arranges; it decides nothing. `SHEET_ONLY=1` re-renders the page
from the existing frames, `INLINE=1` also emits a self-contained copy with the
images embedded, `ONLY=<substring>` narrows to matching story ids, and
`CHROMIUM_PATH` points at a preinstalled browser when the pinned playwright
build is unavailable. Output is git-ignored.

This instance hosts **only** fsl — the general ttoss Storybook (`docs/storybook`) is a separate app and stays untouched.
