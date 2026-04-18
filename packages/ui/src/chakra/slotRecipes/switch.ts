import { defineSlotRecipe } from '@chakra-ui/react';

const switchSlotRecipe = defineSlotRecipe({
  className: 'switch',
  slots: ['root', 'label', 'control', 'thumb', 'indicator'],
  base: {
    label: {
      color: 'display.text.primary.default',
      _disabled: {
        color: 'display.text.muted.default',
      },
    },
    control: {
      backgroundColor: 'input.background.muted.disabled',
      _invalid: {
        borderColor: 'input.border.negative.default',
      },
      _disabled: {
        backgroundColor: 'input.background.muted.disabled',
      },
    },
    thumb: {
      backgroundColor: 'input.background.primary.default',
      _checked: {
        backgroundColor: 'input.text.primary.default',
      },
    },
    indicator: {
      color: 'input.text.secondary.default',
      _checked: {
        color: 'input.text.primary.default',
      },
    },
  },
});

export { switchSlotRecipe as switch };
