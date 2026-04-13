import maplibregl from 'maplibre-gl';

import type {
  CapabilitySet,
  EngineAdapter,
  MountedView,
  SpecPatch,
} from '../../runtime/adapter';

const injectMaplibreCSS = () => {
  const id = 'maplibre-gl-css';
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = new URL('maplibre-gl/dist/maplibre-gl.css', import.meta.url).href;
  document.head.appendChild(link);
};

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

let _map: maplibregl.Map | null = null;

const MapLibreAdapter: EngineAdapter = {
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
    injectMaplibreCSS();
    const { view, basemap, sources, layers } = spec;

    const map = new maplibregl.Map({
      container,
      style: basemap?.styleUrl ?? DEFAULT_STYLE,
      center: view.center,
      zoom: view.zoom,
      pitch: view.pitch ?? 0,
      bearing: view.bearing ?? 0,
    });

    _map = map;

    map.on('load', () => {
      for (const source of sources) {
        map.addSource(source.id, toMaplibreSource(source));
      }
      for (const layer of layers) {
        map.addLayer(toMaplibreLayer(layer));
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
    if (!map.isStyleLoaded()) return;

    for (const layer of spec.layers) {
      if (map.getLayer(layer.id)) {
        map.setLayoutProperty(
          layer.id,
          'visibility',
          layer.visible === false ? 'none' : 'visible'
        );
      }
    }
  },

  applyPatch: (patch: SpecPatch) => {
    if (!_map || patch.target !== 'layer') return;
    const parts = patch.path.split('.');
    const layerId = parts[1];
    const prop = parts[2];
    if (!layerId || !prop || patch.op !== 'replace') return;
    if (patch.value !== undefined) {
      _map.setPaintProperty(layerId, prop, patch.value);
    }
  },

  destroy: () => {
    _map?.remove();
    _map = null;
  },

  getNativeInstance: (): unknown => {
    return _map;
  },
};

export default MapLibreAdapter;
