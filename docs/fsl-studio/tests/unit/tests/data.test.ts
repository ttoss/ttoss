import { timezoneLabel, TIMEZONES } from 'src/data';

describe('timezoneLabel', () => {
  test('maps a known zone id to its city label', () => {
    expect(timezoneLabel('America/Sao_Paulo')).toBe('São Paulo');
  });

  test('falls back to the id for a zone outside the set', () => {
    expect(timezoneLabel('Mars/Olympus_Mons')).toBe('Mars/Olympus_Mons');
  });

  test('every zone id is unique', () => {
    const ids = TIMEZONES.map((zone) => {
      return zone.id;
    });
    expect(new Set(ids).size).toBe(ids.length);
  });
});
