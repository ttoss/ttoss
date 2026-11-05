import type { VisualizationSpec } from '@ttoss/geovis';

import {
  LEFT_SIDEBAR_CONTROL_CLEARANCE,
  RIGHT_SIDEBAR_LEGEND_CLEARANCE,
} from './controlOffset';

/**
 * Returns `visualizationSpec` with the open sidebars added to its
 * `viewInsets`, so what GeoVis frames by itself — the proximity search's
 * circle — fits the part of the map they leave free instead of sliding under
 * a sidebar. Each open sidebar covers its card's footprint, the same clearance
 * the legend and the layer control keep from it; the app's own insets are
 * added to.
 *
 * On a compact viewport the sidebars cover the whole map rather than a side
 * of it, so nothing is added there. The spec is returned untouched (same
 * reference) when no sidebar is open, so `GeoVisProvider` does not re-sync
 * needlessly.
 *
 * @example
 * applySidebarViewInsets({ spec, leftSidebarOpen: false, rightSidebarOpen: true, compact: false });
 * // { ...spec, viewInsets: { right: 332 } }
 */
export const applySidebarViewInsets = ({
  spec,
  leftSidebarOpen,
  rightSidebarOpen,
  compact,
}: {
  spec: VisualizationSpec;
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  compact: boolean;
}): VisualizationSpec => {
  if (compact || (!leftSidebarOpen && !rightSidebarOpen)) return spec;
  const insets = spec.viewInsets ?? {};
  return {
    ...spec,
    viewInsets: {
      ...insets,
      ...(leftSidebarOpen && {
        left: (insets.left ?? 0) + LEFT_SIDEBAR_CONTROL_CLEARANCE,
      }),
      ...(rightSidebarOpen && {
        right: (insets.right ?? 0) + RIGHT_SIDEBAR_LEGEND_CLEARANCE,
      }),
    },
  };
};
