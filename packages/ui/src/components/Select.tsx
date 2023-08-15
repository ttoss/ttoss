import * as React from 'react';
import { Icon } from '@ttoss/react-icons';
import { type SelectProps, Select as SelectUi } from 'theme-ui';
import { Text } from '..';

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
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                <Icon icon="warning-alt" />
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
