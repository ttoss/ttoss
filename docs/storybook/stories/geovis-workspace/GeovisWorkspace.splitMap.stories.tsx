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
 * The **split map** integrated with the sidebar. The spec only switches the
 * "Modo do mapa" button on (`mapModeControl`); the app hands the workspace
 * nothing more than it already does — `variables`, `onVariableChange` and
 * `visualizationSpec` — and builds one spec per selection, as for a single map.
 *
 * While split, `variables` and `visualizationSpec` are the side the sidebar
 * edits. The workspace keeps the other side as it was when last edited, and
 * switching sides hands its selection back through `onVariableChange`.
 *
 * ## What to check
 *
 * 1. Open **Modo do mapa** (top-right) and pick **Dividir em dois**. Both
 *    sides start equal. The sidebar gains the **Editando o lado** block, with
 *    **Mapa A** checked in green, and side A is ringed in green on the map.
 * 2. Pick another variation, year or opacity in the sidebar: only side A
 *    changes, and its pill follows (name, colour and year).
 * 3. Click **Mapa B** in the block, or the right half of the map: the ring and
 *    the block turn blue, and the sidebar now shows B's settings. Change
 *    them: only B changes. Click back to A: its settings are where you left
 *    them.
 * 4. **Copiar p/ B** makes B a copy of A; the swap button (⇄) exchanges the
 *    two sides.
 * 5. Pick a layer from a side's pill on the map (**Equipamentos de saúde**,
 *    **Contornos dos distritos**): only that side shows it, over its own
 *    variation, year and opacity.
 * 6. Under **Configurações**, pick **3D** and a pitch: the camera tilts on
 *    both sides, since their cameras move together.
 * 7. Back to **Mapa único**: the block goes away and the map shows the side
 *    that was being edited.
 */

const VARIATIONS = [
  { value: 'taxa-total', label: 'Taxa cumulativa (% do total)' },
  { value: 'taxa-65', label: 'Proporção cumulativa (% 65+)' },
  { value: 'vulnerabilidade', label: 'Vulnerabilidade social' },
];

const YEARS = { min: 2020, max: 2024 };

const DEFAULTS: GeovisWorkspaceSelection = {
  variacao: 'taxa-total',
  ano: String(YEARS.max),
  opacidade: '90',
  view: '2d',
  pitch: '45',
};

const labelOf = (value: string) => {
  return (
    VARIATIONS.find((item) => {
      return item.value === value;
    })?.label ?? value
  );
};

/** Fictitious rates that differ by variation and by year. */
const ratesOf = ({ variation, year }: { variation: string; year: number }) => {
  const index = VARIATIONS.findIndex((item) => {
    return item.value === variation;
  });
  return fictitiousRates({
    seed: index * 10 + (year - YEARS.min),
    centrality: 0.3 + index * 0.3,
  });
};

/** The spec the app builds from one selection, as for a single map. */
const buildSpec = (selection: GeovisWorkspaceSelection): VisualizationSpec => {
  const variation = selection.variacao ?? DEFAULTS.variacao!;
  const year = Number(selection.ano) || YEARS.max;
  const opacity = (Number(selection.opacidade) || 90) / 100;
  const extruded = selection.view === '3d';
  const pitch = Number(selection.pitch) || 45;

  return {
    engine: 'maplibre',
    view: {
      center: CENTER,
      zoom: 9.3,
      pitch: extruded ? pitch : 0,
      bearing: 0,
      cameraAngleTransitionMs: 600,
    },
    attributionControlEnabled: false,
    mapModeControl: true,
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
        paint: { fillOpacity: opacity, lineColor: '#ffffff' },
        ...(extruded && { extrusion: { maxHeight: 3000 } }),
      },
      {
        id: 'facilities-pts',
        sourceId: 'facilities',
        geometry: 'point',
        visible: false,
        paint: {
          circleColor: '#E4572E',
          circleRadius: 4,
          circleStrokeColor: '#FFFFFF',
          circleStrokeWidth: 1,
        },
      },
      {
        id: 'districts-outline',
        sourceId: 'districts',
        geometry: 'line',
        visible: false,
        paint: { lineColor: '#1a2235', lineWidth: 1.5 },
      },
    ],
    // The layers each side's pill chooses between, on that side's own spec.
    control: {
      id: 'camadas',
      label: 'Camadas',
      position: 'bottom-left',
      trigger: 'click',
      items: [
        {
          id: 'saude',
          label: 'Equipamentos de saúde',
          layers: ['facilities-pts'],
          defaultActive: false,
        },
        {
          id: 'contornos',
          label: 'Contornos dos distritos',
          layers: ['districts-outline'],
          defaultActive: false,
        },
      ],
    },
    mapData: [
      {
        mapDataId: 'rates',
        mapId: 'districts',
        data: ratesOf({ variation, year }),
      },
    ],
    legends: [
      {
        id: 'rates',
        title: `${labelOf(variation)} — ${year}`,
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
        id: 'variacoes',
        header: { title: 'Variações', icon: 'lucide:layers' },
        body: {
          kind: 'variations',
          menuId: 'variacao',
          defaultValue: DEFAULTS.variacao,
          groups: [
            {
              id: 'taxas',
              label: 'Taxas',
              color: '#0e9e6e',
              variations: VARIATIONS.slice(0, 2),
            },
            {
              id: 'indices',
              label: 'Índices',
              color: '#d97706',
              variations: VARIATIONS.slice(2),
            },
          ],
        },
      },
      {
        id: 'linha-do-tempo',
        header: { title: 'Linha do tempo', icon: 'lucide:clock' },
        body: {
          kind: 'filters',
          blocks: [
            {
              id: 'ano',
              title: 'Ano',
              icon: 'lucide:calendar',
              control: {
                kind: 'timeline',
                menuId: 'ano',
                min: YEARS.min,
                max: YEARS.max,
                defaultValue: YEARS.max,
              },
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
              id: 'opacidade',
              title: 'Opacidade',
              icon: 'lucide:droplet',
              control: {
                kind: 'slider',
                menuId: 'opacidade',
                min: 30,
                max: 100,
                step: 10,
                defaultValue: 90,
                unit: '%',
              },
            },
            {
              id: 'visualizacao',
              title: 'Visualização',
              icon: 'lucide:box',
              control: {
                kind: 'choice',
                menuId: 'view',
                defaultValue: '2d',
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
                  },
                ],
              },
            },
            {
              id: 'inclinacao',
              title: 'Inclinação da câmera',
              icon: 'lucide:rotate-3d',
              shownWhen: { menuId: 'view', values: ['3d'] },
              control: {
                kind: 'choice',
                menuId: 'pitch',
                defaultValue: '45',
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

const SplitMapDemo = () => {
  const [selection, setSelection] =
    React.useState<GeovisWorkspaceSelection>(DEFAULTS);

  const spec = React.useMemo(() => {
    return buildSpec(selection);
  }, [selection]);

  return (
    <div style={{ height: 680 }}>
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
  title: 'Geovis Workspace/Split Map',
  component: SplitMapDemo,
  tags: ['autodocs'],
  decorators: [withPtBr],
} satisfies Meta<typeof SplitMapDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Steps 1–7: the split map, edited one side at a time from the sidebar. */
export const Default: Story = {};
