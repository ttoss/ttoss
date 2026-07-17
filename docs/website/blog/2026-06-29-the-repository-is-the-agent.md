---
title: The Repository is the Agent
description: AI coding does not become exponential when models write more code. It becomes exponential when the repository becomes an acceptance system.
authors:
  - enniolopes
tags: [AI, engineering, agentic-development, evals, software-delivery]
---

The first wave of AI coding was about generation.

Write this function.
Fix this bug.
Add this test.
Explain this file.
Refactor this component.

The second wave will not be about generation.

It will be about acceptance.

That distinction is the difference between using AI as a faster assistant and redesigning software development around machine execution.

Most teams are still asking the wrong question. They ask, "How much code can AI write?" But code generation is already cheap. The scarce resource is not output. The scarce resource is trusted change.

The real question is:

> How much AI-generated work can our development system safely accept without increasing human review load, regression risk, or architectural entropy?

That is the frontier.

Not the model.
Not the prompt.
Not the agent.
The acceptance system.

## The repo is no longer just source code

A repository used to be where software lived.

Now it is becoming the runtime where delegated engineering work happens.

That changes what a repo is responsible for. It cannot merely contain code and human-readable conventions. It must expose intent, constraints, context, tests, ownership, risk boundaries, tool permissions, runtime assumptions, and acceptance criteria in forms that agents can consume and machines can verify.

The ttoss AI docs already point in this direction: agentic engineering is not "AI coding" as a tactic, but an operating model where humans move upward into framing and downward into validation; when code becomes cheap to generate, system quality depends more on intent, verification, and architectural judgment. ([Terezinha Tech Operations][1])

That means the repository is becoming something closer to a compiler.

Not a compiler for programming languages.

A compiler for intent.

```txt
human intent
→ task contract
→ context package
→ execution profile
→ sandboxed work
→ evidence
→ acceptance decision
→ durable memory
```

The output is not code.

The output is a change the organization can trust.

## The agent is not the unit of leverage

The industry talks about agents as if they were workers.

One agent writes code.
One agent reviews code.
One agent writes tests.
One agent handles security.

Sometimes that framing is useful. But it hides the more important abstraction.

The same model can behave differently when given different context, tools, policies, memory, runtime limits, and acceptance criteria. Two different vendors can behave similarly if they execute the same task contract under the same constraints. A deterministic script can outperform every LLM when the task is structured enough.

So the unit is not the agent.

The unit is the **execution profile**.

An execution profile is a controlled way of doing work:

```txt
model
+ instructions
+ tools
+ permissions
+ context
+ runtime budget
+ acceptance criteria
```

A bugfix profile may be optimized for minimal edit radius and regression coverage.

A migration profile may be optimized for mechanical consistency and rollback safety.

A reviewer profile may be read-only and optimized for precise objections.

A documentation profile may be allowed to change examples but required to execute them.

A security profile may be forbidden to write code and required to produce exploit paths, not vibes.

This matters because the future is not "choose the best coding agent."

The future is task routing.

A team should not ask whether Claude, Gemini, Codex, Cursor, Devin, Copilot, or an internal runner is globally better. It should ask which execution profile wins for a given class of work under the repo's own constraints.

OpenAI's Codex guidance moves in this direction by recommending reusable repo guidance through `AGENTS.md`, planning before difficult tasks, and making instructions durable instead of repeated manually. ([OpenAI Developers][2]) Gemini Code Assist agent mode also frames agentic coding around plans, tools, MCP servers, and human approval of plans and tool use rather than one-shot generation. ([Google for Developers][3])

The pattern is clear: the agent is becoming a schedulable process.

The repository needs to become the scheduler.

## Evaluation is not a score. It is admission control.

Most teams treat evals as measurement.

That is too weak.

In agentic development, evals are admission control.

They decide which execution profiles are allowed to operate on which task classes, with which permissions, under which budgets, and with which human review requirements.

OpenAI's evaluation guidance recommends eval-driven development, task-specific datasets, logging everything, automation where possible, continuous evaluation, and calibration with human feedback. It also warns against vibe-based evals and generic metrics that do not match production behavior. ([OpenAI Developers][4])

That advice becomes more radical when applied to coding agents.

A coding eval should not ask whether a model can produce a plausible answer. It should ask whether a complete development attempt can be accepted.

```txt
Did it understand the task?
Did it preserve the contract?
Did it change only what it should?
Did it add the right evidence?
Did it pass deterministic checks?
Did it reduce or increase review burden?
Did it leave the repo easier to change next time?
```

This is why public benchmarks are useful but insufficient.

They tell us something about model capability. They do not tell us whether a given execution profile should be trusted in our repo, against our architecture, with our tests, under our risk tolerance.

Anthropic's infrastructure-noise study makes the same point from another angle: in agentic coding evals, resource configuration must be treated as a first-class experimental variable, because small leaderboard differences can reflect hardware, timing, or setup rather than capability; they specifically warn that differences below three percentage points deserve skepticism when eval configuration is not matched. ([Anthropic][5])

So the state of the art is not just "run evals."

It is:

```txt
same task
same repo state
same sandbox
same tools
same budget
same acceptance criteria
same evidence schema
```

Only then can evals become routing logic.

## The breakthrough is acceptance elasticity

AI makes production elastic.

But most organizations still have inelastic acceptance.

They can generate ten times more code, but they cannot review ten times more diffs. They can spawn parallel agents, but they cannot safely integrate parallel uncertainty. They can automate implementation, but not trust.

This creates a new bottleneck:

> Development throughput is bounded by acceptance bandwidth, not generation bandwidth.

The breakthrough metric is therefore not "lines generated" or "tasks attempted."

It is **acceptance elasticity**.

Acceptance elasticity measures how much additional machine-generated work the system can absorb without proportional growth in human review time, defect rate, or architectural damage.

A low-elasticity team gets more output and more chaos.

A high-elasticity team gets more output and more verified progress.

This reframes engineering investment. The highest-leverage work is not another prompt. It is anything that lowers the marginal cost of accepting a correct change or rejecting an unsafe one.

That includes:

```txt
task contracts
fast tests
type systems
visual diffs
policy checks
bounded edit radius
sandboxed execution
structured traces
risk classification
automated reviewers
post-merge regression mining
```

The best AI engineering investment is often not inside the model loop.

It is around the acceptance loop.

## Context is infrastructure

Prompt engineering was the first interface.

Context engineering is the real discipline.

Anthropic describes context engineering as the broader problem of configuring the information available to a model at inference time, beyond merely writing better prompts. The question becomes: what configuration of context is most likely to produce the desired behavior? ([Anthropic][6])

For software development, this means the repo must become context-addressable.

Agents should not scrape meaning from chaos. They should be able to discover the smallest sufficient context packet for the task.

That packet should contain:

```txt
the task
the relevant files
the architectural boundary
the invariants
the examples
the tests
the non-goals
the owner
the risk level
the verification commands
```

The ttoss docs already define context availability as a prerequisite: agents can only use context that exists in accessible artifacts, and decisions trapped in meetings, Slack, memory, or tribal habit are unavailable at execution time. ([Terezinha Tech Operations][1])

The next step is to make context not only available, but load-bearing.

A context artifact should be judged by whether it changes agent behavior.

If a document does not improve execution, reduce review time, prevent a class of errors, or make a task easier to verify, it is not agentic context. It is prose.

## Tools should be designed as contracts, not conveniences

Giving agents more tools does not automatically make them more capable.

It often makes them more confused, more expensive, and harder to control.

Anthropic's writing on agent tools makes this explicit: agents are only as effective as the tools they receive, and teams should build tools and evaluations together. ([Anthropic][7]) Their work on MCP and code execution adds an important refinement: as tool ecosystems grow, loading every tool definition and every intermediate result into context becomes expensive; presenting tools as code APIs lets agents load only what they need, process data outside the model context, and preserve privacy by returning only selected outputs. ([Anthropic][8])

That insight is deeper than MCP.

It says agents should not be forced to think through everything.

They should be allowed to compute.

The model should reason where reasoning is needed. The runtime should execute where execution is cheaper, safer, and more deterministic.

A good agentic repo therefore separates three things:

```txt
reasoning: what should change?
execution: how do we inspect, transform, test, and verify?
evidence: what proves the change is acceptable?
```

The model should not manually compare 10,000 rows, scan every file by memory, or simulate the type checker in prose.

It should write code, call tools, run checks, and return evidence.

The less raw operational detail that flows through the model, the more scalable the system becomes.

## Long-running work needs memory outside the model

Short tasks can live inside one context window.

Real software development rarely does.

Long-running agentic work needs a harness: progress files, task lists, feature states, handoff artifacts, and restartable execution. Anthropic's long-running agent work highlights exactly this problem: agents still struggle across many context windows, and effective harnesses borrow from human engineering workflows by giving agents ways to get up to speed, read progress, and choose the next highest-priority failing feature. ([Anthropic][9])

This suggests a stronger design principle:

> Never store essential progress only in the model's context.

The model context is working memory.

The repository is durable memory.

The harness should continuously externalize progress:

```txt
what was attempted
what changed
what failed
what remains
what evidence exists
what risk is unresolved
```

This turns agentic work from a long conversation into a resumable process.

That is the shape of serious software delivery.

Not a chat.
A ledger.

## Observability is the nervous system

If agents act inside the repo and no trace remains, the team cannot learn.

It can only remember.

Memory does not scale. Telemetry does.

OpenTelemetry's GenAI semantic conventions now define signals for GenAI operations, including events, exceptions, metrics, model spans, and agent spans. ([OpenTelemetry][10]) The metrics spec defines token usage and operation duration for GenAI client operations, with attributes such as operation name, provider, and model. ([OpenTelemetry][11]) The agent span conventions also include operations such as agent creation, workflow invocation, and tool execution, with error types and agent metadata where applicable. ([OpenTelemetry][12])

For agentic development, this should be extended into a repo-level evidence model.

Every run should answer:

```txt
What was the task?
Which profile executed it?
Which model and instructions were used?
Which context was loaded?
Which tools were called?
Which files changed?
Which checks ran?
Which checks failed?
Which errors were infra errors?
Which errors were reasoning errors?
How much human review was required?
What happened after merge?
```

This is not observability for dashboards.

It is observability for organizational learning.

A failed run should not disappear. It should become one of four artifacts:

```txt
a new eval
a new guardrail
a new context artifact
a new deterministic tool
```

That is the compounding loop.

Without it, the organization uses AI.

With it, the organization gets better at using AI every week.

## The acceptance system has three gates

A repo that wants agentic leverage needs three gates.

### 1. The admission gate

Before execution, decide whether the task is delegable.

```txt
Is the goal clear?
Are non-goals explicit?
Is the edit radius bounded?
Is the risk acceptable?
Is there a verification path?
Is the required context available?
```

If not, the task should not go to an agent yet.

It should go to clarification, decomposition, or specification.

This is where human judgment has the highest leverage.

### 2. The execution gate

During execution, constrain the work.

```txt
sandbox
permissions
network policy
time budget
memory budget
tool allowlist
protected paths
progress checkpoints
```

OpenAI's Codex launch described cloud tasks running in separate sandbox environments preloaded with the repository, which reflects the direction of travel: agentic software work is becoming isolated, parallel, and environment-aware by default. ([OpenAI][13])

The sandbox is not an implementation detail.

It is part of the contract.

### 3. The acceptance gate

After execution, demand evidence.

```txt
diff
tests
types
lint
screenshots
security checks
behavioral traces
risk notes
rollback path
```

The human should not be the first verifier.

The human should be the final judge.

That difference is everything.

## The repo should become self-tightening

The most important property of the future development system is not autonomy.

It is self-tightening.

Every failure should make the next failure less likely.

A human catches an unauthorized export bug.
That becomes a regression test.

An agent edits a forbidden path.
That becomes a policy gate.

A task was ambiguous.
That becomes a required field in the task contract.

A model bloats a simple change.
That becomes an edit-radius budget.

A tool returns too much irrelevant data.
That becomes a filtered API.

A reviewer spends thirty minutes reconstructing intent.
That becomes a mandatory evidence summary.

This is the operating principle:

> Do not merely correct agent mistakes. Convert them into structure.

The best teams will not be the teams with the most powerful models.

They will be the teams whose systems learn fastest from every rejected change.

## What to build

The next platform is not an AI chat interface.

It is an **agentic delivery system**.

It can start small:

```bash
ai admit .ai/tasks/issue-481.yaml
ai run --profile bugfix-minimal-edit --task .ai/tasks/issue-481.yaml
ai verify --run run_01
ai explain --run run_01
ai mine-failure --run run_01
```

The important part is not the CLI.

The important part is the loop:

```txt
admit
→ execute
→ verify
→ explain
→ accept or reject
→ mine into memory
```

At maturity, the system knows:

```txt
which tasks are safe to delegate
which profiles work for each task class
which model is best under which budget
which checks catch which failures
which context artifacts reduce confusion
which tools reduce token waste
which humans should review which risks
```

That is when AI stops being an assistant bolted onto software development.

It becomes part of the delivery system itself.

## The new definition of velocity

Velocity used to mean how fast a team could produce code.

In agentic development, that definition is obsolete.

A team can now produce code faster than it can understand, test, review, integrate, and own it.

So velocity must be redefined:

> Velocity is the rate at which a team can safely accept useful change.

Not generate change.

Accept change.

This definition makes the trade-offs visible.

A change that takes five minutes to generate and two hours to review is not fast.

A change that takes twenty minutes to generate and five minutes to accept may be faster.

A model that writes more code but increases uncertainty is not better.

A profile that writes less code but produces stronger evidence may improve throughput.

A benchmark win that disappears under controlled runtime is not capability.

A workflow that turns failures into durable guardrails is capability.

## Conclusion

The next stage of AI-assisted development will not be won by teams that prompt harder.

It will be won by teams that make their repositories acceptance-native.

The repo must expose intent.
The task must encode judgment.
The profile must constrain execution.
The sandbox must bound risk.
The trace must preserve evidence.
The eval must route work.
The verifier must reduce uncertainty.
The human must judge what remains.
The failure must harden the system.

This is the shift:

```txt
from code generation
to change acceptance

from agents as workers
to profiles as schedulable execution

from prompts as instructions
to repos as intent compilers

from review as inspection
to review as final judgment

from AI usage
to AI compounding
```

The repository is no longer just where software is stored.

It is where human judgment becomes executable.

And when that happens, the agent is not outside the system helping the developer.

The system itself has become agentic.

[1]: https://ttoss.dev/docs/ai/agentic-engineering-foundations 'Agentic Engineering Foundations | Terezinha Tech Operations (ttoss)'
[2]: https://developers.openai.com/codex/learn/best-practices 'Best practices – Codex | OpenAI Developers'
[3]: https://developers.google.com/gemini-code-assist/docs/use-agentic-chat-pair-programmer 'Use the Gemini Code Assist agent mode  |  Google for Developers'
[4]: https://developers.openai.com/api/docs/guides/evaluation-best-practices 'Evaluation best practices | OpenAI API'
[5]: https://www.anthropic.com/engineering/infrastructure-noise 'Quantifying infrastructure noise in agentic coding evals \\ Anthropic'
[6]: https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents 'Effective context engineering for AI agents \\ Anthropic'
[7]: https://www.anthropic.com/engineering/writing-tools-for-agents 'Writing effective tools for AI agents—using AI agents \\ Anthropic'
[8]: https://www.anthropic.com/engineering/code-execution-with-mcp 'Code execution with MCP: building more efficient AI agents \\ Anthropic'
[9]: https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents 'Effective harnesses for long-running agents \\ Anthropic'
[10]: https://opentelemetry.io/docs/specs/semconv/gen-ai/ 'Semantic conventions for generative AI systems | OpenTelemetry'
[11]: https://opentelemetry.io/docs/specs/semconv/gen-ai/gen-ai-metrics/ 'Semantic conventions for generative AI metrics | OpenTelemetry'
[12]: https://opentelemetry.io/docs/specs/semconv/gen-ai/gen-ai-agent-spans/ 'Semantic Conventions for GenAI agent and framework spans | OpenTelemetry'
[13]: https://openai.com/index/introducing-codex/ 'Introducing Codex | OpenAI'
