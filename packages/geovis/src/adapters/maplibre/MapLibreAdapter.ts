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
  DataSource,
  FillPaint,
  GeoVisGeometryType,
  LinePaint,
  RasterPaint,
  VisualizationLayer,
  VisualizationSpec,
} from '../../spec/types';

const DEFAULT_STYLE = 'https://demotiles.maplibre.org/style.json';

const resolveStyleUrl = (spec: VisualizationSpec): string => {
  return spec.basemap?.styleUrl ?? DEFAULT_STYLE;
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
  };
  const entry = map[key];
  if (!entry) return undefined;
  return typeof entry === 'function' ? entry(geometry) : entry;
};

// Source translation

type MaplibreSourceSpec = maplibregl.SourceSpecification;

export const toMaplibreSource = (source: DataSource): MaplibreSourceSpec => {
  switch (source.type) {
    case 'geojson':
      return {
        type: 'geojson',
        data: source.data,
        attribution: source.attribution,
      };
    case 'vector-tiles':
      return {
        type: 'vector',
        tiles: source.tiles,
        minzoom: source.minzoom,
        maxzoom: source.maxzoom,
        attribution: source.attribution,
      };
    case 'raster-tiles':
      return {
        type: 'raster',
        tiles: source.tiles,
        tileSize: source.tileSize ?? 256,
        minzoom: source.minzoom,
        maxzoom: source.maxzoom,
        attribution: source.attribution,
      };
    case 'image':
      return {
        type: 'image',
        url: source.url,
        coordinates: source.coordinates,
      };
    case 'raster-dem':
      return {
        type: 'raster-dem',
        tiles: source.tiles,
        url: source.url,
        tileSize: source.tileSize ?? 256,
        encoding: source.encoding,
        minzoom: source.minzoom,
        maxzoom: source.maxzoom,
        attribution: source.attribution,
      };
    case 'video':
      return {
        type: 'video',
        urls: source.urls,
        coordinates: source.coordinates,
      };
  }
};

// Layer translation

export const toMaplibreLayer = (
  layer: VisualizationLayer,
  sourceLayer?: string
): maplibregl.LayerSpecification => {
  const base: Record<string, unknown> = {
    id: layer.id,
    source: layer.sourceId,
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
      };
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
      };
    }
    case 'point':
    case 'heatmap':
    case 'symbol': {
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
      };
    }
    case 'raster': {
      const rp = p as RasterPaint;
      return {
        ...base,
        type: 'raster',
        paint: {
          'raster-opacity': rp.rasterOpacity ?? 1,
        },
      };
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

    for (const source of previousSpec.sources) {
      const stillExists = spec.sources.some((nextSource) => {
        return nextSource.id === source.id;
      });
      if (!stillExists && map.getSource(source.id)) {
        map.removeSource(source.id);
      }
    }
  }

  for (const source of spec.sources) {
    if (!map.getSource(source.id)) {
      map.addSource(source.id, toMaplibreSource(source));
    }
  }

  for (const layer of spec.layers) {
    const mapLayer = map.getLayer(layer.id);
    const source = spec.sources.find((s) => {
      return s.id === layer.sourceId;
    });
    const sourceLayer =
      source && 'sourceLayer' in source
        ? (source as { sourceLayer?: string }).sourceLayer
        : undefined;
    const desiredLayer = toMaplibreLayer(layer, sourceLayer);
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
 * Creates a new, isolated MapLibre adapter instance.
 * Each call returns an independent instance with its own internal state,
 * allowing multiple maps to coexist without shared mutable state.
 */
const createMapLibreAdapter = (): EngineAdapter => {
  interface ViewState {
    map: maplibregl.Map;
    spec: VisualizationSpec;
    styleUrl: string;
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
      const styleUrl = resolveStyleUrl(spec);

      const map = new maplibregl.Map({
        container,
        style: styleUrl,
        center: view.center,
        zoom: view.zoom,
        pitch: view.pitch ?? 0,
        bearing: view.bearing ?? 0,
      });

      _views.set(viewId, { map, spec, styleUrl });

      map.on('load', () => {
        const viewState = _views.get(viewId);
        if (viewState) {
          syncSourcesAndLayers(map, viewState.spec, null);
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
        const nextStyleUrl = resolveStyleUrl(spec);
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
        } else if (patch.target === 'source') {
          if (patch.op === 'add' && patch.value != null) {
            const newSource = patch.value as DataSource;
            if (!map.getSource(newSource.id)) {
              map.addSource(newSource.id, toMaplibreSource(newSource));
              viewState.spec = {
                ...viewState.spec,
                sources: [...viewState.spec.sources, newSource],
              };
            }
          } else if (patch.op === 'remove') {
            const sourceId = patch.value as string;
            if (map.getSource(sourceId)) {
              map.removeSource(sourceId);
              viewState.spec = {
                ...viewState.spec,
                sources: viewState.spec.sources.filter((s) => {
                  return s.id !== sourceId;
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
