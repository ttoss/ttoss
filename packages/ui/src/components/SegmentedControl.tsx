import Segmented from 'rc-segmented';
import * as React from 'react';
import { Box, Flex, FlexProps } from 'theme-ui';

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
  showDividers?: boolean;
}

export const SegmentedControl = ({
  options,
  value: propValue,
  defaultValue,
  onChange,
  disabled,
  className,
  sx,
  showDividers = false,
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

  // Custom rendering for options with dividers
  const renderCustomContent = () => {
    return (
      <Flex className="rc-segmented-group custom-segmented-group">
        {normalizedOptions.map((option, index) => {
          const isSelected = option.value === currentValue;
          const isLastItem = index === normalizedOptions.length - 1;

          // Determine if we should show divider
          const showDivider =
            showDividers &&
            !isLastItem &&
            option.value !== currentValue &&
            normalizedOptions[index + 1].value !== currentValue;

          return (
            <React.Fragment key={`${index}-${option.value}`}>
              <Box
                as="label"
                className={`rc-segmented-item ${isSelected ? 'rc-segmented-item-selected' : ''} ${option.disabled ? 'rc-segmented-item-disabled' : ''}`}
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
                  disabled={disabled || option.disabled}
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
                    backgroundColor: 'action.text.accent.default',
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
          <div className="rc-segmented-thumb"></div>
        )}
      </Flex>
    );
  };

  return (
    <Flex
      className={className}
      sx={{
        width: '100%',
        borderRadius: '4xl',
        border: 'sm',
        borderColor: 'display.border.primary.default',
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
          gap: showDividers ? '0' : '3',
          display: 'flex',
          width: '100%',
          position: 'relative',
        },
        '.rc-segmented-item': {
          borderRadius: '4xl',
          margin: 0,
          paddingX: '5',
          paddingY: '3',
          fontSize: 'lg',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'action.text.accent.default',
          flex: '1 1 auto',
          minWidth: 'min-content',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          zIndex: 2,
          transition: 'background-color 0.2s ease, color 0.2s ease',
          cursor: 'pointer',

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
        },
        '.rc-segmented-thumb': {
          backgroundColor: 'action.background.accent.default',
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
    >
      {showDividers ? (
        <div className="rc-segmented">{renderCustomContent()}</div>
      ) : (
        <Segmented
          options={options}
          value={propValue}
          defaultValue={defaultValue}
          onChange={onChange}
          disabled={disabled}
          className="rc-segmented"
          {...rest}
        />
      )}
    </Flex>
  );
};
