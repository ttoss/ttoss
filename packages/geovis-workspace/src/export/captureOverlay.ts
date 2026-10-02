import { toCanvas } from 'html-to-image';

import type { ExportOverlay } from './composeMapImage';

/** Marks the element that holds a workspace, the scope legends are found in. */
export const WORKSPACE_ROOT_ATTRIBUTE = 'data-geovis-workspace';

/**
 * The legend cards on screen in the workspace around `node`: every element
 * `@ttoss/geovis` tags with `data-geovis-legend`. A legend that is not shown —
 * folded behind the compact legend button, say — is not mounted, so it is not
 * found either: the export carries the legends the reader sees.
 *
 * @param node - Any element inside the workspace (the export dialog), or
 *   `null` before it is mounted.
 * @returns The legend cards, in document order; empty outside a workspace.
 *
 * @example
 * findLegendCards(dialog); // [<div data-geovis-legend="rate">]
 */
export const findLegendCards = (node: Element | null): HTMLElement[] => {
  const root = node?.closest(`[${WORKSPACE_ROOT_ATTRIBUTE}]`);

  if (!root) return [];

  return Array.from(root.querySelectorAll<HTMLElement>('[data-geovis-legend]'));
};

/**
 * The layer control in the workspace around `node` — the map's layers button,
 * tagged by `@ttoss/geovis` with `data-geovis-layer-control`. It is mounted
 * only when the spec declares a `control`, so a map without one has nothing
 * to find.
 *
 * @param node - Any element inside the workspace (the export dialog), or
 *   `null` before it is mounted.
 * @returns The control's root; `null` without one or outside a workspace.
 *
 * @example
 * findLayerControl(dialog); // <div data-geovis-layer-control>
 */
export const findLayerControl = (node: Element | null): HTMLElement | null => {
  return (
    node
      ?.closest(`[${WORKSPACE_ROOT_ATTRIBUTE}]`)
      ?.querySelector<HTMLElement>('[data-geovis-layer-control]') ?? null
  );
};

/**
 * Room, in CSS pixels, left around each overlay in its image for what paints
 * past its box: the layer control's count badge, which pokes out of the
 * button's corner, and the cards' drop shadows — the largest, the legend's, is
 * a 24px blur. `html-to-image` draws only what falls inside the image, so
 * without it they come out cut off.
 */
export const OVERLAY_BLEED = 24;

/**
 * Style overrides that pin the clone inside its own image, `OVERLAY_BLEED` in
 * from the top-left.
 *
 * `html-to-image` copies every computed style onto the clone and renders it in
 * a box the image's size. An overlay anchored by `right`/`bottom` — a legend
 * card pushed clear of a sidebar — would carry those offsets into that box and
 * land outside it, leaving the image blank. Its size is fixed at the measured
 * one, so an overlay sized by its offsets (`top: 0; bottom: 0`) keeps it.
 */
const pinInsideBleed = (rect: DOMRect): Partial<CSSStyleDeclaration> => {
  return {
    position: 'absolute',
    top: `${OVERLAY_BLEED}px`,
    left: `${OVERLAY_BLEED}px`,
    right: 'auto',
    bottom: 'auto',
    margin: '0',
    transform: 'none',
    width: `${rect.width}px`,
    height: `${rect.height}px`,
  };
};

/**
 * Renders a piece of DOM over the map — the left sidebar, a legend card — into
 * a canvas, placed where it sits over the map frame.
 *
 * The map is a WebGL canvas, but the overlays are DOM, so they cannot be copied
 * the same way: `html-to-image` serializes the node, its computed styles and its
 * fonts into an SVG and paints that. The image is the node's box grown by
 * {@link OVERLAY_BLEED} on every side, so a badge or shadow past the box is
 * kept; the position accounts for it. The offset is measured against the map
 * canvas rather than the workspace, so the overlay lands where it sat over the
 * map whatever the two elements' own positions are.
 *
 * @param params.node - The overlay's element.
 * @param params.mapCanvas - The map's canvas, the frame's coordinate origin.
 * @param params.pixelRatio - Device pixels per CSS pixel of the map frame.
 * @returns The overlay's canvas and its position in the frame's device pixels.
 *
 * @example
 * const menu = await captureOverlay({ node, mapCanvas, pixelRatio: 2 });
 */
export const captureOverlay = async ({
  node,
  mapCanvas,
  pixelRatio,
}: {
  node: HTMLElement;
  mapCanvas: HTMLCanvasElement;
  pixelRatio: number;
}): Promise<ExportOverlay> => {
  const nodeRect = node.getBoundingClientRect();
  const mapRect = mapCanvas.getBoundingClientRect();

  const canvas = await toCanvas(node, {
    pixelRatio,
    width: nodeRect.width + OVERLAY_BLEED * 2,
    height: nodeRect.height + OVERLAY_BLEED * 2,
    style: pinInsideBleed(nodeRect),
  });

  return {
    canvas,
    x: (nodeRect.left - mapRect.left - OVERLAY_BLEED) * pixelRatio,
    y: (nodeRect.top - mapRect.top - OVERLAY_BLEED) * pixelRatio,
  };
};
