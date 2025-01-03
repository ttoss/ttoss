import * as React from 'react';
import { Flex, Text } from '..';
import { Icon, type IconType } from '@ttoss/react-icons';
import {
  type TextareaProps as TextareaPropsUI,
  Textarea as TextareaUI,
} from 'theme-ui';

export interface TextareaProps extends TextareaPropsUI {
  trailingIcon?: IconType;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ trailingIcon, className, sx, ...textareaProps }, ref) => {
    return (
      <Flex
        className={className}
        sx={{
          ...sx,
          position: 'relative',
          padding: 0,
          border: 'none',
        }}
      >
        <TextareaUI
          ref={ref}
          sx={{
            fontFamily: 'body',
            paddingY: '4',
            paddingX: '5',
            ...sx,
            paddingRight: trailingIcon ? '7' : undefined,
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
