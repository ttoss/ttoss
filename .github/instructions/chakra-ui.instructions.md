---
description: Instructions for working with Chakra UI components and recipes in the ttoss project
applyTo: '**/packages/ui/src/chakra/**/*'
---

# Chakra UI Development Guidelines

Read Chakra documentation for more details: #fetch https://chakra-ui.com/llms-theming.txt

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

- **navigation**: Colors for navigation elements (menus, headers, sidebars)
- **display**: Colors for main content display (text, backgrounds, borders)
- **action**: Colors for interactive elements (buttons, links, CTAs)
- **input**: Colors for form inputs and controls
- **feedback**: Colors for status messages (success, error, warning, info)

## Recipe Types

Chakra UI supports two types of recipes:

1. **Recipes** (`defineRecipe`): For single-part components
2. **Slot Recipes** (`defineSlotRecipe`): For multi-part components

### Regular Recipe Structure (defineRecipe)

Use `defineRecipe` for simple, single-part components like buttons:

```typescript
import { defineRecipe } from '@chakra-ui/react';

/**
 * Recipe for Button component using ttoss semantic color system.
 *
 * **Design Philosophy:**
 * - Only color tokens are mapped (spacing, sizes, etc. match Chakra defaults)
 * - Uses ttoss semantic tokens (navigation, display, action, input, feedback)
 * - Maintains consistency with other ttoss components
 */
export const button = defineRecipe({
  className: 'button',
  base: {
    // Base color styles for all variants
    color: 'action.text.primary.default',
    backgroundColor: 'navigation.text.accent.default',
    borderColor: 'action.border.primary.default',
    _hover: {
      backgroundColor: 'action.background.primary.active',
      _disabled: {
        backgroundColor: 'action.background.primary.disabled',
      },
    },
    _active: {
      backgroundColor: 'action.background.primary.active',
    },
    _disabled: {
      backgroundColor: 'action.background.primary.disabled',
      color: 'action.text.muted.default',
      opacity: 1,
    },
  },
  variants: {
    variant: {
      solid: {
        color: 'action.text.primary.default',
        backgroundColor: 'navigation.text.accent.default',
        _hover: {
          backgroundColor: 'action.background.primary.active',
        },
      },
      outline: {
        color: 'action.text.primary.default',
        backgroundColor: 'navigation.text.accent.default',
        borderColor: 'action.border.primary.default',
        _hover: {
          backgroundColor: 'action.background.primary.default',
        },
      },
      ghost: {
        color: 'action.text.primary.default',
        backgroundColor: 'transparent',
        _hover: {
          backgroundColor: 'action.background.secondary.default',
        },
      },
    },
  },
  defaultVariants: {
    variant: 'solid',
  },
});
```

### Slot Recipe Structure (defineSlotRecipe)

Use `defineSlotRecipe` for complex, multi-part components like steps or accordions:

```typescript
import { defineSlotRecipe } from '@chakra-ui/react';

/**
 * Recipe for Steps component using ttoss semantic color system.
 *
 * **Design Philosophy:**
 * - Only color tokens are mapped (spacing, sizes, etc. match Chakra defaults)
 * - Uses ttoss semantic tokens (navigation, display, action, input, feedback)
 * - Maintains consistency with other ttoss components
 */
export const steps = defineSlotRecipe({
  className: 'steps',
  slots: [
    'root',
    'list',
    'item',
    'trigger',
    'indicator',
    'separator',
    'title',
    'description',
    'number',
  ],
  base: {
    indicator: {
      // Default state colors
      borderColor: 'display.border.muted.default',
      color: 'display.text.muted.default',
      backgroundColor: 'display.background.secondary.default',
      // Completed state
      _complete: {
        backgroundColor: 'action.background.accent.default',
        borderColor: 'action.background.accent.default',
        color: 'action.text.accent.default',
      },
      // Current/active step
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

## File Structure and Exports

### Recipe Files

Recipes are organized in `packages/ui/src/chakra/recipes/`:

```
recipes/
├── index.ts          # Re-exports all recipes
├── button.ts         # Button recipe
└── [component].ts    # Other component recipes
```

**Export pattern in index.ts:**

```typescript
export { button } from './button';
export { otherRecipe } from './otherRecipe';
```

### Slot Recipe Files

Slot recipes are organized in `packages/ui/src/chakra/slotRecipes/`:

```
slotRecipes/
├── index.ts          # Re-exports all slot recipes
├── steps.ts          # Steps slot recipe
└── [component].ts    # Other slot recipes
```

**Export pattern in index.ts:**

```typescript
export { steps } from './steps';
export { otherSlotRecipe } from './otherSlotRecipe';
```

### Integration with Theme Provider

All recipes and slot recipes are automatically integrated in `ChakraThemeProvider.tsx`:

```typescript
import * as recipes from './recipes';
import * as slotRecipes from './slotRecipes';

const config = {
  theme: {
    recipes: { ...recipes, ...overrides.theme?.recipes },
    slotRecipes: { ...slotRecipes, ...overrides.theme?.slotRecipes },
  },
};
```

Applications can override recipes using the `overrides` prop:

```tsx
<ChakraProvider
  overrides={{
    theme: {
      recipes: {
        button: customButtonRecipe,
      },
      slotRecipes: {
        steps: customStepsRecipe,
      },
    },
  }}
>
  {children}
</ChakraProvider>
```
