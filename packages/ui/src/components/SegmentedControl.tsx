import * as React from 'react';
import type { FlexProps } from 'theme-ui';
import { Box, Flex } from 'theme-ui';

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
  sx?: FlexProps['sx'];
  /** Visual variant that maps to theme color tokens */
  variant?: 'primary' | 'secondary' | 'accent';
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

// map variants to theme token paths used in the sx prop
const variantTokens: Record<
  NonNullable<SegmentedControlProps['variant']>,
  {
    selectedBg: string;
    selectedColor: string;
    unselectedColor: string;
    hoverBg: string;
    divider: string;
    thumb: string;
    border: string;
  }
> = {
  primary: {
    selectedBg: 'action.background.primary.default',
    selectedColor: 'action.text.primary.default',
    unselectedColor: 'display.text.primary.default',
    hoverBg: 'action.background.muted.default',
    divider: 'action.text.primary.default',
    thumb: 'action.background.primary.default',
    border: 'display.border.primary.default',
  },
  secondary: {
    selectedBg: 'action.background.secondary.default',
    selectedColor: 'action.text.secondary.default',
    unselectedColor: 'display.text.secondary.default',
    hoverBg: 'action.background.muted.default',
    divider: 'action.text.secondary.default',
    thumb: 'action.background.secondary.default',
    border: 'display.border.muted.default',
  },
  accent: {
    selectedBg: 'action.background.accent.default',
    selectedColor: 'action.text.accent.default',
    unselectedColor: 'action.text.accent.default',
    hoverBg: 'action.background.muted.default',
    divider: 'action.text.accent.default',
    thumb: 'action.background.accent.default',
    border: 'display.border.primary.default',
  },
};

// map sizes to styling values
const sizeTokens: Record<
  NonNullable<SegmentedControlProps['size']>,
  {
    paddingX: string;
    paddingY: string;
    fontSize: string;
  }
> = {
  sm: {
    paddingX: '2',
    paddingY: '1',
    fontSize: 'sm',
  },
  md: {
    paddingX: '3',
    paddingY: '2',
    fontSize: 'md',
  },
  lg: {
    paddingX: '5',
    paddingY: '3',
    fontSize: 'lg',
  },
};

export const SegmentedControl = ({
  options,
  value: propValue,
  defaultValue,
  onChange,
  disabled,
  className,
  variant = 'accent',
  size = 'md',
  sx,
  ...rest
}: SegmentedControlProps) => {
  const [internalValue, setInternalValue] = React.useState<
    string | number | undefined
  >(propValue || defaultValue);

  // Keep internal state in sync with prop value
  React.useEffect(() => {
    if (propValue !== undefined) {
      setInternalValue(propValue);
    }
  }, [propValue]);

  const handleChange = (newValue: string | number) => {
    setInternalValue(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };

  const normalizedOptions = options.map((option) => {
    return typeof option === 'string' || typeof option === 'number'
      ? { label: option, value: option }
      : option;
  });

  const currentValue = propValue !== undefined ? propValue : internalValue;
  const tokens = variantTokens[variant];
  const sizeStyles = sizeTokens[size];

  return (
    <Flex
      className={className}
      data-variant={variant}
      sx={{
        width: '100%',
        borderRadius: '4xl',
        border: 'sm',
        borderColor: tokens.border,
        overflow: 'hidden',
        position: 'relative',

        '.rc-segmented': {
          width: '100%',
          padding: '0',
          backgroundColor: 'display.background.primary.default',
          position: 'relative',
          display: 'flex',
          flexGrow: 1,
        },
        '.rc-segmented-group, .custom-segmented-group': {
          borderRadius: '4xl',
          gap: '0',
          display: 'flex',
          width: '100%',
          position: 'relative',
        },
        '.rc-segmented-item': {
          borderRadius: '4xl',
          margin: 0,
          paddingX: sizeStyles.paddingX,
          paddingY: sizeStyles.paddingY,
          fontSize: sizeStyles.fontSize,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: tokens.unselectedColor,
          flex: '1 1 auto',
          minWidth: 'min-content',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          zIndex: 2,
          transition: 'background-color 0.2s ease, color 0.2s ease',
          cursor: 'pointer',

          '&:focus': {
            outline: '2px solid',
            outlineColor: tokens.selectedBg,
            outlineOffset: '2px',
            boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.1)',
          },
          '&:focus-visible': {
            outline: '2px solid',
            outlineColor: tokens.selectedBg,
            outlineOffset: '2px',
          },
          '&:hover:not(.rc-segmented-item-selected)': {
            backgroundColor: tokens.hoverBg,
          },

          'input[type="radio"]': {
            display: 'none',
          },
        },
        '.rc-segmented-item-selected': {
          backgroundColor: tokens.selectedBg,
          color: tokens.selectedColor,
        },
        '.rc-segmented-thumb': {
          backgroundColor: tokens.thumb,
          borderRadius: '4xl',
          zIndex: -1,
          margin: 0,
          position: 'absolute',
          height: '100%',
          width: '100%',
          left: 0,
          transition: 'transform 0.2s ease, left 0.2s ease',
        },
        '.rc-segmented-item-disabled': {
          opacity: 0.5,
          cursor: 'not-allowed',
          backgroundColor: 'action.background.muted.disabled',
        },
        ...sx,
      }}
      {...rest}
    >
      <div className="rc-segmented">
        <Flex className="rc-segmented-group custom-segmented-group">
          {normalizedOptions.map((option, index) => {
            const isSelected = option.value === currentValue;
            const isLastItem = index === normalizedOptions.length - 1;
            const isItemDisabled = disabled || option.disabled;

            // Determine if we should show divider
            const showDivider =
              !isLastItem &&
              option.value !== currentValue &&
              normalizedOptions[index + 1].value !== currentValue;

            return (
              <React.Fragment key={`${index}-${option.value}`}>
                <Box
                  as="label"
                  className={`rc-segmented-item ${isSelected ? 'rc-segmented-item-selected' : ''} ${isItemDisabled ? 'rc-segmented-item-disabled' : ''}`}
                  onClick={() => {
                    if (!disabled && !option.disabled) {
                      handleChange(option.value);
                    }
                  }}
                >
                  <input
                    type="radio"
                    value={option.value}
                    checked={isSelected}
                    disabled={isItemDisabled}
                    onChange={(e) => {
                      if (!disabled && !option.disabled && e.target.checked) {
                        handleChange(option.value);
                      }
                    }}
                  />
                  <div className="rc-segmented-item-label">{option.label}</div>
                </Box>

                {showDivider && (
                  <Box
                    className="segmented-divider"
                    sx={{
                      height: '60%',
                      width: '1px',
                      backgroundColor: tokens.divider,
                      opacity: 0.4,
                      alignSelf: 'center',
                      zIndex: 3,
                    }}
                  />
                )}
              </React.Fragment>
            );
          })}

          {currentValue !== undefined && (
            <div
              className="rc-segmented-thumb"
              style={{
                width: `${100 / normalizedOptions.length}%`,
                transform: `translateX(${
                  normalizedOptions.findIndex((option) => {
                    return option.value === currentValue;
                  }) * 100
                }%)`,
              }}
            ></div>
          )}
        </Flex>
      </div>
    </Flex>
  );
};
