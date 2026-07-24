import { navigate, parseHash, ROUTES } from 'src/router';

describe('parseHash', () => {
  test.each([
    ['#/', 'dashboard'],
    ['#/team', 'team'],
    ['#/billing', 'billing'],
    ['', 'dashboard'],
    ['#/unknown', 'dashboard'],
  ])('%s → %s', (hash, route) => {
    expect(parseHash(hash)).toBe(route);
  });
});

describe('navigate', () => {
  test('sets the location hash for each route', () => {
    for (const route of Object.keys(ROUTES) as (keyof typeof ROUTES)[]) {
      navigate(route);
      expect(window.location.hash).toBe(ROUTES[route].hash);
    }
  });
});
