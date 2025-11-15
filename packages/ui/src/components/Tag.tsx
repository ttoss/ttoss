import { Box } from '@ttoss/ui';
import * as React from 'react';

export type TagVariant =
  | 'accent'
  | 'positive'
  | 'caution'
  | 'muted'
  | 'negative'
  | 'primary'
  | 'secondary'
  | 'default';

export type TagProps = {
  children: React.ReactNode | React.ReactNode[];
  variant?: TagVariant;
  sx?: Record<string, unknown>;
};

const tagVariantMap: Record<TagVariant, { bg: string; color: string }> = {
  positive: {
    bg: 'feedback.background.positive.default',
    color: 'feedback.text.positive.default',
  },
  accent: {
    bg: 'action.background.accent.default',
    color: 'action.text.accent.default',
  },
  caution: {
    bg: 'feedback.background.caution.default',
    color: 'feedback.text.caution.default',
  },
  muted: {
    bg: 'display.background.muted.default',
    color: 'display.text.muted.default',
  },
  negative: {
    bg: 'feedback.background.negative.default',
    color: 'feedback.text.negative.default',
  },
  primary: {
    bg: 'action.background.primary.default',
    color: 'action.text.primary.default',
  },
  secondary: {
    bg: 'action.background.secondary.default',
    color: 'action.text.secondary.default',
  },
  default: {
    bg: 'action.background.muted.default',
    color: 'action.text.muted.default',
  },
};

export const Tag = ({ children, variant = 'default', sx }: TagProps) => {
  const colors = tagVariantMap[variant];

  const baseStyles: Record<string, unknown> = {
    ml: 2,
    px: 2,
    py: 0,
    fontSize: 'xs',
    borderRadius: 'full',
    backgroundColor: colors.bg,
    color: colors.color,
    border: '1px solid',
    borderColor: 'border.default',
    fontWeight: 'medium',
    lineHeight: 1.5,
    display: 'inline-flex',
    alignItems: 'center',
  };

  if (Array.isArray(children)) {
    return (
      <Box
        as="span"
        sx={{
          ml: 2,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 1,
          ...sx,
        }}
      >
        {children.map((child, i) => {
          return (
            <Box
              key={i}
              as="span"
              sx={{
                ...baseStyles,
                px: 2,
                py: 0,
                fontSize: 'xs',
                backgroundColor: colors.bg,
                color: colors.color,
              }}
            >
              {child}
            </Box>
          );
        })}
      </Box>
    );
  }

  return (
    <Box as="span" sx={{ ...baseStyles, ...sx }}>
      {children}
    </Box>
  );
};
