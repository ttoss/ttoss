# fsl-bench — AI-executability report

Run `gemini-only-2026-07-16` — 125 samples. First-pass success = compile + render + behavior green with zero repairs. Semantic errors = mechanical L4 lint findings on the first completion. Rounds-to-green = repair-loop rounds until green (proxy for human corrections).

## Model: gemini/gemini-pro-latest

### Headless cohort (candidate + baselines)

| Library                     | First-pass success (Wilson 95%) | Semantic errors / sample | Rounds-to-green (mean) | Never green |
| --------------------------- | ------------------------------- | ------------------------ | ---------------------- | ----------- |
| @ttoss/fsl-ui (+llms.txt)   | 48% [30%–67%]                   | 0.00                     | 0.60                   | 5/25        |
| @ttoss/fsl-ui (no llms.txt) | 40% [23%–59%]                   | 0.08                     | 0.58                   | 6/25        |
| React Aria Components       | 80% [61%–91%]                   | 6.52                     | 0.28                   | 0/25        |
| Radix Primitives            | 100% [87%–100%]                 | 3.56                     | 0.00                   | 0/25        |

### Control — opinionated library (separate cohort)

| Library       | First-pass success (Wilson 95%) | Semantic errors / sample | Rounds-to-green (mean) | Never green |
| ------------- | ------------------------------- | ------------------------ | ---------------------- | ----------- |
| MUI (control) | 100% [87%–100%]                 | 0.00                     | 0.00                   | 0/25        |

### A/B — contribution of llms.txt (grammar vs model priors)

First-pass delta (with − without llms.txt): **8 pp**.

### Per-scenario first-pass (passed/total)

| Library                     | dialog | field-validation | menu | destructive-confirm | themed-composite |
| --------------------------- | ------ | ---------------- | ---- | ------------------- | ---------------- |
| @ttoss/fsl-ui (+llms.txt)   | 5/5    | 0/5              | 2/5  | 0/5                 | 5/5              |
| @ttoss/fsl-ui (no llms.txt) | 5/5    | 0/5              | 0/5  | 5/5                 | 0/5              |
| React Aria Components       | 5/5    | 0/5              | 5/5  | 5/5                 | 5/5              |
| Radix Primitives            | 5/5    | 5/5              | 5/5  | 5/5                 | 5/5              |
| MUI (control)               | 5/5    | 5/5              | 5/5  | 5/5                 | 5/5              |
