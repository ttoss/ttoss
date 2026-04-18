import { defineSlotRecipe } from '@chakra-ui/react';

export const radioGroup = defineSlotRecipe({
  className: 'radio-group',
  slots: [
    'root',
    'label',
    'item',
    'itemText',
    'itemControl',
    'indicator',
    'itemAddon',
    'itemIndicator',
  ],
  base: {
    label: {
      color: 'display.text.primary.default',
      _disabled: {
        color: 'display.text.muted.default',
      },
    },
    item: {
      _disabled: {
        color: 'display.text.muted.default',
      },
    },
    itemText: {
      color: 'display.text.primary.default',
    },
    itemControl: {
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
      backgroundColor: 'input.text.primary.default',
    },
  },
});
