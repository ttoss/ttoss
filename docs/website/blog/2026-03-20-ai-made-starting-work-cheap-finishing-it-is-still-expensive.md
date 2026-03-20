---
title: 'AI Made Starting Work Cheap. Finishing It Is Still Expensive.'
description: AI drastically reduces the cost of generating work, but validation, integration, and ownership remain expensive. Teams that ignore this flood themselves with invisible WIP.
authors:
  - arantespp
tags:
  - ai
  - engineering-management
  - product-development
  - agentic-development
---

AI made one part of software development dramatically cheaper: starting.

You can now ask an agent to draft a feature, generate a migration, rewrite a module, or propose three product variations in minutes. This feels like a productivity revolution. In one sense, it is.

But it also creates a dangerous illusion.

The cost of generation has collapsed. The cost of commitment has not.

<!-- truncate -->

This is the core of [The Principle of Cheap Generation, Expensive Commitment](/docs/ai/agentic-development-principles#the-principle-of-cheap-generation-expensive-commitment): AI makes it cheap to produce candidates, but the expensive parts of software development still remain. Someone still has to validate the output, integrate it into the real system, review the trade-offs, own the risk, and maintain the result over time.

Before AI, generation and commitment were roughly coupled. If creating something took meaningful effort, teams naturally limited how much work they started. That friction acted as a governor.

AI removes that governor.

Now organizations can start far more work than they can responsibly finish. The visible cost is low, so the hidden cost is ignored.

## The New Bottleneck Is Commitment Capacity

Most teams still manage engineering as if typing code were the scarce resource. Commitment capacity is now the scarce resource.

The new bottleneck is commitment capacity:

- validation
- review
- integration
- testing
- deployment
- monitoring
- future maintenance

This changes how teams should think about velocity.

If AI generates four "small" tasks in the time a developer used to complete one, the team creates 4x more unfinished obligations. The system accumulates invisible queue growth.

That is why this principle connects directly to [Q3: The Principle of Queueing Capacity Utilization](/docs/product/product-development/principles#q3-the-principle-of-queueing-capacity-utilization-capacity-utilization-increases-queues-exponentially). When cheap generation floods the system with new work, queues expand silently until throughput collapses.

## Cheap Initiation Creates Expensive WIP

A common anti-pattern in AI-enabled teams looks like this:

A developer is working on a critical migration. Then sales asks for "one quick change." Product asks for a variant of a flow. Support asks for a small fix. Each request looks cheap because AI can draft it quickly.

So the team says yes.

Each accepted task creates a commitment tail:

- new context to keep active
- new test scenarios
- new review surface
- new integration risk
- new maintenance burden

The organization mistakes fast initiation for fast completion.

This is exactly how teams become busy while delivering less.

## Admission Control Is Now a Core Management Discipline

The decisive question is, "Should this enter execution now?"

That is an admission control problem.

Every task must justify more than its own local value. It must justify:

- the validation effort it imposes
- the interruption cost it creates
- the review capacity it consumes
- the maintenance tail it adds
- the opportunity cost it imposes on current priorities

Without admission control, AI becomes a queue amplifier.

This is also why [The Principle of Zero-Cost Erosion](/docs/ai/agentic-development-principles#the-principle-of-zero-cost-erosion) matters. When patching becomes nearly free, teams stop feeling the friction that used to warn them that the system was becoming harder to change. Complexity enters quietly.

## What Good Teams Do Instead

High-performing teams treat AI as a way to complete the right work with less waste.

That means:

- limiting concurrent work even when generation is cheap
- protecting the highest-value task from interruption
- accepting only requests that justify commitment cost
- using automation to reduce validation cost
- keeping architecture modular so ownership stays bounded

AI should reduce cycle time and keep hidden WIP bounded.

## Conclusion

AI changed the economics of software creation. Responsibility still carries the same economics.

Generating work is cheap. Finishing work is still expensive.

Teams that understand this will build better systems of prioritization, verification, and admission control. Teams that ignore it will create more drafts, more branches, more reviews, more context switching, and less finished value.

The constraint has moved.

The winning organizations are the ones that notice.
