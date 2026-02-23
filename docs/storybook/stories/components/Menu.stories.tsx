import type { Meta, StoryFn } from '@storybook/react-webpack5';
import { Menu } from '@ttoss/components/Menu';
import { NotificationCard } from '@ttoss/components/NotificationCard';
import { Icon } from '@ttoss/react-icons';
import { Flex } from '@ttoss/ui';

export default {
  title: 'Components/Menu',
  component: Menu,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Dropdown menu component with customizable trigger icon and content. Perfect for navigation menus, notification panels, and action lists. Theme-aware with responsive behavior.',
      },
    },
  },
  argTypes: {
    menuIcon: {
      control: 'text',
      description:
        'Icon identifier from @ttoss/react-icons for the menu trigger',
    },
  },
} as Meta;

interface MenuItem {
  path: string;
  label: string;
  icon: string;
}

const menuItems: MenuItem[] = [
  {
    path: '#link1',
    label: 'Link 1',
    icon: 'streamline:customer-support-1',
  },
  {
    path: '#link2',
    label: 'Link 2',
    icon: 'cil:bus-alt',
  },
  {
    path: '#link3',
    label: 'Link 3',
    icon: 'ep:document',
  },
];

/**
 * Basic menu with navigation links and icons.
 * Each menu item shows hover effects and smooth transitions.
 */
export const Example: StoryFn = () => {
  return (
    <Menu>
      {menuItems.map((item) => {
        return (
          <a
            key={item.label}
            href={item.path}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: 'none', display: 'block' }}
          >
            <Flex
              sx={{
                backgroundColor: 'input.background.muted.default',
                textDecoration: 'none',
                borderRadius: 'md',
                padding: '3',
                color: 'display.text.secondary.default',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: 'display.background.secondary.default',
                  transform: 'translateX(4px)',
                },
              }}
            >
              <Flex
                sx={{
                  alignItems: 'center',
                  marginLeft: '4',
                  cursor: 'pointer',
                  fontSize: 'md',
                  gap: '2',
                }}
              >
                <Icon icon={item.icon} width={18} height={18} />
                {item.label}
              </Flex>
            </Flex>
          </a>
        );
      })}
    </Menu>
  );
};

/**
 * Menu with notification card content.
 * Demonstrates using Menu as a notification center with custom trigger icon and wider width.
 */
export const WithNotificationCard: StoryFn = () => {
  return (
    <Menu
      menuIcon="mdi:bell-outline"
      sx={{
        width: '600px',
      }}
    >
      <NotificationCard
        title="Notificação de Exemplo"
        message="Esta é uma notificação de exemplo para demonstrar o componente NotificationCard dentro do Menu."
        onClose={() => {
          return alert('Fechar notificação');
        }}
        actions={[
          {
            action: 'open_url',
            label: 'Acessar',
            url: 'https://example.com',
          },
        ]}
        caption="Enviada há 2 horas"
        type={'success'}
      />
    </Menu>
  );
};
