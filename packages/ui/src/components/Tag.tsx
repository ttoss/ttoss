import { Box } from '@ttoss/ui';
import * as React from 'react';

export type TagProps = {
  children: React.ReactNode | React.ReactNode[];
};

export const Tag = ({ children }: TagProps) => {
  if (Array.isArray(children)) {
    return (
      <Box
        as="span"
        sx={{
          ml: 2,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        {children.map((child, i) => {
          return (
            <Box
              key={i}
              as="span"
              sx={{
                px: 2,
                py: 0,
                fontSize: 'xs',
                borderRadius: 'full',
                backgroundColor: 'display.background.secondary.default',
                color: 'text.secondary',
                border: '1px solid',
                borderColor: 'border.default',
                fontWeight: 'medium',
                lineHeight: 1.5,
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
    <Box
      as="span"
      sx={{
        ml: 2,
        px: 2,
        py: 0,
        fontSize: 'xs',
        borderRadius: 'full',
        backgroundColor: 'display.background.secondary.default',
        color: 'text.secondary',
        border: '1px solid',
        borderColor: 'border.default',
        fontWeight: 'medium',
        lineHeight: 1.5,
        display: 'inline-flex',
        alignItems: 'center',
      }}
    >
      {children}
    </Box>
  );
};
