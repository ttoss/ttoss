---
title: Principles
---

import TOCInline from '@theme/TOCInline';

In this section, we list the principles that we follow when developing products. We use these principles as a base to create all processes, tools, guidelines, and workflows of all departments—[product](/docs/product), [design](/docs/engineering), and [engineering](/docs/engineering).

_These principles are based on the book [The Principles of Product Development Flow](https://www.amazon.com/Principles-Product-Development-Flow-Generation-ebook/dp/B00K7OWG7O) by Donald G. Reinertsen._

## Table of Contents

<TOCInline toc={toc} />

## The Economic View

_Why do you want to change the product development process?_ The answer: **to increase profits**.

The economic view of product development allows you to make product development decisions based on economic choices. You don't chase the popular proxy variable of the moment. Instead, you transform all proxy variables to the same unit of measure, life-cycle profits, and make multivariable trade-offs to increase profits, which is the core of product development.

### E1: The Principle of Quantified Overall Economics: Select Actions Based on Quantified Overall Economic Impact

You should consider the economic impact of all possible decisions when you have to make a project decision. For example, choosing between releasing a project soon without many tests or testing more and releasing later should be an economic, not a philosophical choice.

### E3: The Principle of Quantified Cost of Delay If You only Quantify One Thing, Quantify the Cost of Delay

You don't have business trading money for [cycle time](/docs/product/product-development/definitions#cycle-time) if you don't know the economic value of [cycle time](/docs/product/product-development/definitions#cycle-time). No single sensitivity is more eye-opening than the cost of delay (COD). The cost of queues, determined by COD, dominates the economics of Flow.

## Managing Queues

### Q1: The Principle of Invisible Inventory: Product Development Inventory Is Physically and Financially Invisible

Inventory in product development isn't physical objects but information. Then, it's virtually invisible, both physically and financially. Product development inventory's effects: increased [cycle time](/docs/product/product-development/definitions#cycle-time), delayed feedback, constantly shifting priorities, and status reporting.

### Q4: The Principle of High-Queues States: Most of the Damage Done by a Queue Is Caused by High-Queues States

Queues spend more time in low-queue states, but high-queue states cause the most harm. When a queue is overloaded, it delays more tasks, increases cycle times, and leads to greater economic waste. Even though high-queue states are less frequent, they have a much bigger impact on overall performance and efficiency.

The State Probability of an $M/M/1/\infty$ queue to have $n$ jobs in the system is:

$$
\text{State Probability} = \frac{1-\rho}{\rho^n}
$$

For example, for a queue with at 75% utilization, the probabilities of having $n$ jobs in the system are:

| Number of Jobs in the System | Probability |
| ---------------------------- | ----------- |
| 0                            | 25%         |
| 1                            | 18.8%       |
| 2                            | 14.1%       |
| 3                            | 10.5%       |

This means that the probability of having two jobs are 75% of the probability of having one job in the system. However, delaying two units creates twice the economic waste (see [The Hidden Costs of Queues in Product Development](/blog/2024/09/24/the-hidden-costs-of-queues-in-product-development) for more details) of delaying one unit.

### Q8: The Principle of Linked Queues: Adjacent Queues See Arrival or Service Variability Depending on Loading

In systems where one queue feeds into another, the output of one queue becomes the input for the next. The way each queue performs depends on how busy it is—its output may either mirror the rate at which tasks arrive or the speed at which they are completed.

In a process with several linked queues, one queue usually slows down the entire system (the bottleneck). To improve the flow and speed up the whole process, it's important to reduce delays and unpredictability at the bottleneck by managing how tasks arrive from the previous queue. By controlling what happens before the bottleneck, you can improve the flow through it and make the system more efficient.

### Q16: The Intervention Principle: We Cannot Rely on Randomness to Correct a Random Queue

When a queue builds up into a sustained high-load state, it won't easily or quickly revert to a low-load state on its own. Just like flipping 10 heads in a row doesn’t increase the chance of flipping 10 tails to balance it out, randomness won’t fix the problem.

You need to intervene quickly and decisively in such situations. Set limits on maximum queue size, and act before the system hits those limits. The more closely you monitor queues and intervene early, the less they will cost you in the long run.

## Controlling Flow Under Uncertainty

### F19: The Round-Robin Principle: When Task Duration Is Unknown, Share Time Among Tasks

When scheduling a task with an unknown duration, you can't predict how long it will occupy a resource. Worse, the task could take an infinite amount of time.

The [round-robin scheduling](/docs/product/product-development/definitions#round-robin-scheduling) method from operating system design addresses this by allocating a fixed time slice (quantum) to each task. After the quantum ends, the task returns to the queue, and the next task starts. This ensures shorter tasks are completed sooner, even if their duration is unknown.

The key decision is setting the quantum size. If too large, the system behaves like FIFO; if too small, frequent context switching increases overhead. A useful heuristic is setting the quantum so that 80% of tasks are completed within a single time slice.

### F28: The Principle of Preplanned Flexibility: For Fast Responses, Preplan and Invest in Flexibility

Flexibility comes from early decisions and careful planning. By preparing in advance, teams can respond quickly to changes.

For instance, if maintaining schedules is crucial, pre-identify nonessential requirements, classifying them as mandatory, important, or optional. This way, optional features are loosely coupled with the core architecture, making it easier to drop them if needed.

Similarly, if you anticipate needing to reallocate resources quickly, invest in keeping backup resources informed and ready. This reduces their response time and ensures they can become productive on short notice.

## Using Fast Feedback

### FF5: The Moving Target Principle: Know When to Pursue a Dynamic Goal

Many companies create harmful control systems by failing to distinguish between static and dynamic goals. They assume that following the plan is always correct and any deviation is negative. In stable environments, like manufacturing, this can be true, where frameworks like Six Sigma prevent deviations to optimize efficiency.

However, in product development, goals constantly shift as better information emerges. Stable goals require preventing deviations and avoiding risk, while dynamic goals demand quick adjustments and reduced inertia to close the gap between the current state and the desired outcome.

Recognizing when your goals are dynamic or stable is crucial, especially in the highly variable world of product development. For example, in developing a new software feature, user feedback may shift priorities, requiring the team to pivot and adjust the goal to meet evolving customer needs.

## Achieving Decentralized Control

### D1: The Second Perishability Principle: Decentralize Control for Problems and Opportunities that Age Poorly

Certain problems and opportunities are highly perishable, requiring swift action—like putting out a fire before it spreads. On the other hand, some issues, like a bad stock investment, have self-limiting impacts.

To handle problems that worsen over time or seize fleeting opportunities, decentralize control. This means empowering individuals with the authority and resources to act quickly. Centralized planning can set tasks, but decentralized control ensures flexibility, enabling immediate responses to minor issues without delays.

### D2: The Scale Principle: Centralize Control for Problems that Are Infrequent, Large, or Have Significant Economies of Scale

Some problems require large-scale responses—big fires need fire trucks, not garden hoses. Centralized control is ideal for infrequent but significant demands, especially when economies of scale are at play. In contrast, frequent, small, and low-variability issues are better handled by decentralized resources ([D1: The Second Perishability Principle](#d1-the-second-perishability-principle-decentralize-control-for-problems-and-opportunities-that-age-poorly)).

Centralizing resources can delay response due to their size and complexity, so prioritizing these resources is crucial to ensure timely action. In product development, instead of placing an expert on every project, centralizing their expertise can be more efficient.

### D3. The Principle of Layered Control: Adapt Control Based on Emerging Information

When it's unclear whether to centralize or decentralize control, two approaches can help: triage and escalation.

Triage, as used in hospitals, prioritizes resources by addressing solvable, potentially critical issues and avoiding those that are unsolvable or less urgent. This method is effective when enough information is available at the outset to make informed decisions.

Alternatively, when it's uncertain which task will take the most time, a [round-robin scheduling](/docs/product/product-development/definitions#round-robin-scheduling) approach discussed in [F19: The Round-Robin Principle](#f19-the-round-robin-principle-when-task-duration-is-unknown-share-time-among-tasks) ensures fair resource distribution. Each task is given a time slice, and unfinished tasks return to the queue, preventing long tasks from blocking shorter ones.

In systems with layered priorities, escalation ensures low-priority tasks don't get neglected. Problems are escalated after waiting too long, striking a balance between keeping important issues from being overlooked and avoiding overloading centralized resources.

### D4. The Opportunistic Principle: Adjust the Plan for Unplanned Obstacles and Opportunities

In line with [Principle FF5: The Moving Target Principle: Know When to Pursue a Dynamic Goal](#ff5-the-moving-target-principle-know-when-to-pursue-a-dynamic-goal), static goals call for conformance, but dynamic goals require continuous adaptation. Plans should not enforce rigid conformance; instead, they should be used to maintain alignment and synchronize complex activities, such as coordinating multiple tasks for a product launch.

Adaptive plans allow teams to seize opportunities, adding significant value in product development. For instance, if a feature turns out to be far more costly and less valuable to customers than expected, a flexible process will recognize this and adjust. Similarly, if an easier-to-implement feature is discovered to provide greater customer value, adaptive plans make it simple to pivot, something much harder in rigid, conformance-focused processes.

### D5. The Principle of Virtual Centralization: Quickly Reorganize Decentralized Resources to Create Centralized Power

It's often inefficient to keep centralized resources idle for rare large demands. Instead, these resources can be used for routine tasks and mobilized when needed to tackle big problems, allowing organizations to benefit from both centralized and decentralized resources, as discussed in [F28: The Principle of Preplanned Flexibility: For Fast Responses, Preplan and Invest in Flexibility](#f28-the-principle-of-preplanned-flexibility-for-fast-responses-preplan-and-invest-in-flexibility).

For example, cities can train civilians in firefighting and collaborate with nearby fire departments for mutual aid, providing centralized response capacity without maintaining a large permanent fire department.

In product development, some companies use "tiger teams"—highly skilled, experienced employees who handle critical crises but perform their regular duties during normal times. This strategy enables the company to mobilize expert resources quickly in emergencies.

### D7: The Principle of Alignment: More Value Is Created with Overall Alignment than Local Excellence

While one barbarian might defeat a Roman soldier, 1,000 Roman soldiers would always overcome 1,000 barbarians due to superior coordination and alignment of their forces.

In war, the principle of mass refers to concentrating effort and resources on a decisive point to achieve maximum impact. Economy of force means allocating minimal resources to secondary tasks, ensuring most resources are focused on the main objective. Together, these principles demonstrate the power of alignment.

In product development, small gains across many features don't impress, but a significant advantage in a key area can sway customer preference. Aligning resources to focus on a single area can create a competitive advantage, even if it means sacrificing excellence in other areas.

### D8: The Principle of Mission: Specify the End State, Its Purpose, and the Minimal Possible Constraints

In maneuver warfare, missions align teams through mission orders, which focus on the operation's intent—its end state—rather than prescribing specific actions. They communicate the "why," not the "what" or "how."

When the intent is clear, those executing the mission can adapt to obstacles or opportunities, choosing the best course of action. A well-crafted mission statement is a powerful tool for maintaining coordination, with the "why" being its most crucial element.

For example, in product development, rather than prescribing detailed features, a mission might be "create a seamless user experience that reduces churn by 20%." The team is free to explore the best solutions to achieve this goal, whether through UX improvements, better onboarding, or new product features. The key is the clear end state (reduce churn) and its purpose (improve retention), with minimal constraints on how to achieve it.