---
title: 'The Theme as a Perceptual Operating System'
description: 'A theme is not a skin, a palette, or a token bundle. It is the layer that governs perception, attention, action, meaning, risk, and time across an interface.'
authors:
  - enniolopes
tags:
  - design-system
  - design-tokens
  - semantic-design
  - ui-architecture
  - fsl
  - ai-assisted-development
---

Most themes start in the wrong place.

They start with a palette.

Then someone chooses a type scale, a spacing ramp, a radius scale, a shadow system, and a handful of component defaults. If the result looks polished enough, the theme is treated as done.

But a theme is not done when its values look good in isolation.

A theme is done when it reliably organizes perception, attention, action, meaning, risk, and time across a product.

That is the harder problem.

Spacing should communicate what belongs together. Sizing should communicate what can be acted on. Typography should govern rhythm and hierarchy. Radius should express material and posture. Color should communicate meaning through valid pairs. Motion should explain causality. Focus should preserve navigation. Elevation should express functional distance.

A good theme is not a skin.

A good theme is a perceptual operating system.

It decides what the user sees first, what feels related, what feels available, what feels risky, what feels disabled, what feels elevated, what deserves attention, and what should remain quiet.

Design tokens made visual decisions portable.

Now themes need to make perception governable.

<!-- truncate -->

## Tokens solved portability, not judgment

Design tokens changed the way design systems scale.

They made visual decisions portable across tools, platforms, and codebases. The [Design Tokens Community Group Format Module](https://www.designtokens.org/TR/2025.10/format/) defines a technical specification for exchanging design tokens between tools, and the [Design Tokens Community Group](https://www.w3.org/community/design-tokens/) frames the work around sharing stylistic pieces of a design system at scale.

That matters.

A token can move a value across tools.

But a token does not explain why that value exists, where it should be used, what relationship it expresses, or what should happen when another theme changes it.

A token can say:

```txt
spacing.4 = 16px
```

It cannot, by itself, say:

```txt
This is the space between two related fields,
not the space between an icon and its label,
not the padding inside a compact button,
not the gutter between page content and viewport.
```

That difference is the whole problem.

Tokens preserve values.

They do not preserve judgment.

They do not know whether a color is carrying too many meanings. They do not know whether a compact control still has a safe hit target. They do not know whether a dark surface still feels elevated. They do not know whether the relationship between a label and an input is stronger than the relationship between two sections.

For that, a design system needs something above tokens.

It needs a perceptual operating system.

## A theme is a perceptual operating system

The common definition of a theme is too small.

A theme is usually described as a collection of values that changes the visual appearance of an interface. That definition is technically true, but operationally weak.

A stronger definition is this:

> A theme is the perceptual operating system of an interface.

It controls how visual signals are distributed across the product. It controls how much attention each state receives. It controls whether the user can distinguish available, selected, focused, disabled, destructive, informational, elevated, and blocking things without decoding the interface from scratch.

That means a theme is not only an aesthetic artifact.

It is a system of constraints.

It governs five ledgers:

| Ledger    | What the theme allocates                                                     |
| --------- | ---------------------------------------------------------------------------- |
| Attention | What enters the foreground, what stays peripheral, what disappears.          |
| Action    | What feels clickable, editable, draggable, selected, disabled, or dangerous. |
| Meaning   | Which visual signals correspond to which semantic states.                    |
| Risk      | Which states demand caution, confirmation, interruption, or restraint.       |
| Time      | How rhythm, density, motion, and feedback shape the speed of use.            |

Most design systems document the tokens.

Fewer document the ledgers.

That is where themes drift.

A team may have consistent tokens and inconsistent attention. Consistent colors and inconsistent meaning. Consistent spacing and inconsistent grouping. Consistent shadows and inconsistent depth.

The values match.

The system does not.

## The operating-system map

The operating-system metaphor is useful because it separates layers that are usually collapsed.

| Layer            | In theme design                                                                                    |
| ---------------- | -------------------------------------------------------------------------------------------------- |
| Low-level values | Raw tokens: color values, spacing values, radii, durations, shadows.                               |
| System calls     | Semantic contract: the stable grammar through which components request meaning.                    |
| Kernel           | Design constitution: the rules that decide what meanings are legal and how conflicts are resolved. |
| Runtime          | Theme resolution: how values become mode-safe, state-safe, and component-consumable.               |
| Type system      | Validation: contrast, state legality, pair compatibility, density safety, mode correctness.        |
| Applications     | Components and product screens consuming semantic meaning.                                         |

Without a kernel, the system can still run.

It just cannot govern itself.

Values can be emitted. Components can render. Screens can look consistent. But no layer has the authority to reject a theme that looks good while breaking meaning.

A perceptual operating system needs that authority.

It needs to say:

```txt
This value is allowed.
This relationship is invalid.
This state is overloaded.
This mode breaks the surface model.
This interaction is visually compact but ergonomically unsafe.
```

That is what a design constitution does.

A design constitution is the kernel of the perceptual operating system.

## The hidden failure mode is semantic entropy

Theme failure usually does not begin as visual chaos.

It begins as semantic entropy.

A signal starts with one meaning. Then it gets reused because it is convenient. Then it becomes overloaded. Eventually the interface still looks consistent, but the user can no longer trust what signals mean.

Examples:

- Red means destructive action in one component, validation error in another, and brand emphasis in a third.
- Yellow means warning in one place and selected state in another.
- Muted gray means secondary action, disabled state, placeholder text, and background decoration.
- Hover becomes visually louder than selection.
- Focus is treated as an aesthetic outline instead of a navigation contract.
- Elevation changes without matching z-index or surface behavior.
- Dark mode inverts color but loses hierarchy.
- Motion appears wherever the interface wants to feel alive, not where the user needs causality.
- Opacity becomes the primary disabled state and silently damages contrast.
- A compact control becomes visually elegant and physically unsafe.

This is not merely inconsistency.

It is loss of trust.

The user can still see the interface, but the interface has stopped making reliable promises.

A perceptual operating system exists to prevent semantic entropy. It defines which meanings are allowed to share signals, which meanings must remain exclusive, and which visual relationships must survive every theme.

## Geometry comes before palette

A theme should not begin with color.

It should begin with geometry.

Color is tempting because it is immediately expressive. It produces fast visual differentiation. It makes screenshots feel like progress.

But geometry governs the deeper experience.

Geometry decides what belongs together, what is separate, what can be touched, what should be scanned, what should be read, what is contained, and what is risky to place nearby.

Before choosing a primary color, a theme should answer:

```txt
How dense is this product?
How safe do interactions need to be?
How much reading does the interface require?
How much information must be scanned?
How much risk exists between adjacent actions?
How quickly should the user move?
```

Only then should the theme choose values.

If geometry is wrong, color cannot rescue the interface.

A beautiful palette on top of confused geometry is still confused.

## Spacing is not distance. It is grammar.

Spacing is often treated as a numeric ramp:

```txt
4, 8, 12, 16, 24, 32...
```

A ramp is useful, but it is not a grammar.

Spacing becomes grammar when values express relationship.

The [Nielsen Norman Group article on the Gestalt principle of proximity](https://www.nngroup.com/articles/gestalt-proximity/) summarizes the core idea: elements near each other are perceived as related, while elements spaced apart are perceived as belonging to separate groups.

That means spacing is semantic before it is aesthetic.

The space between an icon and its label should be smaller than the space between two sibling controls. The space between sibling controls should be smaller than the space between groups. The space between groups should be smaller than the space between sections. Page gutters should be larger than local relationships.

A healthy theme preserves a spatial order like this:

```txt
icon-label gap
< inline sibling gap
< control inset
< stack sibling gap
< group gap
< section gap
< page gutter
```

If this order breaks, perception becomes ambiguous.

Consider this:

```txt
icon-label gap = 16px
field-to-field gap = 12px
```

Both values may come from the same spacing scale. But the relationship is wrong. The icon now feels less related to its label than one field feels to another field.

The token is valid.

The grammar is invalid.

That is why spacing needs constitutional rules, not just values.

## Density is the tempo of work

Density is not how much you shrink the UI.

Density is the tempo of work.

It determines how quickly the user scans, how much information fits, how much effort reading requires, how safely actions can be taken, and how much pressure the interface creates.

Material Design connects spacing and density to product personality: spacing groups content, directs attention, and changes how serious, focused, relaxed, or open an interface feels. See [Material Design 3 spacing](https://m3.material.io/foundations/layout/grids-spacing/spacing) and [Material Design 3 density](https://m3.material.io/foundations/layout/grids-spacing/density).

The mistake is treating density as one global multiplier.

A compact theme should not simply shrink everything. It should decompose density:

| Density type        | What changes                            |
| ------------------- | --------------------------------------- |
| Content density     | How much data fits on screen.           |
| Interaction density | How close controls are to one another.  |
| Reading density     | How much effort text requires.          |
| Decision density    | How many choices compete for attention. |
| Signal density      | How many visual signals appear at once. |

This distinction is essential.

A dense table may be excellent. A dense destructive action cluster may be dangerous. A dense toolbar may be efficient. Dense prose may be exhausting. Dense status signals may become noise.

For many product interfaces, the target is not “compact everywhere.”

It is closer to:

```txt
content dense
+ interaction safe
+ reading comfortable
+ signal restrained
```

That is a constitutional decision.

Not a token decision.

## Sizing is the contract of action

Sizing is often confused with appearance.

But sizing is primarily a contract of action.

| Size type    | Meaning                                |
| ------------ | -------------------------------------- |
| Visual size  | What the user sees.                    |
| Hit size     | What the user can successfully target. |
| Content size | What the content requires.             |
| Layout size  | What the composition reserves.         |

A compact visual control may still need a larger invisible hit area.

For example:

```txt
icon = 16px
visual control = 32px
hit target = 40px or 44px
```

The visible object can be small.

The interactive affordance must be safe.

WCAG 2.2 includes criteria for target size, focus visibility, and contrast because small targets and weak visual indicators create real accessibility problems. The [WCAG overview](https://www.w3.org/WAI/standards-guidelines/wcag/), [contrast minimum explanation](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum), and [focus appearance explanation](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html) all point to the same deeper principle: accessibility is not a decorative layer added after visual design. It is part of the system’s operating constraints.

A theme constitution should therefore preserve this relationship:

```txt
icon size <= visual control size <= hit target size
```

If a theme cannot preserve that relationship, it is not ergonomically sound.

## Typography governs rhythm, not just hierarchy

Typography is not just font selection.

It defines voice, hierarchy, density, and rhythm.

Material 3 organizes type into functional roles: display, headline, title, label, and body. See [Material Design 3 typography](https://m3.material.io/styles/typography/applying-type). That role-based approach matters because type should not be tied directly to HTML tags.

The body style is the gravitational center of a product theme.

A theme should define:

```txt
body font size
body line height
label size
title scale
heading scale
reading measure
```

Then spacing should be checked against that typographic center.

For example:

```txt
body.md line-height = 24px
stack.sm = 8px
stack.md = 16px
section gap = 32px
```

This gives the eye a rhythm it can trust.

A theme can intentionally break a strict baseline grid. But it should never make text, line-height, and vertical spacing feel unrelated.

If the body style changes, the theme changes.

If the line height changes, the rhythm changes.

If the rhythm changes, spacing should be re-evaluated.

## Radius is material behavior

Radius is often treated as fashion.

Sharp was old enterprise. Rounded is modern SaaS. Pill-shaped is friendly. Large radius is “premium.”

That is not enough.

Radius expresses material, density, and affordance.

| Radius behavior | Meaning                                        |
| --------------- | ---------------------------------------------- |
| Sharp           | Technical, precise, dense, serious.            |
| Mild            | Neutral, productive, professional.             |
| Soft            | Friendly, calm, assistive.                     |
| Round           | Pill, avatar, chip, badge, contained identity. |
| Expressive      | Brand-led, consumer, playful.                  |

A dense technical interface with large playful radii sends a mixed signal. A calm assistant interface with harsh corners and tight spacing also sends a mixed signal.

A theme should define a shape grammar:

```txt
control radius <= surface radius <= overlay radius
```

Exceptions are valid, but they must be intentional.

A pill button can have a larger radius than a card. A technical product can choose sharper surfaces. A consumer brand can choose more expressive shape.

But the theme should know what it is doing.

Radius is not the corner of a box.

It is part of the material model of the interface.

## Surface hierarchy is not a shadow scale

Modern UI is layered.

A product screen usually contains a page layer, contained surfaces, raised elements, overlays, blocking dialogs, and transient messages.

A theme needs a surface model before it needs a shadow scale.

| Layer     | Function                                |
| --------- | --------------------------------------- |
| Page      | Ambient background.                     |
| Surface   | Contained content.                      |
| Raised    | Locally emphasized content.             |
| Overlay   | Temporary floating content.             |
| Blocking  | Modal interruption.                     |
| Transient | Toast, notification, ephemeral message. |

The layer should be communicated by more than one signal.

A popover may need elevation, surface color, border, and z-index. A dialog may need scrim, elevation, focus containment, and a stronger z-index. A selected item may need background and text state, not just color alone.

This is even more important in dark mode.

Dark mode is not inversion. Shadows are less expressive on dark surfaces, so layer hierarchy often needs tonal shifts, border contrast, and surface role discipline.

A dark theme that simply swaps white and black is not a dark theme.

It is an inverted light theme.

## Color is a signal economy

Color is where design systems drift fastest.

A brand palette enters the system. Then semantic names are added. Then component variants inherit those names. Then teams start using the same red for destructive action, validation error, warning, status, and emphasis.

At that point, the palette still looks consistent, but meaning has collapsed.

Material 3’s [color roles](https://m3.material.io/styles/color/roles) are useful because they treat color as a set of roles and relationships, not just a palette. Colors are meant to be applied in intended pairs and layers so contrast and meaning survive across surfaces.

The central rule is this:

> The atomic unit of color is not a swatch.  
> The atomic unit of color is a pair.

A theme should validate relationships like:

```txt
background + text
background + border
surface + focus
scrim + blocking surface
```

Not just isolated values.

A token like `red.500` is neither accessible nor inaccessible by itself. It becomes accessible or inaccessible only in relation to a foreground, background, state, and usage context.

The second rule is signal exclusivity.

One signal should not carry conflicting meanings.

Invalid:

| Color use                                      | Conflict                       |
| ---------------------------------------------- | ------------------------------ |
| Red for destructive action and ordinary accent | Consequence vs brand emphasis. |
| Yellow for warning and selected state          | Risk vs navigation state.      |
| Muted gray for disabled and secondary action   | Unavailable vs lower priority. |
| Accent for brand, focus, selected, and success | Brand vs system state.         |

Valid:

| Signal   | Meaning                                        |
| -------- | ---------------------------------------------- |
| Negative | Error, destructive consequence, failure.       |
| Caution  | Risk, warning, needs attention.                |
| Positive | Success, completion, safe state.               |
| Accent   | Brand pop or special emphasis, not validation. |
| Muted    | Lower emphasis, not disabled by itself.        |

Good themes do not merely look consistent.

They prevent meaning from becoming overloaded.

## Focus is not a state. It is a location system.

Focus is often documented as a state.

That is too weak.

Focus is a location system.

It tells the keyboard user where they are. It tells the interface which action is currently reachable. It protects orientation when interaction becomes dense.

W3C’s explanation of [Focus Appearance](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html) emphasizes that focus indicators need sufficient size and contrast because many people cannot perceive subtle visual changes.

A theme should guarantee:

```txt
focus is visible
focus is not color-only
focus does not shift layout
focus remains visible over hover
focus works in light and dark modes
```

State priority should be explicit:

```txt
disabled
> focus
> pressed / active
> selected / current
> hover
> default
```

Hover should never hide focus.

A focus ring is not decoration.

It is navigational infrastructure.

## Motion should describe cause and continuity

Motion should not exist to make the interface feel alive in a vague way.

Motion should explain what changed, why it changed, and how that change relates to the user’s action.

A button press should be fast and local. A menu opening should be spatially grounded. A dialog entering should communicate a layer change. A validation error should be noticeable but not theatrical. Decorative motion should be the lowest-priority motion in the system and must respect reduced-motion preferences.

A useful order is:

```txt
feedback motion < transition motion < emphasis motion
```

This is not about making every animation slower as it gets more important. It is about preserving proportionality.

If decorative motion is stronger than user feedback, the theme is distracting. If modal motion is so slow that it blocks task flow, the theme is indulgent. If reduced motion removes meaning, the interaction model is fragile.

Motion is not delight first.

Motion is continuity first.

## Attention is a scarce resource

Themes do not only create visual identity.

They govern attention.

This becomes especially important in adaptive and AI-assisted products, where the interface can easily become too eager, too interruptive, or too confident.

The [Principles of Calm Technology](https://www.calmtech.institute/calm-tech-principles) argue that technology should require the smallest possible amount of attention, inform without overwhelming, and make use of the periphery. The original calm technology work by Mark Weiser and John Seely Brown was rooted in the idea that technology should move between center and periphery rather than constantly demand focus.

That idea is useful.

But theme design should go further.

The question is not only whether technology is calm.

The question is whether the interface has an attention budget.

A theme should define how much attention each kind of signal is allowed to demand.

```txt
ambient < peripheral < explicit < interruptive < blocking
```

Not every state deserves the foreground.

Not every warning deserves a banner.

Not every update deserves motion.

Not every error deserves red.

Not every assistant action deserves a toast.

A strong theme constitution should ask:

```txt
How much attention should this signal require?
Should this state be ambient, peripheral, explicit, interruptive, or blocking?
Is this visual treatment proportional to the user's risk?
```

A good interface does not grab attention because it can.

It earns attention when the task requires it.

## Why this matters more with AI

Theme ambiguity has always been expensive.

With AI-assisted development, it becomes more expensive.

Humans can sometimes infer institutional intent from memory, past design reviews, Slack threads, Figma comments, or social context. AI agents cannot reliably do that. They operate on whatever structure is present in the context window.

Microsoft’s [Guidelines for Human-AI Interaction](https://www.microsoft.com/en-us/research/project/guidelines-for-human-ai-interaction/) emphasize that AI systems should support interaction across uncertainty, failure, correction, and changing behavior over time. Google’s [People + AI Guidebook](https://pair.withgoogle.com/guidebook/) similarly centers mental models, trust, feedback, control, and graceful failure.

Those same principles apply to theme systems that agents will modify.

If the theme does not define what spacing means, the agent guesses. If color roles are overloaded, the agent guesses. If “primary,” “secondary,” “danger,” “muted,” and “accent” are inconsistently used, the agent imitates local patterns and spreads the inconsistency.

This is why a theme constitution is not only a design artifact.

It is also an AI infrastructure artifact.

OpenAI’s [evaluation guidance](https://developers.openai.com/api/docs/guides/evaluation-best-practices) states the basic issue clearly: generative AI is variable, so traditional tests are not enough. Anthropic’s work on [context engineering for agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) points in the same direction from another angle: agents need curated, compressed, high-signal context to preserve critical decisions and avoid being drowned by noise.

A theme constitution is exactly that kind of compressed context.

It gives the agent:

- posture;
- density;
- geometry rules;
- signal rules;
- accessibility floors;
- invalid patterns;
- acceptance criteria.

That converts visual taste into operational guidance.

It turns theme design into a set of constraints the agent can follow, a reviewer can check, and a validator can eventually enforce.

## The theme compiler

The deeper shift is to stop thinking of a theme as a file.

Think of it as a compiler.

It receives raw inputs:

```txt
brand color
density preference
type choices
spacing scale
surface style
motion posture
accessibility target
```

It should compile them into semantic behavior:

```txt
this is readable
this is actionable
this is dangerous
this is selected
this is disabled
this is foreground
this is peripheral
this is blocking
```

A compiler does not merely output values.

A compiler rejects invalid programs.

A mature theme system should do the same.

It should reject values that break contrast. It should reject colors that overload meaning. It should reject density changes that destroy hit safety. It should reject dark mode values that collapse surface hierarchy. It should reject state combinations where hover hides focus or selected looks weaker than hover.

This is the ultimate direction for theme authoring:

```txt
theme values
+ semantic contract
+ design constitution
+ validation rules
= reliable perceptual system
```

Without the constitution, validation can only check mechanics.

With the constitution, validation can begin to check intent.

## The FSL constitution layer

This is why we created the [FSL Theme Authoring](/docs/design/design-system/design-tokens/theme-authoring) guidance.

It gives every theme a brief before values are selected:

```yaml
theme:
  name:
  purpose:
  primaryPosture:
  secondaryPosture:
  densityProfile:
  readingMode:
  pointerProfile:
  interactionRisk:
  surfaceModel:
  brandEnergy:
  accessibilityTarget:
  colorModeStrategy:
  platformBias:
```

This small structure changes the order of work.

Instead of:

```txt
choose colors
choose radius
choose spacing
patch accessibility
```

The process becomes:

```txt
define experience
define relationships
define values
validate invariants
```

That is the real shift.

It prevents palette-first thinking. It prevents density from becoming a multiplier. It prevents accessibility from becoming a late patch. It prevents dark mode from becoming inversion. It prevents AI agents from turning taste into random local imitation.

## What makes a theme invalid?

A constitution is only useful if it can say no.

A theme should be considered invalid when:

- it does not declare posture;
- it does not declare density;
- spacing relationships contradict semantic grouping;
- hit target is smaller than the declared safety floor;
- icon size is treated as hit size;
- typography is tied to HTML tags instead of functional roles;
- reading measure is unbounded;
- radius contradicts density and posture;
- layer change relies on only one weak signal;
- dark mode is simple inversion;
- colors are validated as swatches instead of pairs;
- a signal color carries conflicting meanings;
- text/background pairs fail contrast targets;
- focus is hidden by hover;
- motion is decorative when causal feedback is needed;
- reduced motion removes meaning;
- opacity is the primary disabled or text state;
- elevation and z-index disagree.

This is not bureaucracy.

It is how a design system protects meaning.

## What changes for theme authors

A theme author should not ask first:

```txt
Which colors look good?
Which radius feels modern?
Which spacing scale is popular?
```

Those questions come too early.

The better questions are:

```txt
What posture does this product need?
How dense should the work feel?
What must remain easy to hit?
What should be read first?
What belongs together?
What deserves foreground attention?
What should stay peripheral?
What changes across dark mode?
Which signals must never be overloaded?
What should fail validation?
```

Only after those questions are answered should token values be chosen.

This is not slower.

It is cheaper than discovering later that the theme cannot support real product complexity.

## The base theme as a product decision

This matters most for the base theme.

A base theme is not just a default. It is the first experience developers have with the system. It teaches them what “normal” means.

If the base theme is too branded, every extension fights it. If it is too bland, it fails to express quality. If it is too dense, it makes the system feel technical by accident. If it is too spacious, it becomes inefficient for product UI. If dark mode is weaker than light mode, the system looks unfinished. If accessibility is patched later, agents and humans learn that accessibility is optional.

The base theme should be quiet, productive, calm, and robust.

A strong default brief looks like this:

```yaml
theme:
  name: base
  purpose: default built-in foundation for modern product UI
  primaryPosture: productive
  secondaryPosture: calm
  densityProfile: balanced
  readingMode: mixed
  pointerProfile: hybrid
  interactionRisk: medium
  surfaceModel: lightly-layered
  brandEnergy: quiet
  accessibilityTarget: AA+
  colorModeStrategy: dark-supported
  platformBias: web
```

This gives the base theme a clear identity:

- efficient, but not cramped;
- calm, but not passive;
- modern, but not ornamental;
- accessible, but not visually heavy;
- brandable, but not blank;
- agent-friendly, but not over-specified.

## The ten laws of theme authoring

A useful constitution can be summarized in ten laws:

1. Values are not design. Relationships are design.
2. A theme must declare posture before tokens.
3. Density is operational, not aesthetic.
4. Spacing communicates relationship.
5. Sizing communicates affordance.
6. Typography governs rhythm.
7. Radius expresses material.
8. Color communicates meaning only through valid pairs.
9. Attention is a scarce resource.
10. A theme is finished only when its rules are executable by humans, agents, and validators.

These laws are intentionally simple.

They are not a substitute for judgment.

They are a way to make judgment reusable.

## Conclusion

Themes fail when they are treated as skins.

A skin changes how a system looks.

A theme should define how a system behaves visually.

That requires more than tokens. It requires a constitution: a small set of principles, relationships, invalid states, and acceptance criteria that govern every value.

Design systems do not become stronger by adding more tokens. They become stronger by making the meaning of those tokens harder to misuse.

That is the role of the FSL Theme Design Constitution.

It turns theme design from taste into infrastructure.

It turns values into behavior.

It turns visual choices into constraints.

It turns human judgment into reusable operating logic.

And in an era where humans and AI agents both implement UI, that distinction matters more than ever.

## References

- [FSL Theme Authoring](/docs/design/design-system/design-tokens/theme-authoring)
- [The Missing Layer in Design Systems: Semantic Contract](/blog/2026/03/09/the-missing-layer-in-design-systems-semantic-contract)
- [Tazuna UX](/blog/2026/03/09/tazuna-ux)
- [Design Tokens Format Module 2025.10](https://www.designtokens.org/TR/2025.10/format/)
- [Design Tokens Community Group](https://www.w3.org/community/design-tokens/)
- [Nielsen Norman Group — Proximity Principle in Visual Design](https://www.nngroup.com/articles/gestalt-proximity/)
- [Nielsen Norman Group — Visual Hierarchy in UX](https://www.nngroup.com/articles/visual-hierarchy-ux-definition/)
- [Nielsen Norman Group — 5 Principles of Visual Design in UX](https://www.nngroup.com/articles/principles-visual-design/)
- [Material Design 3 — Spacing](https://m3.material.io/foundations/layout/grids-spacing/spacing)
- [Material Design 3 — Density](https://m3.material.io/foundations/layout/grids-spacing/density)
- [Material Design 3 — Color roles](https://m3.material.io/styles/color/roles)
- [Material Design 3 — Typography](https://m3.material.io/styles/typography/applying-type)
- [Carbon Design System — Spacing](https://carbondesignsystem.com/elements/spacing/overview/)
- [IBM Design Language — 2x Grid](https://www.ibm.com/design/language/2x-grid/)
- [W3C — WCAG Overview](https://www.w3.org/WAI/standards-guidelines/wcag/)
- [Understanding WCAG Contrast Minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum)
- [Understanding WCAG Focus Appearance](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html)
- [Principles of Calm Technology](https://www.calmtech.institute/calm-tech-principles)
- [Microsoft — Guidelines for Human-AI Interaction](https://www.microsoft.com/en-us/research/project/guidelines-for-human-ai-interaction/)
- [Google — People + AI Guidebook](https://pair.withgoogle.com/guidebook/)
- [OpenAI — Evaluation best practices](https://developers.openai.com/api/docs/guides/evaluation-best-practices)
- [Anthropic — Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)

[1]: https://docusaurus.io/docs/next/blog?utm_source=chatgpt.com 'Blog'
