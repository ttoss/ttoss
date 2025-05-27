import 'rc-segmented/assets/index.css';

import Segmented from 'rc-segmented';
import * as React from 'react';
import { Flex } from 'theme-ui';

export interface SegmentedControlProps {
  options: (
    | string
    | number
    | { label: React.ReactNode; value: string | number; disabled?: boolean }
  )[];
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (value: string | number) => void;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: { padding: 1, fontSize: 12, height: '28px' },
  md: { padding: 4, fontSize: 14, height: '36px' },
  lg: { padding: 8, fontSize: 18, height: '44px' },
};

export const SegmentedControl = ({
  options,
  value,
  defaultValue,
  onChange,
  disabled,
  className,
  size = 'md',
  ...rest
}: SegmentedControlProps) => {
  const { padding, fontSize, height } = sizes[size];

  return (
    <Flex
      className={className}
      sx={{
        width: '100%',
        borderRadius: 'full',
        border: '1px solid',
        borderColor: 'action.background.muted',
        overflow: 'hidden',

        '.rc-segmented': {
          width: '100%',
          padding: 0,
          backgroundColor: 'action.background.muted',
        },
        '.rc-segmented-group': {
          borderRadius: 'full',
          display: 'flex',
          width: '100%',
        },
        '.rc-segmented-item': {
          borderRadius: 'full',
          margin: 0,
          transition: 'background-color 0.2s ease, color 0.2s ease',
          padding: `${padding}px 16px`,
          fontSize,
          lineHeight: height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'action.text.muted',
          '&:focus': {
            boxShadowColor: 'action.background.accent.default',
            outlineColor: 'action.background.muted.default',
          },
          '&:hover:not(.rc-segmented-item-selected)': {
            backgroundColor: 'action.background.muted',
          },
        },
        '.rc-segmented-item-selected': {
          backgroundColor: 'action.background.accent.default',
          color: 'action.text.accent.default',
          fontWeight: 'bold',
        },
        '.rc-segmented-thumb': {
          backgroundColor: 'action.background.accent.default',
          borderRadius: 'full',
          zIndex: 1,
          margin: 0,
          transition: 'transform 0.2s ease, width 0.2s ease',
        },
        '.rc-segmented-item-disabled': {
          opacity: 0.5,
          cursor: 'not-allowed',
        },
      }}
    >
      <Segmented
        options={options}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        disabled={disabled}
        {...rest}
      />
    </Flex>
  );
};
