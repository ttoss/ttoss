/**
 * São Paulo districts — 60+ population visualizations.
 *
 * Two stories sharing the same GeoJSON fixture and overlay components:
 *
 *   AgeBands   — small-multiples choropleth by age band (60–64, 65–69,
 *                70–74, 75+, total). Use the View mode control to switch
 *                between tabs / side-by-side / single-filter / time-slider.
 *
 *   Timeline   — time-slider choropleth of total 60+ population per year
 *                (2000–2050). Use the Overlay control to add a legend and
 *                sparkline trend panel.
 *
 */

import type { Meta, StoryFn } from '@storybook/react-webpack5';
import type {
  LayerTemplate,
  PartialVisualizationSpec,
  QuantitativeColorBy,
  VisualizationLayer,
} from '@ttoss/geovis';
import {
  computeQuantileBreaks,
  GeoVisProvider,
  GeoVisViews,
  useGeoVis,
} from '@ttoss/geovis';
import type { Map as MapLibreMap, MapMouseEvent } from 'maplibre-gl';
import * as React from 'react';

import distritosMinimal from '../../../../packages/geovis/src/fixtures/distritos-sp-populacao-idosa.minimal.json';
import {
  applyBasemap,
  BASEMAP_ARG_TYPE,
  type BasemapArgs,
  DEFAULT_AUTO_COLORS,
  DEFAULT_BASEMAP_ARGS,
  DEFAULT_PRESENTATION_ARGS,
  PRESENTATION_ARG_TYPE,
  type PresentationArgs,
} from './_map-story-helpers';

// ── Meta ──────────────────────────────────────────────────────────────────────

type OverlayMode = 'none' | 'legend' | 'sparkline';

type StoryArgs = BasemapArgs & PresentationArgs & { overlayMode: OverlayMode };

export default {
  title: 'GeoVis/Fixtures/DistritosSPPopulacao60Mais',
  tags: ['autodocs'],
  argTypes: {
    ...BASEMAP_ARG_TYPE,
    ...PRESENTATION_ARG_TYPE,
    overlayMode: {
      name: 'Overlay',
      control: 'radio',
      options: ['none', 'legend', 'sparkline'] as OverlayMode[],
      description:
        'none — choropleth only · legend — adds quantile scale · sparkline — adds legend + trend bars',
    },
  },
  args: {
    ...DEFAULT_BASEMAP_ARGS,
    ...DEFAULT_PRESENTATION_ARGS,
    overlayMode: 'sparkline',
  },
} as Meta<StoryArgs>;

// ── Shared constants ──────────────────────────────────────────────────────────

// DEFAULT_AUTO_COLORS (Blues 5) is imported from _map-story-helpers — same
// palette as the lib's DEFAULT_PALETTE used when no explicit colors are set.
const YEARS = [
  2000, 2005, 2010, 2015, 2020, 2025, 2030, 2035, 2040, 2045, 2050,
];

// ── Shared utilities ──────────────────────────────────────────────────────────

type FeatureProperties = Record<string, number | string | null>;

const DISTRITOS_URL = (
  distritosMinimal as unknown as { data: Array<{ url?: string }> }
).data[0].url;

// Module-level cache — one fetch shared between AgeBands, Timeline, and Docs view.
let _featuresPromise: Promise<Array<{ properties: FeatureProperties }>> | null =
  null;

const loadGeoJSONFeatures = (): Promise<
  Array<{ properties: FeatureProperties }>
> => {
  if (!_featuresPromise && DISTRITOS_URL) {
    _featuresPromise = fetch(DISTRITOS_URL)
      .then((r) => {
        return r.json() as Promise<unknown>;
      })
      .then((raw) => {
        const fc = raw as {
          type?: string;
          features?: Array<{ properties: FeatureProperties }>;
        };
        if (fc.type === 'FeatureCollection' && Array.isArray(fc.features)) {
          return fc.features;
        }
        return [];
      })
      .catch(() => {
        return [];
      });
  }
  return _featuresPromise ?? Promise.resolve([]);
};

/**
 * Returns district features for break computation.
 * Fetches once per session (module-level cache); MapLibre renders the map
 * directly via the `geojson-url` source without a second fetch.
 */
const useGeoJSONFeatures = (): Array<{ properties: FeatureProperties }> => {
  const [features, setFeatures] = React.useState<
    Array<{ properties: FeatureProperties }>
  >([]);
  React.useEffect(() => {
    if (!DISTRITOS_URL) return;
    loadGeoJSONFeatures().then(setFeatures);
  }, []);
  return features;
};

const getFeatureValues = (
  features: Array<{ properties: FeatureProperties }>,
  property: string
): number[] => {
  return features
    .map((f) => {
      return Number(f.properties?.[property]);
    })
    .filter((v) => {
      return Number.isFinite(v) && v > 0;
    });
};

/** Returns the hovered GeoJSON feature properties for `layer.id`. */
const useHoveredFeature = (
  layer: VisualizationLayer
): FeatureProperties | null => {
  const { runtime } = useGeoVis();
  const [hovered, setHovered] = React.useState<FeatureProperties | null>(null);

  React.useEffect(() => {
    if (!runtime) return;
    const map = runtime.getAdapter().getNativeInstance() as MapLibreMap;
    const onMove = (event: MapMouseEvent) => {
      const features = map.queryRenderedFeatures(event.point, {
        layers: [layer.id],
      });
      setHovered(
        features.length > 0
          ? (features[0].properties as FeatureProperties)
          : null
      );
    };
    map.on('mousemove', onMove);
    return () => {
      map.off('mousemove', onMove);
    };
  }, [runtime, layer.id]);

  return hovered;
};

// ── AgeBands story components ─────────────────────────────────────────────────

const ageBandsLabels: Record<string, string> = {
  nm_distrit: 'Distrito',
  pop_60_64: 'Pop. 60 a 64',
  pop_65_69: 'Pop. 65 a 69',
  pop_70_74: 'Pop. 70 a 74',
  pop_75_mais: 'Pop. 75 e +',
  pop_total_60_mais: 'Pop. Total 60+',
};

const ageBandsTemplate: LayerTemplate = {
  id: 'distritos',
  geometry: 'polygon',
  dataId: 'distritos',
  labelProperty: 'nm_distrit',
  displayProperties: [
    'pop_60_64',
    'pop_65_69',
    'pop_70_74',
    'pop_75_mais',
    'pop_total_60_mais',
  ],
  colorBy: {
    type: 'quantitative',
    scale: 'quantile',
    bins: 5,
    palette: 'Blues',
  },
  presentation: 'tabs',
};

const ageBandsSpec: PartialVisualizationSpec = {
  ...(distritosMinimal as PartialVisualizationSpec),
  layerTemplates: [ageBandsTemplate],
  metadata: { displayPropertyLabels: ageBandsLabels },
};

/**
 * Hover panel showing all `displayProperties` for the hovered district.
 * Used by the AgeBands story.
 */
const HoverPanel = ({ layer }: { layer: VisualizationLayer }) => {
  const hovered = useHoveredFeature(layer);
  const displayProperties = layer.displayProperties ?? [];
  const labelProperty = layer.labelProperty ?? 'nm_distrit';
  const layerLabels = layer.displayPropertyLabels ?? ageBandsLabels;

  return (
    <div
      style={{
        position: 'absolute',
        top: 8,
        right: 8,
        width: 240,
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

// ── Timeline story components ─────────────────────────────────────────────────

const timelineLabels: Record<string, string> = Object.fromEntries(
  YEARS.map((y) => {
    return [`pop_total_60_mais_${y}`, String(y)];
  })
);

const timelineTemplate: LayerTemplate = {
  id: 'pop60mais',
  geometry: 'polygon',
  dataId: 'distritos',
  properties: YEARS.map((y) => {
    return `pop_total_60_mais_${y}`;
  }),
  labelProperty: 'nm_distrit',
  displayProperties: YEARS.map((y) => {
    return `pop_total_60_mais_${y}`;
  }),
  colorBy: {
    type: 'quantitative',
    scale: 'quantile',
    bins: 5,
    palette: 'Blues',
  },
  presentation: 'time-slider',
  labelPattern: '${label}',
};

const timelineSpec: PartialVisualizationSpec = {
  ...(distritosMinimal as PartialVisualizationSpec),
  layerTemplates: [timelineTemplate],
  metadata: { displayPropertyLabels: timelineLabels },
};

/**
 * Colour-scale legend (bottom-left). Shows the 5 quantile bands with
 * population thresholds. Thresholds update per year (relative classification).
 */
const LegendOverlay = ({ breaks }: { breaks: number[] }) => {
  const bands = [
    {
      color: DEFAULT_AUTO_COLORS[0],
      label: `< ${breaks[0]?.toLocaleString('pt-BR') ?? '—'}`,
    },
    ...breaks.map((threshold, i) => {
      return {
        color:
          DEFAULT_AUTO_COLORS[i + 1] ??
          DEFAULT_AUTO_COLORS[DEFAULT_AUTO_COLORS.length - 1],
        label:
          i < breaks.length - 1
            ? `${threshold.toLocaleString('pt-BR')} – ${breaks[i + 1].toLocaleString('pt-BR')}`
            : `>= ${threshold.toLocaleString('pt-BR')}`,
      };
    }),
  ];

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 28,
        left: 8,
        padding: '6px 8px',
        background: 'rgba(255,255,255,0.92)',
        borderRadius: 5,
        boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
        fontSize: 11,
        fontFamily: 'system-ui, sans-serif',
        zIndex: 2,
        pointerEvents: 'none',
        display: 'grid',
        gap: 3,
      }}
    >
      <span style={{ fontWeight: 600, color: '#374151', marginBottom: 2 }}>
        Pop. 60+ (quintis)
      </span>
      {bands.map(({ color, label }) => {
        return (
          <div
            key={label}
            style={{ display: 'flex', alignItems: 'center', gap: 5 }}
          >
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: 2,
                background: color,
                border: '1px solid rgba(0,0,0,0.12)',
                flexShrink: 0,
              }}
            />
            <span style={{ color: '#4b5563' }}>{label}</span>
          </div>
        );
      })}
    </div>
  );
};

/**
 * Hover panel (top-right) with full 2000–2050 trend bars for the hovered
 * district. Active year highlighted in dark blue. Heights are relative to
 * the district's own maximum so smaller districts still show a trend shape.
 */
const SparklinePanel = ({
  layer,
  hovered,
}: {
  layer: VisualizationLayer;
  hovered: FeatureProperties | null;
}) => {
  const property = (layer.colorBy as QuantitativeColorBy | undefined)?.property;
  const activeYear = property
    ? Number(property.replace('pop_total_60_mais_', ''))
    : null;

  const values = hovered
    ? YEARS.map((y) => {
        return {
          year: y,
          value: Number(hovered[`pop_total_60_mais_${y}`] ?? 0),
        };
      })
    : [];
  const maxValue = Math.max(
    ...values.map((v) => {
      return v.value;
    }),
    1
  );

  return (
    <div
      style={{
        position: 'absolute',
        top: 8,
        right: 8,
        width: 220,
        padding: '8px 10px',
        background: 'rgba(255,255,255,0.96)',
        borderRadius: 6,
        boxShadow: '0 1px 6px rgba(0,0,0,0.15)',
        fontSize: 11,
        fontFamily: 'system-ui, sans-serif',
        zIndex: 2,
        pointerEvents: 'none',
      }}
    >
      <strong style={{ display: 'block', marginBottom: 6, fontSize: 12 }}>
        {hovered
          ? String(hovered['nm_distrit'] ?? 'Distrito')
          : 'Passe o mouse'}
      </strong>
      {hovered ? (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(11, 1fr)',
              gap: 2,
              alignItems: 'flex-end',
              height: 52,
            }}
          >
            {values.map(({ year, value }) => {
              const isActive = year === activeYear;
              const heightPct = maxValue > 0 ? (value / maxValue) * 100 : 0;
              return (
                <div
                  key={year}
                  title={`${year}: ${value.toLocaleString('pt-BR')}`}
                  style={{
                    height: `${Math.max(heightPct, 4)}%`,
                    background: isActive ? '#1d4ed8' : '#93c5fd',
                    borderRadius: '1px 1px 0 0',
                    transition: 'background 0.15s',
                  }}
                />
              );
            })}
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 2,
              color: '#9ca3af',
              fontSize: 9,
            }}
          >
            <span>2000</span>
            <span style={{ color: '#1d4ed8', fontWeight: 600 }}>
              {activeYear ?? ''}
            </span>
            <span>2050</span>
          </div>
          <div
            style={{
              marginTop: 5,
              display: 'flex',
              justifyContent: 'space-between',
              color: '#6b7280',
            }}
          >
            <span>Pop. 60+</span>
            <span
              style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}
            >
              {property && hovered[property] != null
                ? Number(hovered[property]).toLocaleString('pt-BR')
                : '—'}
            </span>
          </div>
        </>
      ) : (
        <div style={{ color: '#9ca3af' }}>
          Passe o mouse sobre um distrito para ver a evolucao.
        </div>
      )}
    </div>
  );
};

/**
 * Composite overlay for the Timeline story. Conditionally mounts
 * `LegendOverlay` and `SparklinePanel` based on `overlayMode`.
 */
const TimelineOverlaySet = ({
  layer,
  overlayMode,
  features,
}: {
  layer: VisualizationLayer;
  overlayMode: OverlayMode;
  features: Array<{ properties: FeatureProperties }>;
}) => {
  const hovered = useHoveredFeature(layer);
  const breaks = React.useMemo(() => {
    return computeQuantileBreaks(
      getFeatureValues(
        features,
        (layer.colorBy as QuantitativeColorBy).property ?? ''
      ),
      (layer.colorBy as QuantitativeColorBy).bins ?? 5
    );
  }, [layer, features]);

  return (
    <>
      {overlayMode !== 'none' && <LegendOverlay breaks={breaks} />}
      {overlayMode === 'sparkline' && (
        <SparklinePanel layer={layer} hovered={hovered} />
      )}
    </>
  );
};

// ── Stories ───────────────────────────────────────────────────────────────────

/**
 * Choropleth of Sao Paulo districts by 60+ age bands (small multiples).
 *
 * `layerTemplates` generates one layer per age band property. Use the
 * **View mode** control to switch between tabs / side-by-side / time-slider.
 * Hover a district to see the full property panel.
 *
 * Data: Fundacao SEADE — Evolucao da populacao por sexo e faixa etaria,
 * municipio de Sao Paulo, distritos, 2025 (census-adjusted).
 */
export const AgeBands: StoryFn<StoryArgs> = ({
  basemapStyleUrl,
  presentationMode,
}) => {
  const spec = React.useMemo(() => {
    return applyBasemap(ageBandsSpec, basemapStyleUrl);
  }, [basemapStyleUrl]);

  return (
    <GeoVisProvider spec={spec}>
      <div>
        <strong>Distritos de Sao Paulo — faixas etarias 60+</strong>
        <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 14 }}>
          Coropletico por faixa etaria (60-64, 65-69, 70-74, 75+, total). Use o
          controle de visualizacao para alternar entre abas, grade e
          time-slider.
        </p>
      </div>
      <GeoVisViews
        mode={presentationMode}
        renderView={({ layer }) => {
          if (!layer) return null;
          return <HoverPanel layer={layer} />;
        }}
      />
    </GeoVisProvider>
  );
};

AgeBands.parameters = {
  docs: {
    description: {
      story:
        'Small-multiples choropleth: `layerTemplates` auto-generates one layer per age band. ' +
        'Switch **View mode** between `tabs`, `side-by-side`, `single-filter`, and `time-slider`. ' +
        'Hover a district to inspect all age-band values simultaneously.',
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Spec with `presentation: 'side-by-side'` — all five age-band
 * choropleths rendered simultaneously in a responsive CSS grid.
 *
 * Each panel is a fully independent `GeoVisProvider` scoped to one layer,
 * so panning / zooming one map does NOT affect the others. Useful for
 * comparing spatial distributions across bands at a glance.
 *
 * The spec is identical to `AgeBands` except for the `presentation` field
 * and a smaller per-panel height to fit the grid.
 */
const ageBandsSideBySideTemplate: LayerTemplate = {
  ...ageBandsTemplate,
  presentation: 'side-by-side',
};

const ageBandsSideBySideSpec: PartialVisualizationSpec = {
  ...(distritosMinimal as PartialVisualizationSpec),
  layerTemplates: [ageBandsSideBySideTemplate],
  metadata: { displayPropertyLabels: ageBandsLabels },
};

/**
 * Side-by-side small multiples of the 60+ age bands (60–64, 65–69, 70–74,
 * 75+, total) rendered simultaneously in a responsive grid.
 */
export const AgeBandsSideBySide: StoryFn<BasemapArgs> = ({
  basemapStyleUrl,
}) => {
  const spec = React.useMemo(() => {
    return applyBasemap(ageBandsSideBySideSpec, basemapStyleUrl);
  }, [basemapStyleUrl]);

  return (
    <GeoVisProvider spec={spec}>
      <div>
        <strong>
          Distritos de Sao Paulo — comparativo de faixas etarias 60+
        </strong>
        <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 14 }}>
          Cada painel exibe uma faixa etaria independente (
          <code>presentation: &quot;side-by-side&quot;</code>). A escala de cor
          e os quintis sao calculados separadamente por faixa — compare a
          distribuicao espacial entre os grupos.
        </p>
      </div>
      <GeoVisViews
        mode="side-by-side"
        height={320}
        renderView={({ layer }) => {
          if (!layer) return null;
          return <HoverPanel layer={layer} />;
        }}
      />
    </GeoVisProvider>
  );
};

AgeBandsSideBySide.argTypes = BASEMAP_ARG_TYPE;
AgeBandsSideBySide.args = DEFAULT_BASEMAP_ARGS;

AgeBandsSideBySide.parameters = {
  docs: {
    description: {
      story:
        'The same `layerTemplates` spec as `AgeBands` with `presentation: "side-by-side"`. ' +
        '`GeoVisViews` mounts every view at the same time in a `repeat(auto-fit, minmax(280px, 1fr))` CSS grid. ' +
        'Each panel is an independent `GeoVisProvider` — quantile breaks are computed per layer, ' +
        "so colours are relative to each band's own distribution rather than a shared scale.",
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Time-slider choropleth of total 60+ population per year (2000-2050).
 *
 * Drag the slider to navigate across years. Use the **Overlay** control to
 * add progressive detail:
 * - `none` — choropleth only (clean baseline)
 * - `legend` — 5-class quantile scale, updates per year
 * - `sparkline` — legend + hover panel with full 2000-2050 trend bars
 *
 * Data: Fundacao SEADE — census 2000-2010, projections 2015-2050.
 */
export const Timeline: StoryFn<StoryArgs> = ({
  basemapStyleUrl,
  overlayMode,
}) => {
  const features = useGeoJSONFeatures();
  const spec = React.useMemo(() => {
    return applyBasemap(timelineSpec, basemapStyleUrl);
  }, [basemapStyleUrl]);

  return (
    <GeoVisProvider spec={spec}>
      <div>
        <strong>
          Evolucao da populacao 60+ nos distritos de Sao Paulo (2000-2050)
        </strong>
        <p
          style={{
            margin: '4px 0 0',
            color: '#6b7280',
            fontSize: 13,
            lineHeight: 1.4,
          }}
        >
          Dados censitarios (2000-2010) e projecoes SEADE (2015-2050). Arraste o
          controle para navegar pelos anos.
        </p>
      </div>
      <GeoVisViews
        mode="time-slider"
        renderView={({ layer }) => {
          if (!layer) return null;
          return (
            <TimelineOverlaySet
              layer={layer}
              overlayMode={overlayMode}
              features={features}
            />
          );
        }}
      />
    </GeoVisProvider>
  );
};

Timeline.parameters = {
  docs: {
    description: {
      story:
        '`layerTemplates` expands one choropleth layer per year (2000-2050). ' +
        '`presentation: "time-slider"` renders a range input — each step mounts the ' +
        "corresponding year's sub-spec. Use the **Overlay** control to switch between: " +
        '`none` (choropleth only), `legend` (adds 5-class quantile scale that updates per year), ' +
        '`sparkline` (adds legend + hover trend bars). ' +
        'All year values are pre-embedded in the GeoJSON — no extra fetch needed.',
    },
  },
};
