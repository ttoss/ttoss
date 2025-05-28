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
}

export const SegmentedControl = ({
  options,
  value,
  defaultValue,
  onChange,
  disabled,
  className,
  // size = 'md',
  ...rest
}: SegmentedControlProps) => {
  // const { padding, fontSize } = sizes[size];

  return (
    <Flex
      className={className}
      sx={{
        width: '100%',
        borderRadius: '2xl',
        border: 'sm',
        borderColor: 'action.background.muted.default',
        overflow: 'hidden',
        position: 'relative',

        '.rc-segmented': {
          width: '100%',
          padding: '0',
          backgroundColor: 'action.background.muted.default',
          position: 'relative',
          display: 'flex',
          flexGrow: 1,
        },
        '.rc-segmented-group': {
          gap: '3',
          borderRadius: '2xl',
          display: 'flex',
          width: '100%',
          position: 'relative',
        },
        '.rc-segmented-item': {
          borderRadius: '2xl',
          margin: 0,
          paddingX: '4',
          width: '100%',
          paddingY: '2',
          fontSize: 'lg',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'action.text.accent.default',
          flex: 1,
          minWidth: 0,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          zIndex: 2,
          transition: 'background-color 0.2s ease, color 0.2s ease',

          '&:focus': {
            boxShadowColor: 'action.background.accent.default',
            outlineColor: 'action.background.muted.default',
          },
          '&:hover:not(.rc-segmented-item-selected)': {
            backgroundColor: 'action.background.muted.default',
          },
          'input[type="radio"]': {
            display: 'none',
          },
        },
        '.rc-segmented-item-selected': {
          backgroundColor: 'action.background.accent.default',
          color: 'action.text.accent.active',
          fontWeight: 'bold',
        },
        '.rc-segmented-thumb': {
          backgroundColor: 'action.background.accent.default',
          borderRadius: '2xl',
          zIndex: -1,
          margin: 0,
          position: 'absolute',
          height: '100%',
          width: `full`,
          left: 0,
          transition: 'transform 0.2s ease, left 0.2s ease',
        },
        '.rc-segmented-item-disabled': {
          opacity: 0.5,
          cursor: 'not-allowed',
          backgroundColor: 'action.background.muted.disabled',
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
