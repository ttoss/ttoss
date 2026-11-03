---
sidebar_position: 4
title: Reducing Batch Size
---

## B1: The Batch Size Queueing Principle: Reducing batch size reduces cycle time.

On a [cumulative flow diagram](/docs/product/product-development/principles/managing-queues#q11-the-cumulative-flow-principle-use-cfds-to-monitor-queues), the area between arrivals and departures is the queue. Process the same steady arrivals in large batches and that area is large; in small batches it shrinks to a thin staircase. Queue size is proportional to batch size, and since average queue size sets average cycle time ([Little's Formula](/docs/product/product-development/principles/managing-queues#q12-littles-formula-wait-time--queue-sizeprocessing-rate)), reducing batch size reduces cycle time directly.

It does so without changing the average arrival or departure rate, that is, without changing demand or capacity. Throttling demand and adding capacity both cost money; smaller batches can cut cycle time by an order of magnitude or more while capacity utilization stays the same.

## B2: The Batch Size Variability Principle: Reducing batch sizes reduces variability in flow.

Large batches make flow more variable, and the variation causes periodic overloads. A restaurant handles a steady stream of groups of three or four, but a bus of 80 tourists moves through it like an elephant through a boa constrictor, overloading seating, ordering, the kitchen and table clearing in turn.

Lower variability alone can remove a queue. If a 100-person engineering department goes to lunch at the same time, the cafeteria line looks like a capacity problem and tempts a bigger cafeteria. Staggering lunch, half at 11:30 and half at noon, halves the batch and may make the queue disappear. Reducing batch size is one of the cheapest, simplest and most powerful ways to reduce variability and queues.

## B3: The Batch Size Feedback Principle: Reducing batch sizes accelerates feedback.

In manufacturing's stable, repetitive flow, feedback matters little and rarely. In product development it is continuous and economically vital, because the work keeps trying new things and the [optimum failure rate](/docs/product/product-development/principles/exploiting-variability#v4-the-principle-of-optimum-failure-rate-fifty-percent-failure-rate-is-usually-optimum-for-generating-information) is far higher than in manufacturing. Feedback is what controls the cost of those failures, and it is the most important way to lower the cost of [variability](/docs/product/product-development/principles/exploiting-variability).

Fast feedback also pays disproportionately because the cost of a failure grows exponentially the longer feedback takes. Each engineering decision is a predecessor of many later ones, and the number of dependent decisions grows geometrically over time, so one wrong assumption can force hundreds of changes. Fast feedback truncates a bad path before it does much damage, and the benefit applies to any task, whether or not it is on the critical path or its project has a high cost of delay.

## B4: The Batch Size Risk Principle: Reducing batch size reduces risk.

## B5: The Batch Size Overhead Principle: Reducing batch size reduces overhead.

## B6: The Batch Size Efficiency Principle: Large batches reduce efficiency.

## B7: The Psychology Principle of Batch Size: Large batches inherently lower motivation and urgency.

## B8: The Batch Size Slippage Principle: Large batches cause exponential cost and schedule growth.

## B9: The Batch Size Death Spiral Principle: Large batches lead to even larger batches.

## B10: The Least Common Denominator Principle of Batch Size: The entire batch is limited by its worst element.

## B11: The Principle of Batch Size Economics: Economic batch size is a U-curve optimization.

## B12: The Principle of Low Transaction Cost: Reducing transaction cost per batch lowers overall costs.

## B13: The Principle of Batch Size Diseconomies: Batch size reduction saves much more than you think.

## B14: The Batch Size Packing Principle: Small batches allow finer tuning of capacity utilization.

## B15: The Fluidity Principle: Loose coupling between product subsystems enables small batches.

## B16: The Principle of Transport Batches: The most important batch is the transport batch.

## B17: The Proximity Principle: Proximity enables small batch sizes.

Proximity reduces the cost of transporting or communicating in small batches, making processes faster and more efficient. In manufacturing, close distances enable one-piece flow and greater flexibility, while in product development, colocated teams benefit from real-time, face-to-face communication. This eliminates delays inherent to asynchronous communication, unlocking the full advantages of small batch sizes and enhancing responsiveness to emerging needs.

## B18: The Run Length Principle: Short run lengths reduce queues.

## B19: The Infrastructure Principle: Good infrastructure enables small batches.

## B20: The Principle of Batch Content: Sequence first that which adds value most cheaply.

## B21: The Batch Size First Principle: Reduce batch size before you attack bottlenecks.

## B22: The Principle of Dynamic Batch Size: Adjust batch size dynamically to respond to changing economics.
