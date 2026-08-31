import type { Meta, StoryObj } from '@storybook/react-webpack5';
import type { VisualizationSpec } from '@ttoss/geovis';
import {
  GeovisWorkspace,
  type GeovisWorkspaceConfig,
  type GeovisWorkspaceSelection,
} from '@ttoss/geovis-workspace';
import * as React from 'react';

/**
 * A **gated section**: `enabledWhen` ties a sidebar section to another menu's
 * selection, so a control only offers itself where it means something.
 *
 * A timeline is the case it exists for. Only some variations are backed by data
 * with a time dimension; on the others the control would still scrub, still
 * publish a year, and change nothing on the map. Gating the section — rather
 * than dropping it from the config — keeps the tab bar's layout fixed, so the
 * tab reads as unavailable instead of appearing and vanishing as variations
 * change.
 *
 * Here `Pontos por ano` carries a timeline; `Densidade` and `Regiões` do not.
 *
 * ```ts
 * { id: 'filtros', enabledWhen: { menuId: 'variacao', values: ['pontos'] }, ... }
 * ```
 *
 * ## What to check
 *
 * In `Desktop`:
 *
 * 1. It opens on **Pontos por ano**, and the **Timeline** tab is live. Scrub to
 *    a middle year — the circles grow with it.
 * 2. Switch to **Densidade**. The Timeline tab dims, stops responding to clicks
 *    and drops out of the focus order (Tab past it).
 * 3. Do it again from the Timeline tab itself: open **Timeline**, then switch to
 *    **Regiões** from the Variações tab. The card falls back to Variações rather
 *    than stranding you on a body whose tab is disabled.
 * 4. Return to **Pontos por ano**. The year is exactly where you left it — the
 *    gate freezes the value, it does not reset it.
 *
 * In `Mobile`, for the HUD:
 *
 * 5. On **Pontos por ano**, open **Timeline** and press **Play**: the sidebar
 *    closes (`closeOnPlay`) and the HUD takes over at the bottom.
 * 6. Reopen the menu and pick **Densidade**. The menu closes (`closeOnSelect`),
 *    and the HUD does *not* come back. Without the gate it would: playback has
 *    started, the HUD was never dismissed, and the sidebar is closed again.
 * 7. Pick **Pontos por ano** again — the HUD returns, still frozen at the year
 *    playback had reached.
 */

const YEARS = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024];
const FIRST_YEAR = YEARS[0];
const LAST_YEAR = YEARS[YEARS.length - 1];

/** Deterministic pseudo-random in [0, 1) — keeps the demo stable across renders. */
const pseudo = (n: number): number => {
  const x = Math.sin(n * 91.7 + 47.3) * 27183.1459;
  return x - Math.floor(x);
};

/** Rough Brazil bounding box the demo scatters points across. */
const BBOX = { minLng: -70, maxLng: -38, minLat: -30, maxLat: 2 };

/** Count per year, growing — so the timeline has a visible effect on the map. */
const countForYear = (year: number) => {
  return 20 + (year - FIRST_YEAR) * 12;
};

const POINTS = Array.from({ length: countForYear(LAST_YEAR) }, (_, index) => {
  return {
    id: `p${index}`,
    lng: BBOX.minLng + pseudo(index * 2 + 1) * (BBOX.maxLng - BBOX.minLng),
    lat: BBOX.minLat + pseudo(index * 2 + 2) * (BBOX.maxLat - BBOX.minLat),
  };
});

/** The variations, and whether each is backed by data with a time dimension. */
const VARIATIONS = [
  { value: 'pontos', label: 'Pontos por ano', icon: 'lucide:map-pin' },
  { value: 'densidade', label: 'Densidade', icon: 'lucide:circle-dot' },
  { value: 'regioes', label: 'Regiões', icon: 'lucide:map' },
];

/** Only this variation reads the timeline; the gate below names it. */
const TIMED_VARIATION = 'pontos';

const paintForVariation = ({
  variation,
  year,
}: {
  variation: string;
  year: number;
}) => {
  if (variation === 'densidade') {
    return { circleColor: '#B45309', circleRadius: 7, circleOpacity: 0.35 };
  }

  if (variation === 'regioes') {
    return { circleColor: '#1D4ED8', circleRadius: 5, circleOpacity: 0.5 };
  }

  return {
    circleColor: '#337C59',
    circleRadius: 4 + (year - FIRST_YEAR) * 0.6,
    circleOpacity: 0.75,
  };
};

/**
 * The timed variation slices its points by year; the others always draw the
 * whole set, which is exactly why the timeline has nothing to say on them.
 */
const buildSpec = ({
  variation,
  year,
}: {
  variation: string;
  year: number;
}): VisualizationSpec => {
  const visible =
    variation === TIMED_VARIATION
      ? POINTS.slice(0, countForYear(year))
      : POINTS;

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
          ...paintForVariation({ variation, year }),
          circleStrokeColor: '#ffffff',
          circleStrokeWidth: 1,
        },
      },
    ],
    // The bottom-left rail the HUD lifts clear of; see the TimelineHud story.
    control: {
      id: 'camadas',
      label: 'Camadas',
      position: 'bottom-left',
      trigger: 'click',
      items: [{ id: 'pontos', label: 'Pontos', layers: ['pontos-circulos'] }],
    },
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
          defaultValue: TIMED_VARIATION,
          // Compact-only: picking a variation closes the menu, which is what
          // makes step 6 observable — the HUD would otherwise be hidden merely
          // because the sidebar is open.
          closeOnSelect: true,
          groups: [{ id: 'camadas', label: 'Camadas', variations: VARIATIONS }],
        },
      },
      {
        id: 'filtros',
        header: { title: 'Timeline', icon: 'lucide:clock' },
        // The gate: live only while `variacao` is a variation the timeline
        // actually drives. Every other value dims the tab, hides the HUD and
        // freezes the year.
        enabledWhen: { menuId: 'variacao', values: [TIMED_VARIATION] },
        body: {
          kind: 'filters',
          blocks: [
            {
              id: 'periodo',
              title: 'Linha do tempo',
              icon: 'lucide:calendar-clock',
              defaultOpen: true,
              control: {
                kind: 'timeline',
                menuId: 'ano',
                min: FIRST_YEAR,
                max: LAST_YEAR,
                step: 1,
                defaultValue: FIRST_YEAR,
                unitLabel: 'pontos',
                closeOnPlay: true,
                histogram: YEARS.map((year) => {
                  return { key: year, count: countForYear(year) };
                }),
              },
            },
          ],
        },
      },
    ],
  },
};

const GatedTimelineDemo = () => {
  const [selection, setSelection] = React.useState<GeovisWorkspaceSelection>({
    variacao: TIMED_VARIATION,
    ano: String(FIRST_YEAR),
  });

  const variation = selection.variacao ?? TIMED_VARIATION;
  const year = Number(selection.ano) || FIRST_YEAR;

  const spec = React.useMemo(() => {
    return buildSpec({ variation, year });
  }, [variation, year]);

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
  title: 'Geovis Workspace/GatedTimeline',
  component: GatedTimelineDemo,
  tags: ['autodocs'],
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
} satisfies Meta<typeof GatedTimelineDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Steps 1–4: the tab dimming, the fallback off a section whose gate closed, and
 * the year surviving a round trip through an ungated variation.
 */
export const Desktop: Story = {
  globals: { viewport: { value: 'roomy', isRotated: false } },
};

/**
 * Steps 5–7, at 390×844: the gate takes the compact HUD with it, so playback
 * cannot go on driving a year from a variation that ignores it.
 */
export const Mobile: Story = {
  globals: { viewport: { value: 'compact', isRotated: false } },
};
