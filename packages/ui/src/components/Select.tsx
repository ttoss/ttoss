import * as React from 'react';
import { Flex, Text } from '..';
import { Icon, IconType } from '@ttoss/react-icons';
import {
  type SelectProps as SelectPropsUi,
  Select as SelectUi,
} from 'theme-ui';

export type SelectProps = SelectPropsUi & {
  leadingIcon?: IconType;
  trailingIcon?: IconType;
};

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ arrow, sx, leadingIcon, trailingIcon, ...props }, ref) => {
    const hasError = props['aria-invalid'] === 'true';

    return (
      <SelectUi
        // https://theme-ui.com/components/select#custom-arrow-icon
        arrow={
          <>
            {leadingIcon && (
              <Text
                sx={{
                  alignSelf: 'center',
                  pointerEvents: 'none',
                  lineHeight: 0,
                  fontSize: 'base',
                  position: 'absolute',
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  left: ({ space }: any) => {
                    const defaultLeftValue = '16px';
                    const leftSpaceValue = space?.['xl'] || '16px';

                    return `calc(${leftSpaceValue} + ${defaultLeftValue})`;
                  },
                }}
              >
                <Icon icon={leadingIcon} />
              </Text>
            )}

            <Flex
              sx={{
                gap: 'lg',
                position: 'absolute',
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                right: ({ space }: any) => {
                  const defaultRightValue = '16px';
                  const xlSpace = space?.['xl'] || '16px';

                  return `calc(${xlSpace} + ${defaultRightValue})`;
                },
                alignSelf: 'center',
                pointerEvents: 'none',
              }}
            >
              {(trailingIcon || hasError) && (
                <Text
                  className={hasError ? 'error-icon' : ''}
                  sx={{
                    alignSelf: 'center',
                    pointerEvents: 'none',
                    lineHeight: 0,
                    fontSize: 'base',
                  }}
                >
                  <Icon
                    icon={hasError ? 'warning-alt' : (trailingIcon as IconType)}
                  />
                </Text>
              )}

              {arrow ?? (
                <Text
                  sx={{
                    lineHeight: 0,
                    fontSize: 'base',
                  }}
                >
                  <Icon icon="picker-down" />
                </Text>
              )}
            </Flex>
          </>
        }
        sx={{
          fontFamily: 'body',
          width: '100%',
          paddingY: 'lg',
          paddingX: 'xl',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          paddingLeft: ({ space, fontSizes }: any) => {
            const xlSpace = space?.['xl'] || '16px';
            const iconSize = fontSizes?.['base'] || '16px';
            const lgSpace = space?.['lg'] || '16px';

            if (leadingIcon) {
              return `calc(${xlSpace} + ${iconSize} +  ${lgSpace})`;
            }

            return xlSpace;
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          paddingRight: ({ space, fontSizes }: any) => {
            const xlSpace = space?.['xl'] || '16px';
            const iconSize = fontSizes?.['base'] || '16px';
            const lgSpace = space?.['lg'] || '16px';

            if (trailingIcon || hasError) {
              return `calc(${lgSpace} + ${iconSize} + ${lgSpace} + ${iconSize} + ${xlSpace})`;
            }

            return `calc(${lgSpace} + ${iconSize} + ${xlSpace})`;
          },
          ...sx,
        }}
        ref={ref}
        {...props}
      />
    );
  }
);
Select.displayName = 'Select';
