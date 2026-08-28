import type { Meta, StoryObj } from '@storybook/react-webpack5';
import type { VisualizationSpec } from '@ttoss/geovis';
import {
  GeovisWorkspace,
  type GeovisWorkspaceConfig,
  type GeovisWorkspaceSelection,
} from '@ttoss/geovis-workspace';
import * as React from 'react';

/**
 * **`footer`** mounts a slim, square bar flush against the map's bottom edge,
 * naming the variation currently selected in the left sidebar.
 *
 * The left sidebar already says this in its own footer — but that goes away
 * with the sidebar, which is exactly when "what am I looking at?" gets hard to
 * answer. The bar stays whatever the sidebar is doing.
 *
 * ```ts
 * footer: true                    // centred — the default
 * footer: { position: 'right' }   // hugs the bottom-right corner
 * ```
 *
 * The label comes from the active variation, so there is nothing else to
 * configure. It renders nothing when the sidebar declares no `variations`
 * section, or when the selection matches no variation.
 *
 * ## What to check
 *
 * `WithFooter` (the default, centred):
 *
 * 1. The bar sits centred on the bottom edge, reading **Cozinhas por
 *    município** — flush, square, sized to its text rather than to the map.
 * 2. Pick another variation — the bar follows immediately.
 * 3. Close the sidebar (the **✕**). The bar stays; it is the only thing still
 *    naming the view.
 * 4. Pick **Índice de vulnerabilidade social por município e faixa de renda** —
 *    a deliberately long label. The bar stops at its cap and ellipsises rather
 *    than growing across the map; the full text is in the `title` tooltip.
 * 5. Click straight through the bar onto the map: it is inert, so the click
 *    lands on what is underneath.
 *
 * `PositionLeft` and `PositionRight` move it to either corner;
 * `WithoutFooter` omits the field entirely.
 *
 * ## Why `'center'` is the default
 *
 * MapLibre keeps its attribution control in the bottom-right corner, and it is
 * not ours to move. Centred, the bar never meets it — which is why
 * `PositionRight` is the one story where the two overlap unless the spec also
 * sets `attributionControlEnabled: false`.
 *
 * When the compact timeline bar appears it claims the whole bottom edge, and
 * the footer steps up to clear it — the same clearance the map's layer control
 * uses. That lift is the one time the bar is not flush.
 */

const VARIATIONS = [
  { value: 'municipios', label: 'Cozinhas por município', icon: 'lucide:map' },
  {
    value: 'pontos',
    label: 'Localização das cozinhas',
    icon: 'lucide:map-pin',
  },
  {
    value: 'ivs',
    // Long on purpose: it is what makes the width cap visible.
    label: 'Índice de vulnerabilidade social por município e faixa de renda',
    icon: 'lucide:shield-alert',
  },
];

const COLORS: Record<string, string> = {
  municipios: '#337C59',
  pontos: '#B45309',
  ivs: '#1D4ED8',
};

/** Deterministic pseudo-random in [0, 1) — keeps the demo stable across renders. */
const pseudo = (n: number): number => {
  const x = Math.sin(n * 91.7 + 47.3) * 27183.1459;
  return x - Math.floor(x);
};

const BBOX = { minLng: -70, maxLng: -38, minLat: -30, maxLat: 2 };

const POINTS = Array.from({ length: 120 }, (_, index) => {
  return {
    id: `p${index}`,
    lng: BBOX.minLng + pseudo(index * 2 + 1) * (BBOX.maxLng - BBOX.minLng),
    lat: BBOX.minLat + pseudo(index * 2 + 2) * (BBOX.maxLat - BBOX.minLat),
  };
});

/** Recolors the same points per variation, so switching is visible on the map. */
const buildSpec = (variation: string): VisualizationSpec => {
  return {
    engine: 'maplibre',
    view: { center: [-54, -14], zoom: 3.1 },
    sources: [
      {
        id: 'pontos',
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: POINTS.map((point) => {
            return {
              type: 'Feature',
              id: point.id,
              properties: {},
              geometry: { type: 'Point', coordinates: [point.lng, point.lat] },
            };
          }),
        },
      },
    ],
    layers: [
      {
        id: 'pontos-circulos',
        sourceId: 'pontos',
        geometry: 'point',
        paint: {
          circleColor: COLORS[variation] ?? '#337C59',
          circleRadius: 5,
          circleOpacity: 0.75,
          circleStrokeColor: '#ffffff',
          circleStrokeWidth: 1,
        },
      },
    ],
  };
};

const buildConfig = (
  footer: GeovisWorkspaceConfig['footer']
): GeovisWorkspaceConfig => {
  return {
    appearance: 'bare',
    footer,
    leftSidebar: {
      initialState: 'open',
      sections: [
        {
          id: 'variacoes',
          header: { title: 'Variações', icon: 'lucide:layout-list' },
          body: {
            kind: 'variations',
            menuId: 'variacao',
            defaultValue: 'municipios',
            groups: [
              { id: 'camadas', label: 'Camadas', variations: VARIATIONS },
            ],
          },
        },
      ],
    },
  };
};

const withFooterConfig = buildConfig(true);
const withoutFooterConfig = buildConfig(false);
const leftConfig = buildConfig({ position: 'left' });
const rightConfig = buildConfig({ position: 'right' });

const Demo = ({ config }: { config: GeovisWorkspaceConfig }) => {
  const [selection, setSelection] = React.useState<GeovisWorkspaceSelection>({
    variacao: 'municipios',
  });

  const variation = selection.variacao ?? 'municipios';
  const spec = React.useMemo(() => {
    return buildSpec(variation);
  }, [variation]);

  return (
    <div style={{ height: 640 }}>
      <GeovisWorkspace
        config={config}
        visualizationSpec={spec}
        variables={selection}
        onVariableChange={setSelection}
      />
    </div>
  );
};

const MapFooterDemo = () => {
  return <Demo config={withFooterConfig} />;
};

const meta = {
  title: 'Geovis Workspace/MapFooter',
  component: MapFooterDemo,
  tags: ['autodocs'],
} satisfies Meta<typeof MapFooterDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

/** `footer: true` — the bar names the active variation, sidebar open or shut. */
export const WithFooter: Story = {};

/** The field omitted, for contrast: the bottom edge holds only the attribution. */
export const WithoutFooter: Story = {
  render: () => {
    return <Demo config={withoutFooterConfig} />;
  },
};

/** `{ position: 'left' }` — hugs the bottom-left corner. */
export const PositionLeft: Story = {
  render: () => {
    return <Demo config={leftConfig} />;
  },
};

/**
 * `{ position: 'right' }` — hugs the bottom-right corner, which is also where
 * MapLibre keeps its attribution control. Expect the two to overlap unless the
 * spec sets `attributionControlEnabled: false`.
 */
export const PositionRight: Story = {
  render: () => {
    return <Demo config={rightConfig} />;
  },
};
