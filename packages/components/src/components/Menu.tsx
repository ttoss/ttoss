import * as React from 'react';
import {
  Box,
  BoxProps,
  Flex,
  Image,
  Text,
  useResponsiveValue,
} from '@ttoss/ui';
import { Drawer } from '..';
import { Icon, IconifyIcon } from '@ttoss/react-icons';

export type MenuProps = {
  onClose: () => void;
  onOpen: () => void;
  isOpen: boolean;
  children: React.ReactNode;
  srcLogo?: string;
  sx?: BoxProps['sx'];
  /**
   * Default direction: `left`
   */
  direction?: 'left' | 'right';
  /**
   * Default size: `100%`
   */
  sizeOnMobile?: string | number;
  /**
   * Default size: `300px`
   */
  sizeOnDesktop?: string | number;
  /**
   * Default icon: `menu-open`
   */
  menuIcon?: IconifyIcon | string;
};

export const Menu = ({
  children,
  srcLogo,
  onClose,
  onOpen,
  isOpen,
  sx,
  direction = 'left',
  sizeOnDesktop = '300px',
  sizeOnMobile = '100%',
  menuIcon = 'menu-open',
}: MenuProps) => {
  const responsiveSize = useResponsiveValue([sizeOnMobile, sizeOnDesktop]);

  return (
    <>
      <Text sx={{ cursor: 'pointer' }} onClick={onOpen}>
        <Icon icon={menuIcon} />
      </Text>

      <Drawer size={responsiveSize} direction={direction} open={isOpen}>
        <Box
          sx={{
            position: 'fixed',
            height: '100%',
            backgroundColor: 'background',
            width: '100%',
            maxWidth: 'md',
            right: 0,
            boxShadow: 'lg',
            paddingX: 'xl',
            paddingTop: 'lg',
            paddingBottom: '2xl',
            ...sx,
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
      </Drawer>
    </>
  );
};
