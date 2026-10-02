import { useGeoVis } from '@ttoss/geovis';
import * as React from 'react';

import {
  type CapturableMap,
  captureMapCanvas,
  isCapturableMap,
} from './captureMapCanvas';
import { captureOverlay } from './captureOverlay';
import type { ExportOverlay } from './composeMapImage';
import { waitForPaint } from './waitForPaint';

/** A promise's outcome, so a failure can be told apart without a `try`. */
const settle = async <T>(
  promise: Promise<T>
): Promise<{ ok: true; value: T } | { ok: false }> => {
  try {
    return { ok: true, value: await promise };
  } catch {
    return { ok: false };
  }
};

/**
 * Captures the map's frame and the device pixel ratio it was taken at — the
 * canvas's pixels per CSS pixel, or `1` when it has no layout width to read.
 */
const captureFrame = async (map: CapturableMap) => {
  const canvas = await captureMapCanvas(map);
  const cssWidth = map.getCanvas().clientWidth;

  return { canvas, pixelRatio: cssWidth > 0 ? canvas.width / cssWidth : 1 };
};

/**
 * A captured frame, the device pixel ratio it was taken at, and the legend
 * cards captured with it — empty when there are none, or when they could not be
 * rendered.
 */
export interface MapSnapshot {
  canvas: HTMLCanvasElement;
  pixelRatio: number;
  legends: ExportOverlay[];
}

/** Captures every node, in order; rejects when any of them cannot be rendered. */
const captureAll = ({
  nodes,
  mapCanvas,
  pixelRatio,
}: {
  nodes: HTMLElement[];
  mapCanvas: HTMLCanvasElement;
  pixelRatio: number;
}): Promise<ExportOverlay[]> => {
  return Promise.all(
    nodes.map((node) => {
      return captureOverlay({ node, mapCanvas, pixelRatio });
    })
  );
};

/**
 * Captures the map once, when the dialog opens, with the legend cards on
 * screen — and the menu right after, when there is one to capture: the sidebar
 * and, when the map has one, the layer control, which the menu toggle carries
 * together. The legends
 * are captured from the page, as the reader sees them, rather than redrawn: a
 * copy drawn by hand would drift from `GeoVisLegend` with its every change. The
 * snapshot is held until they are in, so the first preview already carries
 * them. The capture waits for the dialog's first paint: it
 * re-renders the map and serializes the sidebar on the main thread, and started
 * straight from the click it would hold the dialog off screen until it was
 * done. Every later change — a toggle, the file name —
 * recomposes from these frames, so the preview and the download are built by
 * the same function from the same pixels.
 *
 * The menu is captured whether or not the reader wants it yet, so turning it on
 * is as instant as turning the legend off. Its failure is kept apart from the
 * map's: a menu that cannot be rendered only matters to someone asking for it.
 * The same goes for the legends.
 *
 * A runtime with no capturable map is known at render time, so it is derived
 * rather than set from the effect. So is the frame's size: the capture copies
 * the map canvas pixel for pixel, so `frameSize` is the size the snapshot will
 * have, there before the snapshot so the preview can be held at it.
 *
 * @param params.menuRef - The open sidebar's overlay; omitted when there is none.
 * @param params.legendCards - The legend cards to capture; `undefined` until
 *   they have been looked up, which holds the capture back.
 * @param params.layerControl - The map's layer control, captured with the
 *   menu; omitted when there is none.
 * @returns The map frame and its expected size, the menu's layers (sidebar
 *   first, layer control on top), and whether any capture failed.
 *
 * @example
 * const { snapshot, menu } = useMapSnapshot({ menuRef, legendCards });
 */
export const useMapSnapshot = ({
  menuRef,
  legendCards,
  layerControl,
}: {
  menuRef?: React.RefObject<HTMLElement | null>;
  legendCards?: HTMLElement[];
  layerControl?: HTMLElement | null;
}) => {
  const { runtime } = useGeoVis();
  const map = runtime?.getAdapter().getNativeInstance();
  const capturable = isCapturableMap(map);
  const mapCanvas = capturable ? map.getCanvas() : undefined;
  const frameSize = mapCanvas
    ? { width: mapCanvas.width, height: mapCanvas.height }
    : undefined;

  const [snapshot, setSnapshot] = React.useState<MapSnapshot>();
  const [captureFailed, setCaptureFailed] = React.useState(false);
  const [legendsFailed, setLegendsFailed] = React.useState(false);
  const [menu, setMenu] = React.useState<ExportOverlay[]>();
  const [menuFailed, setMenuFailed] = React.useState(false);

  React.useEffect(() => {
    if (!isCapturableMap(map) || !legendCards) return;

    let cancelled = false;

    const captureMenu = async (pixelRatio: number) => {
      const menuNode = menuRef?.current;
      if (!menuNode) return;

      const layers = await settle(
        captureAll({
          nodes: layerControl ? [menuNode, layerControl] : [menuNode],
          mapCanvas: map.getCanvas(),
          pixelRatio,
        })
      );
      if (cancelled) return;

      if (layers.ok) setMenu(layers.value);
      else setMenuFailed(true);
    };

    const run = async () => {
      await waitForPaint();
      if (cancelled) return;

      const frame = await settle(captureFrame(map));
      // Closed while the frame was on its way: nothing to report, and the
      // legends would be rendered for nothing.
      if (cancelled) return;
      if (!frame.ok) {
        setCaptureFailed(true);
        return;
      }

      const { canvas, pixelRatio } = frame.value;
      const legends = await settle(
        captureAll({
          nodes: legendCards,
          mapCanvas: map.getCanvas(),
          pixelRatio,
        })
      );
      if (cancelled) return;

      if (!legends.ok) setLegendsFailed(true);
      setSnapshot({
        canvas,
        pixelRatio,
        legends: legends.ok ? legends.value : [],
      });

      await captureMenu(pixelRatio);
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [map, menuRef, legendCards, layerControl]);

  return {
    snapshot,
    frameSize,
    failed: !capturable || captureFailed,
    legendsFailed,
    menu,
    menuFailed,
  };
};
