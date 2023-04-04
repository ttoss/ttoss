import { Icon, type IconType, Text } from '..';
import {
  type SelectProps as SelectPropsUi,
  Select as SelectUi,
} from 'theme-ui';
import React from 'react';

export type SelectProps = SelectPropsUi & {
  errorIcon?: IconType;
};

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ arrow, errorIcon, ...props }, ref) => {
    return (
      <SelectUi
        // https://theme-ui.com/components/select#custom-arrow-icon
        arrow={
          <>
            {arrow ?? (
              <Text
                sx={{
                  marginLeft: '-2xl',
                  alignSelf: 'center',
                  pointerEvents: 'none',
                  lineHeight: 0,
                }}
              >
                <Icon icon="carbon:chevron-down" />
              </Text>
            )}

            {props['aria-invalid'] === 'true' && !!errorIcon && (
              <Text
                className="error-icon"
                sx={{
                  marginLeft: ({ space }: any) => {
                    return space?.['2xl']
                      ? `calc(-${space['2xl']} - 10px)`
                      : '44px';
                  },
                  alignSelf: 'center',
                  pointerEvents: 'none',
                  lineHeight: 0,
                }}
              >
                <Icon icon={errorIcon} />
              </Text>
            )}
          </>
        }
        ref={ref}
        {...props}
      />
    );
  }
);
Select.displayName = 'Select';
