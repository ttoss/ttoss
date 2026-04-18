import { defineSlotRecipe } from '@chakra-ui/react';

export const select = defineSlotRecipe({
  className: 'select',
  slots: [
    'label',
    'positioner',
    'trigger',
    'indicator',
    'clearTrigger',
    'item',
    'itemText',
    'itemIndicator',
    'itemGroup',
    'itemGroupLabel',
    'list',
    'content',
    'root',
    'control',
    'valueText',
    'indicatorGroup',
  ],
  base: {
    label: {
      color: 'display.text.primary.default',
      _disabled: {
        color: 'display.text.muted.default',
      },
    },
    trigger: {
      borderColor: 'display.border.muted.default',
      backgroundColor: 'display.background.secondary.default',
      color: 'display.text.primary.default',
      _placeholderShown: {
        color: 'display.text.muted.default',
      },
      _disabled: {
        backgroundColor: 'display.background.muted.default',
        color: 'display.text.muted.default',
      },
      _invalid: {
        borderColor: 'display.border.negative.default',
      },
    },
    indicator: {
      color: 'display.text.muted.default',
    },
    valueText: {
      color: 'display.text.primary.default',
    },
    content: {
      borderColor: 'display.border.muted.default',
      backgroundColor: 'display.background.primary.default',
    },
    item: {
      color: 'display.text.primary.default',
      _highlighted: {
        backgroundColor: 'display.background.muted.default',
      },
      _disabled: {
        color: 'display.text.muted.default',
      },
    },
  },
});
