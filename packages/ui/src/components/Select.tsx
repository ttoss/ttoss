import * as React from 'react';
import { Icon, Text } from '..';
import { SelectProps, Select as SelectUi } from 'theme-ui';

export { SelectProps };

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ arrow, ...props }, ref) => {
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
                }}
              >
                <Icon icon="error" />
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
