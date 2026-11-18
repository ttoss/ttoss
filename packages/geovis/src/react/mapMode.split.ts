import type { CameraView } from '../runtime/adapter';
import type { ViewState, VisualizationSpec } from '../spec/types';

/** The two sides of a split map: `a` on the left, `b` on the right. */
export type GeoVisSplitSide = 'a' | 'b';

/** The colour that marks each side: its badge, and its ring while active. */
export const SPLIT_SIDE_COLOR: Record<GeoVisSplitSide, string> = {
  a: '#0e9e6e',
  b: '#2f6fe4',
};

/** What one side of the split map shows, built by the app. */
export interface GeoVisSplitSideInput {
  /** The side's own spec: its layers, data, legends, paint and view. */
  spec: VisualizationSpec;
}

/**
 * A split map whose sides the app builds: each side renders the spec the app
 * gives it — its own data, legends, paint and camera angles — rather than the
 * provider's spec. The pills still choose which `control` item each side
 * shows, now on that side's own spec. Passed to `<GeoVisProvider split>`; the
 * reader still enters and leaves the split with the "Modo do mapa" button,
 * which `spec.mapModeControl` switches on.
 *
 * @example
 * <GeoVisProvider
 *   spec={specA}
 *   split={{ sides: { a: { spec: specA }, b: { spec: specB } } }}
 * />
 */
export interface GeoVisSplitInput {
  sides: Record<GeoVisSplitSide, GeoVisSplitSideInput>;
}

type CameraFields = Pick<CameraView, 'center' | 'zoom' | 'pitch' | 'bearing'>;

const sameCenter = (a: ViewState['center'], b: ViewState['center']) => {
  return a?.[0] === b?.[0] && a?.[1] === b?.[1];
};

/**
 * The camera fields the app changed in `spec.view` from one spec to the next.
 * A split side opens on the reader's camera, so a field the app did not touch
 * stays where the reader left it, and one it changed — a tilt, a rotation —
 * still reaches the map.
 *
 * @param previous - `spec.view` of the spec the side was last built from.
 * @param next - `spec.view` of the spec it is built from now.
 * @returns The changed fields, empty when nothing changed or on the first build.
 *
 * @example
 * changedViewFields({ pitch: 0, zoom: 10 }, { pitch: 45, zoom: 10 }); // { pitch: 45 }
 */
export const changedViewFields = (
  previous: ViewState | undefined | null,
  next: ViewState | undefined
): Partial<CameraFields> => {
  if (previous === null || previous === next) return {};
  const before = previous ?? {};
  const after = next ?? {};
  const changes: Partial<CameraFields> = {};
  if (after.center && !sameCenter(before.center, after.center)) {
    changes.center = after.center;
  }
  for (const key of ['zoom', 'pitch', 'bearing'] as const) {
    const value = after[key];
    if (value !== undefined && value !== before[key]) changes[key] = value;
  }
  return changes;
};
