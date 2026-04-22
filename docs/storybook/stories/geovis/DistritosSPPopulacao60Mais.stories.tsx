import type { Meta, StoryFn } from '@storybook/react-webpack5';
import type {
  LayerTemplate,
  PartialVisualizationSpec,
  QuantitativeColorBy,
  VisualizationLayer,
  VisualizationView,
} from '@ttoss/geovis';
import { GeoVisCanvas, GeoVisProvider, useGeoVis } from '@ttoss/geovis';
import type { Map as MapLibreMap, MapMouseEvent } from 'maplibre-gl';
import * as React from 'react';

import distritosMinimal from '../../../../packages/geovis/src/fixtures/distritos-sp-populacao-idosa.minimal.json';
import {
  applyBasemap,
  BASEMAP_ARG_TYPE,
  type BasemapArgs,
  DEFAULT_BASEMAP_ARGS,
} from './_map-story-helpers';

export default {
  title: 'GeoVis/Fixtures/DistritosSPPopulacao60Mais',
  tags: ['autodocs'],
  argTypes: BASEMAP_ARG_TYPE,
  args: DEFAULT_BASEMAP_ARGS,
} as Meta<BasemapArgs>;

const BLUES_5 = ['#eff3ff', '#bdd7e7', '#6baed6', '#3182bd', '#08519c'];

// Story title and description (previously in fixture metadata).
const STORY_TITLE = 'Distritos de São Paulo — small multiples 60+';
const STORY_DESCRIPTION =
  'Choropleth of São Paulo districts using layerTemplates with inline data. Shows the small multiples pattern from the c1..c5 properties (60+ age bands).';

// Story-level overrides on top of the data-only minimal fixture.
const distritoTemplate: LayerTemplate = {
  id: 'distritos',
  geometry: 'polygon',
  dataId: 'distritos',
  properties: ['c1', 'c2', 'c3', 'c4', 'c5'],
  labelProperty: 'nm_distrit',
  displayProperties: ['nm_distrit', 'c1', 'c2', 'c3', 'c4', 'c5'],
  colorBy: {
    type: 'quantitative',
    scale: 'quantile',
    bins: 5,
    palette: 'Blues',
  },
};

const displayPropertyLabels: Record<string, string> = {
  nm_distrit: 'Distrito',
  c1: 'População 60 a 64',
  c2: 'População 65 a 69',
  c3: 'População 70 a 74',
  c4: 'População 75 e +',
  c5: 'População Total 60+',
};

const distritosSpec: PartialVisualizationSpec = {
  ...(distritosMinimal as PartialVisualizationSpec),
  layerTemplates: [distritoTemplate],
  metadata: { displayPropertyLabels },
};

const computeQuantileBreaks = (values: number[], bins: number): number[] => {
  const sorted = values
    .filter((v) => {
      return Number.isFinite(v);
    })
    .slice()
    .sort((a, b) => {
      return a - b;
    });
  if (sorted.length === 0) return [];
  const breaks: number[] = [];
  for (let i = 1; i < bins; i++) {
    const idx = Math.floor((i / bins) * sorted.length);
    breaks.push(sorted[Math.min(idx, sorted.length - 1)]);
  }
  return breaks;
};

const buildFillColorExpression = (
  property: string,
  breaks: number[],
  palette: string[]
): unknown => {
  const expression: unknown[] = [
    'step',
    ['to-number', ['get', property]],
    palette[0],
  ];
  for (let i = 0; i < breaks.length; i++) {
    expression.push(breaks[i], palette[i + 1] ?? palette[palette.length - 1]);
  }
  return expression;
};

type DistritoFeatureProperties = Record<string, number | string | null>;

const getFeatureValues = (property: string): number[] => {
  const features = (
    distritosMinimal as unknown as {
      data: Array<{
        geojson: { features: Array<{ properties: DistritoFeatureProperties }> };
      }>;
    }
  ).data[0].geojson.features;
  return features.map((f) => {
    return Number(f.properties?.[property]);
  });
};

const ChoroplethPainter = ({ layer }: { layer: VisualizationLayer }) => {
  const { runtime } = useGeoVis();

  React.useEffect(() => {
    if (!runtime || !layer.colorBy || layer.colorBy.type !== 'quantitative')
      return;
    const map = runtime.getAdapter().getNativeInstance() as MapLibreMap;
    const colorBy = layer.colorBy as QuantitativeColorBy;
    const bins = colorBy.bins ?? 5;
    const breaks = computeQuantileBreaks(
      getFeatureValues(colorBy.property),
      bins
    );

    const apply = () => {
      if (!map.getLayer(layer.id)) return;
      map.setPaintProperty(
        layer.id,
        'fill-color',
        buildFillColorExpression(colorBy.property, breaks, BLUES_5) as never
      );
    };

    if (map.isStyleLoaded()) apply();
    else map.once('load', apply);
  }, [runtime, layer]);

  return null;
};

const HoverPanel = ({
  layer,
  compact,
}: {
  layer: VisualizationLayer;
  compact?: boolean;
}) => {
  const { runtime } = useGeoVis();
  const [hovered, setHovered] =
    React.useState<DistritoFeatureProperties | null>(null);

  React.useEffect(() => {
    if (!runtime) return;
    const map = runtime.getAdapter().getNativeInstance() as MapLibreMap;
    const handler = (event: MapMouseEvent) => {
      const features = map.queryRenderedFeatures(event.point, {
        layers: [layer.id],
      });
      setHovered(
        features.length > 0
          ? (features[0].properties as DistritoFeatureProperties)
          : null
      );
    };
    map.on('mousemove', handler);
    return () => {
      map.off('mousemove', handler);
    };
  }, [runtime, layer.id]);

  const displayProperties = layer.displayProperties ?? [];
  const labelProperty = layer.labelProperty ?? 'nm_distrit';
  const layerLabels = layer.displayPropertyLabels ?? displayPropertyLabels;

  return (
    <div
      style={{
        position: 'absolute',
        top: 8,
        right: 8,
        width: compact ? 180 : 240,
        padding: 8,
        background: 'rgba(255,255,255,0.95)',
        borderRadius: 6,
        boxShadow: '0 1px 6px rgba(0,0,0,0.15)',
        fontSize: 12,
        fontFamily: 'system-ui, sans-serif',
        zIndex: 2,
        pointerEvents: 'none',
      }}
    >
      <strong style={{ display: 'block', marginBottom: 6 }}>
        {hovered
          ? String(hovered[labelProperty] ?? 'Distrito')
          : 'Passe o mouse'}
      </strong>
      {hovered && (
        <dl style={{ margin: 0, display: 'grid', gap: 2 }}>
          {displayProperties.map((key) => {
            return (
              <div
                key={key}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: 6,
                }}
              >
                <dt style={{ color: '#525252' }}>{layerLabels[key] ?? key}</dt>
                <dd style={{ margin: 0, fontVariantNumeric: 'tabular-nums' }}>
                  {hovered[key] == null ? '—' : String(hovered[key])}
                </dd>
              </div>
            );
          })}
        </dl>
      )}
    </div>
  );
};

/**
 * Renders the expanded spec as a tab-switched single-map view.
 * Each tab corresponds to one generated view (one property from the template).
 * Only the active tab's GeoVisProvider is mounted — avoids N simultaneous maps.
 * Must be rendered inside an outer GeoVisProvider so useGeoVis() resolves the
 * already-expanded spec (layerTemplates → concrete layers + views).
 */
const ViewSwitcher = () => {
  const { spec: expandedSpec } = useGeoVis();

  const views: VisualizationView[] = expandedSpec.views ?? [];
  const [activeViewId, setActiveViewId] = React.useState<string>(() => {
    return views[0]?.id ?? '';
  });

  const layersById = React.useMemo(() => {
    return new Map<string, VisualizationLayer>(
      expandedSpec.layers.map((l) => {
        return [l.id, l];
      })
    );
  }, [expandedSpec]);

  // Derive one sub-spec per view (single layer, no views/templates).
  const subSpecs = React.useMemo(() => {
    return Object.fromEntries(
      views.map((view) => {
        return [
          view.id,
          {
            ...expandedSpec,
            layers: expandedSpec.layers.filter((l) => {
              return view.layers.includes(l.id);
            }),
            views: undefined,
            layerTemplates: undefined,
          },
        ];
      })
    );
  }, [expandedSpec, views]);

  const activeView = views.find((v) => {
    return v.id === activeViewId;
  });
  const activeLayer = activeView
    ? layersById.get(activeView.layers[0])
    : undefined;
  const activeSubSpec = activeViewId ? subSpecs[activeViewId] : undefined;

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div>
        <strong>{STORY_TITLE}</strong>
        <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 14 }}>
          {STORY_DESCRIPTION}
        </p>
      </div>

      {/* Tab bar — one button per expanded view */}
      <div
        role="tablist"
        style={{
          display: 'flex',
          gap: 4,
          flexWrap: 'wrap',
          borderBottom: '1px solid #e5e7eb',
          paddingBottom: 4,
        }}
      >
        {views.map((view) => {
          const isActive = view.id === activeViewId;
          return (
            <button
              key={view.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => {
                return setActiveViewId(view.id);
              }}
              style={{
                padding: '6px 14px',
                borderRadius: '6px 6px 0 0',
                border: `1px solid ${isActive ? '#3b82f6' : '#d4d4d8'}`,
                borderBottom: isActive
                  ? '2px solid #3b82f6'
                  : '1px solid #d4d4d8',
                background: isActive ? '#eff6ff' : 'white',
                color: isActive ? '#1d4ed8' : '#374151',
                fontWeight: isActive ? 600 : 400,
                fontSize: 13,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {view.label ?? view.id}
            </button>
          );
        })}
      </div>

      {/* Single map for the active view */}
      {activeSubSpec && activeLayer && (
        <div
          style={{
            position: 'relative',
            height: 480,
            border: '1px solid #d4d4d8',
            borderRadius: 6,
            overflow: 'hidden',
          }}
        >
          <GeoVisProvider spec={activeSubSpec}>
            <GeoVisCanvas
              viewId={activeViewId}
              style={{ width: '100%', height: '100%' }}
            />
            <ChoroplethPainter layer={activeLayer} />
            <HoverPanel layer={activeLayer} />
          </GeoVisProvider>
        </div>
      )}

      <details>
        <summary
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#374151',
            cursor: 'pointer',
          }}
        >
          How it works — layerTemplates expanded automatically by GeoVisProvider
        </summary>
        <pre
          style={{
            marginTop: 8,
            fontFamily: 'monospace',
            fontSize: 12,
            whiteSpace: 'pre',
            overflowX: 'auto',
            background: '#f3f4f6',
            padding: 12,
            borderRadius: 6,
            color: '#1f2937',
          }}
        >{`// Fixture declares a minimal template (only 4 required fields):
// {
//   "layerTemplates": [{
//     "geometry": "polygon",
//     "properties": ["c1","c2","c3","c4","c5"],
//     "labelProperty": "nm_distrit",
//     "displayProperties": ["nm_distrit","c1","c2","c3","c4","c5"],
//     "colorBy": { "type": "quantitative", "scale": "quantile", "bins": 5 }
//   }]
// }
//
// GeoVisProvider expands layerTemplates internally on mount.
// useGeoVis().spec returns the expanded spec with concrete layers + views.
// ViewSwitcher reads that spec and renders one map per tab, mounting only
// the active view's GeoVisProvider to avoid N simultaneous map instances.`}</pre>
      </details>
    </div>
  );
};

/**
 * Choropleth of São Paulo districts by 60+ age bands (small multiples).
 *
 * The minimal fixture contains only `data` (inline GeoJSON with `nm_distrit`
 * and `c1..c5` properties). `layerTemplates` in the story-level spec instruct
 * the runtime to generate one choropleth layer per property and expose each
 * as a tab. The basemap defaults to OpenFreeMap Bright (same as the lib default).
 */
export const DistritosSPPopulacao60Mais: StoryFn<BasemapArgs> = ({
  basemapStyleUrl,
}) => {
  const spec = React.useMemo(() => {
    return applyBasemap(distritosSpec, basemapStyleUrl);
  }, [basemapStyleUrl]);

  return (
    // GeoVisProvider expands layerTemplates internally — no manual call needed.
    <GeoVisProvider spec={spec}>
      <ViewSwitcher />
    </GeoVisProvider>
  );
};

DistritosSPPopulacao60Mais.parameters = {
  docs: {
    description: {
      story:
        'Choropleth using `layerTemplates` to auto-generate one layer per age band (`c1..c5`). ' +
        'The runtime expands templates into concrete layers + views on mount. ' +
        'Tabs switch the active choropleth without mounting N simultaneous maps. ' +
        'Hover a district to see the full property panel.',
    },
  },
};
