import type { VisualizationSpec } from '@ttoss/geovis';
import type * as React from 'react';

import {
  type GeovisWorkspaceConfig,
  type GeovisWorkspaceSlotName,
} from './context/GeovisWorkspaceContext';

/** Whether a slot's `hidden` flag is set. Hidden always wins over content. */
export const isSlotHidden = ({
  config,
  slot,
}: {
  config: GeovisWorkspaceConfig;
  slot: GeovisWorkspaceSlotName;
}): boolean => {
  return config.slots?.[slot]?.hidden === true;
};

/** The override component configured for a slot, if any. */
export const getSlotOverride = ({
  config,
  slot,
}: {
  config: GeovisWorkspaceConfig;
  slot: GeovisWorkspaceSlotName;
}): React.ComponentType | undefined => {
  return config.slots?.[slot]?.component;
};

const hasControlsDefaultContent = (config: GeovisWorkspaceConfig): boolean => {
  const menuCount = config.controls?.menus?.length ?? 0;
  return menuCount > 0;
};

const hasLegendDefaultContent = ({
  config,
  spec,
}: {
  config: GeovisWorkspaceConfig;
  spec: VisualizationSpec;
}): boolean => {
  if (config.legend?.description) return true;
  if (config.legend?.sources) return true;
  const legendCount = spec.legends?.length ?? 0;
  return legendCount > 0;
};

/**
 * Whether the slot's own default panel has content, ignoring hidden/override
 * — `map`, `warnings`, `inspector`, and `metadata` have no default panel yet
 * (added in PRD-003 Phases 3-5), so only `controls` and `legend` resolve here.
 */
const DEFAULT_PANEL_HAS_CONTENT: Partial<
  Record<
    GeovisWorkspaceSlotName,
    (args: {
      config: GeovisWorkspaceConfig;
      spec: VisualizationSpec;
    }) => boolean
  >
> = {
  controls: ({ config }) => {
    return hasControlsDefaultContent(config);
  },
  legend: hasLegendDefaultContent,
};

/**
 * Whether a slot has anything to render: not hidden, and either an override
 * component (assumed to render something — it is not yet known to be empty)
 * or the slot's own default panel has real content to show.
 */
export const slotHasContent = ({
  config,
  spec,
  slot,
}: {
  config: GeovisWorkspaceConfig;
  spec: VisualizationSpec;
  slot: GeovisWorkspaceSlotName;
}): boolean => {
  if (isSlotHidden({ config, slot })) return false;
  if (getSlotOverride({ config, slot })) return true;

  const hasDefaultContent = DEFAULT_PANEL_HAS_CONTENT[slot];
  return hasDefaultContent ? hasDefaultContent({ config, spec }) : false;
};
