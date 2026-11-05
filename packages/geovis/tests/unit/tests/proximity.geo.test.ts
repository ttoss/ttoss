import {
  circleRing,
  destinationPoint,
  distanceInMetres,
  metresPerPixel,
  zoomForRadius,
} from 'src/react/proximity.geo';

describe('metresPerPixel', () => {
  test('covers the equator in one 512 px tile at zoom 0', () => {
    expect(metresPerPixel(0, 0)).toBeCloseTo(40_075_016.686 / 512, 3);
  });

  test('halves with every zoom level, and shrinks away from the equator', () => {
    expect(metresPerPixel(0, 1)).toBeCloseTo(metresPerPixel(0, 0) / 2, 6);
    expect(metresPerPixel(60, 0)).toBeCloseTo(metresPerPixel(0, 0) / 2, 6);
  });
});

describe('zoomForRadius', () => {
  test('is the zoom at which the radius spans the pixels asked for', () => {
    const zoom = zoomForRadius({ lat: -23.55, metres: 1000, pixels: 150 });

    expect(1000 / metresPerPixel(-23.55, zoom)).toBeCloseTo(150, 6);
  });
});

describe('distanceInMetres', () => {
  test('measures a degree of latitude as about 111 km', () => {
    expect(distanceInMetres([0, 0], [0, 1])).toBeCloseTo(111_195, -1);
  });

  test('is zero between a point and itself', () => {
    expect(distanceInMetres([-46.63, -23.55], [-46.63, -23.55])).toBe(0);
  });
});

describe('destinationPoint', () => {
  test('lands the given distance away, along the bearing', () => {
    const origin: [number, number] = [-46.63, -23.55];
    for (const bearing of [0, 90, 180, 270, 45]) {
      const point = destinationPoint({ origin, metres: 1500, bearing });
      expect(distanceInMetres(origin, point)).toBeCloseTo(1500, 3);
    }
    const [lngNorth, latNorth] = destinationPoint({
      origin,
      metres: 1000,
      bearing: 0,
    });
    expect(lngNorth).toBeCloseTo(origin[0], 9);
    expect(latNorth).toBeGreaterThan(origin[1]);
    const [lngEast, latEast] = destinationPoint({
      origin,
      metres: 1000,
      bearing: 90,
    });
    expect(lngEast).toBeGreaterThan(origin[0]);
    expect(latEast).toBeCloseTo(origin[1], 4);
  });
});

describe('circleRing', () => {
  test('is closed, every point the radius away from the centre', () => {
    const origin: [number, number] = [-46.63, -23.55];
    const ring = circleRing({ origin, metres: 2000, steps: 16 });

    expect(ring).toHaveLength(17);
    expect(ring.at(-1)).toEqual(ring[0]);
    for (const point of ring) {
      expect(distanceInMetres(origin, point)).toBeCloseTo(2000, 3);
    }
  });

  test('defaults to 96 points', () => {
    expect(circleRing({ origin: [0, 0], metres: 10 })).toHaveLength(97);
  });
});
