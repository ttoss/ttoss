import type { VisualizationSpec } from '@ttoss/geovis';
import {
  GeovisWorkspace,
  type GeovisWorkspaceConfig,
  type GeovisWorkspaceSelection,
} from '@ttoss/geovis-workspace';
import * as React from 'react';

import {
  CENTER,
  DISTRICTS,
  fictitiousIvs,
  fictitiousPopulation,
} from '../geovis/helpers/extrusion-helpers';

/*
 * The "Compare indicators" demo of the View Mode stories: each hexagon painted
 * by its Índice de Vulnerabilidade Social and, in 3D, lifted by its population
 * — two indicators read at once, one on the ground and one in the air.
 */

const IVS = fictitiousIvs();
const POPULATION = fictitiousPopulation();

/** IVS faixas, as breaks: below 0.300, then 0.300, 0.400 and 0.500. */
const IVS_THRESHOLDS = [0.3, 0.4, 0.5];

/** Green to red, the IVS faixas from least to most vulnerable. */
const IVS_COLORS = ['#2E9E5B', '#F2C94C', '#F2994A', '#D64545'];

const IVS_LABELS = [
  'Baixa (abaixo de 0,300)',
  'Média (0,300 a 0,399)',
  'Alta (0,400 a 0,499)',
  'Muito alta (0,500 ou mais)',
];

/** The height-indicator values: the population, or the IVS itself. */
const HEIGHT_POPULATION = 'populacao';
const HEIGHT_IVS = 'ivs';

/** Height, in metres, of the tallest prism at `1×`. */
const BASE_HEIGHT = 1000;
const DEFAULT_SCALE = 5;
const DEFAULT_PITCH = 60;

/** How far the camera turns from north in 3D, in degrees (negative: left). */
const BEARING_3D = -25;

const valueById = (rows: typeof IVS) => {
  return new Map(
    rows.map((row) => {
      return [String(row.geometryId), row.value as number];
    })
  );
};

const IVS_BY_ID = valueById(IVS);
const POPULATION_BY_ID = valueById(POPULATION);

const formatIvs = (value: number | undefined) => {
  return value === undefined
    ? '—'
    : value.toLocaleString('pt-BR', {
        minimumFractionDigits: 3,
        maximumFractionDigits: 3,
      });
};

const formatPopulation = (value: number | undefined) => {
  return value === undefined
    ? '—'
    : `${value.toLocaleString('pt-BR')} habitantes`;
};

const buildSpec = ({
  view,
  scale,
  pitch,
  heightIndicator,
}: {
  view: string;
  scale: number;
  pitch: number;
  heightIndicator: string;
}): VisualizationSpec => {
  const extruded = view === '3d';
  const byPopulation = heightIndicator === HEIGHT_POPULATION;

  return {
    engine: 'maplibre',
    // Centre and zoom never change, so the view sync only moves the angles:
    // in 3D the camera tilts and turns a little, so the prisms show a side
    // face, and both ease back together in 2D.
    view: {
      center: CENTER,
      zoom: 9.3,
      pitch: extruded ? pitch : 0,
      bearing: extruded ? BEARING_3D : 0,
      cameraAngleTransitionMs: 600,
    },
    attributionControlEnabled: false,
    sources: [{ id: 'districts', type: 'geojson', data: DISTRICTS }],
    layers: [
      {
        id: 'districts-fill',
        sourceId: 'districts',
        geometry: 'polygon',
        mapDataId: 'ivs',
        activeLegendId: 'ivs',
        paint: { fillOpacity: 0.9, lineColor: '#ffffff' },
        ...(extruded && {
          // By population: its own dataset, proportional to the head count
          // (no thresholds, so `'continuous'`). By IVS: the colour's dataset,
          // one step per faixa.
          extrusion: byPopulation
            ? {
                mapDataId: 'population',
                mode: 'continuous' as const,
                maxHeight: BASE_HEIGHT * scale,
              }
            : { maxHeight: BASE_HEIGHT * scale },
        }),
        hoverTooltip: {
          render: (info) => {
            const id = String(info.featureId);
            return (
              <>
                <div style={{ fontWeight: 600 }}>Área {id}</div>
                <div>IVS: {formatIvs(IVS_BY_ID.get(id))}</div>
                <div>
                  População: {formatPopulation(POPULATION_BY_ID.get(id))}
                </div>
              </>
            );
          },
        },
      },
    ],
    mapData: [
      { mapDataId: 'ivs', mapId: 'districts', data: IVS },
      // A `stateKey` apart from the IVS's: both write the same hexagons'
      // feature-state.
      {
        mapDataId: 'population',
        mapId: 'districts',
        stateKey: 'population',
        data: POPULATION,
      },
    ],
    legends: [
      {
        id: 'ivs',
        title: 'Índice de Vulnerabilidade Social (IVS)',
        // The legend explains the colour; the subtitle names the height.
        subtitle: extruded
          ? `Altura: ${byPopulation ? 'população' : 'IVS'} · dados fictícios`
          : 'Dados fictícios',
        position: 'bottom-right',
        offset: 12,
        colorBy: {
          type: 'quantitative',
          property: 'value',
          scale: 'threshold',
          thresholds: IVS_THRESHOLDS,
          colors: IVS_COLORS,
        },
        labelFormat: { type: 'labels', labels: IVS_LABELS },
      },
    ],
  };
};

const only3d = { menuId: 'view', values: ['3d'] };

const CONFIG: GeovisWorkspaceConfig = {
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
                glyphColors: IVS_COLORS,
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
              id: 'indicador-altura',
              title: 'Indicador da altura',
              icon: 'lucide:chart-column',
              shownWhen: only3d,
              control: {
                kind: 'choice',
                menuId: 'heightIndicator',
                defaultValue: HEIGHT_POPULATION,
                options: [
                  {
                    value: HEIGHT_POPULATION,
                    label: 'População',
                    sublabel: 'habitantes',
                  },
                  {
                    value: HEIGHT_IVS,
                    label: 'IVS',
                    sublabel: 'mesmo da cor',
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

/**
 * Each hexagon coloured by its IVS faixa and, in 3D, lifted by its population,
 * with the height's indicator switchable back to the IVS itself.
 */
export const IvsPopulationDemo = () => {
  const [selection, setSelection] = React.useState<GeovisWorkspaceSelection>({
    view: '3d',
    heightIndicator: HEIGHT_POPULATION,
  });

  const view = selection.view ?? '2d';
  const scale = Number(selection.extrusionScale) || DEFAULT_SCALE;
  const pitch = Number(selection.pitch) || DEFAULT_PITCH;
  const heightIndicator = selection.heightIndicator ?? HEIGHT_POPULATION;

  const spec = React.useMemo(() => {
    return buildSpec({ view, scale, pitch, heightIndicator });
  }, [view, scale, pitch, heightIndicator]);

  return (
    <div style={{ height: 640 }}>
      <GeovisWorkspace
        config={CONFIG}
        visualizationSpec={spec}
        variables={selection}
        onVariableChange={setSelection}
      />
    </div>
  );
};
