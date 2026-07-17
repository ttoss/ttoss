# @ttoss/fsl-bench

AI-executability benchmark harness for [`@ttoss/fsl-ui`](../fsl-ui) — the
execution of **ROADMAP §D1** (STRATEGIC_EVAL criterion 6). It measures
whether an LLM, given a library and its docs, produces **correct UI code on
the first pass** — the falsifiable half of fsl-ui's "AI-first" thesis.

Private, never published. Lives beside `fsl-ui` (not inside it) so the
benchmark consumes the library exactly as an external app would and its
dependencies (baseline libraries, model SDKs) never touch the measured
package.

## What it measures

| Metric                  | Definition                                                        | Source         |
| ----------------------- | ----------------------------------------------------------------- | -------------- |
| **First-pass success**  | compile + render + behavior green with zero repairs               | gauntlet L1–L3 |
| **Semantic error rate** | mechanical lint findings per first completion                     | gauntlet L4    |
| **Rounds-to-green**     | repair-loop rounds until green (≤ 2), proxy for human corrections | repair loop    |

Reported with Wilson 95% intervals (cells are small — no over-claiming).

## Conditions

| Condition     | Cohort          | Docs context                                                             |
| ------------- | --------------- | ------------------------------------------------------------------------ |
| `fsl-ui`      | candidate       | the **shipped** `packages/fsl-ui/llms.txt`                               |
| `fsl-ui-bare` | candidate (A/B) | export list only — isolates the grammar's contribution from model priors |
| `react-aria`  | baseline        | `contexts/react-aria.md`                                                 |
| `radix`       | baseline        | `contexts/radix.md`                                                      |
| `mui`         | **control**     | `contexts/mui.md`                                                        |

Cohort design follows `fsl-ui/INTERNAL/BENCHMARK_EVAL.md`: the fair cohort
is headless (React Aria, Radix); MUI — fully styled and massively
represented in training data — is a separate _control_ column, never mixed
into the cohort. The decisive comparison is the **A/B**: fsl-ui with vs
without llms.txt, same library, same model.

## The gauntlet (objective grading)

```mermaid
flowchart LR
    G[completion] --> X[extract code] --> L4[L4 lint AST]
    X --> L1[L1 tsc strict] --> L2[L2 bundle + mount] --> L3[L3 behavior asserts]
    L1 & L2 & L3 -->|fail| R[repair loop ≤2] --> G
```

- **L1** compiles against the real installed packages — for fsl-ui, illegal
  `evaluation`s, missing required labels and invented props die here
  mechanically.
- **L2/L3** run in a **dedicated child Node process** per sample: a fresh
  jsdom + React world (zero cross-sample leakage) driven by Testing Library
  user-event, asserting user-observable behavior only (roles, accessible
  names, fixed copy) — never library API shape.
- **L4** counts mechanically decidable semantic errors. fsl profile:
  `style`/`className` on fsl-ui components, invented `size`,
  `evaluation` on data-entry surfaces, raw color literals. generic profile:
  raw colors hardcoded at the point of use (defining tokens in a
  `themeTokens`/`createTheme` constant is legal — headless libraries must
  define tokens somewhere).

### Calibration (fairness proof)

`golden/` holds a hand-written, correct implementation of **every scenario ×
every library** (20 files). The test suite requires each to pass the full
gauntlet with zero lint findings — if a golden fails, the harness is broken
and no campaign number is valid. Run: `pnpm run test`.

## The frozen prompt suite

Five scenarios (`src/scenarios/`), the fixed D1 suite: `dialog`,
`field-validation`, `menu`, `destructive-confirm`, `themed-composite`.
Prompts are library-neutral (behavior + fixed copy, zero API vocabulary)
and **frozen**: any edit after a campaign invalidates comparability —
change them only with a suite-version bump recorded here, and never between
a campaign's start and its report.

The freeze is enforced, not just stated: `registry.test.ts` pins each
prompt's text by sha256, so any wording change fails the suite. A
deliberate change means updating `FROZEN_PROMPT_HASHES` there **and**
bumping the suite version in this section — never a silent edit.

**Current suite version: 1** (this line is the single definition site —
campaign reports compare only within a suite version).

## Running a campaign

```bash
export ANTHROPIC_API_KEY=...   # provider: anthropic (default model claude-opus-4-8)
export GEMINI_API_KEY=...      # provider: gemini (default model gemini-pro-latest — a Google-maintained
                                # alias; pinned snapshots like gemini-2.5-pro get retired for new
                                # keys/projects on a rolling basis and 404)

pnpm run bench                 # full matrix: 5 scenarios x 5 conditions x 2 providers x 5 reps
pnpm run bench -- --dry        # print the matrix, no API calls
pnpm run bench -- --reps 3 --providers anthropic --scenarios dialog,menu
pnpm run bench:report -- <runId>   # re-render a past run's report
```

Model overrides: `FSL_BENCH_ANTHROPIC_MODEL`, `FSL_BENCH_GEMINI_MODEL`.

Every completion, extracted code and gauntlet verdict is appended to
`results/<runId>/samples.jsonl` (the audit trail; content hashes of prompt
and context included per sample). Raw run data under `results/` is
gitignored; each run's `report.md` is trackable — the campaign
**report** is committed deliberately and its headline lands in
`fsl-ui/INTERNAL/ROADMAP.md` §D1, gating D2.

## Honesty rules (binding)

1. **Freeze before running.** Prompts, contexts and rubric rules are
   committed before a campaign; the report references the commit.
2. **Same harness for everyone.** One prompt suite, one gauntlet, one
   repair budget. Library-specific acceptance is expressed as
   user-observable behavior, never API shape.
3. **Comparable context budgets.** Baseline docs excerpts are honest
   best-effort digests of comparable size to llms.txt. They are versioned
   here — improvements welcome before a campaign, never during.
4. **No cherry-picking.** A campaign's matrix is declared up front
   (`--dry` prints it); every sample lands in the JSONL, including failures
   and provider errors.
5. **Human spot-check.** Before publishing a headline number, manually
   review ≥20% of failing samples for harness artifacts (a failure caused
   by the harness, not the model, voids the cell and is fixed + rerun).
