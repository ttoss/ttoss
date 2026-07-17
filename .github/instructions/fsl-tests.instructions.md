---
description: How to write, review, and prune tests in the @ttoss/fsl-theme package — the decision framework, not a checklist
applyTo: '**/packages/fsl-theme/**/*.test.{ts,tsx,js,jsx}'
---

# Tests — Decision Framework

A test is a load-bearing artifact: it pins a contract, it documents intent through its name, and it constrains future refactors. Bad tests are not "tests that pass for the wrong reason" — they are tests that **add no constraint that isn't already pinned elsewhere**. Writing and reviewing tests is a continuous act of asking "what does **only this test** make safe?".

This file is the basis. Apply it before adding, removing, merging, or moving any test.

---

## 1. The Four Axes (what a test can validate)

Every test in this repo must map cleanly to **exactly one** of these axes. If you cannot say which axis it belongs to, the test is unfocused — rewrite or delete.

| Axis                            | What it pins                                                                                                                                         | Failure mode it catches                                                                                            | Typical location                                 |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------ |
| **A. Structural invariant**     | A property that must hold across **all** valid configurations (no unresolved `{...}` refs, no cycles, no duplicate IDs, no missing required fields). | Architectural drift: a future contributor adds data that silently violates the model.                              | `tests/theme/global.test.ts`, schema validators. |
| **B. Family / domain contract** | A **relation between values**, not a value (`sm < md < lg`, contrast ≥ 4.5:1, monotonic elevation, alphabetic ordering).                             | Any theme, any input that respects the system stays valid; only system-violating data breaks.                      | Per-family / per-domain test files.              |
| **C. Pure-function unit**       | The input→output mapping of a pure function (factory, transformer, parser, resolver).                                                                | A regression in the function itself, isolated from runtime, DOM, and side effects.                                 | Co-located with the pure module.                 |
| **D. Integration / runtime**    | The **observable outcome** of wiring multiple units through a runtime surface (React render, DOM mutation, SSR string, network call).                | Wiring bugs invisible to A–C: missing effect cleanup, wrong context provision, stale closures, hydration mismatch. | `tests/.../runtime/`, `tests/.../react/`.        |

**Mediocre vs. good test (operationalised)**

| Mediocre                                       | Good                                                                                   |
| ---------------------------------------------- | -------------------------------------------------------------------------------------- |
| Asserts a fixed value: `spacing.md === '16px'` | Asserts a relation: `spacing.sm < spacing.md < spacing.lg`                             |
| Snapshots an entire structure                  | Pins one specific property on one specific path                                        |
| Mocks an internal helper to observe a call     | Asserts the public output of the function under test                                   |
| Aims for line coverage                         | Aims for **contract coverage** — every contract has exactly one canonical pinning test |

The decisive sentence: **family tests must keep passing if the theme's spacing scale is rescaled by 2×**. If a test breaks under that operation, it is testing a value, not a contract — promote it to a relation or move it to a pure-unit test of a constant table.

---

## 2. Scope filter — "who owns this contract?"

Before adding a test to file `X.test.ts`, answer in one sentence: **what does `X.ts` uniquely own that no other module can break?**

- If the behavior under test is produced by a module that `X.ts` only _calls_, the test belongs in **that module's** test file.
- If `X.ts` is an integrator (provider, runtime, orchestrator), it owns only the **wiring** — argument routing, lifecycle, error mapping, context provision. It does **not** own the correctness of what it delegates to.

**Diagnostic question**: _"If I replace this delegate with an equivalent implementation, should this test break?"_ If the answer is **no**, the test belongs in the delegate's file — not here.

Concrete example: a React provider that injects CSS via a `toCssVars` helper should be tested for **the fact that CSS is injected and scoped correctly**, not for the **content** of the generated CSS. The content is `toCssVars`'s contract.

---

## 3. Uniqueness filter — "what does **only** this test pin?"

For every test, name the **single regression** that only this test would catch. If you cannot, the test is redundant.

**Redundancy patterns to detect and remove:**

- **Strict subset**: test B's assertion implies test A's assertion (`called exactly 2 times with [args]` implies `called at least once`). Drop A.
- **Implicit default**: a test asserts the default path that is already implicitly exercised by every other test in the file (e.g. `targets :root when no themeId` when 9 other tests already render without `themeId` and rely on `:root` behavior). Drop it.
- **Cross-layer duplication**: the same behavior is asserted in the unit test of the helper **and** in the integration test of its caller. Keep the unit test; drop the integration assertion **unless** the integration adds wiring-specific risk (timing, effect order, context).
- **Restatement merge**: two tests in the same `describe` use the same setup and verify orthogonal properties of the same observed value — they should be one test with two assertions, not two tests.

**Counter-pattern (do not collapse)**: tests that exercise **opposite branches** of the same code path (with-X vs. without-X, light vs. dark, valid vs. invalid) are not duplication — they are dual evidence of branch coverage at the contract level.

---

## 4. Outcome filter — "would a future internal refactor break this?"

The most powerful test is one that survives any refactor that does not change observable behavior, and breaks the moment observable behavior changes.

- Prefer asserting **the end of the pipeline**: the DOM after render, the returned object, the string emitted by SSR, the side effect performed.
- Avoid asserting **the steps inside the pipeline**: that `useMemo` was called, that an internal helper received specific arguments, that a state update happened in a specific order.

**Stop signals when you read your own draft**:

- "verifies that internal function X is called with Y" → rewrite as an outcome assertion.
- "spies on the implementation" → only legitimate at integration boundaries (network, storage, DOM events you cannot trigger).
- "snapshot of the whole tree" → pick the one property the change is about.

**The single-question rule**: write the test name, then ask _"can a developer who knows nothing about the implementation read this name and tell me what would break in production if this test fails?"_ If no, the name is wrong — and the test probably is too.

**Mechanism check**: mentally remove _only_ the feature the test name claims to guard, leaving everything else intact. If the test still passes, another gate upstream is doing the work — the test is either named wrong or needs a stronger fixture that bypasses that upstream gate.

---

## 5. Mergeability filter — "can two tests collapse into one?"

Two tests **can** merge into one if and only if:

1. They share **the same setup** (same wrapper, same fixtures, same mocks).
2. They observe **a linear evolution** of the same subject (state at t1, state after action, state after second action) — not orthogonal scenarios.
3. The merged name still names exactly one contract.

Two tests **cannot** merge if any of the following hold (each is an axis of structural incompatibility):

- Different module-level mocks (e.g. `matchMedia` configured differently).
- Different provider props that change the runtime's initial branch (with/without `theme`, different `defaultMode`, different `root`).
- One is a **guard test** (`expect(() => ...).toThrow(...)`) — the throw prevents any further setup or assertion.
- They cover **opposite branches** — keep them apart so the failure message names the branch.

**Naming-as-contract trade-off**: in ADR-governed or contract-heavy packages, the test name is part of the executable spec. A merge that replaces two specific names with one generic name **destroys documentation**. When in doubt, prefer two named tests over one anonymous block.

---

## 6. Coverage discipline

- **Line coverage is a floor, not a goal.** Removing a redundant test does not reduce line coverage when the same lines are exercised by other tests — and that is the proof that the test was redundant.
- **Contract coverage** is the real metric: every observable contract has **exactly one** canonical pinning test. Search the test file by the contract's name — if the search returns more than one match with the same intent, you have redundancy.
- The repository enforces `coverageThreshold` per package (see [packages.instructions.md](packages.instructions.md)). Always update the threshold after a measurable change, never silently downgrade it.

---

## 7. Structural rules (mechanical, non-negotiable)

These are not opinions — they are repo-wide invariants enforced by review.

1. **One axis per file when feasible.** If a file mixes invariant, contract, unit, and integration tests, it becomes unreadable and brittle. Split when a file exceeds two axes.
2. **Test file location mirrors source.** `tests/unit/tests/<mirror of src path>.test.ts`. New folders are created only when a new source folder exists.
3. **No tests on private symbols.** If you need to test it, export it (and document it) or remove it. Private symbols are tested through the public surface.
4. **`jest.mocked()` for type-safe mocks** — never `as jest.Mock`. See [general.instructions.md](general.instructions.md).
5. **No `any` in test code.** Test code is production code for invariants. Use proper types.
6. **English only**, including test names. See [general.instructions.md](general.instructions.md).
7. **Deterministic timing.** No `setTimeout` without `jest.useFakeTimers()`. No `Date.now()` without mocking. No `Math.random()`.
8. **Each test cleans its own DOM/state.** Use `afterEach` for cleanup — leakage between tests is a bug, not a quirk.

---

## 8. Boilerplate is not bloat

Repetitive setup is **not** a signal to refactor. Hiding setup behind helpers makes stack traces opaque and makes each test require a second file to understand.

- A test file with 600 lines and 30 tests, each a `renderHook(..., { wrapper: ... })` block, is **structurally minimal** if every test pins a distinct contract.
- Helpers are justified only when the setup itself has **non-trivial logic** (computing fixtures, building a complex scene graph) — not for repeating React provider boilerplate.
- **The test reader is the boss**: if a colleague reading one test in isolation cannot run it mentally, the helper is harmful — inline it.

---

## 9. The procedure (apply to every test you touch)

When **adding** a test:

1. Name the axis (A / B / C / D). If you cannot, reconsider.
2. Name the single regression it catches. Write it as a one-line comment if the test name does not say it.
3. Search the file for the same contract — if a similar name exists, merge or drop.
4. Verify the assertion is on **the outcome**, not the implementation.

When **reviewing or removing** a test:

0. **Source-first**: before reading any test, read the source and list every observable contract (public method × branch × side effect). Complete this list first — missing contracts are bugs invisible to any per-test check.
1. Read the test name without reading the body. State the contract it pins.
2. Search the rest of the test suite for that contract. If pinned elsewhere with equal or stronger assertions, mark as redundant.
3. **Before deleting**, simulate: would mutating the source in a way that violates this contract still be caught by another test? If yes, delete. If no, the test is load-bearing — keep it even if it looks duplicative.
4. **Chesterton's fence applies to tests too**: a test with a regression comment, an ADR link, or a non-obvious name is **evidence of an unstated invariant**. Investigate before pruning.

When **merging** tests:

1. Verify shared setup, linear time, single contract — all three (§ 5).
2. If any fails, do not merge.
3. After merging, the new name must read as a single specification — not "tests A and B".

When **moving** a test:

1. Confirm the new file's SUT actually owns the contract.
2. If the test asserts an output that crosses module boundaries, it stays at the boundary owner — never duplicated on both sides.

---

## 10. Anti-patterns — trigger phrases in your own thinking

These phrases, appearing in your draft, your commit message, or your reasoning, are stop signals. Investigate before proceeding.

| Trigger phrase                     | Real meaning                                   | Action                              |
| ---------------------------------- | ---------------------------------------------- | ----------------------------------- |
| "just to be safe"                  | No specific regression in mind                 | Delete the planned test             |
| "covers the happy path"            | The happy path is implicit in every other test | Delete                              |
| "make sure it doesn't break"       | No contract identified                         | Identify the contract or delete     |
| "for symmetry with the other test" | Cargo-culted scaffolding                       | Delete unless it pins a real branch |
| "snapshot for now"                 | Avoidance of contract definition               | Rewrite as targeted assertions      |
| "we'll refactor it later"          | Tech debt scheduled by default                 | Refactor now or document why later  |
| "the linter will catch it"         | Linter is not a test runner                    | Validate experimentally             |

---

## 11. When you face a divergence between code and spec / convention

A passing test that violates a documented best practice is **evidence of an unstated invariant**, not a bug.

- Run the proposed "fix" through the actual pipeline (build, renderer, runtime, emitted output). Does any observable degrade?
- Look for tests with regression markers (`// Regression:`, `// Bug #N`, ADR links) — they are executable history of intent.
- If the spec and the code disagree, **either** side may be wrong. Validate the frame, not just the evidence.
- If the only real gap is documentation (missing JSDoc, undocumented exception, stale spec), the fix is documentation — not the test, not the code.

---

## 12. The closing test for any test suite

After you finish a test file, answer these out loud:

1. **What contracts does this file own?** (List them — there should be one bullet per test.)
2. **What single change to the source would break each test?** (One sentence per test.)
3. **Could any test be deleted without losing a contract pin?** (If yes, delete.)
4. **Would the file still document the module's contract if the source were destroyed?** (If no, the names are weak — rewrite them.)

A passing suite that fails these four checks is debt. A smaller suite that passes them is the asset.
