import type * as React from 'react';

import type { LegendPosition, VisualizationSpec } from '../spec/types';
import { GeoVisLayerControl } from '../ui/GeoVisLayerControl';
import { buildOuterStyle } from '../ui/GeoVisLayerControl.styles';
import { GeoVisLegend } from '../ui/GeoVisLegend';
import { buildContainerStyle, resolveLegend } from '../ui/GeoVisLegend.utils';
import { GeoVisMapModeControl } from '../ui/GeoVisMapModeControl';
import { GeoVisProximitySearch } from '../ui/GeoVisProximitySearch';
import { useGeoVisMapMode } from './mapMode';
import type { CompactOverlays } from './useCompactOverlays';

/**
 * Spec-driven legend overlays: one `<GeoVisLegend>` per positioned legend, so
 * consumers get the overlay just by declaring `position`, exactly like the
 * auto-mounted hoverTooltip. Legends sharing a position stack inside one grouped
 * container instead of overlapping as separate absolutely-positioned boxes.
 *
 * Kept out of `GeoVisProvider` with the other overlays, so the provider's own
 * render body stays within its line budget.
 */
const PositionedLegends = ({
  spec,
  groups,
}: {
  spec: VisualizationSpec;
  groups: Map<LegendPosition, string[]>;
}) => {
  return Array.from(groups.entries()).flatMap(([position, ids]) => {
    if (ids.length <= 1) {
      return ids.map((id) => {
        return <GeoVisLegend key={id} legendId={id} />;
      });
    }
    // Legends sharing a position share one anchor, so the group wrapper carries
    // the offset (all members get the same clearance from callers like the
    // workspace pushing legends clear of an open sidebar).
    const groupOffset = resolveLegend(spec, ids[0])?.offset;
    return (
      <div key={position} style={buildContainerStyle(position, groupOffset)}>
        {ids.map((id) => {
          return <GeoVisLegend key={id} legendId={id} noPositionWrap />;
        })}
      </div>
    );
  });
};

/**
 * The map's anchored control bar. `spec.control` mounts the layer control
 * automatically, exactly like the legend/tooltip overlays, and below the compact
 * breakpoint the legend button rides along in its trigger row so the two share
 * one corner anchor. With no `control` to ride along with, that button anchors
 * the corner on its own — at the corner's default edge gap, there being no
 * control offset to follow.
 */
const ControlBar = ({
  hasControl,
  legendTrigger,
  layerControlProps,
  position,
}: {
  hasControl: boolean;
  legendTrigger: React.ReactNode;
  layerControlProps: CompactOverlays['layerControlProps'];
  position: LegendPosition;
}) => {
  if (hasControl) {
    return (
      <GeoVisLayerControl trailing={legendTrigger} {...layerControlProps} />
    );
  }
  if (legendTrigger == null) return null;
  return <div style={buildOuterStyle({ position })}>{legendTrigger}</div>;
};

/**
 * The overlays the spec declares over the map: its positioned legends (above
 * the compact breakpoint only — below it they collapse into the control bar's
 * legend button, see `useCompactOverlays`), the control bar, the compact
 * legend panel, the map mode button and the proximity search.
 *
 * Split, each side carries its own legends and the pickers replace the layer
 * control, so all but the map mode button step aside.
 *
 * @example
 * <ProviderOverlays spec={spec} isCompact={false} legendGroups={groups} ... />
 */
export const ProviderOverlays = ({
  spec,
  isCompact,
  legendGroups,
  legendTrigger,
  legendPanel,
  layerControlProps,
  position,
}: {
  spec: VisualizationSpec;
  isCompact: boolean;
  legendGroups: Map<LegendPosition, string[]>;
  legendTrigger: React.ReactNode;
  legendPanel: React.ReactNode;
  layerControlProps: CompactOverlays['layerControlProps'];
  position: LegendPosition;
}) => {
  const { enabled, mode } = useGeoVisMapMode();
  // Mounted only when the spec opts in: its texts go through the app's i18n,
  // which a map without the button must not need.
  const modeControl = enabled ? <GeoVisMapModeControl /> : null;
  if (mode === 'split') return modeControl;
  return (
    <>
      {!isCompact && <PositionedLegends spec={spec} groups={legendGroups} />}
      <ControlBar
        hasControl={spec.control != null}
        legendTrigger={legendTrigger}
        layerControlProps={layerControlProps}
        position={position}
      />
      {legendPanel}
      {modeControl}
      {spec.proximitySearch && (
        <GeoVisProximitySearch config={spec.proximitySearch} />
      )}
    </>
  );
};
