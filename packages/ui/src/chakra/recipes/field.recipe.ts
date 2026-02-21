import { defineSlotRecipe } from '@chakra-ui/react';

export const fieldSlotRecipe = defineSlotRecipe({
  className: 'field',
  slots: ['root', 'label', 'helperText', 'errorText', 'requiredIndicator'],
  base: {
    label: {
      color: 'input.text.primary.default',
      _disabled: {
        color: 'input.text.muted.default',
      },
    },
    helperText: {
      color: 'input.text.secondary.default',
    },
    errorText: {
      color: 'feedback.text.negative.default',
    },
    requiredIndicator: {
      color: 'feedback.text.negative.default',
    },
  },
});
