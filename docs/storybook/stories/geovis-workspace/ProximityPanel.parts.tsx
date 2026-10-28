/**
 * The pieces of the `ProximityPanel` story's sidebar: its look, the details the
 * app keeps about each place, and the counts and skeleton rows.
 */
import { type ProximityHit, useGeoVisProximitySearch } from '@ttoss/geovis';
import { useGeovisWorkspace } from '@ttoss/geovis-workspace';
import * as React from 'react';

import { CATEGORIES } from '../geovis/SearchingForServicesByDistance.fixtures';

export const INK = '#1a2235';
export const MUTED = '#6b7a90';
export const FAINT = '#8593a6';
export const HAIRLINE = '1px solid rgba(0,0,0,0.07)';
export const GREEN = '#0b7a55';
export const BLUE = '#2f6fe4';
export const AMBER = '#b45309';
export const FONT_HEAD = "'Barlow Condensed', sans-serif";
export const FONT_MONO = "'JetBrains Mono', monospace";

/** The short names the counts row uses, by category id. */
const SHORT_LABELS: Record<string, string> = {
  cozinha: 'Cozinhas',
  restaurante: 'Restaurantes',
  banco: 'Bancos',
  feira: 'Feiras',
};

const STREETS = [
  'Rua das Palmeiras',
  'Av. Brasil',
  'Rua São Bento',
  'Rua Dom Pedro II',
  'Travessa da Paz',
  'Rua XV de Novembro',
  'Av. Independência',
  'Rua das Acácias',
];

const NEIGHBOURHOODS = [
  'Bela Vista',
  'Consolação',
  'Liberdade',
  'República',
  'Santa Cecília',
  'Vila Mariana',
];

/** Opening hours and what the place offers, by category id. */
const SCHEDULES: Record<string, { hours: string; serves: string }> = {
  cozinha: { hours: 'Seg a Sex · 11h às 14h', serves: 'Almoço' },
  restaurante: { hours: 'Seg a Sáb · 10h30 às 15h', serves: 'Almoço' },
  banco: { hours: 'Ter e Qui · 8h às 17h', serves: 'Retirada de cestas' },
  feira: { hours: 'Qua e Sáb · 6h às 13h', serves: 'Hortifrúti' },
};

/**
 * What the app knows about a place the search found. Stands in for the app's
 * own records: derived from the id, so the same place always reads the same.
 */
export const detailsOf = (hit: ProximityHit) => {
  const n = Number(hit.id);
  const schedule = SCHEDULES[hit.categoryId ?? ''] ?? SCHEDULES.cozinha;
  return {
    address: `${STREETS[n % STREETS.length]}, ${40 + ((n * 137) % 1900)} · ${
      NEIGHBOURHOODS[(n * 7) % NEIGHBOURHOODS.length]
    }`,
    hours: schedule.hours,
    serves: schedule.serves,
    phone: `(11) ${3000 + ((n * 791) % 6999)}-${String(1000 + ((n * 347) % 8999))}`,
    open: n % 4 !== 0,
  };
};

/** `350 m`, `1,2 km`. */
export const formatDistance = (metres: number) => {
  return metres < 1000
    ? `${Math.round(metres)} m`
    : `${(metres / 1000).toFixed(1).replace('.', ',')} km`;
};

/** `1 km`, `2 km`. */
export const formatRadius = (metres: number) => {
  return `${(metres / 1000).toLocaleString('pt-BR')} km`;
};

/** Rough travel times: walking at 5 km/h, driving at 25 km/h plus parking. */
export const travelTimes = (metres: number) => {
  const km = metres / 1000;
  return {
    walk: Math.max(2, Math.round(km * 1.3 * 12)),
    car: Math.max(2, Math.round(km * 1.4 * 2.4 + 2)),
  };
};

export const CSS = `
.pp-close:hover { color: ${MUTED}; background: rgba(0,0,0,0.05); }
.pp-row:hover { background: rgba(0,0,0,0.025); }
.pp-scroll { scrollbar-width: none; }
.pp-scroll::-webkit-scrollbar { width: 0; height: 0; }
`;

/** Opens the sidebar on each new search, and closes it when one clears. */
export const useOpenWithSearch = () => {
  const search = useGeoVisProximitySearch();
  const { setRightSidebarOpen } = useGeovisWorkspace();
  const key = search?.origin ? search.origin.join(',') : null;
  React.useEffect(() => {
    setRightSidebarOpen({ open: key !== null });
  }, [key, setRightSidebarOpen]);
};

export const fieldLabel: React.CSSProperties = {
  fontFamily: FONT_HEAD,
  fontSize: 10,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: MUTED,
};

/** The counts by kind, one cell per category, dimmed when none is near. */
export const Counts = ({
  results,
  pending,
}: {
  results: ProximityHit[];
  pending: boolean;
}) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(76px, 1fr))',
        margin: '0 -20px -1px',
        borderTop: HAIRLINE,
        overflow: 'hidden',
      }}
    >
      {CATEGORIES.map((category) => {
        const count = results.filter((hit) => {
          return hit.categoryId === category.id;
        }).length;
        return (
          <div
            key={category.id}
            title={category.label}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 6,
              minHeight: 58,
              padding: '11px 10px 12px',
              boxShadow: '1px 0 0 rgba(0,0,0,0.07), 0 1px 0 rgba(0,0,0,0.07)',
              opacity: count || pending ? 1 : 0.45,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                height: 20,
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 99,
                  background: category.color,
                }}
              />
              <span
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 20,
                  fontWeight: 500,
                  color: INK,
                  lineHeight: 1,
                }}
              >
                {pending ? '–' : count}
              </span>
            </div>
            <div
              style={{
                ...fieldLabel,
                fontSize: 9.5,
                letterSpacing: '0.08em',
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '100%',
              }}
            >
              {SHORT_LABELS[category.id] ?? category.label}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/** Placeholder rows while the first answer is awaited, fading out. */
export const Skeleton = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {[1, 0.75, 0.5, 0.3].map((opacity) => {
        return (
          <div
            key={opacity}
            style={{
              display: 'flex',
              gap: 12,
              padding: '14px 20px',
              borderBottom: HAIRLINE,
              opacity,
            }}
          >
            <span
              style={{
                width: 32,
                height: 32,
                borderRadius: 9,
                background: '#eef2f6',
              }}
            />
            <span
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 7,
                paddingTop: 3,
              }}
            >
              <span
                style={{
                  width: '40%',
                  height: 8,
                  borderRadius: 4,
                  background: '#eef2f6',
                }}
              />
              <span
                style={{
                  width: '80%',
                  height: 10,
                  borderRadius: 4,
                  background: '#eef2f6',
                }}
              />
            </span>
          </div>
        );
      })}
    </div>
  );
};
