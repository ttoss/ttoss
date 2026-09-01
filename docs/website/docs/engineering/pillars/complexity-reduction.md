---
title: Complexity Reduction
sidebar_position: 4
---

Complexity has always been charged to the next person who reads the code. With agents it is charged twice, and the second charge is the one teams miss.

The first charge is comprehension. Whoever validates a change has to understand the code around it, and with agent-authored diffs that person did not write it — so they pay the full cost of understanding without the head start that writing gives you. The second charge is replication. Agents infer conventions from the code they are shown, so complexity is not merely inherited by the next task; it is reproduced by it. A codebase with one tangled module gets more tangled modules, because the tangle is now the example. [The Principle of Pattern Inertia](/docs/ai/agentic-development-principles/physics-of-ai-integration#the-principle-of-pattern-inertia) describes the mechanism.

There is also a hard limit that has no equivalent for humans. A human facing an incomprehensible module can spend three days and eventually understand it. An agent facing a task whose smallest correct context exceeds its working context does not get slower — it guesses, confidently. Complexity therefore converts directly into wrong output rather than into delay.

## Why a Budget and Not a Guideline

"Keep functions simple" is advice, and advice is applied unevenly by humans and probabilistically by agents. A threshold enforced by the linter fails the build, fails identically for everyone, and costs no reviewer attention to apply — the same reason [Automation](/docs/engineering/pillars/automation) insists that a rule not enforced by a machine is not a rule. The value is not that any single threshold is optimal. It is that the constraint stops depending on whoever happens to be reviewing.

## What the Budget Bounds

Our shared lint configuration puts a ceiling on each dimension that makes code expensive to hold in your head: the number of independent paths through a function, its cognitive complexity, how deeply control structures and callbacks nest, how many parameters a function takes before an object is required, and how long a function or file may grow. The current values live in `@ttoss/eslint-config` and are deliberately not repeated here — they move as the codebase does, and the configuration is the source of truth.

Cyclomatic complexity and [cognitive complexity](https://www.sonarsource.com/blog/cognitive-complexity-because-testability-understandability-and-changeability-matter/) are both bounded because they measure different things. The first counts paths and treats a flat switch statement as complex; the second weights nesting, so it tracks how hard code is to hold in your head. A long flat function is usually fine. A short deeply nested one usually is not.

Alongside the size budget sits a set of duplication and dead-code rules — identical functions, duplicated branches, dead stores, collapsible conditionals. These matter more in agentic work than they used to: generating a near-copy of an existing function is cheaper than finding it, so an agent will happily produce the fourth variant of something that should have one implementation. Duplication detection is how that tendency gets caught mechanically instead of in review.

## Calibrate Thresholds From Your Own Distribution

What makes this pillar work is not any particular number. It is the method: every threshold is picked by measuring the repository's actual distribution and setting the limit where only genuine outliers report.

The test-file overrides show what the method produces. When we last calibrated them, the source file-length limit flagged dozens of suites while a limit two and a half times higher flagged only the handful that were genuinely unwieldy; a relaxed path-complexity limit reported exactly two files, both real; and the callback-nesting limit had to rise by two because `describe > describe > test > callback` is the standard shape of a suite, not a defect in one.

Two rules are off entirely in tests, for reasons no threshold fixes. Function-length counts a `describe` callback as one function, so it measures a whole suite as a single unit — the unit is wrong, not the limit. And identical-function detection fights the near-identical arrange/assert blocks that are how a readable suite is written in the first place.

What is deliberately _not_ relaxed says the most: `max-depth`, `max-params` and `sonarjs/cognitive-complexity` keep their source limits in test files, because they report zero violations there. Nothing about test code makes deep nesting or parameter soup legitimate.

The lesson generalizes. A threshold calibrated to a real distribution is one every violation is worth reading. A threshold picked by taste produces hundreds of reports, and hundreds of reports produce blanket `eslint-disable` comments — at which point the constraint is gone and the file still looks compliant.

## Failure Mode

The code compiles, the tests pass, and every task requires loading three modules to change one line. Agents guess, because the smallest correct context no longer fits. Reviewers approve, because reconstructing the reasoning costs more than trusting it. Nothing in the pipeline distinguishes this from a healthy system until an incident reveals that nobody — human or agent — understood the change that caused it.
