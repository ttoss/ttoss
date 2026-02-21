import { defineRecipe } from '@chakra-ui/react';

export const inputRecipe = defineRecipe({
  className: 'input',
  base: {
    color: 'input.text.primary.default',
    backgroundColor: 'input.background.primary.default',
    borderColor: 'input.border.primary.default',
    _placeholder: {
      color: 'input.text.muted.default',
    },
    _focus: {
      borderColor: 'input.border.accent.default',
    },
    _invalid: {
      borderColor: 'input.border.negative.default',
    },
    _disabled: {
      backgroundColor: 'input.background.primary.disabled',
      color: 'input.text.muted.default',
      opacity: 1,
    },
  },
});
