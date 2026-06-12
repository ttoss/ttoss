import type {
  GeoJSONFeatureCollection,
  VisualizationSpec,
} from '@ttoss/geovis';

import type { ColorStep } from './choropleth-helpers';

interface SpecParams {
  year: string | number;
  districtData: GeoJSONFeatureCollection | null;
  mapDataEntries: Array<{ geometryId: string | number; value: number }>;
  populationBreaks: number[];
  populationSteps: ColorStep[];
  DEFAULT_COLOR: string;
  showBasemap: boolean;
}

export const getMunicipalDistrictSpec = ({
  year,
  districtData,
  mapDataEntries,
  populationBreaks,
  populationSteps,
  DEFAULT_COLOR,
  showBasemap,
  labelFormat,
  noDataLabel,
  position,
}: SpecParams): VisualizationSpec => {
  return {
    id: 'municipal-district-mapdata',
    engine: 'maplibre',
    basemap: { visible: showBasemap },
    sources: [
      {
        id: 'districts',
        type: 'geojson',
        data: districtData ?? { type: 'FeatureCollection', features: [] },
      },
    ],
    layers: [
      {
        id: 'districts-fill',
        sourceId: 'districts',
        geometry: 'polygon',
        mapDataId: 'population',
        activeLegendId: 'population',
        hoverPaint: { lineColor: '#333333', lineWidth: 2 },
        selectedPaint: { lineColor: '#1a1a1a', lineWidth: 3 },
        clickAnchor: { color: '#2171b5' },
      },
      {
        id: 'districts-outline',
        sourceId: 'districts',
        geometry: 'line',
        paint: { lineColor: '#93c5fd', lineWidth: 0.5 },
      },
    ],
    legends: [
      {
        id: 'population',
        label: `Population by district \u2014 ${year}`,
        labelFormat,
        ...(noDataLabel && { noDataLabel }),
        ...(position && { position }),
        colorBy: {
          type: 'quantitative',
          property: 'population',
          scale: 'threshold',
          thresholds: populationBreaks,
          colors: [
            DEFAULT_COLOR,
            ...populationSteps.map((s) => {
              return s.color;
            }),
          ],
          defaultColor: DEFAULT_COLOR,
        },
      },
    ],
    mapData: [
      {
        mapDataId: 'population',
        mapId: 'districts',
        data: mapDataEntries,
      },
    ],
  };
};
