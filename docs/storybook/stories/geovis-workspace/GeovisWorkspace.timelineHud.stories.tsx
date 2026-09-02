import type { Meta, StoryObj } from '@storybook/react-webpack5';
import type { VisualizationSpec } from '@ttoss/geovis';
import {
  GeovisWorkspace,
  type GeovisWorkspaceConfig,
  type GeovisWorkspaceSelection,
} from '@ttoss/geovis-workspace';
import * as React from 'react';

/**
 * The **compact timeline HUD**: below a 640px viewport, pressing play on the
 * timeline closes the left sidebar (`closeOnPlay`) and a control bar appears
 * along the bottom of the map, so playback can be paused and stepped with the
 * sidebar out of the way.
 *
 * Without it, `closeOnPlay` would take the pause button away with the sidebar
 * and leave the time-lapse running unattended. The bar carries the current
 * value, a 3px rule marking where in the range playback sits, and prev /
 * play-pause / next at 44px touch size. The rule comes from `min`/`max`/`step`,
 * so it draws for any timeline; the record count beside the value is the only
 * part that needs `histogram` — this story declares one to show it.
 *
 * ## What to check
 *
 * Open `Mobile` (pinned to 390×844) and walk through it:
 *
 * 1. The sidebar starts open. Go to the **Filtros** tab and press **Play** — the
 *    sidebar closes and the bar appears at the bottom.
 * 2. The year keeps advancing in the bar, and the map's circles grow with it.
 * 3. Press **Pause** on the bar — it stays put, so **Play** can resume. This is
 *    deliberate: the bar tracks "playback has started", not "is playing".
 * 4. Step with the chevrons — stepping stops playback, as it does in the sidebar.
 * 5. Reopen the menu (the button top-left): the bar goes away, since the
 *    sidebar's own timeline is reachable again. Close the menu and it returns.
 * 6. Dismiss with the **✕** — it stays gone until the next play.
 *
 * Watch the **bottom-left rail** (layers + legend buttons) through step 1: it
 * lifts to clear the bar, and drops back when the bar goes. That clearance is
 * applied through `control.offset.y`, so it needs the spec to declare a
 * `control` — this one does, as every real consumer does.
 *
 * Then switch to `Desktop`: the bar never appears, whatever you do. Above the
 * breakpoint the sidebar sits beside the map, so its controls never leave.
 */

const YEARS = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024];
const FIRST_YEAR = YEARS[0];

/** Deterministic pseudo-random in [0, 1) — keeps the demo stable across renders. */
const pseudo = (n: number): number => {
  const x = Math.sin(n * 91.7 + 47.3) * 27183.1459;
  return x - Math.floor(x);
};

/** Rough Brazil bounding box the demo scatters points across. */
const BBOX = { minLng: -70, maxLng: -38, minLat: -30, maxLat: 2 };

/** Count per year, growing — also feeds the histogram and the HUD's readout. */
const countForYear = (year: number) => {
  return 20 + (year - FIRST_YEAR) * 12;
};

const POINTS = Array.from({ length: countForYear(2024) }, (_, index) => {
  return {
    id: `p${index}`,
    lng: BBOX.minLng + pseudo(index * 2 + 1) * (BBOX.maxLng - BBOX.minLng),
    lat: BBOX.minLat + pseudo(index * 2 + 2) * (BBOX.maxLat - BBOX.minLat),
  };
});

/**
 * A spec whose circles grow with the year, so playback is visible on the map
 * itself and not only in the readouts.
 */
const buildSpec = (year: number): VisualizationSpec => {
  const visible = POINTS.slice(0, countForYear(year));

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
          circleColor: '#337C59',
          circleRadius: 4 + (year - FIRST_YEAR) * 0.6,
          circleOpacity: 0.75,
          circleStrokeColor: '#ffffff',
          circleStrokeWidth: 1,
        },
      },
    ],
    legends: [
      {
        id: 'legenda',
        title: 'Pontos por ano',
        position: 'bottom-right',
        colorBy: {
          type: 'categorical',
          property: 'kind',
          mapping: { ponto: '#337C59' },
          defaultColor: '#337C59',
        },
        labelFormat: { type: 'labels', labels: ['Ponto'] },
      },
    ],
    // The bottom-left rail the HUD would otherwise cover. Declaring it is what
    // gives the workspace something to lift: the clearance is applied through
    // `control.offset.y`, so a spec without a `control` has nothing to shift —
    // and the compact legend button would sit at its fixed edge gap, under the
    // bar. Every real consumer declares one.
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
          defaultValue: 'pontos',
          // Also compact-only: picking a variation closes the menu the same way.
          closeOnSelect: true,
          groups: [
            {
              id: 'g1',
              label: 'Camadas',
              variations: [
                {
                  value: 'pontos',
                  label: 'Pontos por ano',
                  icon: 'lucide:map-pin',
                },
              ],
            },
          ],
        },
      },
      {
        id: 'filtros',
        header: { title: 'Filtros', icon: 'lucide:filter' },
        body: {
          kind: 'filters',
          blocks: [
            {
              id: 'periodo',
              title: 'Linha do tempo',
              icon: 'lucide:clock',
              control: {
                kind: 'timeline',
                menuId: 'ano',
                min: FIRST_YEAR,
                max: 2024,
                step: 1,
                defaultValue: FIRST_YEAR,
                unitLabel: 'pontos',
                // What makes the HUD necessary: play takes the sidebar away, so
                // the controls have to come back somewhere.
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

const TimelineHudDemo = () => {
  const [selection, setSelection] = React.useState<GeovisWorkspaceSelection>({
    ano: String(FIRST_YEAR),
  });

  const year = Number(selection.ano) || FIRST_YEAR;
  const spec = React.useMemo(() => {
    return buildSpec(year);
  }, [year]);

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
  title: 'Geovis Workspace/TimelineHud',
  component: TimelineHudDemo,
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
} satisfies Meta<typeof TimelineHudDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Pinned to 390×844. Open **Filtros**, press **Play**: the menu closes and the
 * timeline bar takes over at the bottom, keeping pause, the steppers and the
 * year readout within reach while the map animates.
 */
export const Mobile: Story = {
  globals: { viewport: { value: 'compact', isRotated: false } },
};

/**
 * The same config at 1280×800 for contrast: the bar never appears, because the
 * sidebar never covers the map and its timeline control is always reachable.
 */
export const Desktop: Story = {
  globals: { viewport: { value: 'roomy', isRotated: false } },
};
