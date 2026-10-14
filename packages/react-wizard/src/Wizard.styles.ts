import type { ButtonProps, ThemeUIStyleObject } from '@ttoss/ui';
import { keyframes } from '@ttoss/ui';

import type { WizardLayout, WizardStepStatus } from './types';

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

export type WizardVariant =
  'spotlight-accent' | 'spotlight-primary' | 'primary' | 'secondary' | 'accent';

type WizardVariantStyles = {
  accentColor: string;
  accentTextColor: string;
  borderColor: string;
  primaryButtonVariant: NonNullable<ButtonProps['variant']>;
  gradientBackground?: (theme: unknown) => string | undefined;
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

const getVariantStyles = (
  variantType: WizardVariant = 'spotlight-accent'
): WizardVariantStyles => {
  const variants: Record<WizardVariant, WizardVariantStyles> = {
    'spotlight-accent': {
      accentColor: 'action.background.accent.default',
      accentTextColor: 'action.text.accent.default',
      borderColor: 'display.border.muted.default',
      primaryButtonVariant: 'accent',
      gradientBackground: getAccentGradientBackground,
    },
    'spotlight-primary': {
      accentColor: 'action.background.primary.default',
      accentTextColor: 'display.text.accent.default',
      borderColor: 'display.border.muted.default',
      primaryButtonVariant: 'primary',
      gradientBackground: getPrimaryGradientBackground,
    },
    primary: {
      accentColor: 'action.background.primary.default',
      accentTextColor: 'action.text.primary.default',
      borderColor: 'display.border.muted.default',
      primaryButtonVariant: 'primary',
    },
    secondary: {
      accentColor: 'action.background.secondary.default',
      accentTextColor: 'action.text.primary.default',
      borderColor: 'display.border.muted.default',
      primaryButtonVariant: 'secondary',
    },
    accent: {
      accentColor: 'action.background.accent.default',
      accentTextColor: 'action.text.accent.default',
      borderColor: 'display.border.muted.default',
      primaryButtonVariant: 'accent',
    },
  };

  return variants[variantType] ?? variants['spotlight-accent'];
};

export const getWizardShellSx = (
  variant: WizardVariant = 'spotlight-accent'
) => {
  const variantStyles = getVariantStyles(variant);

  return {
    width: '100%',
    minHeight: '300px',
    border: '1px solid',
    borderColor: variantStyles.borderColor,
    borderRadius: '8px',
    overflow: 'hidden',
  } as const;
};

export const getWizardStepListSx = ({
  layout,
  variant = 'spotlight-accent',
}: {
  layout: WizardLayout;
  variant?: WizardVariant;
}) => {
  const isHorizontal = layout === 'top' || layout === 'bottom';
  const isSpotlight = variant.startsWith('spotlight-');
  const variantStyles = getVariantStyles(variant);

  return {
    position: 'relative',
    padding: '6',
    backgroundColor: variantStyles.accentColor,
    ...(isSpotlight
      ? {
          background: variantStyles.gradientBackground,
          backgroundSize: '400% 400%',
          animation: `${gradientFlow} 6s ease infinite`,
        }
      : {}),
    ...(isHorizontal ? { width: '100%' } : { minWidth: '200px' }),
  } as const;
};

export const getWizardStepIndicatorSx = ({
  status,
  variant = 'spotlight-accent',
  isClickable,
}: {
  status: WizardStepStatus;
  variant?: WizardVariant;
  isClickable: boolean;
}) => {
  const variantStyles = getVariantStyles(variant);
  const isCompleted = status === 'completed';
  const isUpcoming = status === 'upcoming';

  return {
    borderColor: variantStyles.accentTextColor,
    backgroundColor: isCompleted
      ? variantStyles.accentTextColor
      : 'transparent',
    color: isCompleted
      ? variantStyles.accentColor
      : variantStyles.accentTextColor,
    opacity: isUpcoming ? 0.4 : 1,
    transition: 'all 0.2s ease',
    ...(isClickable
      ? {
          _hover: {
            opacity: 1,
          },
        }
      : {}),
  } as const;
};

export const getWizardStepSeparatorSx = ({
  isCompleted,
  variant = 'spotlight-accent',
}: {
  isCompleted: boolean;
  variant?: WizardVariant;
}) => {
  const variantStyles = getVariantStyles(variant);

  return {
    backgroundColor: variantStyles.accentTextColor,
    opacity: isCompleted ? 1 : 0.4,
  } as const;
};

export const getWizardStepTitleSx = ({
  status,
  variant = 'spotlight-accent',
}: {
  status: WizardStepStatus;
  variant?: WizardVariant;
}) => {
  const variantStyles = getVariantStyles(variant);

  return {
    color: variantStyles.accentTextColor,
    textAlign: 'center',
    fontWeight: status === 'active' ? 'bold' : 'normal',
    opacity: status === 'upcoming' ? 0.4 : 1,
  } as const;
};

export const getWizardStepDescriptionSx = ({
  status,
  variant = 'spotlight-accent',
}: {
  status: WizardStepStatus;
  variant?: WizardVariant;
}) => {
  const variantStyles = getVariantStyles(variant);

  return {
    color: variantStyles.accentTextColor,
    textAlign: 'center',
    opacity: status === 'upcoming' ? 0.4 : 1,
  } as const;
};

export const WizardStepDescriptionFlexSx: ThemeUIStyleObject = {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
};

export const WizardStepTextWrapperSx: ThemeUIStyleObject = {
  textAlign: 'center',
};

export const getWizardPrimaryButtonVariant = (
  variant: WizardVariant = 'spotlight-accent'
) => {
  return getVariantStyles(variant).primaryButtonVariant;
};
