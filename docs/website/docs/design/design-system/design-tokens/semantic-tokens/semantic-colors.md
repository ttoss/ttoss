---
title: Semantic Colors
---

# Semantic Colors

Semantic color tokens provide contextual meaning to color usage, organizing colors by **where** and **how** they're used rather than their visual appearance.

## Token Structure

Semantic colors follow a consistent hierarchy:

```
{ux}.{context}.{nature}.{state?}

Examples:
action.background.primary.default
input.text.error.focused
display.border.muted.hover
```

## UX Context Categories

### Action Context

**Usage**: Interactive elements that trigger user actions

Colors for buttons, CTAs, links, and other actionable elements:

```typescript
action: {
  background: {
    primary: {
      default: core.colors.main,
      hover: core.colors.complimentary,
      active: core.colors.accent
    },
    secondary: {
      default: core.colors.gray200,
      hover: core.colors.white,
      active: core.colors.darkNeutral
    },
    accent: {
      default: core.colors.accent,
      hover: 'brightness(110%)',
      active: core.colors.teal600
    },
    negative: {
      default: core.colors.red700
    }
  },
  text: {
    primary: { default: core.colors.black },
    secondary: {
      default: core.colors.white,
      active: core.colors.complimentary
    },
    accent: { default: core.colors.white },
    negative: { default: core.colors.white }
  },
  border: {
    primary: { default: core.colors.main },
    secondary: { default: core.colors.black },
    muted: { default: core.colors.gray600 }
  }
}
```

**Component Examples:**

```tsx
// Primary button
<Button variant="primary">
  {/* Uses action.background.primary.default */}
  {/* Uses action.text.secondary.default */}
</Button>

// Destructive button
<Button variant="destructive">
  {/* Uses action.background.negative.default */}
  {/* Uses action.text.negative.default */}
</Button>
```

### Input Context

**Usage**: Form elements and data entry components

Colors for inputs, selects, checkboxes, and form validation:

```typescript
input: {
  background: {
    primary: { default: core.colors.white },
    muted: {
      default: core.colors.gray200,
      disabled: core.colors.gray300
    }
  },
  text: {
    primary: { default: core.colors.black },
    secondary: { default: core.colors.darkNeutral },
    muted: { default: core.colors.gray600 },
    accent: { default: core.colors.accent },
    negative: { default: core.colors.red700 }
  },
  border: {
    default: {
      default: core.colors.gray300,
      focused: core.colors.accent
    },
    muted: { default: core.colors.gray200 },
    negative: { default: core.colors.red700 }
  }
}
```

**Component Examples:**

```tsx
// Standard input
<Input>
  {/* Uses input.background.primary.default */}
  {/* Uses input.border.default.default */}
</Input>

// Error state input
<Input variant="error">
  {/* Uses input.border.negative.default */}
  {/* Uses input.text.negative.default for helper text */}
</Input>
```

### Display Context

**Usage**: Content presentation and information display

Colors for text, cards, containers, and data presentation:

```typescript
display: {
  background: {
    primary: { default: core.colors.main },
    secondary: { default: core.colors.white },
    muted: { default: core.colors.gray200 }
  },
  text: {
    primary: { default: core.colors.black },
    secondary: { default: core.colors.darkNeutral },
    muted: {
      default: core.colors.gray600,
      active: core.colors.gray200
    },
    accent: { default: core.colors.accent },
    negative: { default: core.colors.red700 }
  },
  border: {
    primary: { default: core.colors.main },
    secondary: { default: core.colors.black },
    muted: {
      default: core.colors.gray600,
      active: core.colors.darkNeutral
    }
  }
}
```

**Component Examples:**

```tsx
// Content card
<Card>
  {/* Uses display.background.secondary.default */}
  {/* Uses display.border.muted.default */}
</Card>

// Primary text
<Text variant="body">
  {/* Uses display.text.primary.default */}
</Text>

// Secondary text
<Text variant="caption">
  {/* Uses display.text.muted.default */}
</Text>
```

### Feedback Context

**Usage**: Status communication and user feedback

Colors for alerts, notifications, and status indicators:

```typescript
feedback: {
  background: {
    primary: { default: core.colors.white },
    positive: { default: core.colors.teal600 },
    negative: { default: core.colors.red700 },
    caution: { default: core.colors.amber600 }
  },
  text: {
    primary: { default: core.colors.white },
    secondary: { default: core.colors.black },
    positive: { default: core.colors.white },
    negative: { default: core.colors.white },
    caution: { default: core.colors.white }
  },
  border: {
    positive: { default: core.colors.teal600 },
    negative: { default: core.colors.red700 },
    caution: { default: core.colors.amber600 }
  }
}
```

**Component Examples:**

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

### Navigation Context

**Usage**: Wayfinding and site navigation

Colors for menus, links, breadcrumbs, and navigation elements:

```typescript
navigation: {
  background: {
    primary: { default: core.colors.complimentary },
    muted: { default: core.colors.complimentary }
  },
  text: {
    primary: { default: core.colors.black },
    accent: { default: core.colors.darkNeutral },
    muted: { default: core.colors.gray600 },
    negative: { default: core.colors.red700 }
  },
  border: {
    primary: { default: core.colors.black },
    muted: { default: core.colors.gray600 }
  }
}
```

**Component Examples:**

```tsx
// Navigation link
<Link>
  {/* Uses navigation.text.primary.default */}
  {/* Uses navigation.text.accent.default on :visited */}
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
      default: core.colors.main,
      hover: 'brightness(110%)',      // Lighter on hover
      active: core.colors.accent,     // Different color on press
      disabled: core.colors.gray300   // Muted when disabled
    }
  }
}
```

## Theme Mode Support

Semantic tokens adapt to different theme modes (light/dark) by referencing different core tokens:

```typescript
// Light mode theme
display: {
  background: {
    primary: { default: core.colors.white },
    secondary: { default: core.colors.gray100 }
  },
  text: {
    primary: { default: core.colors.black }
  }
}

// Dark mode theme (same structure, different core values)
display: {
  background: {
    primary: { default: core.colors.black },
    secondary: { default: core.colors.gray900 }
  },
  text: {
    primary: { default: core.colors.white }
  }
}
```

## Implementation Patterns

### Component Styling

```tsx
// Using semantic tokens in custom components
const StyledCard = styled.div`
  background-color: ${(props) =>
    props.theme.colors.display.background.secondary.default};
  border: 1px solid
    ${(props) => props.theme.colors.display.border.muted.default};
  color: ${(props) => props.theme.colors.display.text.primary.default};
`;

// With Theme UI sx prop
<Box
  sx={{
    backgroundColor: 'display.background.secondary.default',
    borderColor: 'display.border.muted.default',
    color: 'display.text.primary.default',
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
      'display.background.primary.default',
      'display.background.secondary.default',
    ],
    color: ['display.text.primary.default', 'display.text.secondary.default'],
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
display.background.secondary.default + display.text.primary.default = 12:1 (AAA)
```

## Best Practices

### Token Usage

- **Use semantic over core**: Always prefer semantic tokens in components
- **Match context to usage**: Use `action.*` for buttons, `input.*` for forms
- **Include all states**: Define hover, focus, disabled states for interactive elements
- **Test across themes**: Ensure tokens work in all theme variations

### Component Integration

```tsx
// Good: Using appropriate semantic context
<Button sx={{
  backgroundColor: 'action.background.primary.default'  // ✅ Correct context
}} />

// Avoid: Using wrong context
<Button sx={{
  backgroundColor: 'display.background.primary.default' // ❌ Wrong context
}} />

// Bad: Using core tokens directly
<Button sx={{
  backgroundColor: 'main'                               // ❌ Too direct
}} />
```

## Next Steps

- **[Semantic Typography](/docs/design/semantic-tokens/typography)**: Text styling tokens
- **[Interaction States](/docs/design/semantic-tokens/interaction-states)**: State-specific tokens
- **[Component Implementation](https://storybook.ttoss.dev)**: See semantic colors in action
