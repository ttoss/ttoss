import * as React from 'react';
import { Flex, FlexProps } from './Flex';

export type StackProps = FlexProps;

/**
 * A component that renders its children in a column.
 */
export const Stack = React.forwardRef<HTMLElement, StackProps>(
  (props: FlexProps, ref) => {
    return (
      <Flex
        ref={ref}
        {...props}
        sx={{
          flexDirection: 'column',
          ...props.sx,
        }}
      />
    );
  }
);

Stack.displayName = 'Stack';
