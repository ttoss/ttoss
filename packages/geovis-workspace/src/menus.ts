import {
  type GeovisWorkspaceConfig,
  type GeovisWorkspaceMenu,
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
