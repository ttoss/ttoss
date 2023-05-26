import * as React from 'react';
import { Icon, Text } from '..';
import { type SelectProps, Select as SelectUi } from 'theme-ui';

export { SelectProps };

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ arrow, sx, ...props }, ref) => {
    return (
      <SelectUi
        // https://theme-ui.com/components/select#custom-arrow-icon
        arrow={
          <>
            {arrow ?? (
              <Text
                sx={{
                  marginLeft: ({ space }: any) => {
                    return space?.['2xl'] ? '-2xl' : '-28px';
                  },
                  alignSelf: 'center',
                  pointerEvents: 'none',
                  lineHeight: 0,
                  fontSize: 'base',
                }}
              >
                <Icon icon="picker-down" />
              </Text>
            )}

            {props['aria-invalid'] === 'true' && (
              <Text
                className="error-icon"
                sx={{
                  marginLeft: ({ space }: any) => {
                    return space?.['2xl']
                      ? `calc(-${space['2xl']} - 10px)`
                      : '-44px';
                  },
                  alignSelf: 'center',
                  pointerEvents: 'none',
                  lineHeight: 0,
                  fontSize: 'base',
                }}
              >
                <Icon icon="error" />
              </Text>
            )}
          </>
        }
        sx={{
          fontFamily: 'body',
          width: '100%',
          paddingY: 'lg',
          paddingX: 'xl',
          ...sx,
        }}
        ref={ref}
        {...props}
      />
    );
  }
);
Select.displayName = 'Select';
