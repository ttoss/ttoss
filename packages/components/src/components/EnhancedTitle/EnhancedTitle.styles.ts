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
