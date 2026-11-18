import type {
  GeoJSONFeatureCollection,
  GeoVisSplitSide,
  VisualizationSpec,
} from '@ttoss/geovis';
import { GeoVisCanvas, GeoVisProvider, useGeoVisMapMode } from '@ttoss/geovis';
import * as React from 'react';

/** What the app's sidebar sets for one map: the whole of a side's settings. */
interface SideSettings {
  variation: string;
  year: number;
  opacity: number;
  pitch: number;
  bearing: number;
}

const VARIATIONS = [
  { id: 'coverage', label: 'Cobertura', color: '#2E9E5B' },
  { id: 'vulnerability', label: 'Vulnerabilidade', color: '#E4572E' },
  { id: 'density', label: 'Densidade', color: '#7C3AED' },
  { id: 'access', label: 'Acesso a serviços', color: '#2563EB' },
];

const YEARS = [2020, 2021, 2022, 2023, 2024];

/** The width of the app's panel over the map's left edge. */
const PANEL_WIDTH = 260;

const INITIAL: SideSettings = {
  variation: 'coverage',
  year: 2024,
  opacity: 55,
  pitch: 0,
  bearing: 0,
};

/** A 4×3 grid of invented "districts" over São Paulo. */
const districts: GeoJSONFeatureCollection = {
  type: 'FeatureCollection',
  features: Array.from({ length: 12 }, (_, index) => {
    const column = index % 4;
    const row = Math.floor(index / 4);
    const west = -46.83 + column * 0.12;
    const north = -23.42 - row * 0.11;
    return {
      type: 'Feature' as const,
      id: index + 1,
      properties: { name: `Distrito ${index + 1}` },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [
          [
            [west, north],
            [west + 0.12, north],
            [west + 0.12, north - 0.11],
            [west, north - 0.11],
            [west, north],
          ],
        ],
      },
    };
  }),
};

const points = (coordinates: [number, number][]): GeoJSONFeatureCollection => {
  return {
    type: 'FeatureCollection',
    features: coordinates.map(([lng, lat], index) => {
      return {
        type: 'Feature' as const,
        id: index + 1,
        properties: {},
        geometry: { type: 'Point' as const, coordinates: [lng, lat] },
      };
    }),
  };
};

const kitchens = points([
  [-46.66, -23.55],
  [-46.61, -23.6],
  [-46.72, -23.5],
  [-46.48, -23.53],
  [-46.55, -23.66],
]);

const hospitals = points([
  [-46.64, -23.57],
  [-46.69, -23.62],
  [-46.52, -23.48],
]);

const swatch = (color: string) => {
  return `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16'><rect width='16' height='16' rx='3' fill='${encodeURIComponent(color)}'/></svg>`;
};

const pointLayer = (id: string, color: string) => {
  return {
    id: `${id}-pts`,
    sourceId: id,
    geometry: 'point' as const,
    visible: false,
    paint: {
      circleColor: color,
      circleRadius: 7,
      circleStrokeColor: '#ffffff',
      circleStrokeWidth: 1.5,
    },
  };
};

/** The districts a variation fills in a year: made up, but year-dependent. */
const filledIn = ({ variation, year }: SideSettings) => {
  const offset =
    VARIATIONS.findIndex((entry) => {
      return entry.id === variation;
    }) + year;
  return {
    type: 'FeatureCollection' as const,
    features: districts.features.filter((feature) => {
      return (Number(feature.id) + offset) % 3 !== 0;
    }),
  };
};

const variationOf = (id: string) => {
  return (
    VARIATIONS.find((entry) => {
      return entry.id === id;
    }) ?? VARIATIONS[0]
  );
};

/** The spec the app builds from one side's settings. */
const specOf = (settings: SideSettings): VisualizationSpec => {
  const variation = variationOf(settings.variation);
  return {
    engine: 'maplibre',
    view: {
      center: [-46.6, -23.58],
      zoom: 9.4,
      pitch: settings.pitch,
      bearing: settings.bearing,
      cameraAngleTransitionMs: 400,
    },
    sources: [
      { id: 'districts', type: 'geojson', data: districts },
      { id: 'filled', type: 'geojson', data: filledIn(settings) },
      { id: 'kitchens', type: 'geojson', data: kitchens },
      { id: 'hospitals', type: 'geojson', data: hospitals },
    ],
    layers: [
      {
        id: 'filled-fill',
        sourceId: 'filled',
        geometry: 'polygon',
        paint: {
          fillColor: variation.color,
          fillOpacity: settings.opacity / 100,
        },
      },
      {
        id: 'districts-line',
        sourceId: 'districts',
        geometry: 'line',
        paint: { lineColor: '#1f2937', lineWidth: 1 },
      },
      pointLayer('kitchens', '#7C3AED'),
      pointLayer('hospitals', '#2563EB'),
    ],
    // The layers each side's pill chooses between, on that side's own spec.
    control: {
      id: 'layers',
      label: 'Camadas',
      position: 'bottom-right',
      trigger: 'click',
      items: [
        {
          id: 'kitchens',
          label: 'Cozinhas',
          thumbnail: swatch('#7C3AED'),
          layers: ['kitchens-pts'],
          defaultActive: false,
        },
        {
          id: 'hospitals',
          label: 'Hospitais',
          thumbnail: swatch('#2563EB'),
          layers: ['hospitals-pts'],
          defaultActive: false,
        },
      ],
    },
    viewInsets: { left: PANEL_WIDTH + 24 },
    mapModeControl: true,
  };
};

const fieldStyle: React.CSSProperties = {
  display: 'grid',
  gap: 4,
  fontSize: 12,
  color: '#475569',
};

const Slider = ({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) => {
  return (
    <label style={fieldStyle}>
      {label}: {value}
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => {
          onChange(Number(event.target.value));
        }}
      />
    </label>
  );
};

/**
 * The app's sidebar: it edits the single map, or — split — the side the
 * reader is editing, which it reads from `useGeoVisMapMode().activeSide`.
 */
const SidePanel = ({
  sides,
  onChange,
}: {
  sides: Record<GeoVisSplitSide, SideSettings>;
  onChange: (side: GeoVisSplitSide, patch: Partial<SideSettings>) => void;
}) => {
  const { mode, activeSide } = useGeoVisMapMode();
  const side: GeoVisSplitSide = mode === 'split' ? activeSide : 'a';
  const settings = sides[side];
  const set = (patch: Partial<SideSettings>) => {
    onChange(side, patch);
  };

  return (
    <div
      style={{
        position: 'absolute',
        zIndex: 30,
        top: 12,
        left: 12,
        bottom: 12,
        width: PANEL_WIDTH,
        display: 'grid',
        alignContent: 'start',
        gap: 14,
        padding: 16,
        borderRadius: 14,
        background: '#ffffff',
        boxShadow: '0 8px 40px rgba(0,0,0,0.14)',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <strong style={{ fontSize: 13 }}>
        {mode === 'split'
          ? `Editando o mapa ${side.toUpperCase()}`
          : 'Mapa único'}
      </strong>
      <label style={fieldStyle}>
        Variação
        <select
          value={settings.variation}
          onChange={(event) => {
            set({ variation: event.target.value });
          }}
        >
          {VARIATIONS.map((entry) => {
            return (
              <option key={entry.id} value={entry.id}>
                {entry.label}
              </option>
            );
          })}
        </select>
      </label>
      <Slider
        label="Ano"
        value={settings.year}
        min={YEARS[0]}
        max={YEARS[YEARS.length - 1]}
        onChange={(year) => {
          set({ year });
        }}
      />
      <Slider
        label="Opacidade"
        value={settings.opacity}
        min={10}
        max={100}
        onChange={(opacity) => {
          set({ opacity });
        }}
      />
      <Slider
        label="Inclinação da câmera"
        value={settings.pitch}
        min={0}
        max={60}
        onChange={(pitch) => {
          set({ pitch });
        }}
      />
      <Slider
        label="Rotação da câmera"
        value={settings.bearing}
        min={-180}
        max={180}
        onChange={(bearing) => {
          set({ bearing });
        }}
      />
    </div>
  );
};

/**
 * The app's map: its own panel over the left edge, and a split map whose two
 * sides it builds from two sets of settings.
 */
export const SideSpecsMap = () => {
  const [sides, setSides] = React.useState<
    Record<GeoVisSplitSide, SideSettings>
  >({ a: INITIAL, b: { ...INITIAL, variation: 'vulnerability' } });

  const change = React.useCallback(
    (side: GeoVisSplitSide, patch: Partial<SideSettings>) => {
      setSides((prev) => {
        return { ...prev, [side]: { ...prev[side], ...patch } };
      });
    },
    []
  );

  const specA = React.useMemo(() => {
    return specOf(sides.a);
  }, [sides.a]);
  const specB = React.useMemo(() => {
    return specOf(sides.b);
  }, [sides.b]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: 600,
        border: '1px solid #d4d4d8',
      }}
    >
      <GeoVisProvider
        spec={specA}
        split={{ sides: { a: { spec: specA }, b: { spec: specB } } }}
      >
        <GeoVisCanvas viewId="primary" />
        <SidePanel sides={sides} onChange={change} />
      </GeoVisProvider>
    </div>
  );
};
