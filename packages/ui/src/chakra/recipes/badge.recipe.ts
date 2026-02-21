import { defineRecipe } from '@chakra-ui/react';

export const badgeRecipe = defineRecipe({
  className: 'badge',
  base: {
    color: 'display.text.primary.default',
    backgroundColor: 'display.background.secondary.default',
    borderColor: 'display.border.muted.default',
  },
  variants: {
    variant: {
      solid: {
        color: 'display.text.primary.default',
        backgroundColor: 'display.background.accent.default',
      },
      subtle: {
        color: 'display.text.accent',
        backgroundColor: 'display.background.secondary.default',
      },
      outline: {
        color: 'display.text.primary.default',
        backgroundColor: 'transparent',
        borderColor: 'display.border.primary.default',
      },
    },
  },
  defaultVariants: {
    variant: 'subtle',
  },
});
