import type {
  GeoVisResult,
  MapClickInfo,
  VisualizationSpec,
} from '@ttoss/geovis';
import type * as React from 'react';

import {
  type GeovisWorkspaceConfig,
  type GeovisWorkspaceSlotName,
} from './context/GeovisWorkspaceContext';
import { getResultIssues, isColdStart } from './warnings';

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

const hasWarningsDefaultContent = ({
  result,
  hasResolvedOnce,
}: {
  result: GeoVisResult;
  hasResolvedOnce: boolean;
}): boolean => {
  // The map slot's cold-start empty state exclusively covers this case.
  if (isColdStart({ result, hasResolvedOnce })) return false;
  return getResultIssues(result).length > 0;
};

const hasInspectorDefaultContent = ({
  click,
}: {
  click: MapClickInfo | null;
}): boolean => {
  return click !== null;
};

/**
 * Whether the slot's own default panel has content, ignoring hidden/override
 * — `map` and `metadata` have no default panel yet (added in PRD-003 Phase
 * 5), so they resolve to no content here.
 */
const DEFAULT_PANEL_HAS_CONTENT: Partial<
  Record<
    GeovisWorkspaceSlotName,
    (args: {
      config: GeovisWorkspaceConfig;
      spec: VisualizationSpec;
      result: GeoVisResult;
      hasResolvedOnce: boolean;
      click: MapClickInfo | null;
    }) => boolean
  >
> = {
  controls: ({ config }) => {
    return hasControlsDefaultContent(config);
  },
  legend: hasLegendDefaultContent,
  warnings: hasWarningsDefaultContent,
  inspector: hasInspectorDefaultContent,
};

/**
 * Whether a slot has anything to render: not hidden, and either an override
 * component (assumed to render something — it is not yet known to be empty)
 * or the slot's own default panel has real content to show.
 */
export const slotHasContent = ({
  config,
  spec,
  result,
  hasResolvedOnce,
  click,
  slot,
}: {
  config: GeovisWorkspaceConfig;
  spec: VisualizationSpec;
  result: GeoVisResult;
  hasResolvedOnce: boolean;
  click: MapClickInfo | null;
  slot: GeovisWorkspaceSlotName;
}): boolean => {
  if (isSlotHidden({ config, slot })) return false;
  if (getSlotOverride({ config, slot })) return true;

  const hasDefaultContent = DEFAULT_PANEL_HAS_CONTENT[slot];
  return hasDefaultContent
    ? hasDefaultContent({ config, spec, result, hasResolvedOnce, click })
    : false;
};
