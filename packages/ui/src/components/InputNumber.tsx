import * as React from 'react';
import { Flex, Text } from '..';
import { Icon } from '@ttoss/react-icons';
import { Input, type InputProps as InputPropsUI } from 'theme-ui';

export type InputNumberProps = Omit<
  InputPropsUI,
  'type' | 'variant' | 'onChange'
> & {
  onChange: (value: number) => void;
  value?: number;
  infoIcon?: boolean;
  onClickInfoIcon?: () => void;
};

export const InputNumber = React.forwardRef<HTMLInputElement, InputNumberProps>(
  ({ sx, value, infoIcon, onChange, onClickInfoIcon, ...inputProps }, ref) => {
    const sxProps: InputPropsUI['sx'] = React.useMemo(() => {
      const size = String(typeof value === 'undefined' ? 0 : value).length;

      if (inputProps['aria-invalid'] === 'true') {
        return {
          width: `calc(139px + ${size > 1 ? size * 10 : 0}px)`,
          textAlign: 'left',
          '&[type=number]::-webkit-inner-spin-button, &[type=number]::-webkit-outer-spin-button':
            {
              WebkitAppearance: 'none',
              margin: 0,
            },
          ...sx,
          paddingLeft: '6',
          paddingRight: '5',
          margin: 0,
        };
      }

      return {
        width: `calc(108px + ${size > 1 ? size * 10 : 0}px)`,
        textAlign: 'center',
        '&[type=number]::-webkit-inner-spin-button, &[type=number]::-webkit-outer-spin-button':
          {
            WebkitAppearance: 'none',
            margin: 0,
          },
        fontFamily: 'body',
        paddingY: '2',
        paddingX: '4',
        ...sx,
        paddingLeft: '5',
        paddingRight: '5',
        margin: 0,
      };
    }, [inputProps, value, sx]);

    const handleChangeUp = () => {
      if (inputProps.disabled) {
        return;
      }

      if (typeof value !== 'number') {
        onChange(-1);
        return;
      }

      onChange(value - 1);
    };

    const handleChangeDown = () => {
      if (inputProps.disabled) {
        return;
      }

      if (typeof value !== 'number') {
        onChange(1);
        return;
      }

      onChange(value + 1);
    };

    return (
      <Flex
        sx={{
          width: 'fit-content',
          ...sx,
          position: 'relative',
          padding: 0,
          border: 'none',
        }}
        ref={ref}
        aria-invalid={inputProps['aria-invalid']}
      >
        <Input
          ref={ref}
          variant="forms.inputNumber"
          sx={sxProps}
          type="number"
          onChange={(e) => {
            onChange(Number(e.target.value));
          }}
          value={value}
          {...inputProps}
        />

        <Text
          sx={{
            position: 'absolute',
            alignSelf: 'center',
            left: '1rem',
            zIndex: 1,
            cursor: 'pointer',
          }}
          onClick={handleChangeUp}
        >
          <Icon icon="picker-down" />
        </Text>

        {infoIcon && (
          <Text
            sx={{
              position: 'absolute',
              alignSelf: 'center',
              right: '2.5rem',
              zIndex: 1,
              cursor: onClickInfoIcon ? 'pointer' : 'default',
            }}
            onClick={onClickInfoIcon}
          >
            <Icon icon="info" />
          </Text>
        )}

        <Text
          sx={{
            position: 'absolute',
            alignSelf: 'center',
            right: '1rem',
            zIndex: 1,
            cursor: 'pointer',
          }}
          onClick={handleChangeDown}
        >
          <Icon icon="picker-up" />
        </Text>
      </Flex>
    );
  }
);

InputNumber.displayName = 'InputNumber';
