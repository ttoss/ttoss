import type { LegendSpec, VisualizationSpec } from '@ttoss/geovis';

/**
 * Horizontal clearance, in pixels, the map's layer control needs so it sits
 * just past the open left sidebar instead of being covered by it. Sized to the
 * sidebar card's footprint on larger screens (its `300px` width plus the
 * overlay inset) with a small gap, matching `LeftSidebar`'s layout.
 */
export const LEFT_SIDEBAR_CONTROL_CLEARANCE = 332;

/**
 * Returns `visualizationSpec` with the map's layer control pushed clear of the
 * left sidebar while it is open, so an opening sidebar never covers the
 * control. The shift is purely horizontal: `control.offset.x` becomes
 * {@link LEFT_SIDEBAR_CONTROL_CLEARANCE} while the control's original vertical
 * distance is preserved, so a `bottom-left` control slides right along the
 * bottom edge rather than lifting off it.
 *
 * The spec is returned untouched (same reference) when there is nothing to
 * adjust — no `control`, the sidebar is closed, or the control is anchored to a
 * right corner the left sidebar never overlaps — so `GeoVisProvider` sees a
 * stable spec and does not re-sync needlessly.
 */
export const applyLeftSidebarControlOffset = ({
  spec,
  leftSidebarOpen,
}: {
  spec: VisualizationSpec;
  leftSidebarOpen: boolean;
}): VisualizationSpec => {
  const control = spec.control;

  if (!control || !leftSidebarOpen) return spec;

  // Only a left-anchored control is ever covered by the left sidebar; the
  // control defaults to `bottom-left` when no position is set.
  const position = control.position ?? 'bottom-left';
  if (!position.endsWith('left')) return spec;

  const { offset } = control;
  const y = typeof offset === 'number' ? offset : offset?.y;

  return {
    ...spec,
    control: {
      ...control,
      offset: {
        x: LEFT_SIDEBAR_CONTROL_CLEARANCE,
        ...(y == null ? {} : { y }),
      },
    },
  };
};

/**
 * Vertical clearance, in pixels, the map's layer control needs so it sits above
 * the compact timeline HUD instead of under it. Sized to the bar's own
 * footprint: its `14px` bottom inset plus its height (`6px` of padding either
 * side of the `44px` controls) plus a gap.
 */
export const TIMELINE_HUD_CONTROL_CLEARANCE = 78;

/**
 * Returns `spec` with the map's layer control lifted clear of the compact
 * timeline HUD while it is showing. The shift is purely vertical:
 * `control.offset.y` becomes {@link TIMELINE_HUD_CONTROL_CLEARANCE} while any
 * horizontal offset is preserved, so this composes with
 * {@link applyLeftSidebarControlOffset} instead of fighting it.
 *
 * Lifting the control is enough to move the compact legend panel with it: GeoVis
 * derives that panel's anchor from the control's own gap, so both rise together.
 *
 * The spec is returned untouched (same reference) when there is nothing to
 * adjust — no `control`, no HUD showing, or a top-anchored control the bar never
 * reaches — so `GeoVisProvider` sees a stable spec and does not re-sync
 * needlessly.
 */
export const applyTimelineHudControlOffset = ({
  spec,
  hudVisible,
}: {
  spec: VisualizationSpec;
  hudVisible: boolean;
}): VisualizationSpec => {
  const control = spec.control;

  if (!control || !hudVisible) return spec;

  // The bar spans the bottom edge, so only a bottom-anchored control is ever
  // under it; the control defaults to `bottom-left` when no position is set.
  const position = control.position ?? 'bottom-left';
  if (!position.startsWith('bottom')) return spec;

  const { offset } = control;
  const x = typeof offset === 'number' ? offset : offset?.x;

  return {
    ...spec,
    control: {
      ...control,
      offset: {
        ...(x == null ? {} : { x }),
        y: TIMELINE_HUD_CONTROL_CLEARANCE,
      },
    },
  };
};

/**
 * Horizontal clearance, in pixels, a right-anchored legend needs so it sits
 * just past the open right sidebar instead of being covered by it. Sized to the
 * sidebar card's footprint (its width plus the overlay inset), matching
 * {@link LEFT_SIDEBAR_CONTROL_CLEARANCE}.
 */
export const RIGHT_SIDEBAR_LEGEND_CLEARANCE = 332;

/**
 * Pushes a right-anchored legend clear of the right sidebar by setting its
 * `offset.x` to {@link RIGHT_SIDEBAR_LEGEND_CLEARANCE}, preserving any original
 * vertical offset. Returns the legend untouched (same reference) when it is not
 * anchored to a right corner the right sidebar overlaps.
 */
const pushLegendClearOfRightSidebar = (legend: LegendSpec): LegendSpec => {
  const position = legend.position;
  if (!position || !position.endsWith('right')) return legend;

  const { offset } = legend;
  const y = typeof offset === 'number' ? offset : offset?.y;

  return {
    ...legend,
    offset: {
      x: RIGHT_SIDEBAR_LEGEND_CLEARANCE,
      ...(y == null ? {} : { y }),
    },
  };
};

/**
 * Returns `visualizationSpec` with every right-anchored legend (top-level or
 * per-layer) pushed clear of the right sidebar while it is open, so an opening
 * sidebar never covers the legend. The shift is purely horizontal, mirroring
 * {@link applyLeftSidebarControlOffset}.
 *
 * The spec is returned untouched (same reference) when there is nothing to
 * adjust — the sidebar is closed, or no legend is anchored to a right corner —
 * so `GeoVisProvider` sees a stable spec and does not re-sync needlessly.
 */
export const applyRightSidebarLegendOffset = ({
  spec,
  rightSidebarOpen,
}: {
  spec: VisualizationSpec;
  rightSidebarOpen: boolean;
}): VisualizationSpec => {
  if (!rightSidebarOpen) return spec;

  let changed = false;

  // Returns the same array reference when no legend needs shifting, so a spec
  // with no right-anchored legends stays referentially stable.
  const mapLegends = (
    legends: LegendSpec[] | undefined
  ): LegendSpec[] | undefined => {
    if (!legends) return legends;
    let localChanged = false;
    const next = legends.map((legend) => {
      const shifted = pushLegendClearOfRightSidebar(legend);
      if (shifted !== legend) localChanged = true;
      return shifted;
    });
    if (!localChanged) return legends;
    changed = true;
    return next;
  };

  const nextLegends = mapLegends(spec.legends);
  const nextLayers = spec.layers.map((layer) => {
    const legends = mapLegends(layer.legends);
    return legends === layer.legends ? layer : { ...layer, legends };
  });

  if (!changed) return spec;

  return {
    ...spec,
    ...(nextLegends ? { legends: nextLegends } : {}),
    layers: nextLayers,
  };
};
