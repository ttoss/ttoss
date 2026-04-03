---
title: Style References
---

# Style References

Style references document **visual languages**, not semantic meaning.

Their purpose is to give ttoss a disciplined way to study recurring interface styles, understand what formally defines them, identify the tradeoffs they introduce, and translate them into theme constraints **without breaking the semantic contract of the design system**. Material describes styles as the visual aspects that give a UI a distinct look and feel, while Carbon treats themes as collections of visual attributes applied to stable token roles. That distinction is central here: visual language may vary, but semantic roles must remain stable. ([m3.material.io](https://m3.material.io/styles?utm_source=chatgpt.com))

In ttoss, semantic tokens remain the public API of meaning-bearing families. Themes may change core values and semantic mappings, but they must not change semantic meaning or create a parallel vocabulary. Style references therefore sit **below** the semantic contract and **above** concrete theme implementations: they inform visual direction, but they do not redefine meaning.

## Position in the architecture

Style references are part of the **Visual Reference Architecture**.

That architecture separates concerns that are often conflated:

- **Semantic Contract** — stable meaning, naming, governance, validation
- **Visual Language Reference** — technical reference for a recurring visual language
- **Formal Style Profile** — operational style constraints derived from a reference
- **Theme Archetype** — product-facing visual posture
- **Built-in Theme** — concrete token implementation
- **Interaction Posture** — attentional and behavioral stance
- **AI Context Pack** — machine-oriented structured context for theme generation and implementation

This separation is necessary because style is not a single artifact. In practice, design systems, platform guidelines, and generative tools use “style” to mean different things: formal construction rules, theming systems, materials, or probabilistic visual steering. ttoss keeps these layers distinct so that appearance can evolve without semantic drift.

## What a style reference is

A style reference is a **technical document for a recurring visual language**.

It describes a style in terms of:

- conceptual and historical context
- formal visual signature
- what it tends to optimize for
- risks and failure modes
- impact on token families
- token-layer fit versus recipe-layer fit
- likely influence on theme archetypes

A style reference is not a moodboard, not a gallery of examples, and not a built-in theme. It is a structured reference artifact that makes a visual language easier to reason about, easier to implement selectively, and harder to misuse.

## What a style reference is not

A style reference is **not** the semantic contract. Meaning remains defined by the token model.

A style reference is **not** a theme archetype. Archetypes are product-oriented theme postures such as enterprise, editorial, technical, or expressive.

A style reference is **not** a built-in theme. Built-in themes are concrete implementations of tokens, mappings, modes, and optional recipes.

A style reference is **not** a component recipe library. Some styles require materials, rendering behavior, component composition, or interaction rules that cannot be expressed through tokens alone. Apple’s HIG and current materials guidance are good examples of this: material behavior is a system-level visual effect, not just a color or shadow choice. ([developer.apple.com](https://developer.apple.com/design/human-interface-guidelines/?utm_source=chatgpt.com))

A style reference is **not** an interaction philosophy. Interaction posture governs guidance, interruption, escalation, and steerability. That is a different layer from visual language.

## Why this library exists

This library exists for four reasons.

First, it creates a **shared technical vocabulary** for discussing styles without reducing them to vague aesthetic labels.

Second, it makes visual languages **comparable**. A good style reference helps clarify what a style really is, what it borrows from, and where it breaks down.

Third, it makes style **operationalizable**. A style becomes useful to a design system only when it can influence bounded decisions across token families such as color, depth, borders, curvature, spacing, typography, opacity, and motion. IBM’s design language is a strong precedent here: its iconography is not defined by taste alone, but by grid, stroke consistency, proportion, corners, and perspective rules. ([ibm.com](https://www.ibm.com/design/language/iconography/ui-icons/design/?utm_source=chatgpt.com))

Fourth, it makes style more useful for **AI-assisted theme creation**. AI systems perform better when the system provides explicit boundaries, known failure modes, and structured distinctions instead of aesthetic prompts alone. That is consistent with ttoss’s broader emphasis on semantic contracts and closed-loop, structurally constrained systems.

## Inclusion criteria

A style is worth documenting only when it is more than a loose aesthetic label.

In this library, a style reference should be:

- historically or culturally recognizable
- formally identifiable across multiple visual dimensions
- useful as a source of constraints for themes
- capable of being discussed in terms of tradeoffs, not only preference
- bounded enough to avoid becoming a catch-all category

Some references are included because they are strong foundations. Others are included because they are cautionary, comparative, or useful sources of selective borrowing. Recommendation level is therefore not the same as relevance.

## Relationship to tokens

Style references do not create a second semantic layer.

They must not introduce public token names such as `flat.button`, `glass.surface`, or `brutalist.border`. Appearance must not replace meaning. Semantic token names continue to express role, context, dimension, state, or analytical function — never visual trend names.

Instead, a style reference may influence:

- core value selection
- semantic mapping posture
- allowed visual ranges per family
- mode tuning
- component or pattern recipes when token control is insufficient

This keeps the system themeable and expressive without compromising semantic stability. Carbon’s theme model is an important precedent: tokens remain universal, roles remain stable, and only values vary to produce a different aesthetic. ([carbondesignsystem.com](https://carbondesignsystem.com/elements/themes/overview/?utm_source=chatgpt.com))

## Relationship to archetypes and themes

Style references inform **Theme Archetypes**, and archetypes inform **Built-in Themes**.

The relationship is not one-to-one.

A theme archetype such as `enterprise-neutral` may be influenced by flat or minimalist references. An archetype such as `expressive-premium` may selectively draw from material or glass references. A theme should therefore be understood as a product-facing implementation shaped by one or more references, not as a literal export of one historical style.

## What each reference document must do

Each style reference in this directory is expected to:

1. define the style clearly
2. explain its historical and conceptual context
3. identify its formal signature
4. describe what it tends to optimize for
5. document its risks and failure modes
6. map its impact across ttoss token families
7. distinguish token-layer fit from recipe-layer fit
8. propose an initial formal style profile
9. identify likely archetype affinity

A style reference that only describes visual taste is incomplete. A style reference becomes useful only when it makes the style technically legible.

## Current references

The initial set in this library covers styles that are historically significant, operationally distinct, or especially relevant to modern token-based theming:

**Structural references:**

- [Skeuomorphic](./skeuomorphic.md)
- [Flat 2.0](./flat2.md)
- [Minimalist](./minimalist.md)

**Specialized references:**

- [Material](./material.md)
- [Glass](./glass.md)
- [Neobrutalism](./neobrutalism.md)
- [Neumorphism](./neumorphism.md)
- [90s](./90s.md)

These references are not expected to be symmetrical in recommendation level. Some are strong sources for production archetypes. Others are valuable because they clarify limits, tradeoffs, or cautionary boundaries.

## Principle

This library exists to make visual style **explicit, bounded, and translatable**.

The goal is not to turn ttoss into a catalog of skins.
The goal is to build a disciplined reference layer that helps themes evolve visually while the semantic contract remains stable.

A good style reference should make a visual language easier to understand, easier to borrow from selectively, and harder to misuse.

---
