---
sidebar_position: 6
title: Controlling Flow Under Uncertainty
---

## F1: The Principle of Congestion Collapse: When loading becomes too high, we will see a sudden and catastrophic drop in output.

## F2: The Peak Throughput Principle: Control occupancy to sustain high throughput in systems prone to congestion.

## F3: The Principle of Visible Congestion: Use forecasts of expected flow time to make congestion visible.

## F4: The Principle of Congestion Pricing: Use pricing to reduce demand during congested periods.

Decision-makers should feel both the cost and the benefit of their choices ([E14](/docs/product/product-development/principles/economic-view#e14-the-first-market-principle-ensure-decision-makers-feel-both-cost-and-benefit)). The cost of loading a resource depends on how congested it is, and the most elegant way to make a project feel that cost is to charge more when the resource is congested.

Airfares and hotel rates work this way: customers with no flexibility pay high-season prices, and those with flexibility move to the off-season. Any flexible demand is enough, because the queueing curve is so steep that a small shift in demand makes a large difference in flow time. Start simple: a premium of 20 to 50 percent is usually enough to move flexible demand. Project managers already decide whether to pay for faster service from external suppliers; the same choice can be extended to congested internal resources.

## F5: The Principle of Periodic Resynchronization: Use a regular cadence to limit the accumulation of variance.

Cadence is a regular, predictable rhythm within a process. It turns unpredictable events into predictable ones and keeps variability from accumulating along a sequence of steps.

Buses that leave their origin at carefully timed intervals still end up arriving in pairs. When the leading bus meets more passengers at a stop, it loads more slowly, falls behind, and finds even more passengers waiting at the next stops; the bus behind it meets fewer passengers and speeds up. That regenerative feedback makes the slow bus slower and the fast bus faster until they bunch. A scheduled departure time at each stop breaks the loop: a bus that arrives early waits, so it does not run ahead and leave an excessive load for the next bus. Resynchronizing to the schedule keeps one bus's variance from coupling into the ones behind it, isolating it to a single interval instead of letting it accumulate.

Resynchronizing is not the same as correcting an out-of-bounds condition: it restores the system to the center of its control range, not merely inside its limits. In the coin-flipping game of [Q15](/docs/product/product-development/principles/managing-queues#q15-the-diffusion-principle-over-time-queues-will-randomly-spin-seriously-out-of-control-and-will-remain-in-this-state-for-long-periods), a player who starts with 5 dollars and loses one on every tails should add capital after losing 4. Adding 1 dollar leaves a 50 percent chance of needing more on the next flip; adding 5 leaves a 1 in 32 chance of intervening in the next five. Restoring a queue to the center of its target range makes high-queue states far less likely and leaves the system robust to a burst of demand.

The benefit is a system-level effect. Optimizing one bus would let it run ahead of schedule, since a stopped bus moves no passengers, but that bus would desynchronize the whole system. What is optimal for a subsystem is not always optimal for the system.

## F6: The Cadence Capacity Margin Principle: Provide sufficient capacity margin to enable cadence.

A process can resynchronize to a regular cadence only if it has enough capacity margin to keep to it despite variation. A bus schedule needs enough slack that reasonable delays do not push a bus off schedule, which means more buses on the route, some of them waiting at stops: short, predictable waits for passengers cost the operator more.

The same holds for a regular product launch schedule, which needs enough capacity margin to absorb delays at intermediate milestones. That is an economic trade-off between the cost of the margin and the damage done by variances that accumulate catastrophically.

## F7: The Cadence Reliability Principle: Use cadence to make waiting times predictable.

## F8: The Cadence Batch Size Enabling Principle: Use a regular cadence to enable small batch sizes.

## F9: The Principle of Cadenced Meetings: Schedule frequent meetings using a predictable cadence.

## F10: The Synchronization Capacity Margin Principle: To enable synchronization, provide sufficient capacity margin.

## F11: The Principle of Multiproject Synchronization: Exploit scale economies by synchronizing work from multiple projects.

## F12: The Principle of Cross-Functional Synchronization: Use synchronized events to facilitate cross function trade-offs.

## F13: The Synchronization Queueing Principle: To reduce queues, synchronize the batch size and timing of adjacent processes.

## F14: The Harmonic Principle: Make nested cadences harmonic multiples.

Processes with fundamentally different cadences are best coordinated by nesting them hierarchically as harmonic multiples of one another, as a daily module test nests inside a weekly higher-level test. Nesting brings the same benefits as synchronizing batch sizes and timing, and it is established practice in financial reporting, where monthly, quarterly and annual cycles nest.

## F15: The SJF Scheduling Principle: When delay costs are homogeneous, do the shortest job first.

When every job has the same [cost of delay](/docs/product/product-development/definitions#cost-of-delay), do the shortest job first (SJF). Each job waits for every job ahead of it, so its delay cost grows with the time those jobs take. With three jobs of durations 1, 3 and 10, running the shortest first keeps two of them waiting only briefly; running the longest first makes the two short jobs wait for the long one. This is the convoy effect, the one slow car on a narrow road that holds up every car behind it.

## F16: The HDCF Scheduling Principle: When job durations are homogeneous, do the high cost-of-delay job first.

When every job takes the same time but their [costs of delay](/docs/product/product-development/definitions#cost-of-delay) differ, do the job with the highest cost of delay first (HDCF). Jobs that lose little by waiting wait, so the ones that lose most are served first. With three equal-length jobs whose delay costs are 10, 3 and 1, running them in that order rather than in reverse is where the saving comes from.

## F17: The WSJF Scheduling Principle: When job durations and delay costs are not homogeneous, use WSJF.

When both durations and [costs of delay](/docs/product/product-development/definitions#cost-of-delay) differ, the most common case in practice, do the weighted shortest job first (WSJF): rank each job by its cost of delay divided by its duration. The metric needs data from the job alone, which makes it easy to apply.

| Job | Duration | Cost of delay | Weight (CoD / duration) |
| --- | -------- | ------------- | ----------------------- |
| 1   | 1        | 10            | 10                      |
| 2   | 3        | 3             | 1                       |
| 3   | 10       | 1             | 0.1                     |

Serving a job blocks the resource for its duration. The benefit of serving it now is the delay cost it saves, and the price is the time every other job waits, so a correct sequence weighs both.

Three common practices miss this. Ranking by return on investment ignores how sensitive each project's profit is to delay: a high-ROI project that loses little by waiting should go after a low-ROI one that loses a lot, because what matters is the portfolio's return adjusted for delay cost. First-in, first-out is simple but dangerous when delay costs differ, as an emergency room that served patients in arrival order would show. Critical Chain gives priority to the project with the least remaining buffer (minimum slack time first), which minimizes missed schedules but is not optimal when delay costs differ: a low-cost-of-delay project short on slack should not displace a high-cost-of-delay one that still has plenty.

## F18: The Local Priority Principle: Priorities are inherently local.

WSJF has a subtle consequence. Priority depends on cost of delay, a property of the project, and on the time the job needs at a resource, a property of that resource. Priorities are therefore local to each resource, not global properties of projects.

Ranking projects once and telling the whole organization to follow that ranking lets an unimportant task on a high-priority project displace an important task on a lower-priority one. The local nature of priority argues for [decentralized control](/docs/product/product-development/principles/achieving-decentralized-control).

## F19: The Round-Robin Principle: When task duration is unknown, share time among tasks.

When scheduling a task with an unknown duration, you can't predict how long it will occupy a resource. Worse, the task could take an infinite amount of time.

The [round-robin scheduling](/docs/product/product-development/definitions#round-robin-scheduling) method from operating system design addresses this by allocating a fixed time slice (quantum) to each task. After the quantum ends, the task returns to the queue, and the next task starts. This ensures shorter tasks are completed sooner, even if their duration is unknown.

The key decision is setting the quantum size. If too large, the system behaves like FIFO; if too small, frequent context switching increases overhead. A useful heuristic is setting the quantum so that 80% of tasks are completed within a single time slice.

## F20: The Preemption Principle: Only preempt when switching costs are low.

Sending a job to the head of the ready queue is not the same as letting it interrupt a job already being served. Preemption gives the fastest cycle time, but it is usually a bad practice: switching wastes work and lowers the effective capacity of a bottleneck. Head-of-the-line privilege is usually enough, since it removes queue time, typically the largest part of cycle time ([W18: The Principle of Differential Service](/docs/product/product-development/principles/applying-wip-constraints#w18-the-principle-of-differential-service-differentiate-quality-of-service-by-workstream)). The job still waits for the one in service to clear, the residual time, which small batches keep short and [round-robin scheduling](#f19-the-round-robin-principle-when-task-duration-is-unknown-share-time-among-tasks) keeps predictable.

The gain from preempting is the cost-of-delay savings the new sequence buys minus the cost of switching, and those savings are large only when jobs differ greatly in cost of delay and in duration. So preempt only when switching is cheap and the savings are substantial, as an emergency room interrupts a doctor treating a cold to attend a cardiac arrest.

## F21: The Principle of Work Matching: Use sequence to match jobs to appropriate resources.

Specialized resources are ideal for particular jobs, but jobs do not arrive in the order those specialists become free, so work gets dispatched to whoever is available, even when that resource handles it badly. A small pool of ready work avoids this: each resource pulls from it the job that fits.

Suppose designs await mechanical analysis, some routine stress analyses and some vibration analyses only one expert can do. With no vibration work waiting, the expert takes routine work; with some waiting, the expert takes that first; and with vibration work about to arrive, it is better to hold the expert briefly idle than to tie up the scarce resource with a routine job. Nonhomogeneous work and resources almost always offer such a matching opportunity, which is why first-in, first-out is virtually never the best sequence, and matching well needs visibility into adjacent resources: the work coming in and when each resource will be free.

## F22: The Principle of Tailored Routing: Select and tailor the sequence of subprocesses to the task at hand.

## F23: The Principle of Flexible Routing: Route work based on the current most economic route.

## F24: The Principle of Alternate Routes: Develop and maintain alternate routes around points of congestion.

## F25: The Principle of Flexible Resources: Use flexible resources to absorb variation.

## F26: The Principle of Late Binding: The later we bind demand to resources, the smoother the flow.

## F27: The Principle of Local Transparency: Make tasks and resources reciprocally visible at adjacent processes.

## F28: The Principle of Preplanned Flexibility: For fast responses, preplan and invest in flexibility.

Flexibility comes from early decisions and careful planning. By preparing in advance, teams can respond quickly to changes.

For instance, if maintaining schedules is crucial, pre-identify nonessential requirements, classifying them as mandatory, important, or optional. This way, optional features are loosely coupled with the core architecture, making it easier to drop them if needed.

Similarly, if you anticipate needing to reallocate resources quickly, invest in keeping backup resources informed and ready. This reduces their response time and ensures they can become productive on short notice.

## F29: The Principle of Resource Centralization: Correctly managed, centralized resources can reduce queues.

## F30: The Principle of Flow Conditioning: Reduce variability before a bottleneck.
