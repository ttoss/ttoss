import {
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
