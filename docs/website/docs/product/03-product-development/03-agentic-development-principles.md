---
title: Agentic Development Principles
---

import TOCInline from '@theme/TOCInline';

:::caution Work in Progress
This document is currently under development. Principles will be added incrementally as they are defined and validated.
:::

This section outlines principles for integrating AI tools into product development workflows. These principles build upon [The Principles of Product Development Flow](/docs/product/product-development/principles) and apply them specifically to human-AI collaboration in product development.

_Agentic development refers to the practice of using AI agents as collaborative partners in the development process, requiring intentional design of workflows, feedback loops, and decision boundaries._

## Table of Contents

<TOCInline toc={toc} />

## The Integration View

### I1: The Principle of Immediate AI Feedback Loop: Integrate AI tools directly into the coding environment to provide instant suggestions and error checking, minimizing context switching.

This principle prioritizes high-bandwidth, low-latency assistance to prevent the high cost of delays and to keep the engineer in a flow state, which aligns with the goal of increasing value-added time. Immediate feedback reduces the "transport batch" of information, preventing the accumulation of waste (e.g., in the form of invisible inventory or queues).

**Failure Scenario (Misuse of AI Tool)**: A team implements a powerful AI code completion tool that requires a separate server connection and a 5-second delay to generate suggestions. The latency forces developers to either wait and break their concentration (context switch) or bypass the tool entirely, leading to inconsistent adoption, increased cycle time, and a failure to reduce batch size. The tool's potential value is destroyed by the friction of poor integration and latency.
