import { defineRecipe } from '@chakra-ui/react';

export const button = defineRecipe({
  className: 'button',
  base: {
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
      plain: {
        color: 'action.text.accent.default',
        backgroundColor: 'transparent',
        _hover: {
          color: 'action.text.accent.default',
        },
      },
    },
  },
  defaultVariants: {
    variant: 'solid',
  },
});
