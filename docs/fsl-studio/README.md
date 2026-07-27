# FSL Studio

The adoption vehicle and theme workbench for [`@ttoss/fsl-theme`](../../packages/fsl-theme) and [`@ttoss/fsl-ui`](../../packages/fsl-ui).

The Stage is **Meridian**, a fictional deploy platform for the `northline` workspace — a real application (login, dashboard, team, billing) built exclusively with fsl-ui on the base theme (BLUEPRINT slice S2, shipped 2026-07-24). The workbench surfaces (token Panel, Inspector, live guarantees) land in the next slices.

- [`BLUEPRINT.md`](./BLUEPRINT.md) — the product definition, binding decisions, and slice route. Read it before any Studio work.
- [`FRICTION.md`](./FRICTION.md) — the append-only evidence log; still the fsl-ui backlog.

```bash
pnpm dev      # vite dev server
pnpm test     # tsc + jest (unit + axe)
pnpm build    # type-check + production build
```

Deployed at [studio.ttoss.dev](https://studio.ttoss.dev) (rides the merge to `main`).
