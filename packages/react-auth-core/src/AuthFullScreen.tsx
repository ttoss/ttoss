import { Flex } from '@ttoss/ui';

export type AuthFullScreenProps = {
  backgroundImageUrl?: string;
  children: React.ReactNode;
};

export const AuthFullScreen = ({ children }: AuthFullScreenProps) => {
  return (
    <Flex
      sx={{
        height: '100vh',
        width: '100vw',
        justifyContent: 'center',
        alignItems: 'center',
        margin: 0,
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
      }}
    >
      {children}
    </Flex>
  );
};
