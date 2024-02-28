import * as React from 'react';
import { Box, BoxProps, Flex, Image, Text } from '@ttoss/ui';
import { Icon } from '@ttoss/react-icons';

export type MenuProps = {
  onClose: () => void;
  isOpen: boolean;
  children: React.ReactNode;
  srcLogo?: string;
  sx?: BoxProps['sx'];
};

export const Menu = ({ children, srcLogo, onClose, isOpen, sx }: MenuProps) => {
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        width: '100vw',
        zIndex: 50,
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 500ms',
        ...sx,
      }}
      aria-hidden={!isOpen}
    >
      <Box
        sx={{
          position: 'fixed',
          height: '100%',
          backgroundColor: 'white',
          width: '100%',
          maxWidth: 'md',
          right: 0,
          boxShadow: 'lg',
          paddingX: 'xl',
          paddingTop: 'lg',
          paddingBottom: '2xl',
        }}
      >
        <Flex sx={{ justifyContent: 'space-between' }}>
          <Image
            src={srcLogo}
            sx={{
              maxWidth: '200px',
              height: '44px',
              objectFit: 'cover',
            }}
          />

          <Text
            sx={{
              marginLeft: 'auto',
              fontSize: '2xl',
              alignSelf: 'center',
              flexShrink: 0,
              cursor: 'pointer',
              lineHeight: 0,
            }}
            role="button"
            onClick={onClose}
          >
            <Icon icon="close" />
          </Text>
        </Flex>

        <Box sx={{ paddingTop: '3xl' }} as="nav">
          {children}
        </Box>
      </Box>
    </Box>
  );
};
