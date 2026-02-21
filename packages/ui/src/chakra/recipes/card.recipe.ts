import { defineSlotRecipe } from '@chakra-ui/react';

export const cardSlotRecipe = defineSlotRecipe({
  className: 'card',
  slots: ['root', 'header', 'body', 'footer'],
  base: {
    root: {
      backgroundColor: 'display.background.primary.default',
      borderColor: 'display.border.muted.default',
      color: 'display.text.primary.default',
    },
    header: {
      color: 'display.text.primary.default',
      borderColor: 'display.border.muted.default',
    },
    body: {
      color: 'display.text.primary.default',
    },
    footer: {
      color: 'display.text.secondary.default',
      borderColor: 'display.border.muted.default',
    },
  },
});
