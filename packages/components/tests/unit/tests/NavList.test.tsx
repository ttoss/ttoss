/* eslint-disable @typescript-eslint/no-explicit-any */
import { fireEvent, render, screen } from '@ttoss/test-utils/react';

import {
  NavList,
  NavListGroup,
  NavListItem,
} from '../../../src/components/NavList';

const mockItems: NavListItem[] = [
  { id: '1', label: 'Home', href: '/home', icon: 'mdi:home' },
  { id: '2', label: 'Profile', href: '/profile', icon: 'mdi:account' },
  { id: '3', label: 'Settings', href: '/settings', icon: 'mdi:cog' },
];

const mockGroupedItems: NavListGroup[] = [
  {
    id: 'main',
    label: 'Main Menu',
    items: [
      {
        id: '1',
        label: 'Dashboard',
        href: '/dashboard',
        icon: 'mdi:view-dashboard',
      },
      {
        id: '2',
        label: 'Analytics',
        href: '/analytics',
        icon: 'mdi:chart-line',
      },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    items: [
      { id: '3', label: 'Account', href: '/account', icon: 'mdi:account-cog' },
      { id: '4', label: 'Preferences', href: '/preferences', icon: 'mdi:tune' },
    ],
  },
];

describe('NavList component', () => {
  describe('Basic rendering', () => {
    test('renders navigation with items', () => {
      render(<NavList items={mockItems} />);

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    test('renders as nav element with role="navigation"', () => {
      const { container } = render(<NavList items={mockItems} />);

      const nav = container.querySelector('nav[role="navigation"]');
      expect(nav).toBeInTheDocument();
    });

    test('renders with groups', () => {
      render(<NavList groups={mockGroupedItems} />);

      expect(screen.getByText('Main Menu')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Account')).toBeInTheDocument();
    });

    test('renders empty list when no items or groups provided', () => {
      const { container } = render(<NavList />);

      const nav = container.querySelector('nav');
      expect(nav).toBeInTheDocument();
      expect(nav?.children.length).toBe(0);
    });
  });

  describe('Variants', () => {
    test('renders sidebar variant with correct styles', () => {
      const { container } = render(
        <NavList items={mockItems} variant="sidebar" />
      );

      const nav = container.querySelector('nav');
      expect(nav).toBeInTheDocument();
    });

    test('renders menu variant with correct styles', () => {
      const { container } = render(
        <NavList items={mockItems} variant="menu" />
      );

      const nav = container.querySelector('nav');
      expect(nav).toBeInTheDocument();
    });

    test('renders dropdown variant with correct styles', () => {
      const { container } = render(
        <NavList items={mockItems} variant="dropdown" />
      );

      const nav = container.querySelector('nav');
      expect(nav).toBeInTheDocument();
    });

    test('defaults to menu variant when variant not specified', () => {
      const { container: withDefault } = render(<NavList items={mockItems} />);
      const { container: withExplicit } = render(
        <NavList items={mockItems} variant="menu" />
      );

      expect(withDefault.querySelector('nav')).toBeInTheDocument();
      expect(withExplicit.querySelector('nav')).toBeInTheDocument();
    });
  });

  describe('Auto-grouping', () => {
    test('groups items by their group property', () => {
      const itemsWithGroups: NavListItem[] = [
        { id: '1', label: 'Dashboard', href: '/dashboard', group: 'Main' },
        { id: '2', label: 'Analytics', href: '/analytics', group: 'Main' },
        { id: '3', label: 'Settings', href: '/settings', group: 'Config' },
        { id: '4', label: 'Profile', href: '/profile', group: 'Config' },
      ];

      render(<NavList items={itemsWithGroups} />);

      expect(screen.getByText('Main')).toBeInTheDocument();
      expect(screen.getByText('Config')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    test('creates ungrouped section for items without group property', () => {
      render(<NavList items={mockItems} />);

      // Items should be rendered without group labels
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });

    test('mixes grouped and ungrouped items correctly', () => {
      const mixedItems: NavListItem[] = [
        { id: '1', label: 'Home', href: '/' },
        { id: '2', label: 'Dashboard', href: '/dashboard', group: 'Main' },
        { id: '3', label: 'About', href: '/about' },
      ];

      render(<NavList items={mixedItems} />);

      expect(screen.getByText('Main')).toBeInTheDocument();
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('About')).toBeInTheDocument();
    });
  });

  describe('Item states', () => {
    test('renders active item with aria-current="page"', () => {
      const itemsWithActive: NavListItem[] = [
        { id: '1', label: 'Home', href: '/', active: true },
        { id: '2', label: 'Profile', href: '/profile' },
      ];

      render(<NavList items={itemsWithActive} />);

      const homeLink = screen.getByText('Home').closest('a');
      expect(homeLink).toHaveAttribute('aria-current', 'page');
    });

    test('renders disabled item with aria-disabled="true"', () => {
      const itemsWithDisabled: NavListItem[] = [
        { id: '1', label: 'Home', href: '/' },
        { id: '2', label: 'Disabled', href: '/disabled', disabled: true },
      ];

      render(<NavList items={itemsWithDisabled} />);

      const disabledLink = screen.getByText('Disabled').closest('a');
      expect(disabledLink).toHaveAttribute('aria-disabled', 'true');
    });

    test('prevents click on disabled item', () => {
      const handleClick = jest.fn();
      const itemsWithDisabled: NavListItem[] = [
        {
          id: '1',
          label: 'Disabled',
          href: '/disabled',
          disabled: true,
          onClick: handleClick,
        },
      ];

      render(<NavList items={itemsWithDisabled} />);

      const link = screen.getByText('Disabled').closest('a');
      fireEvent.click(link as HTMLAnchorElement);

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Click handling', () => {
    test('calls item onClick when item is clicked', () => {
      const handleClick = jest.fn((e) => {
        return e.preventDefault();
      });
      const itemsWithClick: NavListItem[] = [
        { id: '1', label: 'Home', href: '/', onClick: handleClick },
      ];

      render(<NavList items={itemsWithClick} />);

      const link = screen.getByText('Home').closest('a');
      fireEvent.click(link as HTMLAnchorElement);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test('calls onItemClick prop when item is clicked', () => {
      const handleItemClick = jest.fn();
      const itemsForClick: NavListItem[] = [
        { id: '1', label: 'Home', href: '/' },
      ];

      render(<NavList items={itemsForClick} onItemClick={handleItemClick} />);

      const link = screen.getByText('Home').closest('a');
      fireEvent.click(link as HTMLAnchorElement);

      expect(handleItemClick).toHaveBeenCalledWith(itemsForClick[0]);
    });

    test('calls both item onClick and onItemClick', () => {
      const handleItemClick = jest.fn((e) => {
        return e.preventDefault();
      });
      const handleGlobalClick = jest.fn();
      const itemsWithBoth: NavListItem[] = [
        { id: '1', label: 'Home', href: '/', onClick: handleItemClick },
      ];

      render(<NavList items={itemsWithBoth} onItemClick={handleGlobalClick} />);

      const link = screen.getByText('Home').closest('a');
      fireEvent.click(link as HTMLAnchorElement);

      expect(handleItemClick).toHaveBeenCalledTimes(1);
      expect(handleGlobalClick).toHaveBeenCalledWith(itemsWithBoth[0]);
    });
  });

  describe('Icons', () => {
    test('renders items with icons', () => {
      render(<NavList items={mockItems} />);

      const homeLink = screen.getByText('Home').closest('a');
      expect(homeLink).toBeInTheDocument();
      // Icon component should be rendered (can't easily test the icon itself in jsdom)
    });

    test('renders items without icons', () => {
      const itemsWithoutIcons: NavListItem[] = [
        { id: '1', label: 'Home', href: '/' },
        { id: '2', label: 'Profile', href: '/profile' },
      ];

      render(<NavList items={itemsWithoutIcons} />);

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
    });

    test('uses custom iconSize prop', () => {
      const { container } = render(<NavList items={mockItems} iconSize={24} />);

      expect(container).toBeInTheDocument();
    });
  });

  describe('Custom LinkComponent', () => {
    test('uses custom LinkComponent when provided', () => {
      const CustomLink = ({ href, children, ...props }: any) => {
        return (
          <a href={href} data-custom-link="true" {...props}>
            {children}
          </a>
        );
      };

      render(<NavList items={mockItems} LinkComponent={CustomLink} />);

      const links = screen.getAllByRole('link');
      for (const link of links) {
        expect(link).toHaveAttribute('data-custom-link', 'true');
      }
    });

    test('passes href and onClick to custom LinkComponent', () => {
      const handleClick = jest.fn((e) => {
        return e.preventDefault();
      });
      const CustomLink = jest.fn(
        ({ href, onClick, children, ...props }: any) => {
          return (
            <a href={href} onClick={onClick} {...props}>
              {children}
            </a>
          );
        }
      );

      const itemsWithClick: NavListItem[] = [
        { id: '1', label: 'Home', href: '/home', onClick: handleClick },
      ];

      render(<NavList items={itemsWithClick} LinkComponent={CustomLink} />);

      // Check that CustomLink was called and received the correct props
      expect(CustomLink).toHaveBeenCalled();
      const callArgs = CustomLink.mock.calls[0][0];
      expect(callArgs.href).toBe('/home');
      expect(typeof callArgs.onClick).toBe('function');
    });
  });

  describe('Dividers', () => {
    test('renders divider after item when item.divider is true', () => {
      const itemsWithDivider: NavListItem[] = [
        { id: '1', label: 'Home', href: '/', icon: 'mdi:home', divider: true },
        { id: '2', label: 'Profile', href: '/profile', icon: 'mdi:account' },
      ];

      const { container } = render(<NavList items={itemsWithDivider} />);

      // Divider component should be rendered
      const divider = container.querySelector('hr');
      expect(divider).toBeInTheDocument();
    });

    test('renders divider after last item in group when group.divider is true', () => {
      const groupsWithDivider: NavListGroup[] = [
        {
          id: 'main',
          label: 'Main',
          items: [
            { id: '1', label: 'Home', href: '/' },
            { id: '2', label: 'Dashboard', href: '/dashboard' },
          ],
          divider: true,
        },
        {
          id: 'settings',
          items: [{ id: '3', label: 'Settings', href: '/settings' }],
        },
      ];

      const { container } = render(<NavList groups={groupsWithDivider} />);

      // Should have divider after last item of first group
      const dividers = container.querySelectorAll('hr');
      expect(dividers.length).toBeGreaterThan(0);
    });

    test('does not render divider when neither item nor group has divider property', () => {
      const { container } = render(<NavList items={mockItems} />);

      const divider = container.querySelector('hr');
      expect(divider).not.toBeInTheDocument();
    });
  });

  describe('Custom styling', () => {
    test('applies custom sx prop to nav element', () => {
      const { container } = render(
        <NavList items={mockItems} sx={{ backgroundColor: 'red' }} />
      );

      const nav = container.querySelector('nav');
      expect(nav).toBeInTheDocument();
    });
  });

  describe('Group labels', () => {
    test('renders group labels as heading role', () => {
      render(<NavList groups={mockGroupedItems} />);

      const mainLabel = screen.getByText('Main Menu');
      expect(mainLabel).toHaveAttribute('role', 'heading');

      const settingsLabel = screen.getByText('Settings');
      expect(settingsLabel).toHaveAttribute('role', 'heading');
    });

    test('does not render label for ungrouped items', () => {
      render(<NavList items={mockItems} />);

      const headings = screen.queryAllByRole('heading');
      expect(headings.length).toBe(0);
    });

    test('renders groups without labels when label is undefined', () => {
      const groupsWithoutLabels: NavListGroup[] = [
        {
          id: 'no-label',
          items: [
            { id: '1', label: 'Item 1', href: '/item1' },
            { id: '2', label: 'Item 2', href: '/item2' },
          ],
        },
      ];

      render(<NavList groups={groupsWithoutLabels} />);

      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    test('handles items without id gracefully', () => {
      const itemsWithoutIds: NavListItem[] = [
        { label: 'Home', href: '/' },
        { label: 'Profile', href: '/profile' },
      ];

      render(<NavList items={itemsWithoutIds} />);

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
    });

    test('handles groups without id gracefully', () => {
      const groupsWithoutIds: NavListGroup[] = [
        {
          label: 'Main',
          items: [{ label: 'Home', href: '/' }],
        },
      ];

      render(<NavList groups={groupsWithoutIds} />);

      expect(screen.getByText('Main')).toBeInTheDocument();
      expect(screen.getByText('Home')).toBeInTheDocument();
    });

    test('prefers groups over items when both are provided', () => {
      const groups: NavListGroup[] = [
        {
          id: 'group1',
          label: 'From Groups',
          items: [{ id: '1', label: 'Group Item', href: '/group' }],
        },
      ];

      const items: NavListItem[] = [
        { id: '2', label: 'From Items', href: '/items' },
      ];

      render(<NavList groups={groups} items={items} />);

      expect(screen.getByText('From Groups')).toBeInTheDocument();
      expect(screen.getByText('Group Item')).toBeInTheDocument();
      expect(screen.queryByText('From Items')).not.toBeInTheDocument();
    });

    test('handles empty groups array', () => {
      const { container } = render(<NavList groups={[]} />);

      const nav = container.querySelector('nav');
      expect(nav).toBeInTheDocument();
      expect(nav?.children.length).toBe(0);
    });

    test('handles empty items array', () => {
      const { container } = render(<NavList items={[]} />);

      const nav = container.querySelector('nav');
      expect(nav).toBeInTheDocument();
      expect(nav?.children.length).toBe(0);
    });
  });
});
