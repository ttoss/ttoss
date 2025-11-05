---
title: Semantic Colors
---

# Semantic Colors

Semantic color tokens provide contextual meaning to color usage, organizing colors by **where** and **how** they're used rather than their visual appearance.

## Token Structure

Semantic colors follow a consistent hierarchy:

```
{ux}.{dimension}.{role}.{state?}
```

```
Examples:
action.background.primary.default
input.text.negative.active
navigation.text.secondary.default
```

| level                            | value        | description                                                                                                                                                                                                               | usage                                                                                           |
| -------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| **ux**                           | navigation   | Defines movement and wayfinding through the product. **Excludes inline links in body text (these belong to Content).** Clear distinction from Action, as navigation does not trigger state changes but relocates context. | Nav bars, menus, sidebars, breadcrumbs, pagination, tab navigation                              |
| **ux**                           | discovery    | Focused on **finding or filtering content**. Differs from Navigation because it enables exploration and refinement, not path traversal.                                                                                   | Search bars, filter panels, sorting controls, result highlights, advanced filters               |
| **ux**                           | input        | User-provided data entry or selection. Always distinct from Action (triggers).                                                                                                                                            | Text fields, selects, checkboxes, radios, date pickers, file uploads                            |
| **ux**                           | action       | Commands that **change system state** or submit intent. Clear separation from Input (data) and Utility (secondary tools).                                                                                                 | Primary/secondary buttons, icon buttons, CTAs, toggles, switches, FABs                          |
| **ux**                           | feedback     | System or user response to an action. Covers validation, status, and error states. **Does not include Guidance (preventive) or System (infrastructure-level).**                                                           | Error messages, inline validation, alerts, toasts, success banners, loaders                     |
| **ux**                           | guidance     | Preventive and educational support. Distinct from Feedback (reactive) because it anticipates needs.                                                                                                                       | Tooltips, coachmarks, onboarding flows, contextual help, tutorials                              |
| **ux**                           | content      | Core information layer: text, media, surfaces, containers. Functions as the **default semantic bucket** for presentation, but requires subcategories to avoid over-broad usage.                                           | Headings, body text, cards, tables, media blocks, surfaces                                      |
| **ux** _(specialized expansion)_ | analytics    | Representation of quantitative data. Semantically distinct from Content.                                                                                                                                                  | Charts, dashboards, KPIs, heatmaps, sparklines                                                  |
| **ux** _(specialized expansion)_ | social       | User-to-user interactions. Should not be mixed with Gamification (engagement mechanics) or Commerce (transactions).                                                                                                       | Comments, likes, reactions, shares, mentions, social badges                                     |
| **ux** _(specialized expansion)_ | commerce     | Commerce-specific semantics. Relevant only in products with transaction flows.                                                                                                                                            | Price labels, discount badges, cart indicators, checkout steps, stock status                    |
| **ux** _(specialized expansion)_ | gamification | Engagement mechanics. Distinct from Social (interaction) and Commerce (transaction).                                                                                                                                      | Points, achievements, progress bars, leaderboards, streaks                                      |
| **dimension**                    | background   | Surface fills; do **not** use for text glyphs; maintain contrast with adjacent text.                                                                                                                                      | Page/container fills, card surfaces, button fills, selection/highlight backgrounds, chips/pills |
| **dimension**                    | border       | Strokes that outline or separate elements; can also represent focus rings when colorized.                                                                                                                                 | Input outlines, card borders, separators/dividers, table cell borders, focus rings              |
| **dimension**                    | text         | Foreground glyph color; also applies to iconography that behaves like text.                                                                                                                                               | Headings, body copy, labels, helper/error text, link text, icons                                |
| **dimension**                    | shadow       | Depth/elevation via shadow color; not a fill/stroke; complements elevation system.                                                                                                                                        | Popovers/menus, modals, raised cards, sticky headers with elevation                             |
| **role**                         | primary      | Dominant emphasis for the area/dimension; use sparingly to preserve hierarchy.                                                                                                                                            | Primary button fill, default body text, key nav item, primary card surface                      |
| **role**                         | secondary    | Alternative/subordinate emphasis; visually under primary.                                                                                                                                                                 | Secondary buttons, secondary text, subdued nav items, secondary surfaces                        |
| **role**                         | accent       | Attention/highlight color; typically brand-accented; avoid long passages of text.                                                                                                                                         | Links, emphasized chips/badges, accent bars in banners, highlights in discovery                 |
| **role**                         | muted        | De-emphasized visuals; ensure WCAG contrast for readability where text is involved.                                                                                                                                       | Subtle borders/dividers, helper/placeholder text, quiet surfaces                                |
| **role**                         | negative     | Error/destructive semantics.                                                                                                                                                                                              | Error messages, destructive buttons, invalid input borders, critical banners                    |
| **role**                         | positive     | Success/confirmation semantics.                                                                                                                                                                                           | Success toasts, confirmation banners, positive status chips/icons                               |
| **role**                         | caution      | Warning/attention semantics without failure.                                                                                                                                                                              | Warning banners, caution outlines, pending/at-risk status indicators                            |
| **state**                        | default      | Resting/base state; neutral interaction.                                                                                                                                                                                  | Idle buttons, normal text, unfocused inputs, standard card surfaces                             |
| **state**                        | hover        | Pointer hover on interactive elements; provide a non-color cue on touch-only UIs when possible.                                                                                                                           | Button hover, link hover, interactive card hover                                                |
| **state**                        | active       | Pressed/clicked/engaged momentary state; distinct from “selected”.                                                                                                                                                        | Pressed button, active tab press, chip press feedback                                           |
| **state**                        | focused      | Keyboard/programmatic focus indication; should be visible independent of color alone when possible.                                                                                                                       | Input focus ring, focused button/link outline                                                   |
| **state**                        | disabled     | Non-interactive/unavailable state; reduce emphasis but keep legible where text appears.                                                                                                                                   | Disabled buttons/inputs/switches, disabled menu items                                           |
| **state**                        | selected     | Persistent chosen/checked state; not the same as active press.                                                                                                                                                            | Selected nav item, checked checkbox/radio, selected list/table row                              |

## Functional Areas of UX

### Foundation Principles

Our semantic color taxonomy is built on core values that ensure clarity and scalability in our design system—each UX area has a defined purpose, remain distinct and extensible, and avoid unnecessary or arbitrary categories.

Key principles:

- **Functional Coverage**: Areas reflect user intentions, not visual components.
- **Semantic Clarity**: Names transparently communicate purpose to both design and development teams.
- **Scalability & Robustness**: The taxonomy grows consistently, avoiding one-off exceptions.

Alignment to product principles: This taxonomy reduces decision variance and speeds safe reuse, supporting [B3: The Batch Size Feedback Principle](/docs/product/product-development/principles#b3-the-batch-size-feedback-principle-reducing-batch-sizes-accelerates-feedback) and fast learning loops per [FF8: The Fast-Learning Principle](/docs/product/product-development/principles#ff8-the-fast-learning-principle-use-fast-feedback-to-make-learning-faster-and-more-efficient), while optimizing overall economics (see [E1](/docs/product/product-development/principles#e1-the-principle-of-quantified-overall-economics-select-actions-based-on-quantified-overall-economic-impact)).

## Component Examples

```tsx
// Primary button
<Button variant="primary">
  {/* Uses action.background.primary.default */}
  {/* Uses action.text.primary.default */}
</Button>

// Destructive button
<Button variant="destructive">
  {/* Uses action.background.negative.default */}
  {/* Uses action.text.negative.default */}
</Button>
```

```tsx
// Standard input
<Input>
  {/* Uses input.background.primary.default */}
  {/* Uses input.border.muted.default */}
</Input>

// Error state input
<Input variant="error">
  {/* Uses input.border.negative.default */}
  {/* Uses input.text.negative.default for helper text */}
</Input>
```

```tsx
// Success alert
<Alert variant="success">
  {/* Uses feedback.background.positive.default */}
  {/* Uses feedback.text.positive.default */}
</Alert>

// Error notification
<Notification variant="error">
  {/* Uses feedback.background.negative.default */}
  {/* Uses feedback.text.negative.default */}
</Notification>
```

```tsx
// Navigation link
<Link>
  {/* Uses navigation.text.primary.default */}
  {/* Optional: navigation.text.accent.default for emphasis (not for :visited) */}
</Link>

// Main navigation
<Nav>
  {/* Uses navigation.background.primary.default */}
</Nav>
```

## Interaction States

All interactive semantic tokens include state variations:

### State Modifiers

- `default`: Base state
- `hover`: Mouse hover state
- `active`: Pressed/clicked state
- `focused`: Keyboard focus state
- `disabled`: Disabled state
- `selected`: Selected state (for toggles)

### State Examples

```typescript
// Complete button state system
action: {
  background: {
    primary: {
      default: core.colors.main,               // Base
      hover: 'lighten(main,6%)',               // Derived (semantic token, not new core)
      active: 'darken(main,8%)',               // Derived
      focused: 'outline(accent)',              // Usually via border; background unchanged
      disabled: core.colors.gray300,           // Neutral disabled
      selected: 'mix(main,accent,50%)'         // Example derivation for toggled state
    }
  }
}
```

Shadow dimension example (semantic references, not core colors):

```typescript
elevation: {
  shadow: {
    primary: {
      default: elevation.level2,
      hover: elevation.level3,
      active: elevation.level1
    }
  }
}
```

## Theme Mode Support

Semantic tokens adapt to different theme modes (light/dark) by referencing different core tokens:

```typescript
// Light mode theme (neutral surfaces + readable text)
content: {
  background: {
    primary: { default: core.colors.lightNeutral }, // Brand light neutral
    secondary: { default: core.colors.gray100 }     // Functional subtle surface
  },
  text: {
    primary: { default: core.colors.gray700 },       // Primary readable text
    secondary: { default: core.colors.gray500 }
  }
}

// Dark mode theme (mirrors roles using darkest neutrals)
content: {
  background: {
    primary: { default: core.colors.main },          // Brand main as dark surface
    secondary: { default: core.colors.gray900 }
  },
  text: {
    primary: { default: core.colors.lightNeutral },  // Contrast on dark
    secondary: { default: core.colors.gray300 }
  }
}
```

## Implementation Patterns

### Component Styling

```tsx
// Using semantic tokens in custom components
const StyledCard = styled.div`
  background-color: ${(props) =>
    props.theme.colors.content.background.secondary.default};
  border: 1px solid
    ${(props) => props.theme.colors.content.border.muted.default};
  color: ${(props) => props.theme.colors.content.text.primary.default};
`;

// With Theme UI sx prop
<Box
  sx={{
    backgroundColor: 'content.background.secondary.default',
    borderColor: 'content.border.muted.default',
    color: 'content.text.primary.default',
  }}
>
  Content
</Box>;
```

### Responsive Usage

```tsx
// Semantic tokens work with responsive arrays
<Box
  sx={{
    backgroundColor: [
      'content.background.primary.default',
      'content.background.secondary.default',
    ],
    color: ['content.text.primary.default', 'content.text.secondary.default'],
  }}
>
  Responsive semantic colors
</Box>
```

## Accessibility Considerations

Semantic tokens ensure accessible color usage:

- **Sufficient contrast**: Color combinations meet WCAG guidelines
- **Consistent relationships**: Same semantic meaning maintains contrast across themes
- **Focus indicators**: Dedicated focus state colors for keyboard navigation
- **Error communication**: Clear error state colors for form validation

### Contrast Testing

```typescript
// Semantic tokens maintain contrast ratios
action.background.primary.default + action.text.secondary.default = 4.5:1 (AA)
input.background.primary.default + input.text.primary.default = 7:1 (AAA)
content.background.secondary.default + content.text.primary.default = 12:1 (AAA)
```

## Best Practices

### Token Usage

- **Use semantic over core**: Always use semantic tokens in components
- **Match context to usage**: Use `action.*` for buttons, `input.*` for forms
- **Include all states**: Define hover, focus, disabled states for interactive elements
- **Test across themes**: Ensure tokens work in all theme variations
- **Stay within defined states**: Do not introduce `visited`, `loading`, etc. without taxonomy approval
- **Role selection**:
  - primary: default emphasis
  - secondary: subordinate but necessary
  - accent: transient highlight / draw attention briefly
  - muted: de-emphasize while retaining required contrast
  - negative / positive / caution: status semantics only
- **selected vs active**: `selected` = persistent chosen state; `active` = momentary press feedback

### Common Corrections

| Incorrect                            | Correct                              | Reason                           |
| ------------------------------------ | ------------------------------------ | -------------------------------- |
| `input.border.default.default`       | `input.border.muted.default`         | `default` is a state, not a role |
| `display.background.primary.default` | `content.background.primary.default` | `display` not in taxonomy        |

### State Derivation Rules

- Hover: adjust luminance ±4–6% (maintain AA contrast)
- Active: adjust luminance ±8–10% relative to base
- Focus: prefer outline/border using accent (avoid only color fill change)
- Disabled: gray300 (text) / gray200 (border) / reduce opacity for backgrounds
- Selected: blend(main,accent,40–60%) or reuse accent where consistent

### Neutral Usage Guidance

- Brand neutrals (lightNeutral, darkNeutral): identity & high-brand surfaces
- Functional grayscale (gray100–900): structural layering, text hierarchy, borders
- Prefer grayscale for readability tuning; reserve brand neutrals for brand emphasis

### Component Integration

```tsx
// Good: Using appropriate semantic context
<Button sx={{
  backgroundColor: 'action.background.primary.default'  // ✅ Correct context
}} />

// Avoid: Using wrong context
<Button sx={{
  backgroundColor: 'content.background.primary.default' // ❌ Wrong context for an action surface
}} />

// Bad: Using core tokens directly
<Button sx={{
  backgroundColor: 'main'                               // ❌ Too direct
}} />
```

## Next Steps

- **[Implementation Template](./semantic-colors-template)**: Complete semantic color token structure and examples
- **[Component Implementation](https://storybook.ttoss.dev)**: See semantic colors in action
