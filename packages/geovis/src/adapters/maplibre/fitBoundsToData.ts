import type maplibregl from 'maplibre-gl';

import { estimateMaxZoom } from '../../spec/bounds';
import type { GeoJSONBoundingBox } from '../../spec/types';

const RESPONSIVE_PADDING_RATIO = 0.06;

interface FitPadding {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/** 6% of the container's own dimensions per side — scales with viewport size. */
export const computeResponsivePadding = (container: {
  clientWidth: number;
  clientHeight: number;
}): FitPadding => {
  return {
    top: Math.round(container.clientHeight * RESPONSIVE_PADDING_RATIO),
    bottom: Math.round(container.clientHeight * RESPONSIVE_PADDING_RATIO),
    left: Math.round(container.clientWidth * RESPONSIVE_PADDING_RATIO),
    right: Math.round(container.clientWidth * RESPONSIVE_PADDING_RATIO),
  };
};

const toLngLatBounds = (
  bbox: GeoJSONBoundingBox
): [[number, number], [number, number]] => {
  return [
    [bbox[0], bbox[1]],
    [bbox[2], bbox[3]],
  ];
};

/**
 * Wires automatic "fit to data" behaviour onto a live MapLibre map: fits the
 * camera to `bbox` (animated) once the map reports `idle`, then keeps it
 * fitted — instantly, no animation — whenever the container is resized.
 *
 * Guards against the container-not-yet-laid-out race: MapLibre can fire
 * `idle` before the browser has run its first CSS layout pass on the
 * parent container, in which case `clientWidth`/`clientHeight` are both 0.
 * Calling `fitBounds` at that point computes a projection with a 0-px
 * viewport, corrupting the camera. The guard skips the fit in that case and
 * relies on the `ResizeObserver` callback (which already only runs once the
 * container has real dimensions) to perform the eventual correct fit.
 *
 * Returns a cleanup function that detaches every listener it registered.
 */
export const attachFitToData = (
  map: maplibregl.Map,
  bbox: GeoJSONBoundingBox
): (() => void) => {
  let initialFitDone = false;

  const apply = (animate: boolean): void => {
    const container = map.getContainer();
    if (container.clientWidth === 0 || container.clientHeight === 0) {
      if (animate) initialFitDone = true;
      return;
    }
    map.resize();
    map.fitBounds(toLngLatBounds(bbox), {
      padding: computeResponsivePadding(container),
      animate,
      maxZoom: estimateMaxZoom(bbox),
      ...(animate ? {} : { duration: 0 }),
    });
    if (animate) {
      map.once('moveend', () => {
        initialFitDone = true;
      });
    } else {
      initialFitDone = true;
    }
  };

  const applyAnimated = () => {
    apply(true);
  };

  /**
   * Refit on container resize — instant, so the user's Storybook/app-panel
   * resize doesn't retrigger the flyTo animation on every frame. Skipped
   * until the initial animated fit completes, so the ResizeObserver's first
   * callback (which fires shortly after mount, before MapLibre's `idle`)
   * doesn't pre-empt the animated fit.
   */
  const applyOnResize = (entries: ResizeObserverEntry[]): void => {
    if (!initialFitDone) return;
    const rect = entries[0]?.contentRect;
    if (!rect || rect.width === 0 || rect.height === 0) return;
    apply(false);
  };

  map.once('idle', applyAnimated);

  // When `idle` already fired before this was called (e.g. the bbox arrived
  // after the map settled), `once('idle', ...)` would wait indefinitely.
  if (map.loaded()) {
    map.off('idle', applyAnimated);
    applyAnimated();
  }

  // `ResizeObserver` is a browser API — absent in non-DOM test/SSR environments.
  const observer =
    typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(applyOnResize);
  observer?.observe(map.getContainer());

  return () => {
    map.off('idle', applyAnimated);
    observer?.disconnect();
  };
};
