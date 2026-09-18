import type { Meta, StoryObj } from '@storybook/react-webpack5';
import type {
  GeoJSONFeatureCollection,
  VisualizationSpec,
} from '@ttoss/geovis';
import {
  GeovisWorkspace,
  type GeovisWorkspaceConfig,
  type GeovisWorkspaceSelection,
} from '@ttoss/geovis-workspace';
import * as React from 'react';

import { withPtBr } from './GeovisWorkspace.decorators';
import { MUNICIPIOS } from './GeovisWorkspace.municipios';

/**
 * The **locator over a boundary mesh**: the entries are shapes already drawn on
 * the map, so a pick frames the shape and marks it, rather than flying to a
 * coordinate the app had to know in advance.
 *
 * The option says which feature it stands for and nothing else about it:
 *
 * ```ts
 * options: MUNICIPIOS.map((m) => ({
 *   id: m.ibge,
 *   label: m.nome,
 *   sublabel: m.uf,
 *   feature: { layerId: 'municipios', featureId: Number(m.ibge) },
 *   animation: { duration: 2400, essential: true },
 * }))
 * ```
 *
 * One key — the IBGE code — searches, frames, marks, and travels in the
 * permalink. No coordinates anywhere in the sidebar's config: the geometry is
 * already in the source the layer draws, and that is where the bounds are read
 * from.
 *
 * A pick dispatches two actions. `fit-feature` computes the feature's box and
 * compiles to `runtime.setView({ bounds })`, with `estimateMaxZoom` capping how
 * close the camera may end up — a small municipality is framed with its
 * surroundings instead of filling the screen with one shape. `select-feature`
 * sets `feature-state.selected`, which is what the layer's `selectedPaint`
 * draws: the thicker, greener outline.
 *
 * ```ts
 * { id: 'municipios', geometry: 'polygon', sourceId: 'malha',
 *   selectedPaint: { lineColor: '#337C59', lineWidth: 3 } }
 * ```
 *
 * The two are separate on purpose, and the marking outlives the framing: drag
 * the map away and the shape stays marked as the one that was searched for.
 *
 * ## What to check
 *
 * 1. Type `sao` — **São Paulo** and **São Luís** answer, neither spelled the way
 *    you typed, each marking the run it matched inside its own spelling.
 * 2. Pick one. The camera flies to the shape's own extent and the outline
 *    thickens on it alone.
 * 3. Now pick **Manaus**, then **Vitória**. The camera ends up much further out
 *    for one than the other — the zoom is the size of the territory, not a
 *    number chosen in advance. That is the whole difference from the
 *    coordinate-based search in *Input search*, where every capital arrived at
 *    `zoom: 9`.
 * 4. Drag the map away from the framed shape. It stays outlined: what is marked
 *    is what was searched for, not where the camera happens to be.
 * 5. Clear the field. The outline goes out and the camera stays — clearing a
 *    search does not undo a journey.
 * 6. Pick from **Buscas recentes**: same framing, same marking, without
 *    retyping.
 *
 * The mesh here is invented — blobs around each capital's seat, deliberately of
 * very different sizes so the framing has something to say. A real deployment
 * loads IBGE's own malha, and nothing about the config changes: the shapes
 * arrive keyed by the same code the file already carries.
 */

/** Deterministic pseudo-random in [0, 1) — keeps the mesh stable across renders. */
const pseudo = (n: number): number => {
  const x = Math.sin(n * 91.7 + 47.3) * 27183.1459;
  return x - Math.floor(x);
};

/**
 * Half-width in degrees per municipality, so the mesh is not all one size.
 * Loosely the real order of magnitude — an Amazonian territory against a
 * coastal one — because a framing that always lands at the same zoom would
 * demonstrate nothing.
 */
const EXTENT: Record<string, number> = {
  manaus: 2.6,
  'porto-velho': 1.9,
  'boa-vista': 1.7,
  macapa: 1.5,
  palmas: 1.1,
  cuiaba: 1.0,
  'campo-grande': 0.9,
  'sao-luis': 0.45,
  teresina: 0.5,
  brasilia: 0.55,
  goiania: 0.35,
  'belo-horizonte': 0.3,
  curitiba: 0.22,
  'porto-alegre': 0.28,
  'sao-paulo': 0.3,
  'rio-de-janeiro': 0.25,
  salvador: 0.2,
  recife: 0.14,
  vitoria: 0.12,
  aracaju: 0.16,
  maceio: 0.18,
  natal: 0.16,
  'joao-pessoa': 0.15,
  fortaleza: 0.22,
  florianopolis: 0.2,
  belem: 0.5,
  'rio-branco': 1.2,
};

/** An irregular ring around a seat — a stand-in for a real municipal boundary. */
const blob = ({
  lng,
  lat,
  extent,
  seed,
}: {
  lng: number;
  lat: number;
  extent: number;
  seed: number;
}): [number, number][] => {
  const points = 14;
  const ring = Array.from({ length: points }, (_, index) => {
    const angle = (index / points) * Math.PI * 2;
    // Radius wobbles between 70% and 100% of the extent, so the outline reads
    // as a territory rather than as a circle someone forgot to edit.
    const radius = extent * (0.7 + pseudo(seed + index) * 0.3);
    return [
      lng + Math.cos(angle) * radius,
      // Longitude degrees shrink towards the poles; the 0.75 keeps the shapes
      // from looking stretched at Brazilian latitudes without pretending to be
      // a projection.
      lat + Math.sin(angle) * radius * 0.75,
    ] as [number, number];
  });
  return [...ring, ring[0]];
};

const malha: GeoJSONFeatureCollection = {
  type: 'FeatureCollection',
  features: MUNICIPIOS.map((municipio, index) => {
    return {
      type: 'Feature',
      // The IBGE code as the feature's own id: numeric, because MapLibre runs a
      // top-level geojson `id` through `parseInt`. It is the same key the
      // locator publishes and the same one `fit-feature` addresses.
      id: Number(municipio.ibge),
      properties: { nome: municipio.nome, uf: municipio.uf },
      geometry: {
        type: 'Polygon',
        coordinates: [
          blob({
            lng: municipio.lng,
            lat: municipio.lat,
            extent: EXTENT[municipio.id] ?? 0.3,
            seed: index * 31,
          }),
        ],
      },
    };
  }),
};

/**
 * Built once, at module scope. A pick moves the camera through the runtime, so
 * nothing here is rebuilt to frame a shape.
 */
const spec: VisualizationSpec = {
  engine: 'maplibre',
  view: { center: [-54, -14], zoom: 3.1 },
  attributionControlEnabled: false,
  sources: [{ id: 'malha', type: 'geojson', data: malha }],
  layers: [
    {
      id: 'municipios',
      sourceId: 'malha',
      geometry: 'polygon',
      paint: {
        fillColor: '#337C59',
        fillOpacity: 0.18,
        lineColor: '#337C59',
      },
      // What draws the search result: a companion line layer filtered on
      // `feature-state.selected`, which `select-feature` is what sets.
      selectedPaint: { lineColor: '#266044', lineWidth: 3 },
      hoverPaint: { lineColor: '#337C59', lineWidth: 2 },
    },
  ],
};

const config: GeovisWorkspaceConfig = {
  appearance: 'bare',
  slots: {
    legend: { hidden: true },
    warnings: { hidden: true },
    inspector: { hidden: true },
    metadata: { hidden: true },
  },
  leftSidebar: {
    initialState: 'open',
    sections: [
      {
        id: 'busca',
        header: { title: 'Busca', icon: 'lucide:search' },
        body: {
          kind: 'filters',
          blocks: [
            {
              id: 'municipio',
              title: 'Município',
              icon: 'lucide:land-plot',
              control: {
                kind: 'locator',
                menuId: 'municipio',
                placeholder: 'Buscar município...',
                minChars: 2,
                // No coordinates: the entry names the shape, and the bounds are
                // read off the source the layer draws.
                options: MUNICIPIOS.map((municipio) => {
                  return {
                    id: municipio.ibge,
                    label: municipio.nome,
                    sublabel: municipio.uf,
                    feature: {
                      layerId: 'municipios',
                      // The mesh keys on the numeric code; the option publishes
                      // the string one, which is what a permalink carries.
                      featureId: Number(municipio.ibge),
                    },
                    animation: {
                      duration: 2400,
                      curve: 1.6,
                      essential: true,
                    },
                  };
                }),
              },
            },
          ],
        },
      },
    ],
  },
};

const PolygonSearchDemo = () => {
  const [selection, setSelection] = React.useState<GeovisWorkspaceSelection>(
    {}
  );

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

const meta = {
  title: 'Geovis Workspace/Polygon search',
  component: PolygonSearchDemo,
  tags: ['autodocs'],
  decorators: [withPtBr],
  parameters: {
    viewport: {
      options: {
        compact: {
          name: 'Mobile (below the breakpoint)',
          styles: { height: '844px', width: '390px' },
          type: 'mobile',
        },
        roomy: {
          name: 'Desktop (above the breakpoint)',
          styles: { height: '800px', width: '1280px' },
          type: 'desktop',
        },
      },
    },
  },
} satisfies Meta<typeof PolygonSearchDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Steps 1–6: the search, the framing that varies, the outline, and the clears. */
export const Desktop: Story = {
  globals: { viewport: { value: 'roomy', isRotated: false } },
};

/**
 * The same search at 390×844. Worth checking that the framed shape is not left
 * under the sidebar: the padding is symmetric, so a narrow screen frames the
 * territory against a column that covers part of it.
 */
export const Mobile: Story = {
  globals: { viewport: { value: 'compact', isRotated: false } },
};
