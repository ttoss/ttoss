import { defineSlotRecipe } from '@chakra-ui/react';

export const avatarSlotRecipe = defineSlotRecipe({
  className: 'avatar',
  slots: ['root', 'image', 'fallback'],
  base: {
    root: {
      backgroundColor: 'display.background.secondary.default',
      borderColor: 'display.border.muted.default',
    },
    fallback: {
      backgroundColor: 'display.background.accent.default',
      color: 'display.text.accent',
    },
    image: {
      borderColor: 'display.border.primary.default',
    },
  },
});
