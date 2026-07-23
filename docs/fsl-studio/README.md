# FSL Studio

The adoption vehicle and theme workbench for [`@ttoss/fsl-theme`](../../packages/fsl-theme) and [`@ttoss/fsl-ui`](../../packages/fsl-ui). Deployed at [studio.ttoss.dev](https://studio.ttoss.dev).

The Studio is a fictional SaaS product built **exclusively** with fsl-ui on the base theme — zero hand-rolled layout CSS — wrapped by a workbench that edits any fsl-theme token live against the whole product (Panel) and inspects any on-page component's identity, anatomy, and tokenization (Inspector). The product definition, binding decisions, and slice route live in [`BLUEPRINT.md`](./BLUEPRINT.md) — read it before working here. Every gap found while building lands in [`FRICTION.md`](./FRICTION.md), which is the fsl-ui backlog. Component-level browsing is deliberately not this app's job — that is the dedicated fsl Storybook (BLUEPRINT S1).

```bash
pnpm dev      # local dev server
pnpm test     # jest (100% coverage enforced)
pnpm build    # tsc + vite build
```
