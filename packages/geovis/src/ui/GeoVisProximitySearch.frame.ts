import { useGeoVis } from '../react/contexts';
import type { CircleFrame } from '../react/proximity';
import type { ProximitySearch } from '../spec/types.proximity';

/** Below this map width the search draws itself compact, its bar without the counts by kind. */
export const COMPACT_WIDTH = 480;

/** Room kept above and below the circle: the bar under it, and a margin. */
const ROOM_VERTICAL = 64;
/** Room kept on each side of the circle. */
const ROOM_HORIZONTAL = 24;
/** The smallest circle a fill frame draws, so a cramped map still shows one. */
const MIN_FILL_PIXELS = 80;

/**
 * The compact circle's radius on screen: as large as the map allows, between
 * 110 and 150 px — 110 on a compact map.
 */
const compactPixels = (width: number) => {
  const largest = width < COMPACT_WIDTH ? 110 : 150;
  return Math.max(110, Math.min(largest, Math.floor(width / 2) - 30));
};

/**
 * How the camera frames a search on this map: the circle's radius on screen
 * and its centre, both fitted to the map's free area — the map less the
 * spec's `viewInsets`, the panels the app opened over it.
 *
 * With `frame: 'fill'` (the default) the circle fills most of that area,
 * keeping room for the bar under it; with `'compact'` it stays 110–150 px.
 * Either way its centre is the free area's, not the map's.
 *
 * @param params.width - The map's width, in pixels.
 * @param params.height - The map's height, in pixels.
 *
 * @example
 * // A 1200 × 800 map with a 320 px panel on the right:
 * useCircleFrame({ config, width: 1200, height: 800 });
 * // { pixels: 336, offset: [-160, 0] }
 */
export const useCircleFrame = ({
  config,
  width,
  height,
}: {
  config: ProximitySearch;
  width: number;
  height: number;
}): CircleFrame => {
  const { spec } = useGeoVis();
  const { top = 0, right = 0, bottom = 0, left = 0 } = spec.viewInsets ?? {};
  const freeWidth = Math.max(0, width - left - right);
  const freeHeight = Math.max(0, height - top - bottom);
  const offset: [number, number] = [(left - right) / 2, (top - bottom) / 2];
  if (config.frame === 'compact') {
    return { pixels: compactPixels(freeWidth), offset };
  }
  const pixels = Math.floor(
    Math.min(freeWidth / 2 - ROOM_HORIZONTAL, freeHeight / 2 - ROOM_VERTICAL)
  );
  return { pixels: Math.max(MIN_FILL_PIXELS, pixels), offset };
};
