import type { Meta, StoryFn } from '@storybook/react-webpack5';
import type {
  LayerTemplate,
  PartialVisualizationSpec,
  QuantitativeColorBy,
  VisualizationLayer,
} from '@ttoss/geovis';
import { GeoVisProvider, GeoVisViews, useGeoVis } from '@ttoss/geovis';
import type { Map as MapLibreMap, MapMouseEvent } from 'maplibre-gl';
import * as React from 'react';

import distritosMinimal from '../../../../packages/geovis/src/fixtures/distritos-sp-populacao-idosa.minimal.json';
import {
  applyBasemap,
  BASEMAP_ARG_TYPE,
  type BasemapArgs,
  DEFAULT_BASEMAP_ARGS,
  DEFAULT_PRESENTATION_ARGS,
  PRESENTATION_ARG_TYPE,
  type PresentationArgs,
} from './_map-story-helpers';

export default {
  title: 'GeoVis/Fixtures/DistritosSPPopulacao60Mais',
  tags: ['autodocs'],
  argTypes: { ...BASEMAP_ARG_TYPE, ...PRESENTATION_ARG_TYPE },
  args: { ...DEFAULT_BASEMAP_ARGS, ...DEFAULT_PRESENTATION_ARGS },
} as Meta<BasemapArgs & PresentationArgs>;

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
  // properties omitted — displayProperties drives both expansion and info panel
  labelProperty: 'nm_distrit',
  displayProperties: ['c1', 'c2', 'c3', 'c4', 'c5'],
  colorBy: {
    type: 'quantitative',
    scale: 'quantile',
    bins: 5,
    palette: 'Blues',
  },
  // Hint that this story prefers tab-based switching for its 5 expanded views.
  presentation: 'tabs',
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
 * Choropleth of São Paulo districts by 60+ age bands (small multiples).
 *
 * The minimal fixture contains only `data` (inline GeoJSON with `nm_distrit`
 * and `c1..c5` properties). `layerTemplates` in the story-level spec instruct
 * the runtime to generate one choropleth layer per property and expose each
 * as a tab. The `<GeoVisViews>` component reads `spec.presentation` and
 * dispatches to the matching UI shell (tabs / side-by-side / time-slider).
 */
export const DistritosSPPopulacao60Mais: StoryFn<
  BasemapArgs & PresentationArgs
> = ({ basemapStyleUrl, presentationMode }) => {
  const spec = React.useMemo(() => {
    return applyBasemap(distritosSpec, basemapStyleUrl);
  }, [basemapStyleUrl]);

  return (
    // GeoVisProvider expands layerTemplates internally — no manual call needed.
    <GeoVisProvider spec={spec}>
      <div>
        <strong>{STORY_TITLE}</strong>
        <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 14 }}>
          {STORY_DESCRIPTION}
        </p>
      </div>
      <GeoVisViews
        mode={presentationMode}
        renderView={({ layer }) => {
          if (!layer) return null;
          return (
            <>
              <ChoroplethPainter layer={layer} />
              <HoverPanel layer={layer} />
            </>
          );
        }}
      />
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
