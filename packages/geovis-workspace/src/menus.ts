import {
  type GeovisWorkspaceConfig,
  type GeovisWorkspaceGroupedMenu,
  type GeovisWorkspaceMenu,
  type GeovisWorkspaceMenuGroup,
} from './context/GeovisWorkspaceContext';

/**
 * The menu groups that drive the `controls` slot's default panel. Read from
 * `controls.menus`, falling back to the `leftSidebar.menus` convenience alias;
 * `controls.menus` wins when both are set. Returns an empty array when neither
 * is configured.
 */
export const resolveMenus = (
  config: GeovisWorkspaceConfig
): GeovisWorkspaceMenu[] => {
  return config.controls?.menus ?? config.leftSidebar?.menus ?? [];
};

/**
 * The id of the group holding `value`, or `undefined` when no group contains
 * it (including when `value` itself is `undefined`). Used by the carousel to
 * keep the open group in sync with the current selection.
 */
export const findGroupIdForValue = ({
  groups,
  value,
}: {
  groups: GeovisWorkspaceMenuGroup[];
  value: string | undefined;
}): string | undefined => {
  if (value === undefined) {
    return undefined;
  }

  return groups.find((group) => {
    return group.items.some((item) => {
      return item.value === value;
    });
  })?.id;
};

/**
 * The group a grouped menu's carousel opens on first render: `defaultGroupId`
 * when it names a real group, else the group containing `defaultValue`, else
 * the first group. `undefined` only when the menu has no groups.
 */
export const resolveInitialGroupId = ({
  menu,
}: {
  menu: GeovisWorkspaceGroupedMenu;
}): string | undefined => {
  const { groups, defaultGroupId, defaultValue } = menu;

  if (
    defaultGroupId !== undefined &&
    groups.some((group) => {
      return group.id === defaultGroupId;
    })
  ) {
    return defaultGroupId;
  }

  const groupForDefaultValue = findGroupIdForValue({
    groups,
    value: defaultValue,
  });

  return groupForDefaultValue ?? groups[0]?.id;
};
