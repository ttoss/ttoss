import { Icon, IconType } from '@ttoss/react-icons';
import { BoxProps, Flex } from '@ttoss/ui';

import { useGlobal } from './GlobalProvider';

export const Header = ({
  sidebarButton,
  ...props
}: BoxProps & { sidebarButton?: boolean | string | IconType }) => {
  const { isSidebarOpen, toggleSidebar } = useGlobal();

  return (
    <Flex
      variant="layout.header"
      {...props}
      as="header"
      sx={{
        flexDirection: 'row',
        alignItems: 'center',
        ...props.sx,
      }}
    >
      {sidebarButton && (
        <Flex
          sx={{
            cursor: 'pointer',
            backgroundColor: 'navigation.background.muted.default',
            color: isSidebarOpen
              ? 'navigation.text.primary.default'
              : 'navigation.text.muted.default',
            width: 'min',
            borderRadius: 'full',
            marginLeft: '4',
            paddingX: '1',
            paddingY: '1',
            fontSize: ['xl', '2xl'],
          }}
          onClick={toggleSidebar}
        >
          {typeof sidebarButton === 'boolean' && sidebarButton === true && (
            <Icon icon={isSidebarOpen ? 'sidebar-opened' : 'sidebar-closed'} />
          )}
          {typeof sidebarButton === 'string' && <Icon icon={sidebarButton} />}
          {typeof sidebarButton === 'function' && (
            <Icon icon={sidebarButton as IconType} />
          )}
        </Flex>
      )}

      {props.children}
    </Flex>
  );
};

Header.displayName = 'Header';
