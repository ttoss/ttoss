import { defineSlotRecipe } from '@chakra-ui/react';

export const progress = defineSlotRecipe({
  className: 'progress',
  slots: [
    'root',
    'label',
    'track',
    'range',
    'valueText',
    'view',
    'circle',
    'circleTrack',
    'circleRange',
  ],
  base: {
    label: {
      color: 'display.text.primary.default',
    },
    valueText: {
      color: 'display.text.primary.default',
    },
    track: {
      backgroundColor: 'display.background.muted.default',
    },
    range: {
      backgroundColor: 'feedback.background.primary.default',
    },
    circleTrack: {
      color: 'display.background.muted.default',
    },
    circleRange: {
      color: 'feedback.background.primary.default',
    },
  },
  variants: {
    evaluation: {
      primary: {
        range: {
          backgroundColor: 'feedback.background.primary.default',
        },
        circleRange: {
          color: 'feedback.background.primary.default',
        },
      },
      positive: {
        range: {
          backgroundColor: 'feedback.background.positive.default',
        },
        circleRange: {
          color: 'feedback.background.positive.default',
        },
      },
      caution: {
        range: {
          backgroundColor: 'feedback.background.caution.default',
        },
        circleRange: {
          color: 'feedback.background.caution.default',
        },
      },
      negative: {
        range: {
          backgroundColor: 'feedback.background.negative.default',
        },
        circleRange: {
          color: 'feedback.background.negative.default',
        },
      },
    },
  },
  defaultVariants: {
    evaluation: 'primary',
  },
});
