import type { DistrictEntry } from './gender-dominance-helpers';

/** The years the fictitious series covers, five apart. */
const YEARS = [
  2000, 2005, 2010, 2015, 2020, 2025, 2030, 2035, 2040, 2045, 2050,
] as const;

/** São Paulo's district codes (`cd_distrit`) run from 1 to 96. */
const DISTRICT_COUNT = 96;

/** The age bands each sex is split into, and their rough share. */
const AGE_BANDS: [string, number][] = [
  ['0-14', 0.2],
  ['15-64', 0.68],
  ['65+', 0.12],
];

/** A small seeded generator (mulberry32), so the series is the same each load. */
const seeded = (seed: number) => {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** Splits `count` people across the age bands, nudged by `random`. */
const byAge = (count: number, random: () => number) => {
  return Object.fromEntries(
    AGE_BANDS.map(([band, share]) => {
      const nudge = 0.85 + random() * 0.3;
      return [band, Math.round(count * share * nudge)];
    })
  );
};

/**
 * A made-up population for each district of São Paulo, by year — fictitious
 * data for the stories, not census figures. Keyed the way the district
 * boundaries are: the year, then the `cd_distrit` code (`'1'`–`'96'`).
 *
 * Each district gets a size between 8k and 260k in 2000, a growth rate per
 * five years between −4% and +8%, and a share of women between 44% and 56%,
 * so both sexes lead somewhere. Names are "District 1" to "District 96".
 *
 * @example
 * fictitiousDistrictPopulation()['2025']['12'].total; // a made-up number
 */
export const fictitiousDistrictPopulation = (): Record<
  string,
  Record<string, DistrictEntry>
> => {
  const random = seeded(20261104);
  const districts = Array.from({ length: DISTRICT_COUNT }, (_, index) => {
    return {
      id: String(index + 1),
      base: 8_000 + random() ** 1.4 * 252_000,
      growth: -0.04 + random() * 0.12,
      womenShare: 0.44 + random() * 0.12,
    };
  });
  return Object.fromEntries(
    YEARS.map((year) => {
      const steps = (year - 2000) / 5;
      return [
        String(year),
        Object.fromEntries(
          districts.map(({ id, base, growth, womenShare }) => {
            const total = base * (1 + growth) ** steps;
            const women = byAge(total * womenShare, random);
            const men = byAge(total * (1 - womenShare), random);
            const sum = [...Object.values(women), ...Object.values(men)].reduce(
              (acc, value) => {
                return acc + value;
              },
              0
            );
            const entry: DistrictEntry = {
              total: sum,
              districtName: `District ${id}`,
              men,
              women,
            };
            return [id, entry];
          })
        ),
      ];
    })
  );
};
