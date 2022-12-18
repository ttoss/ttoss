import { Flex, FlexProps } from '@ttoss/ui';

export type AuthContainerProps = FlexProps & { backgroundImageUrl?: string };

export const AuthContainer = ({ sx, ...props }: AuthContainerProps) => {
  return (
    <Flex
      {...props}
      sx={{
        height: '100vh',
        justifyContent: 'center',
        alignItems: 'center',
        margin: 0,
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        ...sx,
      }}
    />
  );
};
