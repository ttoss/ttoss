import { keyframes, type ThemeUIStyleObject } from '@ttoss/ui';

import type { EnhancedTitleVariant } from './EnhancedTitle.types';

type ThemeWithColors = {
  colors?: {
    action?: {
      background?: {
        primary?: { default?: string };
        secondary?: { default?: string };
        accent?: { default?: string; active?: string };
      };
      text?: {
        primary?: { default?: string };
        accent?: { default?: string };
      };
    };
    display?: {
      border?: {
        muted?: { default?: string };
      };
    };
    input?: {
      background?: {
        accent?: { default?: string; active?: string };
      };
    };
  };
};

const gradientFlow = keyframes({
  '0%': { backgroundPosition: '0% 50%' },
  '50%': { backgroundPosition: '100% 50%' },
  '100%': { backgroundPosition: '0% 50%' },
});

const getAccentGradientBackground = (t: unknown) => {
  const theme = t as ThemeWithColors;

  const start =
    theme.colors?.action?.background?.accent?.default ||
    theme.colors?.input?.background?.accent?.default;

  if (!start) return undefined;

  const middle =
    theme.colors?.action?.background?.accent?.active ||
    theme.colors?.input?.background?.accent?.active ||
    start;

  return `linear-gradient(270deg, ${start}, ${middle}, ${start})`;
};

const getPrimaryGradientBackground = (t: unknown) => {
  const theme = t as ThemeWithColors;

  const start = theme.colors?.action?.background?.primary?.default;

  if (!start) return undefined;

  const middle = theme.colors?.action?.background?.secondary?.default || start;

  return `linear-gradient(270deg, ${start}, ${middle}, ${start})`;
};

/**
 * Returns style configuration for the icon wrapper based on variant.
 */
export const getEnhancedTitleIconSx = (
  variant: EnhancedTitleVariant
): ThemeUIStyleObject => {
  const variantStyles: Record<EnhancedTitleVariant, ThemeUIStyleObject> = {
    'spotlight-accent': {
      backgroundColor: 'input.background.accent.default',
      color: 'action.text.accent.default',
      borderColor: 'display.border.muted.default',
      background: getAccentGradientBackground,
      backgroundSize: '400% 400%',
      animation: `${gradientFlow} 6s ease infinite`,
    },
    'spotlight-primary': {
      backgroundColor: 'action.background.primary.default',
      color: 'display.text.accent.default',
      borderColor: 'display.border.muted.default',
      background: getPrimaryGradientBackground,
      backgroundSize: '400% 400%',
      animation: `${gradientFlow} 6s ease infinite`,
    },
    primary: {
      backgroundColor: 'action.background.primary.default',
      color: 'action.text.primary.default',
      borderColor: 'display.border.muted.default',
    },
    secondary: {
      backgroundColor: 'action.background.secondary.default',
      color: 'action.text.primary.default',
      borderColor: 'display.border.muted.default',
    },
    accent: {
      backgroundColor: 'action.background.accent.default',
      color: 'action.text.accent.default',
      borderColor: 'display.border.muted.default',
    },
    positive: {
      backgroundColor: 'display.bg.positive.boldest',
      color: 'display.fg.positive.bolder',
      borderColor: 'display.border.muted.default',
    },
    negative: {
      backgroundColor: 'display.bg.negative.boldest',
      color: 'display.fg.negative.bolder',
      borderColor: 'display.border.muted.default',
    },
    informative: {
      backgroundColor: 'display.bg.informative.boldest',
      color: 'display.fg.informative.bolder',
      borderColor: 'display.border.muted.default',
    },
    muted: {
      backgroundColor: 'display.bg.muted.boldest',
      color: 'display.fg.muted.bolder',
      borderColor: 'display.border.muted.default',
    },
  };

  return {
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '2xl',
    border: 'md',
    width: '56px',
    height: '56px',
    ...variantStyles[variant],
  };
};
