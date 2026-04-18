import { defineSlotRecipe } from '@chakra-ui/react';

export const accordion = defineSlotRecipe({
  className: 'accordion',
  slots: [
    'root',
    'item',
    'itemTrigger',
    'itemContent',
    'itemIndicator',
    'itemBody',
  ],
  base: {
    item: {
      borderColor: 'display.border.muted.default',
    },
    itemTrigger: {
      color: 'display.text.primary.default',
      backgroundColor: 'display.background.primary.default',
      _disabled: {
        color: 'display.text.muted.default',
      },
    },
    itemContent: {
      backgroundColor: 'display.background.primary.default',
    },
    itemIndicator: {
      color: 'display.text.muted.default',
      _open: {
        color: 'display.text.accent.default',
      },
    },
    itemBody: {
      color: 'display.text.primary.default',
      borderColor: 'display.border.muted.default',
      backgroundColor: 'display.background.primary.default',
    },
  },
});
