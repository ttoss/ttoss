import { Icon } from '@ttoss/react-icons';
import { Divider, Flex, Link, Text } from '@ttoss/ui';
import * as React from 'react';

export type NavListItem = {
  id?: string;
  label: string;
  href: string;
  icon?: string;
  disabled?: boolean;
  active?: boolean;
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
  group?: string;
  divider?: boolean; // Show divider below this item
};

export type NavListGroup = {
  id?: string;
  label?: string;
  items: NavListItem[];
  divider?: boolean; // Show divider below this group
};

export type NavListProps = {
  items?: NavListItem[];
  groups?: NavListGroup[];
  variant?: 'sidebar' | 'menu' | 'dropdown';
  onItemClick?: (item: NavListItem) => void;
  sx?: Record<string, unknown>;
  iconSize?: number;
  /**
   * Custom Link component to use for rendering links.
   * Useful for integrating with Next.js Link, React Router Link, etc.
   *
   * @example
   * // Next.js
   * import NextLink from 'next/link';
   * <NavList LinkComponent={NextLink} ... />
   *
   * @example
   * // React Router
   * import { Link as RouterLink } from 'react-router-dom';
   * <NavList LinkComponent={RouterLink} ... />
   */
  LinkComponent?: React.ComponentType<{
    href: string;
    onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
    children: React.ReactNode;
    [key: string]: unknown;
  }>;
};

const getVariantStyles = (variant: NavListProps['variant']) => {
  switch (variant) {
    case 'sidebar':
      return {
        container: {
          flexDirection: 'column' as const,
          gap: '6',
          width: 'full',
        },
        item: {
          padding: '4',
          borderRadius: 'none',
          fontSize: 'md',
          transition: 'background-color 0.15s ease',
          '&:hover': {
            backgroundColor: 'navigation.background.muted.default',
            textDecoration: 'none',
          },
        },
        activeItem: {
          backgroundColor: 'navigation.background.primary.default',
          borderLeft: '4px solid',
          borderColor: 'navigation.border.primary.default',
          paddingLeft: 'calc(1rem - 4px)', // Compensate for border
        },
        icon: {
          size: 20,
        },
        groupLabel: {
          fontSize: 'xs',
          fontWeight: 'bold',
          color: 'navigation.text.muted.default',
          textTransform: 'uppercase' as const,
          marginBottom: '2',
          marginTop: '4',
        },
      };
    case 'menu':
      return {
        container: {
          flexDirection: 'column' as const,
          gap: '3',
          width: 'full',
        },
        item: {
          backgroundColor: 'display.background.secondary.default',
          borderRadius: 'md',
          padding: '3',
          fontSize: 'md',
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: 'navigation.background.muted.default',
            transform: 'translateX(4px)',
            textDecoration: 'none',
          },
        },
        activeItem: {
          backgroundColor: 'navigation.background.muted.default',
          fontWeight: 'bold',
        },
        icon: {
          size: 18,
        },
        groupLabel: {
          fontSize: 'sm',
          fontWeight: 'semibold',
          color: 'display.text.secondary.default',
          marginBottom: '2',
          marginTop: '3',
        },
      };
    case 'dropdown':
      return {
        container: {
          flexDirection: 'column' as const,
          gap: '1',
          width: 'full',
        },
        item: {
          padding: '2',
          fontSize: 'sm',
          borderBottom: 'sm',
          borderColor: 'display.border.muted.default',
          transition: 'background-color 0.1s ease',
          '&:hover': {
            backgroundColor: 'display.background.secondary.default',
            textDecoration: 'none',
          },
        },
        activeItem: {
          backgroundColor: 'display.background.secondary.default',
          fontWeight: 'semibold',
        },
        icon: {
          size: 16,
        },
        groupLabel: {
          fontSize: 'xs',
          fontWeight: 'medium',
          color: 'display.text.secondary.default',
          marginBottom: '1',
          marginTop: '2',
          paddingX: '2',
        },
      };
    default:
      return getVariantStyles('menu');
  }
};

const NavListItemComponent = ({
  item,
  onItemClick,
  variantStyles,
  iconSize,
  LinkComponent = Link,
  showDivider = false,
}: {
  item: NavListItem;
  onItemClick?: NavListProps['onItemClick'];
  variantStyles: ReturnType<typeof getVariantStyles>;
  iconSize?: number;
  LinkComponent?: NavListProps['LinkComponent'];
  showDivider?: boolean;
}) => {
  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (item.disabled) {
      event.preventDefault();
      return;
    }

    item.onClick?.(event);
    onItemClick?.(item);
  };

  const itemStyles = {
    ...variantStyles.item,
    ...(item.active ? variantStyles.activeItem : {}),
    ...(item.disabled
      ? {
          opacity: 0.5,
          cursor: 'not-allowed',
          pointerEvents: 'none' as const,
        }
      : {}),
  };

  const linkProps = {
    href: item.href,
    onClick: handleClick,
    sx: itemStyles,
    'aria-disabled': item.disabled,
    'aria-current': item.active ? ('page' as const) : undefined,
    quiet: true,
  };

  return (
    <>
      <LinkComponent {...linkProps}>
        <Flex
          sx={{
            alignItems: 'center',
            gap: '2',
            color: 'navigation.text.primary.default',
          }}
        >
          {item.icon && (
            <Icon
              icon={item.icon}
              width={iconSize ?? variantStyles.icon.size}
              height={iconSize ?? variantStyles.icon.size}
            />
          )}
          <Text>{item.label}</Text>
        </Flex>
      </LinkComponent>
      {showDivider && <Divider sx={{ marginY: '2' }} />}
    </>
  );
};

export const NavList = ({
  items = [],
  groups = [],
  variant = 'menu',
  onItemClick,
  sx,
  iconSize,
  LinkComponent,
}: NavListProps) => {
  const variantStyles = getVariantStyles(variant);

  // If groups are provided, use groups; otherwise, create a single ungrouped group
  const processedGroups = React.useMemo(() => {
    if (groups.length > 0) {
      return groups;
    }

    if (items.length > 0) {
      // Group items by their group property
      const groupedItems = items.reduce(
        (acc, item) => {
          const groupKey = item.group || '__ungrouped__';
          if (!acc[groupKey]) {
            acc[groupKey] = [];
          }
          acc[groupKey].push(item);
          return acc;
        },
        {} as Record<string, NavListItem[]>
      );

      // Convert to NavListGroup array
      return Object.entries(groupedItems).map(([key, groupItems]) => {
        return {
          id: key,
          label: key === '__ungrouped__' ? undefined : key,
          items: groupItems,
          divider: false,
        };
      });
    }

    return [];
  }, [items, groups]);

  return (
    <Flex
      as="nav"
      sx={{
        ...variantStyles.container,
        ...sx,
      }}
      role="navigation"
    >
      {processedGroups.map((group, groupIndex) => {
        return (
          <React.Fragment key={group.id || `group-${groupIndex}`}>
            {group.label && (
              <Text sx={variantStyles.groupLabel} as="div" role="heading">
                {group.label}
              </Text>
            )}
            <Flex
              sx={{
                flexDirection: 'column',
                gap: variantStyles.container.gap,
              }}
            >
              {group.items.map((item, itemIndex) => {
                const isLastItem = itemIndex === group.items.length - 1;
                const showDivider =
                  item.divider || (isLastItem && group.divider);

                return (
                  <NavListItemComponent
                    key={item.id || `${group.id}-item-${itemIndex}`}
                    item={item}
                    onItemClick={onItemClick}
                    variantStyles={variantStyles}
                    iconSize={iconSize}
                    LinkComponent={LinkComponent}
                    showDivider={showDivider}
                  />
                );
              })}
            </Flex>
          </React.Fragment>
        );
      })}
    </Flex>
  );
};

NavList.displayName = 'NavList';
