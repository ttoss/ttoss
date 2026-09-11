/**
 * Offline generator for the vector tiles behind the `ClusterTiles` story.
 *
 * The story demonstrates the only clustering strategy available to a
 * `vector-tiles` source: the points are merged **at tile-generation time** by
 * `tippecanoe`, not in the browser. MapLibre's own `cluster: true` is a
 * `geojson`-source feature — it needs every point in memory, which is exactly
 * what a tiled dataset cannot afford.
 *
 * The data is fictitious: `POINT_TOTAL` points scattered around eight Brazilian
 * capitals with a seeded PRNG, so re-running this script reproduces the same
 * pyramid byte for byte and the committed tiles never churn in `git diff`.
 *
 * # The `count` attribute, and why `point_count` is not enough
 *
 * Every input point carries `count: 1`, and `--accumulate-attribute=count:sum`
 * adds those up as points merge. `tippecanoe` also writes its own `point_count`
 * on each cluster, but that one reports how many features were merged **at that
 * zoom level**, and since each level clusters the previous level's already
 * merged features, it under-reports the real total: a z5 cluster covering 2,000
 * original points reads `point_count: 128` while `count` reads `2000`. Size and
 * label the clusters by `count`.
 *
 * Because `count` is written on every feature — clustered or not — a layer can
 * split clusters from lone points with a plain `count >= 2` / `count < 2`
 * filter, which is what GeoVis's `LayerFilter` can express today (it has no
 * `has`/`not-has` operator for tippecanoe's cluster-only `point_count`).
 *
 * Prerequisites: `tippecanoe` on the PATH (`tippecanoe --version`).
 *
 * Usage, from the repository root:
 *
 *   node packages/geovis/scripts/generateClusterFixtureTiles.ts
 *
 * Output: `docs/storybook/public/tiles/cluster-demo/{z}/{x}/{y}.pbf`, served by
 * Storybook's `staticDirs`. Tiles are written uncompressed
 * (`--no-tile-compression`) because that static server sends no
 * `Content-Encoding: gzip` header, and MapLibre needs one to read compressed
 * tiles.
 */
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PACKAGE_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const OUTPUT_DIR = join(
  PACKAGE_ROOT,
  '..',
  '..',
  'docs',
  'storybook',
  'public',
  'tiles',
  'cluster-demo'
);

/** Layer name inside the tiles; the fixture declares it as `sourceLayer`. */
const TILE_LAYER = 'clusters';

/**
 * Zoom range the pyramid is built for. `2` frames the whole country; `8` is
 * roughly metropolitan scale, where the story's clusters have already broken
 * apart into small groups. Stopping there keeps the committed pyramid near a
 * hundred files — going to street scale would multiply that by an order of
 * magnitude for no demonstrative gain.
 */
const MIN_ZOOM = 2;
const MAX_ZOOM = 8;

/**
 * Pixel distance under which `tippecanoe` merges two points into one cluster.
 * `40` reads like MapLibre's own `clusterRadius` default of 50 without letting
 * neighbouring capitals collapse into a single blob at `MIN_ZOOM`.
 */
const CLUSTER_DISTANCE = 40;

/** Total fictitious points spread across {@link CITIES}. */
const POINT_TOTAL = 20_000;

/**
 * The eight capitals the fictitious points cluster around. `weight` is the
 * share of {@link POINT_TOTAL} each one receives, and `spread` its standard
 * deviation in degrees — a wider spread reads as a metropolitan region, a
 * tighter one as a dense urban core.
 */
const CITIES = [
  { name: 'São Paulo', lng: -46.63, lat: -23.55, weight: 0.3, spread: 0.35 },
  {
    name: 'Rio de Janeiro',
    lng: -43.2,
    lat: -22.91,
    weight: 0.18,
    spread: 0.25,
  },
  {
    name: 'Belo Horizonte',
    lng: -43.94,
    lat: -19.92,
    weight: 0.12,
    spread: 0.3,
  },
  { name: 'Brasília', lng: -47.88, lat: -15.79, weight: 0.1, spread: 0.4 },
  { name: 'Salvador', lng: -38.5, lat: -12.97, weight: 0.1, spread: 0.28 },
  { name: 'Recife', lng: -34.88, lat: -8.05, weight: 0.08, spread: 0.26 },
  {
    name: 'Porto Alegre',
    lng: -51.23,
    lat: -30.03,
    weight: 0.07,
    spread: 0.32,
  },
  { name: 'Manaus', lng: -60.02, lat: -3.12, weight: 0.05, spread: 0.45 },
];

/** Decimal places kept per coordinate — five is ~1 m at these latitudes. */
const COORDINATE_DECIMALS = 5;

/**
 * Deterministic PRNG (mulberry32). `Math.random` would rewrite every tile on
 * every run, turning a regeneration into an unreviewable binary diff.
 *
 * @param seed - Any 32-bit integer; the same seed always yields the same stream.
 * @returns A function producing the next float in `[0, 1)`.
 *
 * @example
 * const random = createRandom(0x5eed);
 * random(); // 0.6303... — same value on every run
 */
export const createRandom = (seed: number): (() => number) => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/**
 * Draws one standard-normal sample from two uniforms (Box–Muller). Normal
 * scatter is what makes the fixture read like a real settlement pattern:
 * dense at the centre, thinning outwards, which is precisely the distribution
 * clustering exists to tame.
 *
 * @param random - The uniform source, from {@link createRandom}.
 * @returns A sample with mean `0` and standard deviation `1`.
 *
 * @example
 * const random = createRandom(1);
 * gaussian(random); // -0.42...
 */
export const gaussian = (random: () => number): number => {
  const u = 1 - random();
  const v = random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

/**
 * The line-delimited GeoJSON feature for one point, ready for `tippecanoe`'s
 * stdin. Each carries `count: 1`, the attribute the tiles accumulate.
 *
 * @param params.lng - Longitude in decimal degrees.
 * @param params.lat - Latitude in decimal degrees.
 * @returns One newline-terminated GeoJSON `Feature`.
 *
 * @example
 * featureLine({ lng: -46.63, lat: -23.55 });
 * // '{"type":"Feature","properties":{"count":1},...}\n'
 */
export const featureLine = ({
  lng,
  lat,
}: {
  lng: number;
  lat: number;
}): string => {
  const coordinates = [
    Number(lng.toFixed(COORDINATE_DECIMALS)),
    Number(lat.toFixed(COORDINATE_DECIMALS)),
  ];
  return `${JSON.stringify({
    type: 'Feature',
    properties: { count: 1 },
    geometry: { type: 'Point', coordinates },
  })}\n`;
};

/** Starts `tippecanoe` reading line-delimited features from its stdin. */
const startTippecanoe = () => {
  return spawn(
    'tippecanoe',
    [
      '--output-to-directory',
      OUTPUT_DIR,
      '--force',
      '--layer',
      TILE_LAYER,
      '--minimum-zoom',
      String(MIN_ZOOM),
      '--maximum-zoom',
      String(MAX_ZOOM),
      '--cluster-distance',
      String(CLUSTER_DISTANCE),
      // Sums `count` as points merge, so a cluster reports how many original
      // points it stands for — see the note on `point_count` above.
      '--accumulate-attribute',
      'count:sum',
      '--no-tile-compression',
      '--no-progress-indicator',
    ],
    { stdio: ['pipe', 'inherit', 'inherit'] }
  );
};

/**
 * Writes one line, waiting for the pipe to drain when the buffer is full.
 * Without the backpressure wait the features queue in memory faster than
 * `tippecanoe` reads them.
 */
const writeLine = (
  stdin: NonNullable<ReturnType<typeof startTippecanoe>['stdin']>,
  line: string
): Promise<void> => {
  if (stdin.write(line)) return Promise.resolve();
  return new Promise((resolve) => {
    stdin.once('drain', resolve);
  });
};

const main = async (): Promise<void> => {
  // `tippecanoe --output-to-directory` creates the leaf directory but not its
  // parents, and fails partway through the first zoom with `ENOENT` otherwise.
  await mkdir(OUTPUT_DIR, { recursive: true });

  const tippecanoe = startTippecanoe();
  const { stdin } = tippecanoe;
  if (!stdin) {
    throw new Error(
      '[generateClusterFixtureTiles] tippecanoe exposed no stdin.'
    );
  }

  const exited = new Promise<void>((resolve, reject) => {
    tippecanoe.on('error', reject);
    tippecanoe.on('close', (code) => {
      return code === 0
        ? resolve()
        : reject(
            new Error(
              `[generateClusterFixtureTiles] tippecanoe exited ${code}.`
            )
          );
    });
  });

  const random = createRandom(0x63_6c_75_73);
  let written = 0;

  for (const city of CITIES) {
    const cityTotal = Math.round(POINT_TOTAL * city.weight);
    for (let index = 0; index < cityTotal; index += 1) {
      await writeLine(
        stdin,
        featureLine({
          lng: city.lng + gaussian(random) * city.spread,
          lat: city.lat + gaussian(random) * city.spread,
        })
      );
      written += 1;
    }
  }

  stdin.end();
  await exited;

  process.stderr.write(
    [
      `[generateClusterFixtureTiles] points written: ${written}`,
      `tiles: ${OUTPUT_DIR} (z${MIN_ZOOM}–z${MAX_ZOOM}, layer "${TILE_LAYER}")`,
      '',
    ].join('\n')
  );
};

await main();
