import {
  Menu as ChakraMenu,
  MenuButton,
  MenuButtonProps as ChakraMenuButtonProps,
  MenuList,
  MenuListProps as ChakraMenuListProps,
  MenuProps as ChakraMenuProps,
} from '@chakra-ui/react';
import { Icon } from '@ttoss/react-icons';
import { Box } from '@ttoss/ui';
import * as React from 'react';

export type MenuProps = ChakraMenuProps & {
  children: React.ReactNode;
  sx?: Record<string, unknown>;
  menuIcon?: string;
  trigger?: React.ReactNode;
  triggerIcon?: React.ReactNode;
  hideTrigger?: boolean;
  fixedTrigger?: boolean;
  fixedOffset?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  menuButtonProps?: ChakraMenuButtonProps;
  menuListProps?: ChakraMenuListProps;
};

export const Menu = ({
  children,
  sx,
  menuIcon = 'menu-open',
  trigger,
  triggerIcon,
  hideTrigger = false,
  fixedTrigger = false,
  fixedOffset,
  menuButtonProps,
  menuListProps,
  ...chakraProps
}: MenuProps) => {
  const triggerStyle: React.CSSProperties = fixedTrigger
    ? {
        position: 'fixed',
        top: typeof fixedOffset?.top === 'number' ? fixedOffset.top : 16,
        right: typeof fixedOffset?.right === 'number' ? fixedOffset.right : 16,
        bottom: fixedOffset?.bottom,
        left: fixedOffset?.left,
        zIndex: 9999,
        display: 'inline-block',
      }
    : { position: 'relative', display: 'inline-block' };

  const buttonDefaultStyle: React.CSSProperties = {
    background: 'transparent',
    border: 0,
    padding: 4,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const triggerNode = trigger ?? triggerIcon ?? <Icon icon={menuIcon} />;

  const mergedMenuListStyle: React.CSSProperties = Object.assign(
    { minWidth: 240, maxHeight: 400, overflowY: 'auto' },
    sx as unknown as React.CSSProperties,
    (menuListProps?.style as React.CSSProperties) ?? {}
  );

  return (
    <ChakraMenu {...chakraProps}>
      <Box style={triggerStyle}>
        {!hideTrigger && (
          <MenuButton
            as="button"
            {...menuButtonProps}
            style={{
              ...(menuButtonProps?.style as React.CSSProperties),
              ...buttonDefaultStyle,
            }}
          >
            {triggerNode}
          </MenuButton>
        )}

        <MenuList {...menuListProps} style={mergedMenuListStyle}>
          <Box as="nav">{children}</Box>
        </MenuList>
      </Box>
    </ChakraMenu>
  );
};
