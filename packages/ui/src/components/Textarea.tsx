import { Flex, Icon, type IconType, Text } from '..';
import {
  type TextareaProps as TextareaPropsUI,
  Textarea as TextareaUI,
} from 'theme-ui';
import React from 'react';

export type TextareaProps = TextareaPropsUI & {
  trailingIcon?: IconType;
};

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ trailingIcon, className, sx, ...textareaProps }, ref) => {
    return (
      <Flex
        className={className}
        sx={{ ...sx, position: 'relative', padding: 0, border: 'none' }}
      >
        <TextareaUI
          ref={ref}
          sx={{
            ...sx,
            paddingRight: trailingIcon ? '3xl' : undefined,
            margin: 0,
          }}
          className={className}
          {...textareaProps}
        />

        {trailingIcon && (
          <Text
            sx={{
              position: 'absolute',
              right: '1.25rem',
              top: '0.75rem',
            }}
          >
            <Icon inline icon={trailingIcon} />
          </Text>
        )}
      </Flex>
    );
  }
);

Textarea.displayName = 'Textarea';
