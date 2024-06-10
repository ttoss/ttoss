---
id: designTokens
title: Design Tokens
slug: /design/design-tokens
---

## Token tiers

We use 2 tier of tokens, each one adds a specific capability to the design system.

### First tier: `core tokens`

Tokens in this tier store raw values intimately related to brand to make them reusable in [`semantic tokens`](#second-tier-semantic-tokens).
They should provide a little abstraction so values can be adjusted. This means they should not have the value directly in the name like `font-size-16px`, but `color-blue` is fine, it allows you to adjust the hex to some kind of blue.

### Second tier: `semantic tokens`

The tokens at this tier have a high level of abstraction and define the specific cases in which it should be used, describing what the token is intended for (e.g. `color-background-surface`). It never has a raw value and always receives [`core tokens`](#first-tier-core-tokens).  
The key difference between core and semantic design tokens is their level of abstraction and their intended use. Core design tokens are more abstract and are used to create the building blocks of the design system, while semantic design tokens are more concrete and are used to create specific design patterns or elements.
