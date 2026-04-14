import { validateSpec } from 'src/spec/validateSpec';

import singleMap from '../../../src/fixtures/single-map.json';

describe('validateSpec', () => {
  test.each([['single-map', singleMap]])(
    'fixture "%s" is valid',
    (_name, fixture) => {
      const result = validateSpec(fixture);

      expect(result.valid).toBe(true);
    }
  );

  test('returns errors for an invalid spec', () => {
    const result = validateSpec({ title: 'missing required fields' });

    expect(result.valid).toBe(false);

    if (!result.valid) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });
});
