import type {
  AddLayerObject,
  CanvasSourceSpecification,
  GeoJSONSource,
  Map as MapLibreMap,
} from 'maplibre-gl';
import * as React from 'react';

import {
  circleRing,
  destinationPoint,
  metresPerPixel,
} from '../react/proximity.geo';
import { ACCENT, ACCENT_RGB } from './palette';

/** The ids of the sources and layers the searched area is drawn with. */
export const AREA_IDS = {
  source: 'geovis-proximity-area',
  fill: 'geovis-proximity-area-fill',
  outline: 'geovis-proximity-area-outline',
  dashes: 'geovis-proximity-area-dashes',
  sweepSource: 'geovis-proximity-sweep',
  sweep: 'geovis-proximity-sweep',
} as const;

/** How long the circle takes to grow in, in milliseconds. */
const GROW_MS = 450;
/** One turn of the sweep, in milliseconds. */
const SWEEP_MS = 1300;
/** One pulse, from the point out to the radius, in milliseconds. */
const PULSE_MS = 1600;
/** When each of the two pulses starts, in milliseconds. */
const PULSE_DELAYS_MS = [0, 800];
/** The sweep's canvas side, in pixels: sharp enough for a moment's drawing. */
const CANVAS_SIZE = 512;

/** The easing the circle grows and the pulses spread with. */
const easeOut = (t: number) => {
  return 1 - (1 - t) ** 3;
};

type AreaFeature = {
  type: 'Feature';
  properties: { kind: 'area' | 'ring' | 'radius' };
  geometry:
    | { type: 'Polygon'; coordinates: [number, number][][] }
    | { type: 'LineString'; coordinates: [number, number][] };
};

/**
 * The searched area as GeoJSON: the circle of the radius and, once it has
 * grown in, a ring at each smaller radius on offer and the radius line, east
 * from the point.
 */
const areaData = ({
  origin,
  radius,
  radii,
  grown,
}: {
  origin: [number, number];
  radius: number;
  radii: number[];
  grown: number;
}) => {
  const polygon = (kind: 'area' | 'ring', metres: number): AreaFeature => {
    return {
      type: 'Feature',
      properties: { kind },
      geometry: {
        type: 'Polygon',
        coordinates: [circleRing({ origin, metres })],
      },
    };
  };
  const features: AreaFeature[] = [polygon('area', radius * easeOut(grown))];
  if (grown >= 1) {
    for (const ring of radii) {
      if (ring < radius) features.push(polygon('ring', ring));
    }
    features.push({
      type: 'Feature',
      properties: { kind: 'radius' },
      geometry: {
        type: 'LineString',
        coordinates: [
          origin,
          destinationPoint({ origin, metres: radius, bearing: 90 }),
        ],
      },
    });
  }
  return { type: 'FeatureCollection' as const, features };
};

/** The search's own layers, bottom to top. */
const OWN_LAYER_IDS: string[] = [
  AREA_IDS.fill,
  AREA_IDS.outline,
  AREA_IDS.dashes,
  AREA_IDS.sweep,
];

/** The style's layers but the search's own. */
const foreignLayers = (map: MapLibreMap) => {
  return (map.getStyle()?.layers ?? []).filter((layer) => {
    return !OWN_LAYER_IDS.includes(layer.id);
  });
};

/**
 * The layer the area goes beneath: the first `symbol` layer above every layer
 * that draws areas or lines — the basemap's land and roads, and the app's own
 * choropleths and heatmaps, which would otherwise cover the circle — so only
 * the labels and pins above them stay over it. `undefined`, the top of the
 * map, when no symbol layer sits above them.
 *
 * Not simply the style's first `symbol` layer: an app's choropleth is drawn
 * above the basemap's labels, and an area beneath those would be hidden by it.
 */
const areaBeforeId = (map: MapLibreMap) => {
  const layers = foreignLayers(map);
  const lastShape = layers.findLastIndex((layer) => {
    return layer.type !== 'symbol';
  });
  return layers[lastShape + 1]?.id;
};

/**
 * Moves the search's layers back above the app's areas when a layer the app
 * added later — a choropleth, a heatmap — landed over them.
 */
const keepOwnLayersOnTop = (map: MapLibreMap) => {
  const ids = (map.getStyle()?.layers ?? []).map((layer) => {
    return layer.id;
  });
  const lowest = ids.findIndex((id) => {
    return OWN_LAYER_IDS.includes(id);
  });
  if (lowest === -1) return;
  const coveredBy = foreignLayers(map).some((layer) => {
    return layer.type !== 'symbol' && ids.indexOf(layer.id) > lowest;
  });
  if (!coveredBy) return;
  const beforeId = areaBeforeId(map);
  for (const id of OWN_LAYER_IDS) {
    if (map.getLayer(id)) map.moveLayer(id, beforeId);
  }
};

/** The area's layers, bottom to top. */
const AREA_LAYERS: AddLayerObject[] = [
  {
    id: AREA_IDS.fill,
    type: 'fill',
    source: AREA_IDS.source,
    filter: ['!=', ['get', 'kind'], 'radius'],
    paint: {
      'fill-color': ACCENT,
      'fill-opacity': ['match', ['get', 'kind'], 'area', 0.1, 0.07],
    },
  },
  {
    id: AREA_IDS.outline,
    type: 'line',
    source: AREA_IDS.source,
    filter: ['==', ['get', 'kind'], 'area'],
    paint: { 'line-color': ACCENT, 'line-opacity': 0.6, 'line-width': 2 },
  },
  {
    id: AREA_IDS.dashes,
    type: 'line',
    source: AREA_IDS.source,
    filter: ['!=', ['get', 'kind'], 'area'],
    paint: {
      'line-color': ACCENT,
      'line-opacity': 0.72,
      'line-width': 1.5,
      'line-dasharray': [2.5, 2],
    },
  },
];

/** Adds whatever of the area's source and layers the map lacks. */
const ensureAreaLayers = (map: MapLibreMap) => {
  if (!map.getSource(AREA_IDS.source)) {
    map.addSource(AREA_IDS.source, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });
  }
  const beforeId = areaBeforeId(map);
  for (const layer of AREA_LAYERS) {
    if (!map.getLayer(layer.id)) map.addLayer(layer, beforeId);
  }
  keepOwnLayersOnTop(map);
};

/**
 * Runs `add` unless the style is still being parsed — as after a new basemap
 * replaced it — when MapLibre refuses new sources: the next `styledata` event
 * tries again. Not `isStyleLoaded()`, which stays false while tiles load.
 */
const addWhenStyleReady = (add: () => void) => {
  try {
    add();
    return true;
  } catch {
    return false;
  }
};

/** Removes whatever of the area's layers and sources the map holds. */
const removeLayers = (
  map: MapLibreMap,
  layerIds: string[],
  sourceId: string
) => {
  for (const id of layerIds) {
    if (map.getLayer(id)) map.removeLayer(id);
  }
  if (map.getSource(sourceId)) map.removeSource(sourceId);
};

const removeAreaLayers = (map: MapLibreMap) => {
  removeLayers(
    map,
    [AREA_IDS.dashes, AREA_IDS.outline, AREA_IDS.fill],
    AREA_IDS.source
  );
};

/**
 * Draws the searched area on the map itself — a polygon of the radius in
 * metres, with the rings of the smaller radii and the radius line — so it
 * tilts and turns with the map. A new search grows the circle in from the
 * point; another radius redraws it at once. The layers go when the search
 * clears, and come back after a new basemap replaces the style.
 *
 * @param params.origin - The searched point, `[lng, lat]`; `null` while idle.
 * @param params.request - The search's number: a new one grows the circle in.
 */
export const useRadiusArea = ({
  map,
  origin,
  radius,
  radii,
  request,
}: {
  map: MapLibreMap | null;
  origin: [number, number] | null;
  radius: number;
  radii: number[];
  request: number;
}) => {
  // The search last grown in: a widening of it redraws without growing.
  const grownRef = React.useRef<number | null>(null);
  const radiiKey = radii.join(',');
  const lng = origin?.[0];
  const lat = origin?.[1];
  React.useEffect(() => {
    if (!map || lng == null || lat == null) return;
    const at: [number, number] = [lng, lat];
    const rings = radiiKey.split(',').map(Number);
    let frame = 0;
    let grown = grownRef.current === request ? 1 : 0;
    const startedAt = performance.now();
    const draw = () => {
      if (
        !addWhenStyleReady(() => {
          return ensureAreaLayers(map);
        })
      )
        return;
      const data = areaData({ origin: at, radius, radii: rings, grown });
      (map.getSource(AREA_IDS.source) as GeoJSONSource).setData(data);
    };
    const grow = () => {
      grown = Math.min(1, (performance.now() - startedAt) / GROW_MS);
      draw();
      if (grown < 1) frame = requestAnimationFrame(grow);
      else grownRef.current = request;
    };
    if (grown < 1) grow();
    else draw();
    map.on('styledata', draw);
    return () => {
      cancelAnimationFrame(frame);
      map.off('styledata', draw);
    };
  }, [map, lng, lat, radius, radiiKey, request]);

  const searching = origin != null;
  React.useEffect(() => {
    if (!map || !searching) return;
    return () => {
      grownRef.current = null;
      removeAreaLayers(map);
    };
  }, [map, searching]);
};

/**
 * The square around the circle the sweep's canvas covers, as a canvas source
 * takes its corners: top left, top right, bottom right, bottom left.
 */
const sweepCorners = (origin: [number, number], radius: number) => {
  const [, north] = destinationPoint({ origin, metres: radius, bearing: 0 });
  const [east] = destinationPoint({ origin, metres: radius, bearing: 90 });
  const [, south] = destinationPoint({ origin, metres: radius, bearing: 180 });
  const [west] = destinationPoint({ origin, metres: radius, bearing: 270 });
  return [
    [west, north],
    [east, north],
    [east, south],
    [west, south],
  ] as CanvasSourceSpecification['coordinates'];
};

/**
 * One frame of the search under way, on a canvas spanning the circle: the
 * sweep turning around the point and two pulses spreading from it to the
 * radius, each fading as it goes.
 *
 * @param params.elapsed - Milliseconds since the search started.
 * @param params.screenRadius - The circle's radius on screen, in pixels, which
 * keeps the pulses' strokes 2 px wide on screen at any zoom.
 */
const drawSweepFrame = ({
  context,
  elapsed,
  screenRadius,
}: {
  context: CanvasRenderingContext2D;
  elapsed: number;
  screenRadius: number;
}) => {
  const centre = CANVAS_SIZE / 2;
  context.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  if (typeof context.createConicGradient === 'function') {
    // A conic gradient starts east; the CSS one it stands for, north.
    const turn = (elapsed / SWEEP_MS) * 2 * Math.PI - Math.PI / 2;
    const gradient = context.createConicGradient(turn, centre, centre);
    gradient.addColorStop(0, `rgba(${ACCENT_RGB},0)`);
    gradient.addColorStop(0.75, `rgba(${ACCENT_RGB},0)`);
    gradient.addColorStop(1, `rgba(${ACCENT_RGB},0.38)`);
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(centre, centre, centre, 0, 2 * Math.PI);
    context.fill();
  }

  const unitsPerPixel = centre / Math.max(screenRadius, 1);
  context.lineWidth = 2 * unitsPerPixel;
  for (const delay of PULSE_DELAYS_MS) {
    if (elapsed < delay) continue;
    const progress = easeOut(((elapsed - delay) % PULSE_MS) / PULSE_MS);
    const opacity = 0.7 * (1 - progress) * 0.55;
    const r = centre * (0.08 + 0.92 * progress) - context.lineWidth / 2;
    if (r <= 0) continue;
    context.strokeStyle = `rgba(${ACCENT_RGB},${opacity})`;
    context.beginPath();
    context.arc(centre, centre, r, 0, 2 * Math.PI);
    context.stroke();
  }
};

/**
 * While a search awaits its answer, draws the sweep and the pulses on a
 * canvas source laid over the circle, so they tilt and turn with the map as
 * the circle does. Gone once the answer is in.
 *
 * @param params.loading - Whether an answer is awaited.
 */
export const useLoadingSweep = ({
  map,
  origin,
  radius,
  loading,
}: {
  map: MapLibreMap | null;
  origin: [number, number] | null;
  radius: number;
  loading: boolean;
}) => {
  const lng = origin?.[0];
  const lat = origin?.[1];
  React.useEffect(() => {
    if (!map || !loading || lng == null || lat == null) return;
    const at: [number, number] = [lng, lat];
    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
    const context = canvas.getContext('2d');
    const startedAt = performance.now();
    let frame = 0;

    const ensure = () => {
      if (map.getLayer(AREA_IDS.sweep)) {
        keepOwnLayersOnTop(map);
        return;
      }
      addWhenStyleReady(() => {
        if (!map.getSource(AREA_IDS.sweepSource)) {
          map.addSource(AREA_IDS.sweepSource, {
            type: 'canvas',
            canvas,
            coordinates: sweepCorners(at, radius),
            animate: true,
          });
        }
        map.addLayer(
          {
            id: AREA_IDS.sweep,
            type: 'raster',
            source: AREA_IDS.sweepSource,
            paint: { 'raster-fade-duration': 0 },
          },
          areaBeforeId(map)
        );
      });
    };
    const tick = () => {
      ensure();
      if (context) {
        drawSweepFrame({
          context,
          elapsed: performance.now() - startedAt,
          screenRadius: radius / metresPerPixel(at[1], map.getZoom()),
        });
      }
      frame = requestAnimationFrame(tick);
    };
    tick();
    return () => {
      cancelAnimationFrame(frame);
      removeLayers(map, [AREA_IDS.sweep], AREA_IDS.sweepSource);
    };
  }, [map, loading, lng, lat, radius]);
};
