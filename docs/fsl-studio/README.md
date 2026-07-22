# FSL Studio

The adoption proving ground for [`@ttoss/fsl-theme`](../../packages/fsl-theme) and [`@ttoss/fsl-ui`](../../packages/fsl-ui) — Program P1 in [`packages/fsl-ui/INTERNAL/ROADMAP.md`](../../packages/fsl-ui/INTERNAL/ROADMAP.md). Deployed at [studio.ttoss.dev](https://studio.ttoss.dev).

The Studio is built **exclusively** with fsl-ui components on the unmodified base theme — zero hand-rolled layout CSS (there is no stylesheet in `src/`). Its purpose is evidence: every real flow it hosts (the **blocks** — Login, Settings/CRUD, Dashboard, Pricing) stresses the packages the way a business app would, and every gap lands in [`FRICTION.md`](./FRICTION.md), which is the fsl-ui v1 backlog.

This is v2, rebuilt from scratch (2026-07-22) with zero reuse of v1 — the recorded lesson in ROADMAP §Program P1: the adoption vehicle must be deliberately conventional, not a UX experiment.

```bash
pnpm dev      # local dev server
pnpm test     # jest (100% coverage enforced)
pnpm build    # tsc + vite build
```
