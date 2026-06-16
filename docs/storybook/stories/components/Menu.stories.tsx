import type { Meta, StoryFn } from '@storybook/react-webpack5';
import type { NavListItem } from '@ttoss/components';
import { Menu, NavList, NotificationCard } from '@ttoss/components';

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

const menuItems: NavListItem[] = [
  {
    href: '#link1',
    label: 'Link 1',
    icon: 'streamline:customer-support-1',
  },
  {
    href: '#link2',
    label: 'Link 2',
    icon: 'cil:bus-alt',
  },
  {
    href: '#link3',
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
      <NavList variant="menu" items={menuItems} />
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
