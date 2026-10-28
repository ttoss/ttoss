import type {
  GeoJSONFeatureCollection,
  ProximityCategory,
  ProximityQueryParams,
  ProximityResult,
  ProximitySearch,
  VisualizationSpec,
} from '@ttoss/geovis';

/**
 * The map the proximity-search stories share: hospitals and health posts as
 * pins around central São Paulo, and a fake search for the food services
 * around a hospital.
 */

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

export const CATEGORIES: ProximityCategory[] = [
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

export const PROXIMITY_SEARCH: ProximitySearch = {
  layers: ['hospitals-pins'],
  query: fetchNearbyServices,
  radii: [1000, 2000, 3000],
  categories: CATEGORIES,
  labels: { one: 'serviço', other: 'serviços' },
};

export const spec: VisualizationSpec = {
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
