---
sidebar_position: 5
title: Applying WIP Constraints
---

## W1: The Principle of WIP Constraints: Constrain WIP to control cycle time and flow.

Limiting work-in-process (WIP) prevents the catastrophic high-queue states described in [Q15: The Diffusion Principle](/docs/product/product-development/principles/managing-queues#q15-the-diffusion-principle-over-time-queues-will-randomly-spin-seriously-out-of-control-and-will-remain-in-this-state-for-long-periods).

WIP constraints work by blocking new work when queue size reaches a predetermined limit (k), creating an M/M/1/k queueing system. This creates three effects, one positive and two negative. The positive is dramatically reduced average [cycle time](/docs/product/product-development/definitions#cycle-time) by preventing queue explosions.

The negative effects are rejected potentially valuable work during congestion periods and reduced capacity utilization when demand is blocked.

The cycle time reduction typically provides **10x more economic value** than the costs of blocked demand and capacity underutilization.

## W2: The Principle of Rate-Matching: WIP constraints force rate-matching.

## W3: The Principle of Global Constraints: Use global constraints for predictable and permanent bottlenecks.

## W4: The Principle of Local Constraints: If possible, constrain local WIP pools.

## W5: The Batch Size Decoupling Principle: Use WIP ranges to decouple the batch sizes of adjacent processes.

## W6: The Principle of Demand Blocking: Block all demand when WIP reaches its upper limit.

## W7: The Principle of WIP Purging: When WIP is high, purge low-value projects.

## W8: The Principle of Flexible Requirements: Control WIP by shedding requirements.

## W9: The Principle of Resource Pulling: Quickly apply extra resources to an emerging queue.

## W10: The Principle of Part-Time Resources: Use part-time resources for high variability tasks.

## W11: The Big Gun Principle: Pull high-powered experts to emerging bottlenecks.

## W12: The Principle of T-Shaped Resources: Develop people who are deep in one area and broad in many.

## W13: The Principle of Skill Overlap: Cross-train resources at adjacent processes.

## W14: The Mix Change Principle: Use upstream mix changes to regulate queue size.

## W15: The Aging Principle: Watch the outliers.

## W16: The Escalation Principle: Create a preplanned escalation process for outliers.

## W17: The Principle of Progressive Throttling: Increase throttling as you approach the queue limit.

## W18: The Principle of Differential Service: Differentiate quality of service by workstream.

## W19: The Principle of Adaptive WIP Constraints: Adjust WIP constraints as capacity changes.

A fixed WIP limit assumes stable capacity. Kanban sets its limits and changes them slowly, which suits a predictable process but not one with large swings in demand and throughput.

The Internet's answer is TCP's window: the number of unacknowledged packets allowed in flight between sender and receiver. The sender probes capacity by raising its rate in small linear steps and, when dropped packets signal congestion, cuts the rate sharply before probing again. This Additive Increase, Multiplicative Decrease (AIMD) is chosen for stability: a system where everyone stops at once and then floods back in oscillates.

Product development can adapt the same way. While a stage finishes work quickly, admit more WIP without risking cycle-time goals; when it slows, lower the limit so the goals still hold. If testing returns results fast, more jobs can be active; when tests start taking longer, tighten the limit before the queue grows.

## W20: The Expansion Control Principle: Prevent uncontrolled expansion of work.

Controlling arrivals is not enough; work must also be kept from growing once it is inside. Some work behaves like a gas and expands to fill whatever time it is given, as conceptual design does, causing delays even when the arrival rate is carefully controlled.

Two defenses block that expansion. The first is a time-out: operating systems accept jobs that may run forever without knowing in advance which ones will, so they cap how long any job may run, and one runaway job cannot lock up the rest ([F19: The Round-Robin Principle](/docs/product/product-development/principles/controlling-flow-under-uncertainty#f19-the-round-robin-principle-when-task-duration-is-unknown-share-time-among-tasks)). The second is a minimum rate of progress: stop a task at the point of diminishing returns, where more time and resources no longer buy enough improvement in the design's value ([E16: The Principle of Marginal Economics](/docs/product/product-development/principles/economic-view#e16-the-principle-of-marginal-economics-always-compare-marginal-cost-and-marginal-value)).

## W21: The Principle of the Critical Queue: Constrain WIP in the section of the system where the queue is most expensive.

Holding work costs different amounts in different places, so keep WIP lowest where waiting is most expensive and let work wait where waiting is cheap.

Air traffic control holds planes in three pools: on the ground at the departure airport, in transit, and in holding patterns at the destination ([V16: The Principle of Variability Displacement](/docs/product/product-development/principles/exploiting-variability#v16-the-principle-of-variability-displacement-move-variability-to-the-process-stage-where-its-cost-is-lowest)). Circling the destination is the most expensive place to hold a plane and the ground is the cheapest, so when weather lowers a destination's landing rate, controllers limit departures to it, adjusting as the flow changes.

In product development, it is often better to hold new opportunities in a ready queue upstream than to let them enter the development system, where they dilute resources, accrue costs and add overhead. Because opportunities are perishable, holding them inside is expensive; the upstream queue is cheaper. HP's bug-fixing teams applied the same rule ("we only want to work on fresh bugs"), limiting the bugs actively worked on, which shortened flow-through time and kept them on the problems that mattered.

## W22: The Cumulative Reduction Principle: Small WIP reductions accumulate.

## W23: The Principle of Visual WIP: Make WIP continuously visible.
