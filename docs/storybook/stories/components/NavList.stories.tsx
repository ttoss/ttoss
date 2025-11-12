import { Meta, StoryObj } from '@storybook/react-webpack5';
import { type LinkComponentProps, NavList } from '@ttoss/components/NavList';

const meta: Meta<typeof NavList> = {
  title: 'Components/NavList',
  component: NavList,
  parameters: {
    docs: {
      description: {
        component:
          'Navigation list component for sidebars, menus, and dropdowns. Supports grouping, icons, active states, and custom Link components (Next.js, React Router).',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof NavList>;

const itensWithIcons = [
  {
    id: '1',
    label: 'Dashboard',
    href: '/dashboard',
    icon: 'fluent:home-24-regular',
    active: true,
  },
  {
    id: '2',
    label: 'Projects',
    href: '/projects',
    icon: 'fluent:folder-24-regular',
  },
  {
    id: '3',
    label: 'Tasks',
    href: '/tasks',
    icon: 'fluent:task-list-24-regular',
  },
  {
    id: '4',
    label: 'Calendar',
    href: '/calendar',
    icon: 'fluent:calendar-24-regular',
  },
  {
    id: '5',
    label: 'Settings',
    href: '/settings',
    icon: 'fluent:settings-24-regular',
  },
  {
    id: '6',
    label: 'Help',
    href: '/help',
    icon: 'fluent:question-circle-24-regular',
    disabled: true,
  },
];

const itemsWithoutIcons = [
  {
    id: '1',
    label: 'Home',
    href: '/',
  },
  {
    id: '2',
    label: 'About',
    href: '/about',
  },
  {
    id: '3',
    label: 'Services',
    href: '/services',
  },
  {
    id: '4',
    label: 'Contact',
    href: '/contact',
  },
];

const groups = [
  {
    id: 'main',
    label: 'Main',
    items: [
      {
        id: '1',
        label: 'Dashboard',
        href: '/dashboard',
        icon: 'fluent:home-24-regular',
        active: true,
      },
      {
        id: '2',
        label: 'Projects',
        href: '/projects',
        icon: 'fluent:folder-24-regular',
      },
    ],
  },
  {
    id: 'tools',
    label: 'Tools',
    items: [
      {
        id: '3',
        label: 'Analytics',
        href: '/analytics',
        icon: 'fluent:data-bar-vertical-24-regular',
      },
      {
        id: '4',
        label: 'Reports',
        href: '/reports',
        icon: 'fluent:document-24-regular',
      },
    ],
  },
  {
    id: 'account',
    label: 'Account',
    items: [
      {
        id: '5',
        label: 'Settings',
        href: '/settings',
        icon: 'fluent:settings-24-regular',
      },
      {
        id: '6',
        label: 'Logout',
        href: '/logout',
        icon: 'fluent:sign-out-24-regular',
      },
    ],
  },
];

const autoGroupedItems = [
  {
    id: '1',
    label: 'Dashboard',
    href: '/dashboard',
    icon: 'fluent:home-24-regular',
    group: 'Main',
  },
  {
    id: '2',
    label: 'Projects',
    href: '/projects',
    icon: 'fluent:folder-24-regular',
    group: 'Main',
  },
  {
    id: '3',
    label: 'Analytics',
    href: '/analytics',
    icon: 'fluent:data-bar-vertical-24-regular',
    group: 'Tools',
  },
  {
    id: '4',
    label: 'Reports',
    href: '/reports',
    icon: 'fluent:document-24-regular',
    group: 'Tools',
  },
  {
    id: '5',
    label: 'Settings',
    href: '/settings',
    icon: 'fluent:settings-24-regular',
    group: 'Account',
  },
];

export const SidebarVariant: Story = {
  args: {
    variant: 'sidebar',
    items: itensWithIcons,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Sidebar variant with larger spacing and icons. Suitable for main navigation in dashboard layouts.',
      },
    },
  },
};

const LinkComponent = ({
  children,
  ...props
}: React.PropsWithChildren<LinkComponentProps>) => {
  return (
    <a
      style={{
        textDecoration: 'none',
      }}
      {...props}
    >
      {children}
    </a>
  );
};

export const SidebarWithLinkComponent: Story = {
  args: {
    variant: 'sidebar',
    items: itensWithIcons,
    LinkComponent,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Using a custom Link component (e.g., for Next.js or React Router integration).',
      },
    },
  },
};

export const MenuVariant: Story = {
  args: {
    variant: 'menu',
    items: itensWithIcons,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Menu variant with card-style items and hover animation. Perfect for dropdown menus.',
      },
    },
  },
};

export const DropdownVariant: Story = {
  args: {
    variant: 'dropdown',
    items: itensWithIcons,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Compact dropdown variant with minimal spacing. Best for action menus and quick selects.',
      },
    },
  },
};

export const WithGroups: Story = {
  args: {
    variant: 'sidebar',
    groups,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Navigation list with grouped items. Each group can have an optional label.',
      },
    },
  },
};

export const AutoGrouping: Story = {
  args: {
    variant: 'sidebar',
    items: autoGroupedItems,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Items are automatically grouped based on the `group` property. Simpler alternative to explicit groups.',
      },
    },
  },
};

export const WithoutIcons: Story = {
  args: {
    variant: 'menu',
    items: itemsWithoutIcons,
  },
  parameters: {
    docs: {
      description: {
        story: 'Navigation list without icons. Clean and simple.',
      },
    },
  },
};
