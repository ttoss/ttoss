import 'maplibre-gl/dist/maplibre-gl.css';

import maplibregl from 'maplibre-gl';

import type {
  CapabilitySet,
  EngineAdapter,
  MountedView,
  SpecPatch,
} from '../../runtime/adapter';
import type {
  CirclePaint,
  ColorBy,
  FillPaint,
  GeoJSONFeature,
  GeoJSONFeatureCollection,
  GeoJSONGeometry,
  GeoVisDataEntry,
  GeoVisGeometryType,
  HeatmapPaint,
  LinePaint,
  QuantitativeColorBy,
  RasterPaint,
  SymbolPaint,
  VisualizationLayer,
  VisualizationSpec,
} from '../../spec/types';

/** Default MapLibre basemap style URL used when the spec omits `basemap.styleUrl`. */
export const DEFAULT_BASEMAP_STYLE =
  'https://tiles.openfreemap.org/styles/bright';

/** Empty MapLibre style used when `basemap.none` is true — no background tiles. */
const EMPTY_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {},
  layers: [],
};

const resolveStyle = (
  spec: VisualizationSpec
): string | maplibregl.StyleSpecification => {
  if (spec.basemap?.none) return EMPTY_STYLE;
  return spec.basemap?.styleUrl ?? DEFAULT_BASEMAP_STYLE;
};

const DEFAULT_PALETTE = ['#eff3ff', '#bdd7e7', '#6baed6', '#3182bd', '#08519c'];

const NAMED_PALETTES: Record<string, string[]> = {
  Blues: DEFAULT_PALETTE,
};

const resolvePalette = (colorBy: ColorBy): string[] => {
  if (colorBy.colors && colorBy.colors.length > 0) {
    return colorBy.colors;
  }
  if (colorBy.palette && NAMED_PALETTES[colorBy.palette]) {
    return NAMED_PALETTES[colorBy.palette];
  }
  return DEFAULT_PALETTE;
};

const getInlineFeatures = (entry: GeoVisDataEntry): GeoJSONFeature[] | null => {
  if (entry.kind !== 'geojson-inline') {
    return null;
  }

  if (entry.geojson.type === 'FeatureCollection') {
    return entry.geojson.features;
  }

  if (entry.geojson.type === 'Feature') {
    return [entry.geojson];
  }

  return null;
};

const toFiniteNumber = (value: unknown): number | null => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const computeQuantileBreaks = (values: number[], bins: number): number[] => {
  if (values.length === 0 || bins <= 1) {
    return [];
  }

  const sorted = values.slice().sort((a, b) => {
    return a - b;
  });

  const breaks: number[] = [];
  for (let i = 1; i < bins; i++) {
    const index = Math.floor((i / bins) * sorted.length);
    breaks.push(sorted[Math.min(index, sorted.length - 1)]);
  }
  return breaks;
};

const buildQuantitativeExpression = (
  colorBy: QuantitativeColorBy,
  features: GeoJSONFeature[]
): unknown[] | null => {
  const property = colorBy.property;
  const values = features
    .map((feature) => {
      return toFiniteNumber(feature.properties?.[property]);
    })
    .filter((value): value is number => {
      return value !== null;
    });

  if (values.length === 0) {
    return null;
  }

  const palette = resolvePalette(colorBy);
  const defaultColor = colorBy.defaultColor ?? palette[0];

  let thresholds: number[] = [];
  if (colorBy.scale === 'threshold' && colorBy.thresholds?.length) {
    thresholds = colorBy.thresholds;
  } else if (colorBy.scale === 'quantile') {
    const bins = Math.max(2, colorBy.bins ?? palette.length);
    thresholds = computeQuantileBreaks(values, bins);
  } else {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const bins = Math.max(2, colorBy.bins ?? palette.length);
    if (max > min) {
      const step = (max - min) / bins;
      thresholds = Array.from({ length: bins - 1 }, (_, index) => {
        return min + step * (index + 1);
      });
    }
  }

  const expression: unknown[] = [
    'step',
    ['to-number', ['get', property]],
    defaultColor,
  ];

  for (let i = 0; i < thresholds.length; i++) {
    const color = palette[Math.min(i + 1, palette.length - 1)] ?? defaultColor;
    expression.push(thresholds[i], color);
  }

  return expression;
};

const buildCategoricalExpression = (
  colorBy: Extract<ColorBy, { type: 'categorical' }>,
  features: GeoJSONFeature[]
): unknown[] => {
  const palette = resolvePalette(colorBy);
  const explicit = colorBy.mapping ?? {};
  const defaultColor = colorBy.defaultColor ?? palette[0];
  const values = new Set<string>();

  for (const feature of features) {
    const raw = feature.properties?.[colorBy.property];
    if (raw == null) continue;
    values.add(String(raw));
  }

  const expression: unknown[] = [
    'match',
    ['to-string', ['get', colorBy.property]],
  ];

  let colorIndex = 0;
  for (const value of values) {
    const color =
      explicit[value] ?? palette[colorIndex % palette.length] ?? defaultColor;
    expression.push(value, color);
    if (!explicit[value]) {
      colorIndex += 1;
    }
  }

  expression.push(defaultColor);
  return expression;
};

const getColorByExpression = (
  layer: VisualizationLayer,
  entry: GeoVisDataEntry
): unknown[] | null => {
  if (!layer.colorBy) {
    return null;
  }

  const features = getInlineFeatures(entry);
  if (!features) {
    return null;
  }

  if (layer.colorBy.type === 'quantitative') {
    return buildQuantitativeExpression(layer.colorBy, features);
  }

  return buildCategoricalExpression(layer.colorBy, features);
};

const applyColorByDefaults = (
  layer: VisualizationLayer,
  entry: GeoVisDataEntry,
  desiredLayer: maplibregl.LayerSpecification
) => {
  const colorByExpression = getColorByExpression(layer, entry);
  if (!colorByExpression) {
    return;
  }

  const paint = ((desiredLayer as { paint?: Record<string, unknown> }).paint ??
    {}) as Record<string, unknown>;

  const explicitPaint = (layer.paint ?? {}) as Record<string, unknown>;

  if (
    layer.geometry === 'polygon' &&
    explicitPaint['fillColor'] === undefined
  ) {
    paint['fill-color'] = colorByExpression;
  }

  if (layer.geometry === 'line' && explicitPaint['lineColor'] === undefined) {
    paint['line-color'] = colorByExpression;
  }

  if (
    layer.geometry === 'point' &&
    explicitPaint['circleColor'] === undefined
  ) {
    paint['circle-color'] = colorByExpression;
  }

  (desiredLayer as { paint?: Record<string, unknown> }).paint = paint;
};

// Maps spec-level camelCase paint keys to MapLibre kebab-case paint properties.
// lineColor is geometry-dependent: polygon uses fill-outline-color, line uses line-color.
const specPaintKeyToMaplibre = (
  key: string,
  geometry: GeoVisGeometryType
): string | undefined => {
  const map: Record<
    string,
    string | ((g: GeoVisGeometryType) => string | undefined)
  > = {
    fillColor: 'fill-color',
    fillOpacity: 'fill-opacity',
    lineColor: (g) => {
      return g === 'polygon' ? 'fill-outline-color' : 'line-color';
    },
    lineWidth: (g) => {
      // line-width is not a valid paint property for fill layers (polygon).
      return g === 'polygon' ? undefined : 'line-width';
    },
    lineOpacity: 'line-opacity',
    lineDasharray: 'line-dasharray',
    circleColor: 'circle-color',
    circleRadius: 'circle-radius',
    circleOpacity: 'circle-opacity',
    circleStrokeColor: 'circle-stroke-color',
    circleStrokeWidth: 'circle-stroke-width',
    rasterOpacity: 'raster-opacity',
    heatmapRadius: 'heatmap-radius',
    heatmapOpacity: 'heatmap-opacity',
    heatmapIntensity: 'heatmap-intensity',
    heatmapWeight: 'heatmap-weight',
    textColor: 'text-color',
    textOpacity: 'text-opacity',
    textHaloColor: 'text-halo-color',
    textHaloWidth: 'text-halo-width',
    iconColor: 'icon-color',
    iconOpacity: 'icon-opacity',
  };
  const entry = map[key];
  if (!entry) return undefined;
  return typeof entry === 'function' ? entry(geometry) : entry;
};

// Data entry translation

type MaplibreSourceSpec = maplibregl.SourceSpecification;

/**
 * Translates a `GeoVisDataEntry` into a MapLibre source specification.
 * For `kind: 'native'` entries targeting maplibre, the `spec` field is
 * passed through verbatim — no validation is performed.
 */
export const translateGeoVisData = (
  entry: GeoVisDataEntry
): MaplibreSourceSpec => {
  switch (entry.kind) {
    case 'geojson-inline':
      return {
        type: 'geojson',
        data: entry.geojson as maplibregl.GeoJSONSourceSpecification['data'],
        attribution: entry.attribution,
      };
    case 'geojson-url':
      return {
        type: 'geojson',
        data: entry.url,
        attribution: entry.attribution,
      };
    case 'vector-tiles':
      return {
        type: 'vector',
        tiles: entry.tiles,
        minzoom: entry.minzoom,
        maxzoom: entry.maxzoom,
        attribution: entry.attribution,
      };
    case 'raster-tiles':
      return {
        type: 'raster',
        tiles: entry.tiles,
        tileSize: entry.tileSize ?? 256,
        minzoom: entry.minzoom,
        maxzoom: entry.maxzoom,
        attribution: entry.attribution,
      };
    case 'raster-dem':
      return {
        type: 'raster-dem',
        tiles: entry.tiles,
        url: entry.url,
        tileSize: entry.tileSize ?? 256,
        encoding: entry.encoding,
        minzoom: entry.minzoom,
        maxzoom: entry.maxzoom,
        attribution: entry.attribution,
      };
    case 'image':
      return {
        type: 'image',
        url: entry.url,
        coordinates: entry.coordinates,
      };
    case 'video':
      return {
        type: 'video',
        urls: entry.urls,
        coordinates: entry.coordinates,
      };
    case 'native':
      return entry.spec as MaplibreSourceSpec;
  }
};

// Layer translation

export const toMaplibreLayer = (
  layer: VisualizationLayer,
  sourceLayer?: string
): maplibregl.LayerSpecification => {
  const base: Record<string, unknown> = {
    id: layer.id,
    source: layer.dataId,
    minzoom: layer.minzoom,
    maxzoom: layer.maxzoom,
    layout: {
      visibility:
        layer.visible === false ? ('none' as const) : ('visible' as const),
    },
  };

  const effectiveSourceLayer = layer.sourceLayer ?? sourceLayer;
  if (effectiveSourceLayer) {
    base['source-layer'] = effectiveSourceLayer;
  }

  const p = layer.paint ?? {};

  switch (layer.geometry) {
    case 'polygon': {
      const fp = p as FillPaint;
      return {
        ...base,
        type: 'fill',
        paint: {
          'fill-color': fp.fillColor ?? '#3b82f6',
          'fill-opacity': fp.fillOpacity ?? 0.6,
          'fill-outline-color': fp.lineColor ?? '#1d4ed8',
        },
      } as maplibregl.LayerSpecification;
    }
    case 'line': {
      const lp = p as LinePaint;
      return {
        ...base,
        type: 'line',
        paint: {
          'line-color': lp.lineColor ?? '#3b82f6',
          'line-width': lp.lineWidth ?? 2,
          'line-opacity': lp.lineOpacity ?? 1,
          'line-dasharray': lp.lineDasharray,
        },
      } as maplibregl.LayerSpecification;
    }
    case 'point': {
      const cp = p as CirclePaint;
      return {
        ...base,
        type: 'circle',
        paint: {
          'circle-color': cp.circleColor ?? '#3b82f6',
          'circle-radius': cp.circleRadius ?? 6,
          'circle-opacity': cp.circleOpacity ?? 1,
          'circle-stroke-color': cp.circleStrokeColor ?? '#ffffff',
          'circle-stroke-width': cp.circleStrokeWidth ?? 1,
        },
      } as maplibregl.LayerSpecification;
    }
    case 'heatmap': {
      const hp = p as HeatmapPaint;
      return {
        ...base,
        type: 'heatmap',
        paint: {
          'heatmap-radius': hp.heatmapRadius ?? 15,
          'heatmap-opacity': hp.heatmapOpacity ?? 1,
          'heatmap-intensity': hp.heatmapIntensity ?? 1,
          'heatmap-weight': hp.heatmapWeight ?? 1,
        },
      } as maplibregl.LayerSpecification;
    }
    case 'symbol': {
      const sp = p as SymbolPaint;
      return {
        ...base,
        type: 'symbol',
        layout: {
          ...(base.layout as object),
          'text-field': sp.textField ?? '',
          'text-size': sp.textSize ?? 12,
          'icon-image': sp.iconImage,
        },
        paint: {
          'text-color': sp.textColor ?? '#000000',
          'text-opacity': sp.textOpacity ?? 1,
          'text-halo-color': sp.textHaloColor ?? '#ffffff',
          'text-halo-width': sp.textHaloWidth ?? 0,
          'icon-color': sp.iconColor ?? '#000000',
          'icon-opacity': sp.iconOpacity ?? 1,
        },
      } as maplibregl.LayerSpecification;
    }
    case 'raster': {
      const rp = p as RasterPaint;
      return {
        ...base,
        type: 'raster',
        paint: {
          'raster-opacity': rp.rasterOpacity ?? 1,
        },
      } as maplibregl.LayerSpecification;
    }
  }
};

// Adapter

const syncSourcesAndLayers = (
  map: maplibregl.Map,
  spec: VisualizationSpec,
  previousSpec: VisualizationSpec | null
) => {
  if (previousSpec) {
    for (const layer of previousSpec.layers) {
      const stillExists = spec.layers.some((nextLayer) => {
        return nextLayer.id === layer.id;
      });
      if (!stillExists && map.getLayer(layer.id)) {
        map.removeLayer(layer.id);
      }
    }

    for (const entry of previousSpec.data) {
      const stillExists = spec.data.some((nextEntry) => {
        return nextEntry.id === entry.id;
      });
      if (!stillExists && map.getSource(entry.id)) {
        map.removeSource(entry.id);
      }
    }
  }

  for (const entry of spec.data) {
    if (!map.getSource(entry.id)) {
      map.addSource(entry.id, translateGeoVisData(entry));
    } else if (entry.kind === 'geojson-inline') {
      const prevEntry = previousSpec?.data.find((e) => {
        return e.id === entry.id;
      });
      const prevGeojson =
        prevEntry?.kind === 'geojson-inline' ? prevEntry.geojson : undefined;
      if (prevGeojson !== entry.geojson) {
        (map.getSource(entry.id) as maplibregl.GeoJSONSource).setData(
          entry.geojson as maplibregl.GeoJSONSourceSpecification['data']
        );
      }
    } else if (entry.kind === 'geojson-url') {
      const prevEntry = previousSpec?.data.find((e) => {
        return e.id === entry.id;
      });
      const prevUrl =
        prevEntry?.kind === 'geojson-url' ? prevEntry.url : undefined;
      if (prevUrl !== entry.url) {
        (map.getSource(entry.id) as maplibregl.GeoJSONSource).setData(
          entry.url
        );
      }
    }
  }

  for (const layer of spec.layers) {
    const mapLayer = map.getLayer(layer.id);
    const dataEntry = spec.data.find((e) => {
      return e.id === layer.dataId;
    });
    const sourceLayer =
      dataEntry?.kind === 'vector-tiles' ? dataEntry.sourceLayer : undefined;
    const desiredLayer = toMaplibreLayer(layer, sourceLayer);
    if (dataEntry) {
      applyColorByDefaults(layer, dataEntry, desiredLayer);
    }
    const desiredPaint = (desiredLayer as { paint?: Record<string, unknown> })
      .paint;

    if (desiredPaint) {
      (desiredLayer as { paint?: Record<string, unknown> }).paint =
        Object.fromEntries(
          Object.entries(desiredPaint).filter(([, value]) => {
            return value !== undefined;
          })
        );
    }

    if (!mapLayer) {
      map.addLayer(desiredLayer);
      continue;
    }

    map.setLayoutProperty(
      layer.id,
      'visibility',
      layer.visible === false ? 'none' : 'visible'
    );

    const paint = (desiredLayer as { paint?: Record<string, unknown> }).paint;
    if (paint) {
      for (const [property, value] of Object.entries(paint)) {
        map.setPaintProperty(
          layer.id,
          property,
          value as maplibregl.StyleSpecification
        );
      }
    }
  }
};

/**
 * Walks a GeoJSON geometry and extends `bounds` with each position. Used
 * by the auto-fit pass to compute the union of all loaded source features
 * (including url-based sources whose extent is unknown at spec-time).
 */
const extendBoundsByGeometry = (
  bounds: maplibregl.LngLatBounds,
  geom: GeoJSONGeometry
): void => {
  switch (geom.type) {
    case 'Point':
      bounds.extend(geom.coordinates as [number, number]);
      return;
    case 'MultiPoint':
    case 'LineString':
      for (const pos of geom.coordinates) {
        bounds.extend(pos as [number, number]);
      }
      return;
    case 'MultiLineString':
    case 'Polygon':
      for (const ring of geom.coordinates) {
        for (const pos of ring) bounds.extend(pos as [number, number]);
      }
      return;
    case 'MultiPolygon':
      for (const poly of geom.coordinates) {
        for (const ring of poly) {
          for (const pos of ring) bounds.extend(pos as [number, number]);
        }
      }
      return;
    case 'GeometryCollection':
      for (const inner of geom.geometries)
        extendBoundsByGeometry(bounds, inner);
      return;
  }
};

/**
 * Fits the camera to the extent of all data sources once they are loaded.
 *
 * Guards:
 *   - `fittedOnce`: ensures the fit runs at most once per mount, so swapping
 *     the basemap style after the initial fit does not reset the camera.
 *   - `loadedSourceIds`: de-duplicates `sourcedata` events per source,
 *     preventing multiple triggers from the same source.
 *
 * Strategy:
 *   - `geojson-inline`: bounds computed synchronously by walking in-memory
 *     GeoJSON — no viewport dependency.
 *   - `geojson-url`: bounds obtained via `GeoJSONSource.getBounds()` on the
 *     first `sourcedata` event where `isSourceLoaded === true`. This avoids
 *     the `querySourceFeatures` viewport limitation that returns empty
 *     results at world zoom before data tiles have been rendered.
 */
const autoFitBounds = (map: maplibregl.Map, spec: VisualizationSpec): void => {
  const allBounds = new maplibregl.LngLatBounds();
  let fittedOnce = false;

  const tryFit = (animate = false) => {
    if (fittedOnce || allBounds.isEmpty()) return;
    fittedOnce = true;
    map.fitBounds(allBounds, { padding: 40, animate });
  };

  // Inline sources: walk in-memory GeoJSON immediately (synchronous).
  for (const entry of spec.data) {
    if (entry.kind !== 'geojson-inline') continue;
    const geojson = entry.geojson;
    if (geojson.type === 'FeatureCollection') {
      for (const f of (geojson as GeoJSONFeatureCollection).features) {
        if (f.geometry)
          extendBoundsByGeometry(
            allBounds,
            f.geometry as unknown as GeoJSONGeometry
          );
      }
    } else if (geojson.type === 'Feature') {
      const feat = geojson as GeoJSONFeature;
      if (feat.geometry)
        extendBoundsByGeometry(
          allBounds,
          feat.geometry as unknown as GeoJSONGeometry
        );
    }
  }

  // URL-based sources: need async getBounds() once the source finishes loading.
  const urlEntries = spec.data.filter((e) => {
    return e.kind === 'geojson-url';
  });

  if (urlEntries.length === 0) {
    // Only inline (or empty) — fit once the map is idle.
    map.once('idle', tryFit);
    return;
  }

  const loadedSourceIds = new Set<string>();
  let resolvedCount = 0;
  const totalUrlCount = urlEntries.length;

  const handleSourceData = (e: maplibregl.MapSourceDataEvent) => {
    if (e.dataType !== 'source' || !e.isSourceLoaded) return;
    // fittedOnce guard per-source: ignore re-fires (e.g. after setStyle).
    if (loadedSourceIds.has(e.sourceId)) return;
    if (
      !urlEntries.some((entry) => {
        return entry.id === e.sourceId;
      })
    )
      return;

    loadedSourceIds.add(e.sourceId); // mark synchronously to block duplicates

    const finish = () => {
      resolvedCount++;
      if (resolvedCount >= totalUrlCount) {
        map.off('sourcedata', handleSourceData);
        tryFit(true);
      }
    };

    const source = map.getSource(e.sourceId) as
      | maplibregl.GeoJSONSource
      | undefined;
    if (
      source &&
      typeof (source as maplibregl.GeoJSONSource).getBounds === 'function'
    ) {
      (source as maplibregl.GeoJSONSource)
        .getBounds()
        .then((sourceBounds) => {
          if (!sourceBounds.isEmpty()) allBounds.extend(sourceBounds);
          finish();
        })
        .catch(finish);
    } else {
      finish();
    }
  };

  map.on('sourcedata', handleSourceData);
};

/**
 * Creates a new, isolated MapLibre adapter instance.
 * Each call returns an independent instance with its own internal state,
 * allowing multiple maps to coexist without shared mutable state.
 */
const createMapLibreAdapter = (): EngineAdapter => {
  interface ViewState {
    map: maplibregl.Map;
    spec: VisualizationSpec;
    styleUrl: string | maplibregl.StyleSpecification;
  }

  const _views = new Map<string, ViewState>();

  return {
    id: 'maplibre',

    getCapabilities: (): CapabilitySet => {
      return {
        supports3D: false,
        supportsRaster: true,
        supportsVectorTiles: true,
        supportsCustomLayers: true,
      };
    },

    mount: (
      container: HTMLElement,
      spec: VisualizationSpec,
      viewId: string
    ): MountedView => {
      const { view } = spec;
      const styleUrl = resolveStyle(spec);

      const map = new maplibregl.Map({
        container,
        style: styleUrl,
        center: view.center,
        zoom: view.zoom,
        pitch: view.pitch ?? 0,
        bearing: view.bearing ?? 0,
      });

      map.addControl(
        new maplibregl.NavigationControl({
          visualizePitch: true,
          visualizeRoll: true,
          showZoom: true,
          showCompass: true,
        })
      );

      _views.set(viewId, { map, spec, styleUrl });

      map.on('load', () => {
        const viewState = _views.get(viewId);
        if (viewState) {
          syncSourcesAndLayers(map, viewState.spec, null);
          if (viewState.spec.view.autoFit) {
            autoFitBounds(map, viewState.spec);
          }
        }
      });

      let _removed = false;

      return {
        viewId,
        container,
        destroy: () => {
          if (_removed) return;
          _removed = true;
          try {
            map.remove();
          } catch {
            // MapLibre can throw if the map was not fully initialized
            // (e.g. unmounted before the style loaded).
          }
          _views.delete(viewId);
        },
      };
    },

    update: (spec: VisualizationSpec) => {
      for (const [viewId, viewState] of _views) {
        const map = viewState.map;
        const nextStyleUrl = resolveStyle(spec);
        const previousSpec = viewState.spec;

        viewState.spec = spec;

        // Apply view state changes regardless of style changes.
        const prevView = previousSpec.view;
        const nextView = spec.view;
        if (
          prevView.center[0] !== nextView.center[0] ||
          prevView.center[1] !== nextView.center[1]
        ) {
          map.setCenter(nextView.center as maplibregl.LngLatLike);
        }
        if (prevView.zoom !== nextView.zoom) {
          map.setZoom(nextView.zoom);
        }
        if ((prevView.pitch ?? 0) !== (nextView.pitch ?? 0)) {
          map.setPitch(nextView.pitch ?? 0);
        }
        if ((prevView.bearing ?? 0) !== (nextView.bearing ?? 0)) {
          map.setBearing(nextView.bearing ?? 0);
        }

        if (nextStyleUrl !== viewState.styleUrl) {
          viewState.styleUrl = nextStyleUrl;
          map.once('style.load', () => {
            const updated = _views.get(viewId);
            if (updated) {
              syncSourcesAndLayers(map, updated.spec, null);
            }
          });
          map.setStyle(nextStyleUrl);
          continue;
        }

        if (map.isStyleLoaded()) {
          syncSourcesAndLayers(map, spec, previousSpec);
        } else {
          map.once('style.load', () => {
            const updated = _views.get(viewId);
            if (updated) {
              syncSourcesAndLayers(map, updated.spec, null);
            }
          });
        }
      }
    },

    applyPatch: (patch: SpecPatch) => {
      for (const viewState of _views.values()) {
        const { map } = viewState;

        if (patch.target === 'layer') {
          if (patch.op === 'add' && patch.value != null) {
            const newLayer = patch.value as VisualizationLayer;
            if (!map.getLayer(newLayer.id)) {
              const mlLayer = toMaplibreLayer(newLayer, newLayer.sourceLayer);
              const dataEntry = viewState.spec.data.find((e) => {
                return e.id === newLayer.dataId;
              });
              if (dataEntry) {
                applyColorByDefaults(newLayer, dataEntry, mlLayer);
              }
              // Strip undefined paint values before passing to MapLibre.
              const paint = (mlLayer as { paint?: Record<string, unknown> })
                .paint;
              if (paint) {
                (mlLayer as { paint?: Record<string, unknown> }).paint =
                  Object.fromEntries(
                    Object.entries(paint).filter(([, v]) => {
                      return v !== undefined;
                    })
                  );
              }
              map.addLayer(mlLayer);
              viewState.spec = {
                ...viewState.spec,
                layers: [...viewState.spec.layers, newLayer],
              };
            }
          } else if (patch.op === 'remove') {
            const layerId = patch.value as string;
            if (map.getLayer(layerId)) {
              map.removeLayer(layerId);
              viewState.spec = {
                ...viewState.spec,
                layers: viewState.spec.layers.filter((l) => {
                  return l.id !== layerId;
                }),
              };
            }
          } else if (patch.op === 'replace') {
            // Expected path: "layer.<layerId>.paint.<camelCaseKey>"
            const parts = patch.path.split('.');
            if (parts.length < 4 || parts[2] !== 'paint') continue;
            const layerId = parts[1];
            const specKey = parts[3];
            if (!layerId || !specKey) continue;
            const layer = viewState.spec.layers.find((l) => {
              return l.id === layerId;
            });
            if (!layer) continue;
            const maplibreKey = specPaintKeyToMaplibre(specKey, layer.geometry);
            if (!maplibreKey) continue;
            if (patch.value !== undefined) {
              if (map.isStyleLoaded()) {
                map.setPaintProperty(
                  layerId,
                  maplibreKey,
                  patch.value as maplibregl.StyleSpecification
                );
              } else {
                map.once('style.load', () => {
                  map.setPaintProperty(
                    layerId,
                    maplibreKey,
                    patch.value as maplibregl.StyleSpecification
                  );
                });
              }
            }
          }
        } else if (patch.target === 'data') {
          if (patch.op === 'add' && patch.value != null) {
            const newEntry = patch.value as GeoVisDataEntry;
            if (!map.getSource(newEntry.id)) {
              map.addSource(newEntry.id, translateGeoVisData(newEntry));
              viewState.spec = {
                ...viewState.spec,
                data: [...viewState.spec.data, newEntry],
              };
            }
          } else if (patch.op === 'remove') {
            const dataId = patch.value as string;
            if (map.getSource(dataId)) {
              // Remove dependent layers first; MapLibre throws if a layer
              // still references the source when removeSource is called.
              for (const layer of viewState.spec.layers) {
                if (layer.dataId === dataId && map.getLayer(layer.id)) {
                  map.removeLayer(layer.id);
                }
              }
              map.removeSource(dataId);
              viewState.spec = {
                ...viewState.spec,
                layers: viewState.spec.layers.filter((l) => {
                  return l.dataId !== dataId;
                }),
                data: viewState.spec.data.filter((e) => {
                  return e.id !== dataId;
                }),
              };
            }
          }
        }
      }
    },

    destroy: () => {
      for (const viewState of _views.values()) {
        try {
          viewState.map.remove();
        } catch {
          // ignore partially-initialized maps
        }
      }
      _views.clear();
    },

    getNativeInstance: (): unknown => {
      return _views.size > 0
        ? (_views.values().next().value?.map ?? null)
        : null;
    },
  };
};

export default createMapLibreAdapter;
