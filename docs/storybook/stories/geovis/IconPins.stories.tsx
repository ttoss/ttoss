import type { Meta, StoryFn } from '@storybook/react-webpack5';
import type {
  GeoJSONFeatureCollection,
  PinImage,
  VisualizationLayer,
  VisualizationSpec,
} from '@ttoss/geovis';
import { addIcon } from '@ttoss/react-icons';
import * as React from 'react';

import { GeoVisFixtureStory } from './GeoVisFixtureStory';
import { computeBbox } from './helpers/map-story-helpers';

/**
 * Demonstrates **icon pins**: `spec.images` declares one pin per kind of
 * place — a teardrop in a colour with an Iconify icon inside — and a `symbol`
 * layer draws it at each feature through `paint.iconImage`. GeoVis builds the
 * pin images itself and registers them on the map; there are no image files.
 *
 * Each pin layer sets `iconAnchor: 'bottom'`, so the pin's tip (not its middle)
 * sits on the place, and `iconAllowOverlap: true`, so neighbouring places keep
 * their pins instead of MapLibre hiding the ones that collide.
 */
export default {
  title: 'GeoVis/IconPins',
  tags: ['autodocs'],
} as Meta;

type Place = { name: string; kind: string; coordinates: [number, number] };

const places = (entries: Place[]): GeoJSONFeatureCollection => {
  return {
    type: 'FeatureCollection',
    features: entries.map((place, index) => {
      return {
        type: 'Feature',
        id: index + 1,
        properties: { name: place.name, kind: place.kind },
        geometry: { type: 'Point', coordinates: place.coordinates },
      };
    }),
  };
};

const hospitals = places([
  {
    name: 'Hospital das Clínicas',
    kind: 'Hospital',
    coordinates: [-46.6695, -23.5573],
  },
  {
    name: 'Santa Casa de São Paulo',
    kind: 'Hospital',
    coordinates: [-46.6497, -23.5441],
  },
  {
    name: 'Hospital São Paulo',
    kind: 'Hospital',
    coordinates: [-46.6432, -23.5979],
  },
]);

const clinics = places([
  { name: 'UBS Sé', kind: 'UBS', coordinates: [-46.6333, -23.5497] },
  {
    name: 'UBS República',
    kind: 'UBS',
    coordinates: [-46.6428, -23.5431],
  },
  {
    name: 'UBS Vila Mariana',
    kind: 'UBS',
    coordinates: [-46.6358, -23.5891],
  },
  { name: 'UBS Pinheiros', kind: 'UBS', coordinates: [-46.6862, -23.5654] },
]);

const restaurants = places([
  {
    name: 'Bom Prato Centro',
    kind: 'Restaurante público',
    coordinates: [-46.6364, -23.5418],
  },
  {
    name: 'Bom Prato Lapa',
    kind: 'Restaurante público',
    coordinates: [-46.7029, -23.5236],
  },
]);

const PINS: PinImage[] = [
  { id: 'hospital-pin', kind: 'pin', icon: 'maki:hospital', color: '#C0392B' },
  { id: 'clinic-pin', kind: 'pin', icon: 'maki:doctor', color: '#1E8449' },
  {
    id: 'restaurant-pin',
    kind: 'pin',
    icon: 'maki:restaurant',
    color: '#D68910',
  },
];

/**
 * A `symbol` layer drawing one pin at each of a source's points, with the
 * place's name on hover. The hover info carries the feature id, not its
 * properties, so the tooltip reads the name back from the source data.
 */
const pinLayer = ({
  id,
  sourceId,
  pinId,
  data,
}: {
  id: string;
  sourceId: string;
  pinId: string;
  data: GeoJSONFeatureCollection;
}): VisualizationLayer => {
  const byId = new Map(
    data.features.map((feature) => {
      return [feature.id, feature.properties ?? {}] as const;
    })
  );

  return {
    id,
    sourceId,
    geometry: 'symbol',
    paint: {
      iconImage: pinId,
      iconAnchor: 'bottom',
      iconAllowOverlap: true,
    },
    // Non-polygon layers are hover-tracked only when they declare `click`.
    click: {},
    hoverTooltip: {
      offset: { x: 12, y: 12 },
      render: (info) => {
        const properties = byId.get(Number(info.featureId)) ?? {};
        return (
          <div>
            <div style={{ fontWeight: 600 }}>{String(properties.name)}</div>
            <div>{String(properties.kind)}</div>
          </div>
        );
      },
    },
  };
};

const LAYERS = [
  {
    id: 'hospitals',
    label: 'Hospitais',
    data: hospitals,
    pinId: 'hospital-pin',
  },
  { id: 'clinics', label: 'UBS', data: clinics, pinId: 'clinic-pin' },
  {
    id: 'restaurants',
    label: 'Restaurantes públicos',
    data: restaurants,
    pinId: 'restaurant-pin',
  },
];

const buildSpec = (pins: PinImage[]): VisualizationSpec => {
  return {
    title: 'Icon pins',
    description:
      'Each kind of place draws its own pin — colour and icon declared in ' +
      '`spec.images`. Hover a pin for its name; toggle the kinds from the ' +
      'layer control.',
    engine: 'maplibre',
    images: pins,
    sources: LAYERS.map((layer) => {
      return { id: layer.id, type: 'geojson' as const, data: layer.data };
    }),
    layers: LAYERS.map((layer) => {
      return pinLayer({
        id: `${layer.id}-pins`,
        sourceId: layer.id,
        pinId: layer.pinId,
        data: layer.data,
      });
    }),
    control: {
      id: 'places',
      label: 'Lugares',
      trigger: 'click',
      items: LAYERS.map((layer) => {
        return {
          id: layer.id,
          label: layer.label,
          layers: [`${layer.id}-pins`],
        };
      }),
    },
  };
};

const bbox = computeBbox({
  type: 'FeatureCollection',
  features: LAYERS.flatMap((layer) => {
    return layer.data.features;
  }),
} as GeoJSON.FeatureCollection);

/**
 * Three kinds of place, each with its own pin. The icons are Iconify names
 * (`maki:*`), fetched from the Iconify API since the story registers none of
 * them.
 */
export const Default: StoryFn = () => {
  return <GeoVisFixtureStory spec={buildSpec(PINS)} bbox={bbox} />;
};

// A custom icon, registered once like any other `@ttoss/react-icons` icon: a
// pin can draw it without the Iconify API.
addIcon('story:heart-plus', {
  body: '<path fill="currentColor" d="M12 21s-7.5-4.6-9.6-9.2C.9 8.5 3 5 6.5 5c2 0 3.6 1.1 4.5 2.6h2C13.9 6.1 15.5 5 17.5 5 21 5 23.1 8.5 21.6 11.8 19.5 16.4 12 21 12 21zm-1-12v2.5H8.5v2H11V16h2v-2.5h2.5v-2H13V9h-2z"/>',
  width: 24,
  height: 24,
});

/**
 * A pin with an icon registered through `addIcon`, a larger `size` and a dark
 * `iconColor` on a light pin — every part of the pin is set from the spec.
 */
export const CustomIconAndSize: StoryFn = () => {
  const spec: VisualizationSpec = {
    ...buildSpec([
      {
        id: 'hospital-pin',
        kind: 'pin',
        icon: 'story:heart-plus',
        color: '#FADBD8',
        iconColor: '#922B21',
        size: 40,
      },
      ...PINS.slice(1),
    ]),
    title: 'Custom icon and size',
    description:
      'The hospital pin draws an icon registered with `addIcon`, at 40 px, ' +
      'with a dark icon on a light pin.',
  };

  return <GeoVisFixtureStory spec={spec} bbox={bbox} />;
};

const PALETTES: Record<string, string[]> = {
  Warm: ['#C0392B', '#1E8449', '#D68910'],
  Cool: ['#6C3483', '#117A65', '#2874A6'],
};

/**
 * Changing a pin's descriptor in the spec rebuilds only that image: the layers
 * keep drawing, and the pins take the new colours as soon as they are ready.
 */
export const ChangingColors: StoryFn = () => {
  const [palette, setPalette] = React.useState('Warm');
  const colors = PALETTES[palette] ?? [];
  const pins = PINS.map((pin, index) => {
    return { ...pin, color: colors[index] ?? pin.color };
  });

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        {Object.keys(PALETTES).map((name) => {
          return (
            <button
              key={name}
              type="button"
              onClick={() => {
                setPalette(name);
              }}
              aria-pressed={name === palette}
              style={{ fontWeight: name === palette ? 600 : 400 }}
            >
              {name}
            </button>
          );
        })}
      </div>
      <GeoVisFixtureStory spec={buildSpec(pins)} bbox={bbox} />
    </div>
  );
};
