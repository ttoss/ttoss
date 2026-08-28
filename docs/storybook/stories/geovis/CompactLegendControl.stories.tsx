import type { Meta, StoryFn } from '@storybook/react-webpack5';
import type {
  GeoJSONFeatureCollection,
  VisualizationSpec,
} from '@ttoss/geovis';

import { GeoVisFixtureStory } from './GeoVisFixtureStory';
import { computeBbox } from './helpers/map-story-helpers';

/**
 * Demonstrates the **compact legend control**: below a 640px viewport the
 * floating legend cards stop being drawn and collapse into a single button that
 * rides next to the layer control's trigger. Pressing it opens a panel that
 * spans the map from side to side — both horizontal edges pinned to the same
 * gap the control bar uses — with every positioned legend stacked inside it,
 * and tints the button with the control's accent so its pressed state is
 * unmistakable.
 *
 * The spec below declares **two** legends in **different** corners
 * (`bottom-right` and `top-right`). Above the breakpoint each floats in its own
 * corner; below it, both stack inside the one button's panel.
 *
 * The **layer control** joins that layout below the breakpoint: its panel stops
 * expanding sideways — one row of square item cards cannot fit a phone — and
 * opens away from the anchored edge instead. Unlike the legend's, that card is
 * only as wide as the options inside it, reaching the map's width and wrapping
 * them onto further lines just when they stop fitting. Both panels claim the same
 * strip, so opening one closes the other.
 *
 * The stories are pinned to a viewport, so the toolbar's viewport control is
 * already set when they open — `Mobile` starts at 390×844, `Desktop` at
 * 1280×800. Resize the preview across 640px to watch the legends swap between
 * the two layouts.
 */
export default {
  title: 'GeoVis/CompactLegendControl',
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
} as Meta;

const municipalities: GeoJSONFeatureCollection = {
  type: 'FeatureCollection',
  features: [
    { id: 'a', name: 'Norte', value: 12, x: -47.2, y: -23.4 },
    { id: 'b', name: 'Centro', value: 48, x: -46.4, y: -23.4 },
    { id: 'c', name: 'Sul', value: 96, x: -45.6, y: -23.4 },
    { id: 'd', name: 'Leste', value: 180, x: -46.4, y: -22.6 },
  ].map((m) => {
    return {
      type: 'Feature',
      id: m.id,
      properties: { name: m.name, value: m.value },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [m.x - 0.4, m.y - 0.4],
            [m.x + 0.4, m.y - 0.4],
            [m.x + 0.4, m.y + 0.4],
            [m.x - 0.4, m.y + 0.4],
            [m.x - 0.4, m.y - 0.4],
          ],
        ],
      },
    };
  }),
};

const kitchens: GeoJSONFeatureCollection = {
  type: 'FeatureCollection',
  features: [
    { lng: -46.63, lat: -23.55 },
    { lng: -46.1, lat: -23.2 },
    { lng: -45.7, lat: -23.5 },
  ].map((k, index) => {
    return {
      type: 'Feature',
      id: `k-${index}`,
      properties: {},
      geometry: { type: 'Point', coordinates: [k.lng, k.lat] },
    };
  }),
};

const spec: VisualizationSpec = {
  title: 'Compact legend control',
  description:
    'Below 640px the legend becomes a button beside the layers button; ' +
    'pressing it stacks every legend in one panel. Above 640px each legend ' +
    'floats in its own corner as before.',
  engine: 'maplibre',
  basemap: { visible: false },
  sources: [
    { id: 'municipios', type: 'geojson', data: municipalities },
    { id: 'cozinhas', type: 'geojson', data: kitchens },
  ],
  layers: [
    {
      id: 'municipios-fill',
      sourceId: 'municipios',
      geometry: 'polygon',
      // Flat fill: the story is about the legend overlay, not a data-driven
      // choropleth, so the swatches come from the legend's own `colorBy`.
      paint: { fillColor: '#10b981', fillOpacity: 0.55, lineColor: '#065f46' },
    },
    {
      id: 'cozinhas-pts',
      sourceId: 'cozinhas',
      geometry: 'point',
      paint: {
        circleColor: '#d97706',
        circleRadius: 7,
        circleStrokeColor: '#ffffff',
        circleStrokeWidth: 1.5,
      },
    },
  ],
  // Two legends in two different corners: apart on desktop, stacked in the one
  // button's panel below the breakpoint.
  legends: [
    {
      id: 'legenda-municipios',
      title: 'Cozinhas por município',
      subtitle: 'Total de unidades cadastradas em cada município.',
      position: 'bottom-right',
      colorBy: {
        type: 'quantitative',
        property: 'value',
        scale: 'threshold',
        thresholds: [25, 75, 150],
        colors: ['#d1fae5', '#6ee7b7', '#10b981', '#065f46'],
      },
    },
    {
      id: 'legenda-pontos',
      title: 'Localização das cozinhas',
      subtitle: 'Cada ponto é uma unidade de preparo de refeições.',
      position: 'top-right',
      colorBy: {
        type: 'categorical',
        property: 'kind',
        mapping: { cozinha: '#d97706' },
        defaultColor: '#d97706',
      },
      labelFormat: { type: 'labels', labels: ['Cozinha solidária'] },
    },
  ],
  control: {
    id: 'layers',
    label: 'Camadas',
    position: 'bottom-left',
    trigger: 'click',
    items: [
      {
        id: 'municipios',
        label: 'Municípios',
        layers: ['municipios-fill'],
      },
      {
        id: 'cozinhas',
        label: 'Cozinhas',
        layers: ['cozinhas-pts'],
      },
    ],
  },
};

const bbox = computeBbox(municipalities as GeoJSON.FeatureCollection);

/**
 * Pinned to a 390×844 viewport: the two legends are gone from the corners and
 * the legend button sits to the right of the layers trigger, bottom-left.
 * Press the legend button — its panel opens upward spanning the full width, with
 * both legends stacked and each card stretched to fill it, and the button turns
 * solid blue while it is open. The layers button opens upward too, closing the
 * legend panel as it goes, but its card hugs the two options rather than
 * spanning the map — add items to the spec to watch it grow and start wrapping.
 */
export const Mobile: StoryFn = () => {
  return <GeoVisFixtureStory spec={spec} bbox={bbox} />;
};
Mobile.globals = { viewport: { value: 'compact', isRotated: false } };

/**
 * The same spec at 1280×800 for contrast: no legend button, and each legend
 * floats in the corner its `position` names.
 */
export const Desktop: StoryFn = () => {
  return <GeoVisFixtureStory spec={spec} bbox={bbox} />;
};
Desktop.globals = { viewport: { value: 'roomy', isRotated: false } };
