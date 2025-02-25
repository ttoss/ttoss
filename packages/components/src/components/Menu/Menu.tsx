import { Icon, IconifyIcon } from '@ttoss/react-icons';
import {
  Box,
  BoxProps,
  Flex,
  Image,
  Text,
  useResponsiveValue,
} from '@ttoss/ui';
import * as React from 'react';

import { Drawer } from '../Drawer';

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
            maxWidth: '2',
            right: 0,
            boxShadow: '4',
            paddingX: '5',
            paddingTop: '4',
            paddingBottom: '6',
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
              data-testid="img"
            />

            <Text
              data-testid="button"
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

          <Box sx={{ paddingTop: '6' }} as="nav">
            {children}
          </Box>
        </Box>
      </Drawer>
    </>
  );
};
