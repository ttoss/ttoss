import { defineSlotRecipe } from '@chakra-ui/react';

export const checkbox = defineSlotRecipe({
  className: 'checkbox',
  slots: ['root', 'label', 'control', 'indicator', 'group'],
  base: {
    control: {
      borderColor: 'input.border.primary.default',
      backgroundColor: 'input.background.primary.default',
      _checked: {
        borderColor: 'input.border.accent.default',
        backgroundColor: 'input.background.accent.default',
      },
      _invalid: {
        borderColor: 'input.border.negative.default',
      },
      _disabled: {
        borderColor: 'display.border.muted.default',
        backgroundColor: 'input.background.muted.disabled',
      },
    },
    indicator: {
      color: 'input.text.primary.default',
    },
    label: {
      color: 'display.text.primary.default',
      _disabled: {
        color: 'display.text.muted.default',
      },
    },
  },
});
