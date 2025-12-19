import { keyframes } from '@ttoss/ui';

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

export type SubscriptionCardVariant =
  | 'spotlight-accent'
  | 'spotlight-primary'
  | 'primary'
  | 'secondary'
  | 'accent';

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

const getVariantStyles = (variantType: SubscriptionCardVariant) => {
  const variants = {
    'spotlight-accent': {
      backgroundColor: 'input.background.accent.default',
      color: 'action.text.accent.default',
      borderColor: 'display.border.muted.default',
      gradientBackground: getAccentGradientBackground,
    },
    'spotlight-primary': {
      backgroundColor: 'action.background.primary.default',
      color: 'display.text.accent.default',
      borderColor: 'display.border.muted.default',
      gradientBackground: getPrimaryGradientBackground,
    },
    primary: {
      backgroundColor: 'action.background.primary.default',
      color: 'action.text.primary.default',
      borderColor: 'display.border.muted.default',
      gradientBackground: undefined,
    },
    secondary: {
      backgroundColor: 'action.background.secondary.default',
      color: 'action.text.primary.default',
      borderColor: 'display.border.muted.default',
      gradientBackground: undefined,
    },
    accent: {
      backgroundColor: 'action.background.accent.default',
      color: 'action.text.accent.default',
      borderColor: 'display.border.muted.default',
      gradientBackground: undefined,
    },
  };

  return variants[variantType] || variants['spotlight-accent'];
};

export const getSubscriptionCardAccentBarSx = (
  variant: SubscriptionCardVariant = 'spotlight-accent'
) => {
  const variantStyles = getVariantStyles(variant);
  const isSpotlight = variant.startsWith('spotlight-');
  const gradientBg =
    variant === 'spotlight-accent'
      ? getAccentGradientBackground
      : getPrimaryGradientBackground;

  return {
    height: '12px',
    width: 'full',
    borderTopLeftRadius: 'lg',
    borderTopRightRadius: 'lg',
    backgroundColor: variantStyles.backgroundColor,
    color: variantStyles.color,
    borderColor: variantStyles.borderColor,
    ...(isSpotlight
      ? {
          background: gradientBg,
          backgroundSize: '400% 400%',
          animation: `${gradientFlow} 6s ease infinite`,
        }
      : {}),
  } as const;
};

export const getSubscriptionCardHeaderIconSx = (
  variant: SubscriptionCardVariant = 'spotlight-accent'
) => {
  const variantStyles = getVariantStyles(variant);
  const isSpotlight = variant.startsWith('spotlight-');
  const gradientBg =
    variant === 'spotlight-accent'
      ? getAccentGradientBackground
      : getPrimaryGradientBackground;

  return {
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '2xl',
    border: 'md',
    width: '56px',
    height: '56px',
    backgroundColor: variantStyles.backgroundColor,
    color: variantStyles.color,
    borderColor: variantStyles.borderColor,
    ...(isSpotlight
      ? {
          background: gradientBg,
          backgroundSize: '400% 400%',
          animation: `${gradientFlow} 6s ease infinite`,
        }
      : {}),
  } as const;
};

export const subscriptionCardAccentBarSx =
  getSubscriptionCardAccentBarSx('spotlight-accent');

export const subscriptionCardHeaderIconSx =
  getSubscriptionCardHeaderIconSx('spotlight-accent');
