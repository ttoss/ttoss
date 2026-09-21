import type { Meta, StoryObj } from '@storybook/react-webpack5';
import type { MapDataRow, VisualizationSpec } from '@ttoss/geovis';
import {
  GeovisWorkspace,
  type GeovisWorkspaceConfig,
  type GeovisWorkspaceSelection,
} from '@ttoss/geovis-workspace';
import * as React from 'react';

import { withPtBr } from './GeovisWorkspace.decorators';
import { MUNICIPIOS } from './GeovisWorkspace.municipios';

/**
 * The **locator**: `kind: 'locator'` gives a filters section a search field over
 * the entries the app declares — a combobox with a results list the arrow keys
 * walk, the picks made so far offered back, and a card for the current one.
 *
 * The entries come from the app's own file, here the 27 capitals and in a real
 * deployment all 5.570 municipalities, mapped onto the options one row at a
 * time:
 *
 * ```ts
 * options: MUNICIPIOS.map((m) => ({
 *   id: m.id,
 *   label: m.nome,
 *   sublabel: m.uf,
 *   view: { center: [m.lng, m.lat], zoom: 9 },
 *   animation: { duration: 2400, curve: 1.6, essential: true },
 * }))
 * ```
 *
 * One row is a name to search, a camera to travel to, and an id to publish, so
 * nothing about a municipality is declared twice and the spec stays out of it
 * entirely. Declaring a `ViewPreset` per row instead would put thousands of
 * entries in a document revalidated on every rebuild, and list them all back in
 * every repair payload, to name positions no agent should be enumerating —
 * `viewPresetId` stays for the handful of framings an app does curate and name.
 *
 * The camera goes through `runtime.setView()` and is applied once: the spec is
 * never rebuilt to pan, so the layers and sources on screen are not re-created,
 * and the move is not pushed back at the adapter as a declarative change —
 * which is what lets the flight run to the end instead of being cut short by
 * the same camera arriving again a frame later.
 *
 * Searching ignores case and accents, which is what makes a list of Brazilian
 * place names usable: `sao` finds **São Paulo** and **São Luís**, `goiania`
 * finds **Goiânia**. The result still reads with its accents, because the
 * matched run is mapped back onto the label as written.
 *
 * ## What to check
 *
 * 1. Type `s` — nothing. One letter is not a search, it is the start of one;
 *    `minChars` is what decides when the list is worth showing.
 * 2. Type `sao`. Two capitals answer, neither spelled the way you typed, and
 *    each marks the run it matched on inside its own spelling.
 * 3. Walk the list with ↑/↓ and take one with **Enter** — the text cursor never
 *    leaves the field, so the query stays editable while the list is walked.
 *    The pointer moves the same cursor, so a row under the mouse is the row
 *    Enter would take.
 * 4. On the pick, the camera pulls back over the country, crosses, and settles
 *    on the city over about two and a half seconds. The points do not blink:
 *    only the camera moved. Pick another and it flies again; drag the map away
 *    and pick the same one, and it re-centres.
 * 5. Clear the field and pick from **Buscas recentes** — same flight, without
 *    retyping. Removing the card's pick reports "nothing chosen" back to the
 *    app but leaves the camera where it is: clearing a search does not undo a
 *    journey.
 * 6. Type `zzz` for the empty state, and **Esc** to close the list while
 *    keeping what you typed.
 *
 * Every capital arrives at `zoom: 9`, since the file carries a seat coordinate
 * rather than a boundary: a `center`/`zoom` frames an area only by
 * approximation, and a municipality the size of Altamira and one the size of
 * Santos would want very different ones. Framing the real shape waits on a
 * `fitBounds` the vocabulary does not have yet.
 */

/** Deterministic pseudo-random in [0, 1) — keeps the demo stable across renders. */
const pseudo = (n: number): number => {
  const x = Math.sin(n * 91.7 + 47.3) * 27183.1459;
  return x - Math.floor(x);
};

/**
 * The categories, with the colors the legend maps them to. One table, so a
 * record and its swatch cannot come to disagree.
 */
const CATEGORIES = [
  { id: 'urbana', label: 'Urbana', color: '#337C59' },
  { id: 'rural', label: 'Rural', color: '#B45309' },
  { id: 'indigena', label: 'Indígena', color: '#7C3AED' },
];

/**
 * Records scattered around each municipality, so a pick always lands on
 * something to look at rather than on an empty basemap.
 */
const RECORDS = MUNICIPIOS.flatMap((municipio, municipioIndex) => {
  return Array.from({ length: 30 }, (_, index) => {
    const seed = municipioIndex * 97 + index * 3;
    return {
      id: `r-${municipio.id}-${index}`,
      lng: municipio.lng + (pseudo(seed + 1) - 0.5) * 4,
      lat: municipio.lat + (pseudo(seed + 2) - 0.5) * 4,
      category: CATEGORIES[Math.floor(pseudo(seed + 3) * CATEGORIES.length)].id,
    };
  });
});

/** Records per municipality, for the readout each result carries. */
const RECORDS_BY_MUNICIPIO = new Map(
  MUNICIPIOS.map((municipio) => {
    return [
      municipio.id,
      RECORDS.filter((record) => {
        return record.id.startsWith(`r-${municipio.id}-`);
      }).length,
    ];
  })
);

const CATEGORY_COLORS = Object.fromEntries(
  CATEGORIES.map((category) => {
    return [category.id, category.color];
  })
);

const rows: MapDataRow[] = RECORDS.map((record) => {
  return { geometryId: record.id, value: record.category };
});

/**
 * Built once, at module scope. Nothing in this story rebuilds it — which is the
 * point: a locator pick moves the camera through the runtime, and a spec rebuilt
 * on every pick would re-create every source and layer just to pan.
 */
const spec: VisualizationSpec = {
  engine: 'maplibre',
  // Where the map opens, and the only camera the spec carries. A pick moves the
  // map through `setView` without touching this.
  view: { center: [-54, -14], zoom: 3.1 },
  attributionControlEnabled: false,
  sources: [
    {
      id: 'registros',
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: RECORDS.map((record) => {
          return {
            type: 'Feature',
            // The join key lives in `properties`: MapLibre runs a top-level
            // `id` through `parseInt`, and these are not numbers.
            properties: { registroId: record.id },
            geometry: {
              type: 'Point',
              coordinates: [record.lng, record.lat],
            },
          };
        }),
      },
    },
  ],
  layers: [
    {
      id: 'registros-circulos',
      sourceId: 'registros',
      geometry: 'point',
      mapDataId: 'categorias',
      activeLegendId: 'categorias',
      paint: {
        circleRadius: 5,
        circleOpacity: 0.8,
        circleStrokeColor: '#FFFFFF',
        circleStrokeWidth: 1,
      },
    },
  ],
  mapData: [
    {
      mapDataId: 'categorias',
      mapId: 'registros',
      joinKey: 'registroId',
      data: rows,
    },
  ],
  legends: [
    {
      id: 'categorias',
      title: 'Categoria do registro',
      subtitle: `${RECORDS.length} registros em ${MUNICIPIOS.length} municípios.`,
      position: 'bottom-right',
      // The left sidebar card's own inset, so the two cards agree.
      offset: 12,
      colorBy: {
        type: 'categorical',
        property: 'value',
        mapping: CATEGORY_COLORS,
      },
    },
  ],
};

const config: GeovisWorkspaceConfig = {
  appearance: 'bare',
  // No right sidebar: nothing here is about the panels it hosts, and its
  // `metadata` panel alone was enough to open it over the map.
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
              id: 'local',
              title: 'Município',
              icon: 'lucide:map-pin',
              control: {
                kind: 'locator',
                menuId: 'local',
                placeholder: 'Buscar município...',
                minChars: 2,
                // The app's file, mapped straight onto the options: one row is
                // a name to search, a camera to travel to, and an id to
                // publish. The flight is long enough to be worth watching, and
                // `essential` keeps it one for a viewer whose system asks for
                // reduced motion — here the movement *is* the answer to "where
                // is this place", so it carries meaning rather than decorating.
                options: MUNICIPIOS.map((municipio) => {
                  return {
                    id: municipio.id,
                    label: municipio.nome,
                    sublabel: municipio.uf,
                    view: { center: [municipio.lng, municipio.lat], zoom: 9 },
                    animation: {
                      duration: 2400,
                      curve: 1.6,
                      essential: true,
                    },
                    // Already formatted: the readout is the app's to phrase,
                    // and the locale it is grouped for is the app's too.
                    value: `${RECORDS_BY_MUNICIPIO.get(municipio.id)} reg.`,
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

const InputSearchDemo = () => {
  /*
   * The pick is published under `local` and held here, which is all the app has
   * to do with it: the camera already moved. Reopening with it set — a restored
   * permalink — brings the card back without moving anything, since the spec's
   * own `view` is what frames the first paint.
   */
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
  title: 'Geovis Workspace/Input search',
  component: InputSearchDemo,
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
} satisfies Meta<typeof InputSearchDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Steps 1–6: the field, the accents, the keyboard, the flight, and the clears. */
export const Desktop: Story = {
  globals: { viewport: { value: 'roomy', isRotated: false } },
};

/**
 * The same field at 390×844, which is where it is worth looking at: the input,
 * its results dropdown and the selected card all compete for one narrow column.
 */
export const Mobile: Story = {
  globals: { viewport: { value: 'compact', isRotated: false } },
};
