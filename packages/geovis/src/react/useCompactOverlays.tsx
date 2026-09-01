import * as React from 'react';

import type { LegendPosition, VisualizationSpec } from '../spec/types';
import {
  GeoVisLegendPanel,
  GeoVisLegendTrigger,
} from '../ui/GeoVisLegendControl';
import { useCompactViewport } from '../ui/useCompactViewport';

/** What the provider needs to render the compact control bar and its panels. */
export interface CompactOverlays {
  /** `true` below the compact breakpoint. */
  isCompact: boolean;
  /** Corner the compact bar anchors to — the layer control's, or its default. */
  position: LegendPosition;
  /** Legend button for the control bar, or `null` when the legend keeps floating. */
  legendTrigger: React.ReactNode;
  /** Open legend panel, anchored to the map, or `null` while it is closed. */
  legendPanel: React.ReactNode;
  /**
   * Props spreading onto `<GeoVisLayerControl>`. Empty above the breakpoint, so
   * the roomy layout keeps the control's own state — hover trigger included.
   */
  layerControlProps: {
    expanded?: boolean;
    onExpandedChange?: (expanded: boolean) => void;
  };
}

/**
 * Owns the compact control bar's two panels — the collapsed legend and the
 * layer control's — and the rule that only one of them is open.
 *
 * Both open into the same strip alongside the trigger row, so they would
 * overlap; keeping both flags here is what lets opening either one close the
 * other. It also has to live above the layer control: the legend panel is a
 * sibling anchored to the map, the only way it can pin both horizontal edges and
 * span the full width, so the button and the panel it drives share no parent.
 *
 * Above the breakpoint this reduces to `isCompact: false` with nothing to
 * render and no props to spread — the legend floats as separate cards and the
 * layer control governs itself, exactly as before.
 *
 * @param spec - The committed spec; supplies the control's corner and offset.
 * @param legendGroups - Positioned legend ids grouped by corner, as the roomy
 * layout renders them. The panel stacks every id in spec order, so no group has
 * a corner of its own here; no groups keeps the legend button off the bar.
 * @returns The compact bar's rendered parts and the layer control's props.
 *
 * @example
 * ```tsx
 * const { isCompact, legendTrigger, legendPanel, layerControlProps } =
 *   useCompactOverlays({ spec: committed.spec, legendGroups });
 * return (
 *   <>
 *     <GeoVisLayerControl trailing={legendTrigger} {...layerControlProps} />
 *     {legendPanel}
 *   </>
 * );
 * ```
 */
export const useCompactOverlays = ({
  spec,
  legendGroups,
}: {
  spec: VisualizationSpec;
  legendGroups: Map<LegendPosition, string[]>;
}): CompactOverlays => {
  const isCompact = useCompactViewport();
  const [legendOpen, setLegendOpen] = React.useState(false);
  const [layersOpen, setLayersOpen] = React.useState(false);

  // Every positioned legend, in spec order: the panel stacks them all, so the
  // corners they would otherwise occupy stop mattering here.
  const legendIds = React.useMemo(() => {
    return Array.from(legendGroups.values()).flat();
  }, [legendGroups]);

  // The compact bar anchors to the same corner as the layer control, so the
  // legend button lands beside its trigger rather than in a corner of its own.
  const position = spec.control?.position ?? 'bottom-left';
  const showLegend = isCompact && legendIds.length > 0;

  const legendTrigger = showLegend ? (
    <GeoVisLegendTrigger
      open={legendOpen}
      onToggle={() => {
        setLayersOpen(false);
        setLegendOpen((prev) => {
          return !prev;
        });
      }}
    />
  ) : null;

  const legendPanel =
    showLegend && legendOpen ? (
      <GeoVisLegendPanel
        legendIds={legendIds}
        position={position}
        offset={spec.control?.offset}
      />
    ) : null;

  const layerControlProps = isCompact
    ? {
        expanded: layersOpen,
        onExpandedChange: (next: boolean) => {
          if (next) setLegendOpen(false);
          setLayersOpen(next);
        },
      }
    : {};

  return { isCompact, layerControlProps, legendPanel, legendTrigger, position };
};
