---
title: "You Probably Don't Need a Graph"
description: A three-layer model of agent architecture is circulating — harness, loop, graph. The layers are real, but the investment order most teams infer from them is backwards.
authors:
  - arantespp
tags:
  - ai
  - agentic-development
  - architecture
  - engineering
---

A framing has been circulating that splits agent architecture into three layers: the **harness** that gives a model tools, memory, and permissions; the **loop** that retries and verifies work; and the **graph** that makes the workflow topology explicit. It is a genuinely useful decomposition, and the diagnostic it implies — figure out which layer owns a failure before you fix anything — is the most valuable idea in it.

But the framing presents the three as co-equal disciplines you should design intentionally, and most teams read that as an instruction to build all three. That reading is expensive. The layers are real; the investment order is not equal.

<!-- truncate -->

## The Layers, Briefly

The harness is the environment: what the agent can see, what it can do, what survives between sessions, and what it is forbidden from touching. The loop is the feedback cycle: how work gets checked, what evidence proves it succeeded, and when it stops. The graph is the flow: which step is allowed to happen next, where work runs in parallel, and where a human must sign off.

Environment, feedback, flow. Two teams with the same model and different harnesses get different outcomes, and that is the whole argument for taking the system around the model seriously.

## The Order That Actually Pays

Invest in the harness first, the loop second, and the graph last — and last frequently means never.

**The harness earns first place because most failures live there.** An agent that cannot reach the right tool, works from stale state, loses context between sessions, or holds permissions nobody scoped is not going to be rescued by a better workflow diagram. This is also where the cheapest wins are: [The Corollary of Tool Minimalism](/docs/ai/agentic-development-principles/architecture-of-flow#the-corollary-of-tool-minimalism) says fewer, more atomic tools outperform bloated toolsets, which means the highest-leverage harness work is often deletion. A good harness is not crowded; it is precise.

**The loop earns second place because it converts a capable agent into a reliable one.** The rule worth memorizing is: do not loop on confidence, loop on evidence. "The agent says it is done" is not a stop condition; tests passing, a schema validating, and citations resolving are. That is [The Principle of Automated Closed Loops](/docs/ai/agentic-development-principles/physics-of-ai-integration#the-principle-of-automated-closed-loops) — open loops accumulate error, and only automated verification closes them cheaply enough to be worth it.

Two failure modes deserve naming here, because both are common and neither is obvious. A loop with no ceiling is not a loop but a cost leak, which is why every loop needs a success predicate, a budget, and an escalation path — see [Bounded Iteration](/docs/ai/agentic-design-patterns#bounded-iteration). And a loop that runs long enough starts optimizing for its checker instead of your requirement, which is [The Principle of Proxy Collapse](/docs/ai/agentic-development-principles/physics-of-ai-integration#the-principle-of-proxy-collapse): the gradient points at green, not at correct.

**The graph earns last place because it is the oldest idea in the stack wearing new vocabulary.** Explicit workflow topology is workflow orchestration, and it predates language models by decades — state machines, BPMN, Airflow, Step Functions, Temporal. Nothing is wrong with it. But the trend line runs against adding it early: as models absorb more orchestration competence, hand-drawn node graphs of _researcher → screener → drafter → reviewer_ increasingly underperform one capable agent with a clean harness and honest stop conditions. Most of the elaborate agent graphs built in 2023 and 2024 have since been deleted.

The strongest evidence is that graph advocates concede the point themselves: nearly every version of this framing lists "building the graph too early" as the first mistake teams make. A layer whose most common failure mode is _existing prematurely_ is not a layer you design up front.

## When a Graph Does Earn Its Place

Structure is not free, but neither is its absence. Reach for an explicit topology when you observe one of these, and not before: a **mandatory human gate** that must be enforced rather than requested; an **audit requirement** where the path taken has to be reconstructable after the fact; **expensive parallel stages** that need deterministic joins; or **durable resumption**, where a workflow interrupted at hour six must restart at step nine rather than step one.

Notice these are all properties of the process, not of the model — which is exactly why they do not get better as models improve, and why a graph is the right answer when they appear.

The related decision, when the pressure is toward splitting work across agents rather than sequencing it, is covered by [Skilled Generalist vs. Specialist Pipeline](/docs/ai/agentic-design-patterns#skilled-generalist-vs-specialist-pipeline): each boundary spends a handoff cost to buy an isolation benefit, and topology chosen by analogy rather than by that trade is how teams end up orchestrating five context resets for a feature one agent could have carried end to end.

## Diagnose Before You Build

The framing's real contribution is diagnostic, and it survives regardless of whether "graph engineering" sticks as a term. Before changing anything, attribute the failure to a layer: if the agent **cannot operate**, the defect is environmental; if it **almost works but is unreliable**, the defect is in the feedback loop; if the **steps are each fine but the process is unmanageable**, the defect is in the flow.

Order matters here, because environment defects impersonate the other two. An agent starved of context produces inconsistent output that reads like a verification problem and erratic sequencing that reads like a topology problem — and a team that diagnoses in the wrong direction builds a workflow to compensate for a missing tool. We have written this up as [Layered Failure Diagnosis](/docs/ai/agentic-design-patterns#layered-failure-diagnosis).

## The Takeaway

Harness, loop, graph is a good map. It is a bad budget. Spend on the environment, then on evidence-based feedback with real stop conditions, and treat explicit topology as an escape hatch that specific, observable pains unlock — human gates, auditability, parallel joins, durable resume.

The differentiator in production has rarely been the model. But it is not the diagram either. It is whether the agent can reach what it needs, and whether anything in the system can prove it did the job.
