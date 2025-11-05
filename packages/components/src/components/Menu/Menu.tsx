import {
  ChakraProvider,
  createSystem,
  defaultConfig,
  Menu as ChakraMenu,
} from '@chakra-ui/react';
import { Icon } from '@ttoss/react-icons';
import { Box, useTheme } from '@ttoss/ui';
import * as React from 'react';

export type MenuProps = React.ComponentProps<typeof ChakraMenu.Root> & {
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
  menuButtonProps?: React.ComponentProps<typeof ChakraMenu.Trigger>;
  menuListProps?: React.ComponentProps<typeof ChakraMenu.Content>;
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
  const { theme } = useTheme();

  // Todo: criar sistema Chakra global com tokens do tema ttoss
  const chakraSystem = React.useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const colors = theme.colors as any;
    const radii = theme.radii as Record<string, string>;

    return createSystem(defaultConfig, {
      theme: {
        tokens: {
          colors: {
            // Mapear tokens semânticos do ttoss para Chakra
            'menu.bg': {
              value: colors?.input?.background?.muted?.default || '#f5f5f5',
            },
            'menu.item': {
              value:
                colors?.display?.background?.secondary?.default || '#ffffff',
            },
            'menu.item.hover': {
              value: colors?.display?.background?.muted?.default || '#eeeeee',
            },
            'menu.text': {
              value: colors?.display?.text?.secondary?.default || '#333333',
            },
            'menu.border': {
              value: colors?.display?.border?.muted?.default || '#cccccc',
            },
          },
          radii: {
            'menu.radius': { value: radii?.[3] || '8px' },
          },
        },
      },
    });
  }, [theme]);

  const triggerNode = trigger || triggerIcon || <Icon icon={menuIcon} />;

  const triggerStyle: React.CSSProperties = fixedTrigger
    ? {
        position: 'fixed',
        zIndex: 1000,
        ...(fixedOffset?.top !== undefined ? { top: fixedOffset.top } : {}),
        ...(fixedOffset?.right !== undefined
          ? { right: fixedOffset.right }
          : {}),
        ...(fixedOffset?.bottom !== undefined
          ? { bottom: fixedOffset.bottom }
          : {}),
        ...(fixedOffset?.left !== undefined ? { left: fixedOffset.left } : {}),
      }
    : {};

  const buttonDefaultStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
  };

  const mergedMenuListStyle: React.CSSProperties = {
    ...(sx ?? {}),
    ...(menuListProps?.style as React.CSSProperties),
  };

  return (
    <ChakraProvider value={chakraSystem}>
      <ChakraMenu.Root {...chakraProps}>
        <Box style={triggerStyle}>
          {!hideTrigger && (
            <ChakraMenu.Trigger
              {...menuButtonProps}
              style={{
                ...buttonDefaultStyle,
                ...(menuButtonProps?.style as React.CSSProperties),
              }}
            >
              {triggerNode}
            </ChakraMenu.Trigger>
          )}
        </Box>
        <ChakraMenu.Positioner>
          <ChakraMenu.Content style={mergedMenuListStyle} {...menuListProps}>
            {children}
          </ChakraMenu.Content>
        </ChakraMenu.Positioner>
      </ChakraMenu.Root>
    </ChakraProvider>
  );
};
