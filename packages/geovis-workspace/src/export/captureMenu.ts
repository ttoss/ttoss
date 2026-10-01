import { toCanvas } from 'html-to-image';

import type { ExportMenuLayer } from './composeMapImage';

/**
 * Renders the left sidebar into a canvas and places it over the map frame.
 *
 * The map is a WebGL canvas, but the sidebar is DOM, so it cannot be copied the
 * same way: `html-to-image` serializes the node, its computed styles and its
 * fonts into an SVG and paints that. The offset is measured against the map
 * canvas rather than the workspace, so the menu lands where it sat over the map
 * whatever the two elements' own positions are.
 *
 * @param params.node - The sidebar overlay (the card and its inset).
 * @param params.mapCanvas - The map's canvas, the frame's coordinate origin.
 * @param params.pixelRatio - Device pixels per CSS pixel of the map frame.
 * @returns The menu canvas and its position in the frame's device pixels.
 *
 * @example
 * const menu = await captureMenu({ node, mapCanvas, pixelRatio: 2 });
 */
export const captureMenu = async ({
  node,
  mapCanvas,
  pixelRatio,
}: {
  node: HTMLElement;
  mapCanvas: HTMLCanvasElement;
  pixelRatio: number;
}): Promise<ExportMenuLayer> => {
  const nodeRect = node.getBoundingClientRect();
  const mapRect = mapCanvas.getBoundingClientRect();

  const canvas = await toCanvas(node, { pixelRatio });

  return {
    canvas,
    x: (nodeRect.left - mapRect.left) * pixelRatio,
    y: (nodeRect.top - mapRect.top) * pixelRatio,
  };
};
