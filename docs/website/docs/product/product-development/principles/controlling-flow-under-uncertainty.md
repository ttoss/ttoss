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

## F16: The HDCF Scheduling Principle: When job durations are homogeneous, do the high cost-of-delay job first.

## F17: The WSJF Scheduling Principle: When job durations and delay costs are not homogeneous, use WSJF.

## F18: The Local Priority Principle: Priorities are inherently local.

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
