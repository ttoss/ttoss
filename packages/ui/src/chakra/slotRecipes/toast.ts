import { defineSlotRecipe } from '@chakra-ui/react';

export const toast = defineSlotRecipe({
  className: 'toast',
  slots: [
    'root',
    'title',
    'description',
    'indicator',
    'closeTrigger',
    'actionTrigger',
  ],
  base: {
    root: {
      backgroundColor: 'feedback.background.primary.default',
      borderColor: 'feedback.border.primary.default',
      color: 'feedback.text.primary.default',
    },
    title: {
      color: 'feedback.text.primary.default',
    },
    description: {
      color: 'feedback.text.primary.default',
    },
    indicator: {
      color: 'feedback.text.primary.default',
    },
    closeTrigger: {
      color: 'feedback.text.secondary.default',
    },
    actionTrigger: {
      color: 'feedback.text.secondary.default',
      borderColor: 'feedback.border.secondary.default',
      _hover: {
        color: 'feedback.text.primary.default',
      },
    },
  },
  variants: {
    evaluation: {
      primary: {
        root: {
          backgroundColor: 'feedback.background.primary.default',
          borderColor: 'feedback.border.primary.default',
        },
        title: {
          color: 'feedback.text.primary.default',
        },
        description: {
          color: 'feedback.text.primary.default',
        },
        indicator: {
          color: 'feedback.text.primary.default',
        },
      },
      positive: {
        root: {
          backgroundColor: 'feedback.background.positive.default',
          borderColor: 'feedback.border.positive.default',
        },
        title: {
          color: 'feedback.text.positive.default',
        },
        description: {
          color: 'feedback.text.positive.default',
        },
        indicator: {
          color: 'feedback.text.positive.default',
        },
      },
      caution: {
        root: {
          backgroundColor: 'feedback.background.caution.default',
          borderColor: 'feedback.border.caution.default',
        },
        title: {
          color: 'feedback.text.caution.default',
        },
        description: {
          color: 'feedback.text.caution.default',
        },
        indicator: {
          color: 'feedback.text.caution.default',
        },
      },
      negative: {
        root: {
          backgroundColor: 'feedback.background.negative.default',
          borderColor: 'feedback.border.negative.default',
        },
        title: {
          color: 'feedback.text.negative.default',
        },
        description: {
          color: 'feedback.text.negative.default',
        },
        indicator: {
          color: 'feedback.text.negative.default',
        },
      },
    },
  },
  defaultVariants: {
    evaluation: 'primary',
  },
});
