import type { Meta, StoryObj } from '@storybook/react-webpack5';
import type { VisualizationSpec } from '@ttoss/geovis';
import {
  GeovisWorkspace,
  type GeovisWorkspaceConfig,
  type GeovisWorkspaceSelection,
} from '@ttoss/geovis-workspace';
import * as React from 'react';

import {
  CENTER,
  COLORS,
  DISTRICTS,
  FACILITIES,
  fictitiousRates,
  THRESHOLDS,
} from '../geovis/helpers/extrusion-helpers';
import { withPtBr } from './GeovisWorkspace.decorators';

/**
 * A **Visualização** block: a `choice` setting switching the map between a
 * flat choropleth and the same polygons extruded by value — `layer.extrusion`,
 * as in `GeoVis/PolygonExtrusion`.
 *
 * Three settings build it, all generic:
 *
 * - `choice` — options side by side as cards. Each can carry a `glyph` (a strip
 *   of flat or extruded cells, drawn in `glyphColors`) and an `enabledWhen`
 *   gate. While its gate is closed the option is inert, shows its
 *   `disabledHint`, and the control publishes the first available option
 *   instead — remembering the reader's pick for when the gate reopens.
 * - `shownWhen` on a block — the height slider and the pitch choice exist only
 *   while the view is `3d`.
 * - `badge` on a variation — the `3D` tag on the variations that can extrude.
 *
 * The app reads `selection.view`, `selection.extrusionScale` and
 * `selection.pitch`, and turns them into `extrusion` and `view.pitch`. Only the
 * pitch changes in `view`, so the camera keeps where the reader panned to.
 *
 * ## What to check
 *
 * 1. Pick **3D** under **Visualização**. The hexagons rise from flat, darker
 *    classes taller, while the camera tilts to 45°. **Altura das extrusões**
 *    and **Inclinação da câmera** appear below.
 * 2. Step the height through `1×`–`5×` and pick another pitch: the prisms and
 *    the camera ease to it. Pan first: the camera stays where you left it.
 * 3. Switch the variation to **Equipamentos de saúde**, points with no `3D`
 *    tag. The 3D card dims, the hint explains why, the map is flat and the 3D
 *    controls are gone. Switch back to a rate: it is 3D again, at the same
 *    height and pitch.
 * 4. Pick **2D**: the prisms lie down and the camera levels out together.
 */

const RATES_TOTAL = fictitiousRates();
const RATES_ELDERLY = fictitiousRates({ seed: 7, centrality: 0.4 });

/** The variations drawn as polygons — the only ones that can extrude. */
const POLYGON_VARIATIONS = ['taxa-total', 'taxa-65'];

const VARIATIONS = [
  {
    value: 'taxa-total',
    label: 'Taxa cumulativa (% do total)',
    icon: 'lucide:pie-chart',
    badge: '3D',
  },
  {
    value: 'taxa-65',
    label: 'Proporção cumulativa (% 65+)',
    icon: 'lucide:donut',
    badge: '3D',
  },
  {
    value: 'saude',
    label: 'Equipamentos de saúde',
    icon: 'lucide:heart-pulse',
  },
];

/** Height, in metres, of the top class at `1×`. */
const BASE_HEIGHT = 1000;

const DEFAULT_SCALE = 3;
const DEFAULT_PITCH = 45;

const buildSpec = ({
  variation,
  view,
  scale,
  pitch,
}: {
  variation: string;
  view: string;
  scale: number;
  pitch: number;
}): VisualizationSpec => {
  const polygons = POLYGON_VARIATIONS.includes(variation);
  // The choice already published `2d` for a variation that cannot extrude, so
  // the view alone says what to draw.
  const extruded = view === '3d';

  return {
    engine: 'maplibre',
    // Centre and zoom never change, so the view sync only ever moves the
    // pitch — eased, so the camera tilts as the prisms rise.
    view: {
      center: CENTER,
      zoom: 9.3,
      pitch: extruded ? pitch : 0,
      cameraAngleTransitionMs: 600,
    },
    attributionControlEnabled: false,
    sources: [
      { id: 'districts', type: 'geojson', data: DISTRICTS },
      { id: 'facilities', type: 'geojson', data: FACILITIES },
    ],
    layers: [
      {
        id: 'districts-fill',
        sourceId: 'districts',
        geometry: 'polygon',
        mapDataId: 'rates',
        activeLegendId: 'rates',
        visible: polygons,
        paint: { fillOpacity: 0.9, lineColor: '#ffffff' },
        ...(extruded && {
          extrusion: { maxHeight: BASE_HEIGHT * scale },
        }),
      },
      {
        id: 'facilities-pts',
        sourceId: 'facilities',
        geometry: 'point',
        visible: !polygons,
        paint: {
          circleColor: '#E4572E',
          circleRadius: 4,
          circleStrokeColor: '#FFFFFF',
          circleStrokeWidth: 1,
        },
      },
    ],
    mapData: [
      {
        mapDataId: 'rates',
        mapId: 'districts',
        data: variation === 'taxa-65' ? RATES_ELDERLY : RATES_TOTAL,
      },
    ],
    legends: [
      {
        id: 'rates',
        title:
          variation === 'taxa-65'
            ? 'Proporção cumulativa (% 65+)'
            : 'Taxa cumulativa (% do total)',
        subtitle: 'Dados fictícios',
        position: 'bottom-right',
        offset: 12,
        colorBy: {
          type: 'quantitative',
          property: 'value',
          scale: 'threshold',
          thresholds: THRESHOLDS,
          colors: COLORS,
        },
        labelFormat: { type: 'percentage', decimals: 0 },
      },
    ],
  };
};

const buildConfig = ({
  activeLabel,
}: {
  activeLabel: string;
}): GeovisWorkspaceConfig => {
  const only3d = { menuId: 'view', values: ['3d'] };

  return {
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
          id: 'variacoes',
          header: { title: 'Variações', icon: 'lucide:layers' },
          body: {
            kind: 'variations',
            menuId: 'variacao',
            defaultValue: 'taxa-total',
            groups: [
              {
                id: 'indicadores',
                label: 'Indicadores',
                variations: VARIATIONS,
              },
            ],
          },
        },
        {
          id: 'configuracoes',
          header: { title: 'Configurações', icon: 'lucide:settings' },
          body: {
            kind: 'settings',
            blocks: [
              {
                id: 'visualizacao',
                title: 'Visualização',
                icon: 'lucide:box',
                control: {
                  kind: 'choice',
                  menuId: 'view',
                  defaultValue: '2d',
                  // The map's own ramp, so the cards preview it.
                  glyphColors: COLORS,
                  options: [
                    {
                      value: '2d',
                      label: '2D',
                      sublabel: 'Plano',
                      glyph: 'flat',
                    },
                    {
                      value: '3d',
                      label: '3D',
                      sublabel: 'Extrudado',
                      glyph: 'extruded',
                      enabledWhen: {
                        menuId: 'variacao',
                        values: POLYGON_VARIATIONS,
                      },
                      disabledHint: `${activeLabel} não tem polígonos. O 3D aparece nas camadas marcadas com 3D em Variações.`,
                    },
                  ],
                },
              },
              {
                id: 'altura',
                title: 'Altura das extrusões',
                icon: 'lucide:move-vertical',
                shownWhen: only3d,
                control: {
                  kind: 'slider',
                  menuId: 'extrusionScale',
                  defaultValue: DEFAULT_SCALE,
                  stops: [1, 2, 3, 4, 5].map((scale) => {
                    return { value: scale, label: `${scale}×` };
                  }),
                  endLabels: ['Baixa', 'Alta'],
                  stepButtons: true,
                },
              },
              {
                id: 'inclinacao',
                title: 'Inclinação da câmera',
                icon: 'lucide:rotate-3d',
                shownWhen: only3d,
                control: {
                  kind: 'choice',
                  menuId: 'pitch',
                  defaultValue: String(DEFAULT_PITCH),
                  options: [30, 45, 60].map((pitch) => {
                    return { value: String(pitch), label: `${pitch}°` };
                  }),
                },
              },
            ],
          },
        },
      ],
    },
  };
};

const ViewModeDemo = () => {
  const [selection, setSelection] = React.useState<GeovisWorkspaceSelection>({
    variacao: 'taxa-total',
  });

  const variation = selection.variacao ?? 'taxa-total';
  const view = selection.view ?? '2d';
  const scale = Number(selection.extrusionScale) || DEFAULT_SCALE;
  const pitch = Number(selection.pitch) || DEFAULT_PITCH;

  const activeLabel =
    VARIATIONS.find((item) => {
      return item.value === variation;
    })?.label ?? variation;

  const spec = React.useMemo(() => {
    return buildSpec({ variation, view, scale, pitch });
  }, [variation, view, scale, pitch]);

  const config = React.useMemo(() => {
    return buildConfig({ activeLabel });
  }, [activeLabel]);

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
  title: 'Geovis Workspace/View Mode',
  component: ViewModeDemo,
  tags: ['autodocs'],
  decorators: [withPtBr],
} satisfies Meta<typeof ViewModeDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Steps 1–4: the 2D/3D choice, its 3D-only controls, and the gate. */
export const Default: Story = {};
