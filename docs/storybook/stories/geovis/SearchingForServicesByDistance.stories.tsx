import type { Meta, StoryFn } from '@storybook/react-webpack5';
import type {
  GeoJSONFeatureCollection,
  ProximityCategory,
  ProximityQueryParams,
  ProximityResult,
  ProximitySearch,
  VisualizationSpec,
} from '@ttoss/geovis';
import { GeoVisCanvas, GeoVisProvider } from '@ttoss/geovis';
import { I18nProvider } from '@ttoss/react-i18n';
import * as React from 'react';

import { GeoVisFixtureStory } from './GeoVisFixtureStory';

const loadLocaleData = async (locale: string) => {
  switch (locale) {
    case 'pt-BR': {
      return (await import('../../i18n/compiled/pt-BR.json')).default;
    }
    default: {
      return (await import('../../i18n/compiled/en.json')).default;
    }
  }
};

/**
 * **Searching for services by distance**, through `spec.proximitySearch`:
 * click a hospital's pin. The other hospitals step aside and the services
 * within 1 km of it drop in around it; the bar under the circle counts them by
 * kind and widens the search to 2 or 3 km, asking only for the ring the first
 * answer did not cover. Click a service for its card; click the hospital
 * again, or the bar's ×, to clear the search and bring the hospitals back.
 *
 * With `fromUserLocation`, a button under the map's controls searches from
 * the reader's own location instead — see the "From user location" story.
 *
 * A fake request stands in for the search — it answers after a moment, with
 * services placed at random within the ring asked for.
 */
export default {
  title: 'GeoVis/SearchingForServicesByDistance',
  tags: ['autodocs'],
  decorators: [
    (Story) => {
      return (
        <I18nProvider locale="pt-BR" loadLocaleData={loadLocaleData}>
          <Story />
        </I18nProvider>
      );
    },
  ],
} as Meta;

/** Central São Paulo, where the map opens. */
const CENTER: [number, number] = [-46.65, -23.56];

const HOSPITAL_PLACES: { name: string; coordinates: [number, number] }[] = [
  { name: 'Hospital das Clínicas', coordinates: [-46.6695, -23.5573] },
  { name: 'Santa Casa de São Paulo', coordinates: [-46.6497, -23.5441] },
  { name: 'Hospital São Paulo', coordinates: [-46.6432, -23.5979] },
  { name: 'Hospital Sírio-Libanês', coordinates: [-46.6545, -23.5571] },
  { name: 'Hospital Pérola Byington', coordinates: [-46.6385, -23.5532] },
];

/**
 * Health posts: pins of another layer, which no search starts from, there to
 * show that a search hides every pin on the map but the one clicked.
 */
const CLINIC_PLACES: { name: string; coordinates: [number, number] }[] = [
  { name: 'UBS Sé', coordinates: [-46.6333, -23.5497] },
  { name: 'UBS República', coordinates: [-46.6428, -23.5431] },
  { name: 'UBS Vila Mariana', coordinates: [-46.6358, -23.5891] },
  { name: 'UBS Pinheiros', coordinates: [-46.6862, -23.5654] },
];

/** One point feature per place, numbered from 1 — MapLibre needs the ids. */
const toPoints = (
  places: { name: string; coordinates: [number, number] }[]
): GeoJSONFeatureCollection => {
  return {
    type: 'FeatureCollection',
    features: places.map((place, index) => {
      return {
        type: 'Feature',
        id: index + 1,
        properties: { name: place.name },
        geometry: { type: 'Point', coordinates: place.coordinates },
      };
    }),
  };
};

const hospitals = toPoints(HOSPITAL_PLACES);
const clinics = toPoints(CLINIC_PLACES);

const CATEGORIES: ProximityCategory[] = [
  {
    id: 'cozinha',
    label: 'Cozinha comunitária',
    color: '#0e9e6e',
    icon: 'lucide:chef-hat',
  },
  {
    id: 'restaurante',
    label: 'Restaurante popular',
    color: '#e07a2e',
    icon: 'lucide:utensils',
  },
  {
    id: 'banco',
    label: 'Banco de alimentos',
    color: '#3b6fd8',
    icon: 'lucide:package',
  },
  {
    id: 'feira',
    label: 'Feira livre',
    color: '#b0479a',
    icon: 'lucide:shopping-basket',
  },
];

const PLACES = [
  'Vila Nova',
  'Jardim Esperança',
  'Centro',
  'Bela Vista',
  'São João',
  'Parque das Flores',
  'Santa Cruz',
  'Vila Rica',
  'Boa Vista',
  'Jardim América',
];

/** Metres in one degree of latitude. */
const METRES_PER_DEGREE = 111_320;

let nextId = 0;

/**
 * A stand-in for the request that finds the services within a ring around a
 * point: after 1.4–2.3 s it answers two to six services (three to seven for a
 * widening) at random spots inside the ring.
 */
const fetchNearbyServices = async ({
  lat,
  lng,
  radiusMin,
  radius,
  signal,
}: ProximityQueryParams): Promise<ProximityResult[]> => {
  await new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, 1400 + Math.random() * 900);
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(signal.reason);
    });
  });

  const count = (radiusMin ? 3 : 2) + Math.floor(Math.random() * 5);
  const low = radiusMin ? radiusMin + 120 : 0.32 * radius;
  const high = radius * 0.9;
  const services = Array.from({ length: count }, () => {
    const angle = Math.random() * Math.PI * 2;
    // Uniform over the ring's area, not its radius.
    const distance = Math.sqrt(
      low * low + Math.random() * (high * high - low * low)
    );
    const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    nextId += 1;
    return {
      id: nextId,
      name: `${category.label} ${PLACES[nextId % PLACES.length]}`,
      categoryId: category.id,
      lngLat: [
        lng +
          (Math.cos(angle) * distance) /
            (METRES_PER_DEGREE * Math.cos((lat * Math.PI) / 180)),
        lat + (Math.sin(angle) * distance) / METRES_PER_DEGREE,
      ] as [number, number],
    };
  });

  return services;
};

const PROXIMITY_SEARCH: ProximitySearch = {
  layers: ['hospitals-pins'],
  query: fetchNearbyServices,
  radii: [1000, 2000, 3000],
  categories: CATEGORIES,
  labels: { one: 'serviço', other: 'serviços' },
};

const spec: VisualizationSpec = {
  title: 'Searching for services by distance',
  description:
    "Click a hospital's pin: the services within 1 km of it drop in around it.",
  engine: 'maplibre',
  view: { center: CENTER, zoom: 13 },
  images: [
    {
      id: 'hospital-pin',
      kind: 'pin',
      icon: 'maki:hospital',
      color: '#C0392B',
    },
    { id: 'clinic-pin', kind: 'pin', icon: 'maki:doctor', color: '#1E8449' },
  ],
  sources: [
    { id: 'hospitals', type: 'geojson', data: hospitals },
    { id: 'clinics', type: 'geojson', data: clinics },
  ],
  layers: [
    {
      id: 'hospitals-pins',
      sourceId: 'hospitals',
      geometry: 'symbol',
      paint: {
        iconImage: 'hospital-pin',
        iconAnchor: 'bottom',
        iconAllowOverlap: true,
      },
      hoverTooltip: {
        offset: { x: 12, y: 12 },
        render: (info) => {
          return HOSPITAL_PLACES[Number(info.featureId) - 1]?.name;
        },
      },
    },
    {
      id: 'clinics-pins',
      sourceId: 'clinics',
      geometry: 'symbol',
      paint: {
        iconImage: 'clinic-pin',
        iconAnchor: 'bottom',
        iconAllowOverlap: true,
      },
    },
  ],
  proximitySearch: PROXIMITY_SEARCH,
};

/**
 * Hospitals and health posts as pins; clicking a hospital searches the
 * services around it.
 */
export const SearchingForServicesByDistance: StoryFn = () => {
  return <GeoVisFixtureStory spec={spec} />;
};

/** Where the fake browser places the reader: Avenida Paulista. */
const USER_LOCATION: [number, number] = [-46.6559, -23.5614];

/** How long the fake browser takes to find the reader, in milliseconds. */
const LOCATE_DELAY_MS = 1100;

/**
 * Stands in for the browser's geolocation while the story is open, and puts
 * the real one back when it closes: the permission starts undecided, and the
 * lookup answers {@link USER_LOCATION} — or, with `outcome: 'denied'`, fails
 * as a refused permission does. Once answered, the permission stays decided.
 */
const useFakeGeolocation = (outcome: 'granted' | 'denied') => {
  React.useLayoutEffect(() => {
    let permission: PermissionState = 'prompt';
    const geolocation = {
      getCurrentPosition: (
        success: PositionCallback,
        failure?: PositionErrorCallback | null
      ) => {
        setTimeout(() => {
          permission = outcome;
          if (outcome === 'granted') {
            success({
              coords: {
                longitude: USER_LOCATION[0],
                latitude: USER_LOCATION[1],
                accuracy: 20,
              },
              timestamp: Date.now(),
            } as GeolocationPosition);
          } else {
            failure?.({
              code: 1,
              message: 'User denied Geolocation',
            } as GeolocationPositionError);
          }
        }, LOCATE_DELAY_MS);
      },
    };
    const permissions = {
      query: async () => {
        return { state: permission } as PermissionStatus;
      },
    };
    const originals = {
      geolocation: Object.getOwnPropertyDescriptor(navigator, 'geolocation'),
      permissions: Object.getOwnPropertyDescriptor(navigator, 'permissions'),
    };
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: geolocation,
    });
    Object.defineProperty(navigator, 'permissions', {
      configurable: true,
      value: permissions,
    });
    return () => {
      for (const key of ['geolocation', 'permissions'] as const) {
        const original = originals[key];
        if (original) Object.defineProperty(navigator, key, original);
        else delete (navigator as unknown as Record<string, unknown>)[key];
      }
    };
  }, [outcome]);
};

const userLocationSpec: VisualizationSpec = {
  ...spec,
  title: 'Searching for services near the reader',
  description:
    'Click the location button under the zoom controls: the services within 1 km of you drop in around you.',
  proximitySearch: { ...PROXIMITY_SEARCH, fromUserLocation: true },
};

/**
 * **From the reader's location**, through `proximitySearch.fromUserLocation`:
 * the crosshair button under the zoom controls first explains why the location is
 * needed, then asks the browser for it and searches from there — the reader a
 * blue "You" dot, the bar saying "near you". Clicking the button again, the
 * dot or the bar's × clears the search. Clicking a hospital still searches
 * from it, replacing the search from the reader.
 *
 * The browser's geolocation is faked: it places you on Avenida Paulista after
 * a moment. Set `outcome` to `denied` for the dialog shown when the location
 * cannot be had.
 */
export const FromUserLocation: StoryFn<{ outcome: 'granted' | 'denied' }> = ({
  outcome,
}) => {
  useFakeGeolocation(outcome);
  // Its own frame, positioned, as in the MapMode story: the location button,
  // its dialog and its note sit in the map's corner, not the story's.
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div>
        <strong>{userLocationSpec.title}</strong>
        <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 14 }}>
          {userLocationSpec.description}
        </p>
      </div>
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: 560,
          border: '1px solid #d4d4d8',
        }}
      >
        <GeoVisProvider key={outcome} spec={userLocationSpec}>
          <GeoVisCanvas viewId="primary" />
        </GeoVisProvider>
      </div>
    </div>
  );
};

FromUserLocation.args = { outcome: 'granted' };
FromUserLocation.argTypes = {
  outcome: {
    control: 'inline-radio',
    options: ['granted', 'denied'],
    description: 'What the fake browser answers when asked for the location.',
  },
};
