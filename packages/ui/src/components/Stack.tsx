import { Flex, FlexProps } from './Flex';

export type StackProps = FlexProps;

/**
 * A component that renders its children in a column.
 */
export const Stack = (props: StackProps) => {
  return (
    <Flex
      {...props}
      sx={{
        flexDirection: 'column',
        alignItems: 'flex-start',
        ...props.sx,
      }}
    />
  );
};
