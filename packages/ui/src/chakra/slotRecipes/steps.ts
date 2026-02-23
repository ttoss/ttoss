import { defineSlotRecipe } from '@chakra-ui/react';

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
      // Map to ttoss semantic colors
      borderColor: 'display.border.muted.default',
      color: 'display.text.muted.default',
      backgroundColor: 'display.background.secondary.default',
      // Active/completed state
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
      // Map to ttoss semantic colors
      backgroundColor: 'display.border.muted.default',
      _complete: {
        backgroundColor: 'action.background.accent.default',
      },
    },
    title: {
      // Map to ttoss semantic colors
      color: 'navigation.text.primary.default',
      _current: {
        color: 'display.text.accent',
      },
    },
    description: {
      // Map to ttoss semantic colors
      color: 'navigation.text.muted.default',
    },
  },
});
