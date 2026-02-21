---
description: Instructions for working with Chakra UI components and recipes in the ttoss project
applyTo: '**/packages/ui/src/chakra/**/*'
---

# Chakra UI Development Guidelines

Read Chakra documentation for more details: #fetch https://chakra-ui.com/llms.txt

## Core Principle: Token Usage in Recipes

**CRITICAL**: When creating or modifying Chakra UI recipes, follow this fundamental rule:

- **Color tokens**: Use ttoss custom semantic color tokens
- **All other tokens**: Use Chakra UI default tokens (spacing, sizing, typography, borders, etc.)

### Rationale

This approach ensures:

- **Consistent theming**: Applications can override color schemes while maintaining consistent spacing/sizing
- **Chakra compatibility**: Recipes remain compatible with Chakra's design system
- **Minimal overrides**: Recipes focus only on color theming, not reinventing the design system
- **Maintainability**: Fewer custom tokens mean less maintenance burden

## Recipe Development

### What to Include in Recipes

**Only include color-related properties:**

```typescript
// ✅ CORRECT: Only colors
export const myRecipe = defineSlotRecipe({
  base: {
    component: {
      color: 'display.text.primary.default',
      backgroundColor: 'display.background.primary.default',
      borderColor: 'display.border.muted.default',
    },
  },
});
```

### What NOT to Include in Recipes

**Do not include:**

- Spacing tokens (`gap`, `padding`, `margin`)
- Sizing tokens (`width`, `height`, `minWidth`, etc.)
- Typography tokens (`fontSize`, `fontWeight`, `lineHeight`, etc.)
- Border properties (`borderWidth`, `borderRadius`)
- Layout properties (`display`, `flexDirection`, `alignItems`, etc.)
- Any other non-color design tokens

```typescript
// ❌ INCORRECT: Non-color tokens included
export const myRecipe = defineSlotRecipe({
  base: {
    component: {
      // These should NOT be in recipes:
      width: '10',
      height: '10',
      gap: '4',
      fontSize: 'sm',
      fontWeight: 'semibold',
      borderRadius: 'full',
      display: 'flex',

      // Only these belong in recipes:
      color: 'display.text.primary.default',
      backgroundColor: 'display.background.primary.default',
    },
  },
});
```

### ttoss Semantic Color Token System

Use semantic color tokens from these categories:

### Recipe Structure

```typescript
import { defineSlotRecipe } from '@chakra-ui/react';

/**
 * Recipe for ComponentName using ttoss semantic color system.
 *
 * **Design Philosophy:**
 * - Only color tokens are mapped (spacing, sizes, etc. match Chakra defaults)
 * - Uses ttoss semantic tokens (navigation, display, action, input, feedback)
 * - Maintains consistency with other ttoss components
 */
export const componentSlotRecipe = defineSlotRecipe({
  className: 'component',
  slots: ['root', 'subComponent'],
  base: {
    root: {
      // Only color-related properties
      color: 'display.text.primary.default',
      backgroundColor: 'display.background.primary.default',
      borderColor: 'display.border.muted.default',
    },
    subComponent: {
      color: 'display.text.secondary.default',
      _hover: {
        color: 'display.text.accent',
      },
    },
  },
});
```

## Testing Recipes

After creating or modifying a recipe:

1. **Visual testing**: Create a Storybook story demonstrating the recipe with different themes
2. **Multiple themes**: Test with at least two different themes (e.g., default and Bruttal)
3. **State variations**: Test all interactive states (\_hover, \_active, \_disabled, etc.)
4. **Accessibility**: Ensure color contrast meets WCAG standards

## Example: Steps Component Recipe

Reference implementation: `packages/ui/src/chakra/recipes/steps.recipe.ts`

```typescript
export const stepsSlotRecipe = defineSlotRecipe({
  className: 'steps',
  slots: ['indicator', 'separator', 'title', 'description'],
  base: {
    indicator: {
      borderColor: 'display.border.muted.default',
      color: 'display.text.muted.default',
      backgroundColor: 'display.background.secondary.default',
      _complete: {
        backgroundColor: 'action.background.accent.default',
        borderColor: 'action.background.accent.default',
        color: 'action.text.accent.default',
      },
      _current: {
        borderColor: 'display.border.accent.default',
        color: 'display.text.accent',
      },
    },
    separator: {
      backgroundColor: 'display.border.muted.default',
      _complete: {
        backgroundColor: 'action.background.accent.default',
      },
    },
    title: {
      color: 'navigation.text.primary.default',
      _current: {
        color: 'display.text.accent',
      },
    },
    description: {
      color: 'navigation.text.muted.default',
    },
  },
});
```

## Migration Guide

When migrating existing recipes to this pattern:

1. **Identify all properties** in the recipe
2. **Categorize each property** as color or non-color
3. **Remove all non-color properties** from the recipe
4. **Verify visually** that Chakra's defaults work well
5. **Update documentation** to reflect the change

If Chakra's defaults don't work for a specific use case, consider whether:

- The component needs restructuring
- A different Chakra component might be more appropriate
- The case is exceptional enough to warrant custom tokens (discuss with team first)

## Common Patterns

### Interactive States

```typescript
base: {
  button: {
    color: 'action.text.primary.default',
    backgroundColor: 'action.background.primary.default',
    _hover: {
      backgroundColor: 'action.background.primary.active',
    },
    _disabled: {
      backgroundColor: 'action.background.primary.disabled',
      color: 'action.text.muted.default',
    },
  },
}
```

### Form Elements

```typescript
base: {
  input: {
    color: 'input.text.primary.default',
    backgroundColor: 'input.background.primary.default',
    borderColor: 'input.border.primary.default',
    _focus: {
      borderColor: 'input.border.accent.default',
    },
    _invalid: {
      borderColor: 'input.border.negative.default',
    },
  },
}
```

### Content Display

```typescript
base: {
  card: {
    backgroundColor: 'display.background.primary.default',
    color: 'display.text.primary.default',
    borderColor: 'display.border.muted.default',
  },
}
```

## Quality Checklist

Before finalizing a recipe:

- [ ] Only color tokens are used (no spacing, sizing, typography, etc.)
- [ ] All color tokens follow ttoss semantic naming
- [ ] Recipe includes JSDoc documentation
- [ ] All interactive states are properly colored
- [ ] Recipe is tested with multiple themes
- [ ] Storybook story demonstrates the recipe
