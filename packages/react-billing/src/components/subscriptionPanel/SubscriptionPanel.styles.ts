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

export type SubscriptionPanelVariant =
  'spotlight-accent' | 'spotlight-primary' | 'primary' | 'secondary' | 'accent';

const gradientFlow = keyframes({
  '0%': { backgroundPosition: '0% 50%' },
  '50%': { backgroundPosition: '100% 50%' },
  '100%': { backgroundPosition: '0% 50%' },
});

/**
 * Reads a nested color from the theme, returning `undefined` when any segment
 * of the path is missing.
 */
const getThemeColor = ({
  theme,
  path,
}: {
  theme: ThemeWithColors;
  path: string;
}): string | undefined => {
  return path.split('.').reduce<unknown>((current, key) => {
    return (current as Record<string, unknown> | undefined)?.[key];
  }, theme.colors) as string | undefined;
};

/**
 * Returns the first truthy color among `paths`, mirroring an `a || b` chain.
 */
const getFirstThemeColor = ({
  theme,
  paths,
}: {
  theme: ThemeWithColors;
  paths: string[];
}): string | undefined => {
  return paths
    .map((path) => {
      return getThemeColor({ theme, path });
    })
    .find(Boolean);
};

const buildGradientBackground = ({
  theme,
  startPaths,
  middlePaths,
}: {
  theme: ThemeWithColors;
  startPaths: string[];
  middlePaths: string[];
}) => {
  const start = getFirstThemeColor({ theme, paths: startPaths });

  if (!start) return undefined;

  const middle = getFirstThemeColor({ theme, paths: middlePaths }) || start;

  return `linear-gradient(270deg, ${start}, ${middle}, ${start})`;
};

const getAccentGradientBackground = (t: unknown) => {
  return buildGradientBackground({
    theme: t as ThemeWithColors,
    startPaths: [
      'action.background.accent.default',
      'input.background.accent.default',
    ],
    middlePaths: [
      'action.background.accent.active',
      'input.background.accent.active',
    ],
  });
};

const getPrimaryGradientBackground = (t: unknown) => {
  return buildGradientBackground({
    theme: t as ThemeWithColors,
    startPaths: ['action.background.primary.default'],
    middlePaths: ['action.background.secondary.default'],
  });
};

const getVariantStyles = (variantType: SubscriptionPanelVariant) => {
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

export const getSubscriptionPanelAccentBarSx = (
  variant: SubscriptionPanelVariant = 'spotlight-accent'
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

export const SubscriptionPanelAccentBarSx =
  getSubscriptionPanelAccentBarSx('spotlight-accent');
