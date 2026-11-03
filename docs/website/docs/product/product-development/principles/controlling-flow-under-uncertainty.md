---
sidebar_position: 6
title: Controlling Flow Under Uncertainty
---

## F1: The Principle of Congestion Collapse: When loading becomes too high, we will see a sudden and catastrophic drop in output.

## F2: The Peak Throughput Principle: Control occupancy to sustain high throughput in systems prone to congestion.

## F3: The Principle of Visible Congestion: Use forecasts of expected flow time to make congestion visible.

## F4: The Principle of Congestion Pricing: Use pricing to reduce demand during congested periods.

## F5: The Principle of Periodic Resynchronization: Use a regular cadence to limit the accumulation of variance.

## F6: The Cadence Capacity Margin Principle: Provide sufficient capacity margin to enable cadence.

## F7: The Cadence Reliability Principle: Use cadence to make waiting times predictable.

## F8: The Cadence Batch Size Enabling Principle: Use a regular cadence to enable small batch sizes.

## F9: The Principle of Cadenced Meetings: Schedule frequent meetings using a predictable cadence.

## F10: The Synchronization Capacity Margin Principle: To enable synchronization, provide sufficient capacity margin.

## F11: The Principle of Multiproject Synchronization: Exploit scale economies by synchronizing work from multiple projects.

## F12: The Principle of Cross-Functional Synchronization: Use synchronized events to facilitate cross function trade-offs.

## F13: The Synchronization Queueing Principle: To reduce queues, synchronize the batch size and timing of adjacent processes.

## F14: The Harmonic Principle: Make nested cadences harmonic multiples.

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

## F21: The Principle of Work Matching: Use sequence to match jobs to appropriate resources.

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
