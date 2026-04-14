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
  LinePaint,
  RasterPaint,
  VisualizationLayer,
  VisualizationSpec,
} from '../../spec/types';

const DEFAULT_STYLE = 'https://demotiles.maplibre.org/style.json';

const resolveStyleUrl = (spec: VisualizationSpec): string => {
  return spec.basemap?.styleUrl ?? DEFAULT_STYLE;
};

// Source translation

type MaplibreSourceSpec = maplibregl.SourceSpecification;

const toMaplibreSource = (source: DataSource): MaplibreSourceSpec => {
  switch (source.type) {
    case 'geojson':
      return {
        type: 'geojson',
        data: source.data as maplibregl.GeoJSONSourceSpecification['data'],
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
  }
};

// Layer translation

const toMaplibreLayer = (
  layer: VisualizationLayer
): maplibregl.LayerSpecification => {
  const base = {
    id: layer.id,
    source: layer.sourceId,
    minzoom: layer.minzoom,
    maxzoom: layer.maxzoom,
    layout: {
      visibility:
        layer.visible === false ? ('none' as const) : ('visible' as const),
    },
  };

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
    const desiredLayer = toMaplibreLayer(layer);

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
  let _map: maplibregl.Map | null = null;
  let _currentSpec: VisualizationSpec | null = null;
  let _activeStyleUrl: string | null = null;

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

      _map = map;
      _currentSpec = spec;
      _activeStyleUrl = styleUrl;

      map.on('load', () => {
        if (_currentSpec) {
          syncSourcesAndLayers(map, _currentSpec, null);
        }
      });

      return {
        viewId,
        container,
        destroy: () => {
          map.remove();
          if (_map === map) _map = null;
        },
      };
    },

    update: (spec: VisualizationSpec) => {
      if (!_map) return;
      const map = _map;
      const nextStyleUrl = resolveStyleUrl(spec);
      const previousSpec = _currentSpec;

      _currentSpec = spec;

      if (nextStyleUrl !== _activeStyleUrl) {
        _activeStyleUrl = nextStyleUrl;
        map.once('style.load', () => {
          if (_currentSpec) {
            syncSourcesAndLayers(map, _currentSpec, null);
          }
        });
        map.setStyle(nextStyleUrl);
        return;
      }

      if (map.isStyleLoaded()) {
        syncSourcesAndLayers(map, spec, previousSpec);
      } else {
        map.once('style.load', () => {
          if (_currentSpec) {
            syncSourcesAndLayers(map, _currentSpec, null);
          }
        });
      }
    },

    applyPatch: (patch: SpecPatch) => {
      if (!_map || patch.target !== 'layer') return;
      const parts = patch.path.split('.');
      const layerId = parts[1];
      const prop = parts[2];
      if (!layerId || !prop || patch.op !== 'replace') return;
      if (patch.value !== undefined) {
        _map.setPaintProperty(
          layerId,
          prop,
          patch.value as maplibregl.StyleSpecification
        );
      }
    },

    destroy: () => {
      _map?.remove();
      _map = null;
      _currentSpec = null;
      _activeStyleUrl = null;
    },

    getNativeInstance: (): unknown => {
      return _map;
    },
  };
};

export default createMapLibreAdapter;
