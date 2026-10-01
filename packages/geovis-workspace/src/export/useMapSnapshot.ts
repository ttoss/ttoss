import { useGeoVis } from '@ttoss/geovis';
import * as React from 'react';

import { captureMapCanvas, isCapturableMap } from './captureMapCanvas';
import { captureMenu } from './captureMenu';
import type { ExportMenuLayer } from './composeMapImage';

/** A captured frame and the device pixel ratio it was taken at. */
export interface MapSnapshot {
  canvas: HTMLCanvasElement;
  pixelRatio: number;
}

/**
 * Captures the map once, when the dialog opens — and the menu right after, when
 * there is one to capture. Every later change — a toggle, the file name —
 * recomposes from these frames, so the preview and the download are built by
 * the same function from the same pixels.
 *
 * The menu is captured whether or not the reader wants it yet, so turning it on
 * is as instant as turning the legend off. Its failure is kept apart from the
 * map's: a menu that cannot be rendered only matters to someone asking for it.
 *
 * A runtime with no capturable map is known at render time, so it is derived
 * rather than set from the effect.
 *
 * @param params.menuRef - The open sidebar's overlay; omitted when there is none.
 * @returns The map frame, the menu layer, and whether either capture failed.
 *
 * @example
 * const { snapshot, menu } = useMapSnapshot({ menuRef });
 */
export const useMapSnapshot = ({
  menuRef,
}: {
  menuRef?: React.RefObject<HTMLElement | null>;
}) => {
  const { runtime } = useGeoVis();
  const map = runtime?.getAdapter().getNativeInstance();
  const capturable = isCapturableMap(map);

  const [snapshot, setSnapshot] = React.useState<MapSnapshot>();
  const [captureFailed, setCaptureFailed] = React.useState(false);
  const [menu, setMenu] = React.useState<ExportMenuLayer>();
  const [menuFailed, setMenuFailed] = React.useState(false);

  React.useEffect(() => {
    if (!isCapturableMap(map)) return;

    let cancelled = false;

    const run = async () => {
      let pixelRatio: number;

      try {
        const canvas = await captureMapCanvas(map);
        const cssWidth = map.getCanvas().clientWidth;
        pixelRatio = cssWidth > 0 ? canvas.width / cssWidth : 1;
        if (cancelled) return;
        setSnapshot({ canvas, pixelRatio });
      } catch {
        if (!cancelled) setCaptureFailed(true);
        return;
      }

      const menuNode = menuRef?.current;
      if (!menuNode) return;

      try {
        const layer = await captureMenu({
          node: menuNode,
          mapCanvas: map.getCanvas(),
          pixelRatio,
        });
        if (!cancelled) setMenu(layer);
      } catch {
        if (!cancelled) setMenuFailed(true);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [map, menuRef]);

  return {
    snapshot,
    failed: !capturable || captureFailed,
    menu,
    menuFailed,
  };
};
