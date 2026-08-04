import type { VisualizationSpec } from '@ttoss/geovis';

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
