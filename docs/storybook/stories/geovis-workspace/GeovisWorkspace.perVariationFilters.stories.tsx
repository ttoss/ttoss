import type { Meta, StoryObj } from '@storybook/react-webpack5';
import type { VisualizationSpec } from '@ttoss/geovis';
import {
  GeovisWorkspace,
  type GeovisWorkspaceConfig,
  type GeovisWorkspaceSelection,
} from '@ttoss/geovis-workspace';
import * as React from 'react';

import { withPtBr } from './GeovisWorkspace.decorators';

/**
 * **Filters that belong to a variation.** A map where each variation is backed
 * by different data: some carry a time dimension, some carry categories, some
 * carry neither. The sidebar has to offer each control only where it means
 * something — and say so, rather than going quiet.
 *
 * Two pieces do the work, and neither is new API:
 *
 * - **One tab per control.** `filters` describes a *body*, not a tab, so the
 *   chips and the timeline live in separate sections. Each then gets its own
 *   header and — the point here — its own gate.
 * - **`enabledWhen` per section.** A tab stays in place and dims where its data
 *   does not exist. Dropping the section from the config instead would work, but
 *   the tab bar would reflow on every variation switch; a dimmed tab reads as
 *   *unavailable*, a missing one reads as *gone*.
 *
 * ## Deriving the gates from one source of truth
 *
 * The gate's `values` is a list of variations, and the variations themselves are
 * a list — keep them separate and they drift the first time someone adds a
 * variation. So both come off the same table:
 *
 * ```ts
 * const VARIATIONS = [
 *   { value: 'cozinhas', label: '…', timeline: true, chips: true },
 *   { value: 'ivs',      label: '…', timeline: false, chips: false },
 * ];
 *
 * const withTimeline = VARIATIONS.filter((v) => v.timeline).map((v) => v.value);
 * ```
 *
 * Adding a variation is then one row, and a row that forgets to declare its
 * controls simply gets none — it cannot silently inherit another variation's.
 *
 * ## What to check
 *
 * 1. It opens on **Cozinhas por município**: both **Filtros** and **Linha do
 *    tempo** are live. Scrub the year and toggle a chip — the circles react to
 *    each.
 * 2. Switch to **Assentamentos**. Only **Linha do tempo** dims: that data has
 *    categories but no year. **Filtros** stays live, and its badge still counts.
 *    The two gates are independent, which is the reason for two tabs.
 * 3. Switch to **IVS**. Both dim — neither control describes anything on this
 *    variation — and the card falls back to **Variações** rather than stranding
 *    you on a disabled body.
 * 4. Return to **Cozinhas por município**. The year and the chips are exactly
 *    where you left them: a closed gate freezes state, it does not reset it.
 *
 * See `GatedTimeline` for what a closed gate does to playback and the compact
 * HUD.
 */

const YEARS = [2019, 2020, 2021, 2022, 2023, 2024];
const FIRST_YEAR = YEARS[0];
const LAST_YEAR = YEARS[YEARS.length - 1];

/** The chip ids, shared by the control and the demo's point data. */
const CATEGORIES = [
  { id: 'urbana', label: 'Urbana', emoji: '🏙️' },
  { id: 'rural', label: 'Rural', emoji: '🌾' },
  { id: 'indigena', label: 'Indígena', emoji: '🪶' },
];

/**
 * The variations, each declaring which controls its data backs. This is the
 * table both the variations list and the two gates are built from — the shape a
 * consumer app already uses to pick a legend or a color scale per variation.
 */
const VARIATIONS = [
  {
    value: 'cozinhas',
    label: 'Cozinhas por município',
    icon: 'lucide:map-pin',
    color: '#337C59',
    timeline: true,
    chips: true,
  },
  {
    value: 'cozinhas-taxa',
    label: 'Cozinhas por 100 mil hab.',
    icon: 'lucide:users',
    color: '#0E7490',
    timeline: true,
    chips: true,
  },
  {
    value: 'assentamentos',
    label: 'Assentamentos',
    icon: 'lucide:tent',
    color: '#B45309',
    timeline: false,
    chips: true,
  },
  {
    value: 'ivs',
    label: 'IVS (Censo 2022)',
    icon: 'lucide:bar-chart-2',
    color: '#7C3AED',
    timeline: false,
    chips: false,
  },
  {
    value: 'idhm',
    label: 'IDHM (Censo 2022)',
    icon: 'lucide:trending-up',
    color: '#BE123C',
    timeline: false,
    chips: false,
  },
];

const DEFAULT_VARIATION = VARIATIONS[0].value;

/** The gate lists, derived so they can never drift from the table above. */
const VARIATIONS_WITH_TIMELINE = VARIATIONS.filter((variation) => {
  return variation.timeline;
}).map((variation) => {
  return variation.value;
});

const VARIATIONS_WITH_CHIPS = VARIATIONS.filter((variation) => {
  return variation.chips;
}).map((variation) => {
  return variation.value;
});

/** Deterministic pseudo-random in [0, 1) — keeps the demo stable across renders. */
const pseudo = (n: number): number => {
  const x = Math.sin(n * 91.7 + 47.3) * 27183.1459;
  return x - Math.floor(x);
};

/** Rough Brazil bounding box the demo scatters points across. */
const BBOX = { minLng: -70, maxLng: -38, minLat: -30, maxLat: 2 };

const POINTS = Array.from({ length: 260 }, (_, index) => {
  return {
    id: `p${index}`,
    lng: BBOX.minLng + pseudo(index * 3 + 1) * (BBOX.maxLng - BBOX.minLng),
    lat: BBOX.minLat + pseudo(index * 3 + 2) * (BBOX.maxLat - BBOX.minLat),
    year: FIRST_YEAR + Math.floor(pseudo(index * 3 + 3) * YEARS.length),
    category: CATEGORIES[index % CATEGORIES.length].id,
  };
});

/** Count per year, for the timeline's histogram. */
const countUpTo = (year: number) => {
  return POINTS.filter((point) => {
    return point.year <= year;
  }).length;
};

/**
 * Applies only the controls the current variation declares. A variation without
 * a timeline draws every year even though `selection.ano` still holds the last
 * value — the gate freezes that value, it does not clear it, so the consumer is
 * the one who decides to ignore it.
 */
const visiblePoints = ({
  variation,
  year,
  categories,
}: {
  variation: (typeof VARIATIONS)[number];
  year: number;
  categories: string[];
}) => {
  return POINTS.filter((point) => {
    if (variation.timeline && point.year > year) {
      return false;
    }

    if (
      variation.chips &&
      categories.length > 0 &&
      !categories.includes(point.category)
    ) {
      return false;
    }

    return true;
  });
};

const buildSpec = ({
  variation,
  year,
  categories,
}: {
  variation: (typeof VARIATIONS)[number];
  year: number;
  categories: string[];
}): VisualizationSpec => {
  const visible = visiblePoints({ variation, year, categories });

  return {
    engine: 'maplibre',
    view: { center: [-54, -14], zoom: 3.1 },
    sources: [
      {
        id: 'pontos',
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: visible.map((point) => {
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
          circleColor: variation.color,
          circleRadius: 5,
          circleOpacity: 0.75,
          circleStrokeColor: '#ffffff',
          circleStrokeWidth: 1,
        },
      },
    ],
  };
};

const config: GeovisWorkspaceConfig = {
  appearance: 'bare',
  leftSidebar: {
    initialState: 'open',
    sections: [
      {
        id: 'variacoes',
        header: { title: 'Variações', icon: 'lucide:layout-list' },
        body: {
          kind: 'variations',
          menuId: 'variacao',
          defaultValue: DEFAULT_VARIATION,
          groups: [
            {
              id: 'mapas',
              label: 'Mapas',
              variations: VARIATIONS.map((variation) => {
                return {
                  value: variation.value,
                  label: variation.label,
                  icon: variation.icon,
                };
              }),
            },
          ],
        },
      },
      {
        id: 'filtros',
        header: { title: 'Filtros', icon: 'lucide:filter' },
        // Live wherever the data carries categories — a different list from the
        // timeline's, which is the whole reason these are two sections.
        enabledWhen: { menuId: 'variacao', values: VARIATIONS_WITH_CHIPS },
        body: {
          kind: 'filters',
          blocks: [
            {
              id: 'categorias',
              title: 'Categoria',
              icon: 'lucide:filter',
              control: {
                kind: 'chips',
                menuId: 'categoria',
                multiple: true,
                options: CATEGORIES,
              },
            },
          ],
        },
      },
      {
        id: 'linha-do-tempo',
        header: { title: 'Linha do tempo', icon: 'lucide:calendar-clock' },
        enabledWhen: { menuId: 'variacao', values: VARIATIONS_WITH_TIMELINE },
        body: {
          kind: 'filters',
          blocks: [
            {
              id: 'ano',
              title: 'Ano',
              icon: 'lucide:calendar-clock',
              control: {
                kind: 'timeline',
                menuId: 'ano',
                min: FIRST_YEAR,
                max: LAST_YEAR,
                step: 1,
                defaultValue: LAST_YEAR,
                unitLabel: 'pontos',
                histogram: YEARS.map((year) => {
                  return { key: year, count: countUpTo(year) };
                }),
              },
            },
          ],
        },
      },
    ],
  },
};

const PerVariationFiltersDemo = () => {
  const [selection, setSelection] = React.useState<GeovisWorkspaceSelection>({
    variacao: DEFAULT_VARIATION,
    ano: String(LAST_YEAR),
  });

  const variation =
    VARIATIONS.find((entry) => {
      return entry.value === selection.variacao;
    }) ?? VARIATIONS[0];

  const year = Number(selection.ano) || LAST_YEAR;

  // The chips publish their ids comma-joined; `''` while nothing is selected.
  // Kept as the raw string so it can be a dependency — splitting it inside the
  // memo avoids a fresh array identity on every render.
  const categoria = selection.categoria ?? '';

  const spec = React.useMemo(() => {
    return buildSpec({
      variation,
      year,
      categories: categoria.split(',').filter(Boolean),
    });
  }, [variation, year, categoria]);

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
  title: 'Geovis Workspace/PerVariationFilters',
  component: PerVariationFiltersDemo,
  tags: ['autodocs'],
  decorators: [withPtBr],
} satisfies Meta<typeof PerVariationFiltersDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Each variation lights up only the controls its data backs: **Cozinhas** both,
 * **Assentamentos** the chips alone, **IVS** and **IDHM** neither.
 */
export const Default: Story = {};
