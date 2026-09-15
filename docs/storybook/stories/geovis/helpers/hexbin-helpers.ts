/**
 * Hexagonal binning helpers shared by the Hexbin story.
 * Not public package artefacts — story utilities only.
 *
 * The grid is built in Web Mercator metres rather than in degrees. A degree of
 * longitude shrinks towards the poles, so a grid stepped in degrees draws
 * hexagons that flatten as they go south — over Brazil (5°N to 34°S) that is
 * visible without measuring. MapLibre renders in Mercator, so binning in the
 * same space is what keeps every cell the same shape on screen.
 *
 * Pointy-top axial coordinates throughout, following the standard formulation
 * (Patel, "Hexagonal Grids"): a cell is addressed by `(q, r)`, a point is
 * assigned to one by rounding in cube space, and no cell is ever assigned twice.
 */

import { BRAZIL_RINGS } from './brazilRings';
import type { Bbox } from './map-story-helpers';

/** Half the Mercator world span, in metres — the projection's x at 180°. */
const MERCATOR_HALF_WORLD = 20_037_508.34;

/** A position in Web Mercator metres. */
type Metres = { x: number; y: number };

/** A cell address in pointy-top axial coordinates. */
type Axial = { q: number; r: number };

const toMetres = ([lng, lat]: [number, number]): Metres => {
  return {
    x: (lng * MERCATOR_HALF_WORLD) / 180,
    y:
      ((Math.log(Math.tan(((90 + lat) * Math.PI) / 360)) / (Math.PI / 180)) *
        MERCATOR_HALF_WORLD) /
      180,
  };
};

const toLngLat = ({ x, y }: Metres): [number, number] => {
  const lng = (x / MERCATOR_HALF_WORLD) * 180;
  const raw = (y / MERCATOR_HALF_WORLD) * 180;
  const lat =
    (180 / Math.PI) *
    (2 * Math.atan(Math.exp((raw * Math.PI) / 180)) - Math.PI / 2);
  return [lng, lat];
};

/** Centre of cell `(q, r)` for a grid of the given circumradius. */
const centreOf = ({ q, r }: Axial, radius: number): Metres => {
  return {
    x: radius * Math.sqrt(3) * (q + r / 2),
    y: radius * (3 / 2) * r,
  };
};

/**
 * The cell a point falls in. Fractional axial coordinates are rounded in cube
 * space — rounding `q` and `r` independently would claim points near a shared
 * edge for the wrong neighbour, leaving seams of miscounted cells.
 */
const cellAt = ({ x, y }: Metres, radius: number): Axial => {
  const q = ((Math.sqrt(3) / 3) * x - (1 / 3) * y) / radius;
  const r = ((2 / 3) * y) / radius;
  const s = -q - r;

  let rq = Math.round(q);
  let rr = Math.round(r);
  const rs = Math.round(s);

  const dq = Math.abs(rq - q);
  const dr = Math.abs(rr - r);
  const ds = Math.abs(rs - s);

  // Discard whichever coordinate drifted most, so `q + r + s === 0` holds.
  if (dq > dr && dq > ds) {
    rq = -rr - rs;
  } else if (dr > ds) {
    rr = -rq - rs;
  }

  return { q: rq, r: rr };
};

/** The six corners of cell `(q, r)`, closed, as a GeoJSON ring. */
const ringOf = (cell: Axial, radius: number): [number, number][] => {
  const centre = centreOf(cell, radius);
  const corners = Array.from({ length: 6 }, (_, corner) => {
    const angle = (Math.PI / 180) * (60 * corner - 30);
    return toLngLat({
      x: centre.x + radius * Math.cos(angle),
      y: centre.y + radius * Math.sin(angle),
    });
  });
  return [...corners, corners[0]];
};

/** Stable feature id for a cell. Also the `geometryId` its `mapData` row joins on. */
const idOf = ({ q, r }: Axial): string => {
  return `hex-${q}-${r}`;
};

/**
 * Ray casting: whether `[lng, lat]` lies inside a closed ring. Counts the ring
 * edges a ray cast east from the point crosses — odd means inside.
 */
const insideRing = (
  [lng, lat]: [number, number],
  ring: [number, number][]
): boolean => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const straddles = yi > lat !== yj > lat;
    if (straddles && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
};

/**
 * Each ring paired with its bounding box, computed once.
 *
 * The box is a reject test, not an optimisation for its own sake: without it
 * every position is ray-cast against all 27 rings and their ~1950 vertices, and
 * the grid asks that question six times per candidate cell over a rectangle
 * that is largely ocean. Comparing four numbers first turns nearly all of those
 * into a miss that costs nothing.
 */
const RINGS = BRAZIL_RINGS.map((ring) => {
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;
  for (const [lng, lat] of ring) {
    if (lng < minLng) minLng = lng;
    if (lat < minLat) minLat = lat;
    if (lng > maxLng) maxLng = lng;
    if (lat > maxLat) maxLat = lat;
  }
  return { ring, minLng, minLat, maxLng, maxLat };
});

/**
 * Whether a position falls on Brazilian land, per {@link BRAZIL_RINGS}.
 *
 * @param position - `[lng, lat]`.
 * @returns `true` when inside any state ring.
 *
 * @example
 * insideBrazil([-46.6, -23.5]); // true — São Paulo
 * insideBrazil([-58.4, -34.6]); // false — Buenos Aires
 */
export const insideBrazil = (position: [number, number]): boolean => {
  const [lng, lat] = position;
  return RINGS.some((candidate) => {
    if (lng < candidate.minLng || lng > candidate.maxLng) return false;
    if (lat < candidate.minLat || lat > candidate.maxLat) return false;
    return insideRing(position, candidate.ring);
  });
};

/**
 * Whether a cell belongs to the clipped grid: its centre is on land, or at
 * least half its corners are.
 *
 * The corner half is not cosmetic. The rings are simplified per state, so two
 * neighbours' shared border diverges by up to the tolerance, leaving hairline
 * slivers along every internal boundary that belong to no ring. A centre
 * landing in one would punch a hole in the middle of the country. Requiring
 * half the corners — rather than any single one — keeps those cells while still
 * refusing cells that merely graze the coast with one corner.
 */
const cellOnLand = (ring: [number, number][]): boolean => {
  let onLand = 0;
  let offLand = 0;
  for (let corner = 0; corner < 6; corner += 1) {
    if (insideBrazil(ring[corner])) {
      onLand += 1;
      if (onLand >= 3) return true;
    } else {
      offLand += 1;
      // Four misses put the remaining corners out of reach of the threshold.
      if (offLand > 3) return false;
    }
  }
  return false;
};

/** One binned cell: its polygon, its address, and how many points landed in it. */
export type HexbinCell = {
  id: string;
  count: number;
  ring: [number, number][];
};

/**
 * Every cell of the grid over the given Mercator extent, in a stable order.
 *
 * The extent is padded by one circumradius, because a point can sit up to
 * `radius` from its own cell's centre: a cell centred just outside the box can
 * still own a point just inside it. Selecting on the bare box would drop those
 * cells and, with them, their counts — a hexbin that silently loses
 * observations.
 */
const tile = ({
  min,
  max,
  radius,
  keep,
}: {
  min: Metres;
  max: Metres;
  radius: number;
  keep: (cell: { id: string; ring: [number, number][] }) => boolean;
}): { id: string; ring: [number, number][] }[] => {
  const pad = radius;
  const tiles: { id: string; ring: [number, number][] }[] = [];

  // `q` is sheared by `r`, so its range is derived per row, not once for all.
  const rMin = Math.floor(((2 / 3) * (min.y - pad)) / radius);
  const rMax = Math.ceil(((2 / 3) * (max.y + pad)) / radius);

  for (let r = rMin; r <= rMax; r += 1) {
    const rowShift = r / 2;
    const qMin = Math.floor((min.x - pad) / (radius * Math.sqrt(3)) - rowShift);
    const qMax = Math.ceil((max.x + pad) / (radius * Math.sqrt(3)) - rowShift);

    for (let q = qMin; q <= qMax; q += 1) {
      const centre = centreOf({ q, r }, radius);
      const withinX = centre.x >= min.x - pad && centre.x <= max.x + pad;
      const withinY = centre.y >= min.y - pad && centre.y <= max.y + pad;
      if (!withinX || !withinY) continue;

      const candidate = { id: idOf({ q, r }), ring: ringOf({ q, r }, radius) };
      if (!keep(candidate)) continue;

      tiles.push(candidate);
    }
  }

  return tiles;
};

/**
 * Bins points into a hexagonal grid clipped to Brazilian land.
 *
 * Every cell on land is emitted, empty ones included: the story's subject is a
 * territory fully tiled by hexagons, so the cells that caught nothing are part
 * of the picture. Dropping them is a different chart, offered as a toggle in the
 * story rather than imposed here.
 *
 * @param params.points - The observations to bin, as `[lng, lat]`.
 * @param params.bbox - The area to walk, `[minLng, minLat, maxLng, maxLat]`.
 * @param params.radiusKm - Cell circumradius (centre to corner) in kilometres.
 * @param params.clip - Keep only cells on land. Defaults to `true`.
 * @returns One {@link HexbinCell} per kept cell, in a stable order.
 *
 * @example
 * hexbin({ points: [[-46.6, -23.5]], bbox: BRAZIL_BBOX, radiusKm: 120 });
 */
export const hexbin = ({
  points,
  bbox,
  radiusKm,
  clip = true,
}: {
  points: [number, number][];
  bbox: Bbox;
  radiusKm: number;
  clip?: boolean;
}): HexbinCell[] => {
  // Mercator metres are stretched by 1/cos(latitude), so a cell sized in
  // ground kilometres has to be scaled at the latitude it is drawn at, or the
  // grid comes out systematically too small. The box's mid-latitude is the
  // reference — a single grid cannot honour every latitude it spans at once.
  const midLat = (bbox[1] + bbox[3]) / 2;
  const radius = (radiusKm * 1000) / Math.cos((midLat * Math.PI) / 180);

  const min = toMetres([bbox[0], bbox[1]]);
  const max = toMetres([bbox[2], bbox[3]]);

  const counts = new Map<string, number>();
  for (const point of points) {
    const id = idOf(cellAt(toMetres(point), radius));
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  // A cell that caught something is kept whatever the clip says. The clip is
  // there to shape the grid like the country, and a cell holding observations
  // is part of the country by the only evidence this function has — dropping it
  // to tidy the coastline would delete data to improve a silhouette.
  const keep = ({ id, ring }: { id: string; ring: [number, number][] }) => {
    return !clip || counts.has(id) || cellOnLand(ring);
  };

  return tile({ min, max, radius, keep }).map(({ id, ring }) => {
    return { id, count: counts.get(id) ?? 0, ring };
  });
};

/**
 * Class breaks at even quantiles of the non-empty counts.
 *
 * Quantiles rather than equal intervals because binned counts are heavily
 * right-skewed — a handful of dense cells would otherwise push every break
 * above the bulk of the data and paint the whole map in the lightest class.
 * Empty cells are excluded: they are the `defaultColor`, not a class.
 *
 * @param params.counts - Every cell's count, empties included.
 * @param params.classes - How many colour classes to produce.
 * @returns `classes - 1` ascending, distinct break points.
 *
 * @example
 * quantileBreaks({ counts: [0, 1, 2, 3, 4, 9], classes: 3 }); // [2, 4]
 */
export const quantileBreaks = ({
  counts,
  classes,
}: {
  counts: number[];
  classes: number;
}): number[] => {
  const populated = counts
    .filter((count) => {
      return count > 0;
    })
    .sort((a, b) => {
      return a - b;
    });

  if (populated.length === 0) return [];

  const breaks = Array.from({ length: classes - 1 }, (_, index) => {
    const at = Math.floor(((index + 1) / classes) * populated.length);
    return populated[Math.min(at, populated.length - 1)];
  });

  return [...new Set(breaks)];
};

/**
 * Deterministic PRNG (mulberry32). Seeded so the story renders the same cloud
 * on every reload — a story whose data moves under the reader cannot be used to
 * compare one control setting against another.
 */
const randomFrom = (seed: number) => {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let drawn = Math.imul(state ^ (state >>> 15), 1 | state);
    drawn = (drawn + Math.imul(drawn ^ (drawn >>> 7), 61 | drawn)) ^ drawn;
    return ((drawn ^ (drawn >>> 14)) >>> 0) / 4294967296;
  };
};

/**
 * Fictional observations: dense blobs around a few centres over a thin uniform
 * scatter. Invented on purpose — the story demonstrates the technique, and a
 * real dataset would invite reading the map for its subject instead.
 *
 * The blobs are what make binning legible: a uniform cloud bins into a flat
 * surface where every cell looks alike, which shows nothing.
 *
 * @param params.centres - Blob centres as `[lng, lat]`.
 * @param params.perCentre - Points drawn around each centre.
 * @param params.scatter - Points spread uniformly across `bbox`.
 * @param params.spread - Blob standard deviation in degrees.
 * @param params.bbox - Area the scatter covers.
 * @param params.seed - PRNG seed.
 * @returns The point cloud as `[lng, lat]` pairs.
 *
 * @example
 * syntheticPoints({ centres: [[-46.6, -23.5]], perCentre: 200, scatter: 50, spread: 1.5, bbox, seed: 7 });
 */
export const syntheticPoints = ({
  centres,
  perCentre,
  scatter,
  spread,
  bbox,
  seed,
}: {
  centres: [number, number][];
  perCentre: number;
  scatter: number;
  spread: number;
  bbox: Bbox;
  seed: number;
}): [number, number][] => {
  const random = randomFrom(seed);

  // Box-Muller: a sum of uniforms would pile up in a diamond, and the corners
  // of that shape read as grid artefacts once binned.
  const gaussian = () => {
    const u = Math.max(random(), Number.EPSILON);
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * random());
  };

  const clamp = (value: number, min: number, max: number) => {
    return Math.min(Math.max(value, min), max);
  };

  const blobs = centres.flatMap(([lng, lat]) => {
    return Array.from({ length: perCentre }, (): [number, number] => {
      return [
        clamp(lng + gaussian() * spread, bbox[0], bbox[2]),
        clamp(lat + gaussian() * spread, bbox[1], bbox[3]),
      ];
    });
  });

  const noise = Array.from({ length: scatter }, (): [number, number] => {
    return [
      bbox[0] + random() * (bbox[2] - bbox[0]),
      bbox[1] + random() * (bbox[3] - bbox[1]),
    ];
  });

  return [...blobs, ...noise];
};
