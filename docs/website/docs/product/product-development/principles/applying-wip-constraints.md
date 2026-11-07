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

Reaching a WIP limit is not the hard part; what matters is what happens next. The responses fall into three families: cut demand (block new work, purge projects already admitted, shed requirements), add supply (pull in resources, part-timers, experts, cross-trained people), or change the mix of work entering the system. The demand-side responses are the fastest, since they act the moment they are chosen, while adding capacity takes time to arrive.

The simplest response is to block all new demand once WIP hits its limit, as kanban does and as a telephone network does with a busy signal. The arriving job can be ejected, which enforces a true ceiling on WIP and cycle time, worth it because a high-queue state takes long to correct and does damage the whole time. Or it can be held in an upstream queue: demand is not reduced, only moved, which pays when the upstream queue is cheaper to hold work in ([W21: The Principle of the Critical Queue](/docs/product/product-development/principles/applying-wip-constraints#w21-the-principle-of-the-critical-queue-constrain-wip-in-the-section-of-the-system-where-the-queue-is-most-expensive)), provided that queue has a limit of its own.

## W7: The Principle of WIP Purging: When WIP is high, purge low-value projects.

When WIP is high, queues are high, and every job inside is accruing delay cost at the higher rate a long queue imposes ([Q15: The Diffusion Principle](/docs/product/product-development/principles/managing-queues#q15-the-diffusion-principle-over-time-queues-will-randomly-spin-seriously-out-of-control-and-will-remain-in-this-state-for-long-periods)). A job that was worth holding when holding was cheap may not be worth keeping now, so while high-value work keeps arriving, low-value work is purged to free its slot, the way an emergency room moves stable patients out of its few beds so critical ones can be treated.

Purging is still an economic decision: what counts is the remaining investment to finish a job against its return, never what has already been spent on it ([E17: The Sunk Cost Principle](/docs/product/product-development/principles/economic-view#e17-the-sunk-cost-principle-do-not-consider-money-already-spent)). The common failure is the opposite of killing: starving a job of resources while keeping it alive. Such zombie projects are not good enough to finish and not bad enough to stop, and they destroy flow. Kill the zombies.

## W8: The Principle of Flexible Requirements: Control WIP by shedding requirements.

The smaller-batch form of purging is to drop requirements instead of whole projects. During congestion a requirement's delay cost rises, because it now holds up a larger queue behind it, so a feature of marginal value is worth less than the time it costs to build. The payoff is large because a congested system sits on the steep part of the queueing curve, where a small cut in load buys a large cut in cycle time.

Decide in advance which requirements could be dropped or relaxed: the decision is better made before the pressure of a crisis, and knowing the candidates early lets the architecture keep them loosely coupled, so they can be cut loose quickly. Relaxing a target is a choice somebody pays for, and it works best when whoever relaxes it also feels its cost ([E14: The First Market Principle](/docs/product/product-development/principles/economic-view#e14-the-first-market-principle-ensure-decision-makers-feel-both-cost-and-benefit)).

## W9: The Principle of Resource Pulling: Quickly apply extra resources to an emerging queue.

## W10: The Principle of Part-Time Resources: Use part-time resources for high variability tasks.

## W11: The Big Gun Principle: Pull high-powered experts to emerging bottlenecks.

## W12: The Principle of T-Shaped Resources: Develop people who are deep in one area and broad in many.

## W13: The Principle of Skill Overlap: Cross-train resources at adjacent processes.

## W14: The Mix Change Principle: Use upstream mix changes to regulate queue size.

## W15: The Aging Principle: Watch the outliers.

By Little's Formula, average queue size sets average waiting time ([Q12: Little's Formula](/docs/product/product-development/principles/managing-queues#q12-littles-formula-wait-time--queue-sizeprocessing-rate)), but averages hide the tail. An aging analysis looks at the distribution of time in queue, and especially at the jobs that have waited far longer than the rest. Finance does this with receivables more than 90 or 120 days past due, because a very late account is disproportionately likely to never pay; a job stuck in a WIP pool for a long time is likewise likely to be hitting a problem nobody has seen yet. The analysis makes those jobs visible.

## W16: The Escalation Principle: Create a preplanned escalation process for outliers.

Seeing an outlier is not enough; a preplanned process must bring it back under control, for instance by shedding its requirements ([W8](#w8-the-principle-of-flexible-requirements-control-wip-by-shedding-requirements)) or pulling in experts ([W11](#w11-the-big-gun-principle-pull-high-powered-experts-to-emerging-bottlenecks)). The simplest escalation raises a job to someone with more authority once it passes a time limit in the queue: a drawing that waited more than seven days is reported to the department's manager. Alternatively, a rule raises a job's priority class with its age, as operating systems do for a process that has waited too long at a low priority; that rule can run decentralized and automated, and it assumes that even low-priority work is perishable ([D3: The Principle of Layered Control](/docs/product/product-development/principles/achieving-decentralized-control#d3-the-principle-of-layered-control-adapt-control-based-on-emerging-information)).

Age is still not an economic criterion. The job that comes first is the one with the most cost-of-delay savings per unit of the bottleneck resource, however long another has waited ([F17: The WSJF Scheduling Principle](/docs/product/product-development/principles/controlling-flow-under-uncertainty#f17-the-wsjf-scheduling-principle-when-job-durations-and-delay-costs-are-not-homogeneous-use-wsjf)). If outliers really carry a disproportionate cost of delay, that belongs in their economic priority rather than in a separate rule that overrides it.

## W17: The Principle of Progressive Throttling: Increase throttling as you approach the queue limit.

Blocking all demand at the limit ([W6](#w6-the-principle-of-demand-blocking-block-all-demand-when-wip-reaches-its-upper-limit)) is a tail-dropping queue, and the Internet found two flaws in it. A system that throttles only once the buffer is full gravitates to nearly full buffers, leaving no margin for a burst. And an on-off signal makes arrivals either unrestricted or fully blocked, a jaggedness in flow that is itself undesirable variability.

Random Early Deletion and Random Early Marking throttle before the buffer fills, so flow changes smoothly and the system spends more of its time with the reserve margin a burst needs. Product development can do the same by raising the bar for new work as congestion grows, such as demanding a higher return to start a project as the portfolio nears its capacity, or by pricing a shared resource higher while it is congested ([F4: The Principle of Congestion Pricing](/docs/product/product-development/principles/controlling-flow-under-uncertainty#f4-the-principle-of-congestion-pricing-use-pricing-to-reduce-demand-during-congested-periods)).

## W18: The Principle of Differential Service: Differentiate quality of service by workstream.

A workstream's jobs carry widely different costs of delay, so a single queue serves none of them well. Split the work into a few classes, such as high, medium and low cost of delay, give each a target flow-through time, and derive each class's WIP limit from it with Little's Formula ([Q12](/docs/product/product-development/principles/managing-queues#q12-littles-formula-wait-time--queue-sizeprocessing-rate)). A WIP limit together with a capacity allocation per class controls each class's flow-through time, even on a shared resource.

One software company allows a single hot job in its maintenance workstream. It has head-of-the-line privilege in every queue, without preempting work already underway at a resource, so it waits for nothing and flows through quickly.

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
