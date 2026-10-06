import type { Meta, StoryFn } from '@storybook/react-webpack5';
import type {
  PolygonExtrusion as PolygonExtrusionSpec,
  VisualizationSpec,
} from '@ttoss/geovis';
import { GeoVisCanvas, GeoVisProvider } from '@ttoss/geovis';
import * as React from 'react';

import {
  COLORS,
  DISTRICTS,
  fictitiousRates,
  THRESHOLDS,
} from './helpers/extrusion-helpers';
import { MapLabel } from './helpers/map-story-helpers';

const RATES = fictitiousRates();

type PolygonExtrusionStoryArgs = {
  extruded: boolean;
  mode: NonNullable<PolygonExtrusionSpec['mode']>;
  maxHeight: number;
  pitch: number;
  bearing: number;
  fillOpacity: number;
};

export default {
  title: 'GeoVis/PolygonExtrusion',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A choropleth whose polygons rise into prisms: `layer.extrusion` lifts each area by the same value that colours it, so darker classes stand taller. Fictitious rates on a hexagon grid over São Paulo. Drag with the right mouse button (or Ctrl + drag) to rotate and tilt.',
      },
    },
  },
  argTypes: {
    extruded: {
      control: 'boolean',
      description: 'Declares `extrusion` on the layer; off renders it flat.',
    },
    mode: {
      control: 'inline-radio',
      options: ['class', 'continuous'],
      description:
        '`class`: one height per legend class. `continuous`: height proportional to the value.',
    },
    maxHeight: {
      control: { type: 'range', min: 500, max: 10000, step: 500 },
      description: 'Height, in metres, of the top class or largest value.',
    },
    pitch: {
      control: { type: 'range', min: 0, max: 60, step: 5 },
      description: 'Camera tilt (`view.pitch`), in degrees.',
    },
    bearing: {
      control: { type: 'range', min: -180, max: 180, step: 5 },
      description: 'Camera rotation (`view.bearing`), in degrees.',
    },
    fillOpacity: {
      control: { type: 'range', min: 0.1, max: 1, step: 0.05 },
      description: '`paint.fillOpacity` — layer-wide on an extruded layer.',
    },
  },
  args: {
    extruded: true,
    mode: 'class',
    maxHeight: 4000,
    pitch: 55,
    bearing: -20,
    fillOpacity: 0.9,
  },
} as Meta<PolygonExtrusionStoryArgs>;

const formatRate = (value: number | string): string => {
  return typeof value === 'number'
    ? `${(value * 100).toFixed(1)}%`
    : String(value);
};

const PolygonExtrusionDemo = ({
  extruded,
  mode,
  maxHeight,
  pitch,
  bearing,
  fillOpacity,
}: PolygonExtrusionStoryArgs) => {
  const spec = React.useMemo<VisualizationSpec>(() => {
    return {
      engine: 'maplibre',
      view: {
        center: [-46.63, -23.68],
        zoom: 9.3,
        pitch,
        bearing,
        cameraAngleTransitionMs: 600,
      },
      sources: [{ id: 'districts', type: 'geojson', data: DISTRICTS }],
      layers: [
        {
          id: 'districts-fill',
          sourceId: 'districts',
          geometry: 'polygon',
          mapDataId: 'rates',
          activeLegendId: 'rates-legend',
          paint: { fillOpacity },
          ...(extruded && { extrusion: { mode, maxHeight } }),
          hoverTooltip: {
            formatValue: formatRate,
            emptyValueLabel: 'No data',
          },
        },
      ],
      legends: [
        {
          id: 'rates-legend',
          title: 'Cumulative rate (% of total)',
          subtitle: 'Fictitious data',
          position: 'bottom-right',
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
      mapData: [{ mapDataId: 'rates', mapId: 'districts', data: RATES }],
    };
  }, [extruded, mode, maxHeight, pitch, bearing, fillOpacity]);

  return (
    <GeoVisProvider spec={spec}>
      <div
        style={{
          position: 'relative',
          height: 640,
          borderRadius: 6,
          overflow: 'hidden',
          border: '1px solid #d4d4d8',
        }}
      >
        <MapLabel>São Paulo — {extruded ? `3D (${mode})` : 'flat'}</MapLabel>
        <GeoVisCanvas
          viewId="primary"
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </GeoVisProvider>
  );
};

const Template: StoryFn<PolygonExtrusionStoryArgs> = (args) => {
  return <PolygonExtrusionDemo {...args} />;
};

/** Each legend class stands at its own height, evenly stepped to `maxHeight`. */
export const ByClass = Template.bind({});

/** Height proportional to the value: the largest rate stands `maxHeight` tall. */
export const Continuous = Template.bind({});
Continuous.args = { mode: 'continuous' };

/** The same layer without `extrusion`, for comparison. */
export const Flat = Template.bind({});
Flat.args = { extruded: false, pitch: 0, bearing: 0 };
