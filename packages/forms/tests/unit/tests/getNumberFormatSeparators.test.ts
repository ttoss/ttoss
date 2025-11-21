import { getNumberFormatSeparators } from '../../../src/getNumberFormatSeparators';

test('should return correct separators for en-US locale', () => {
  const separators = getNumberFormatSeparators('en-US');
  expect(separators).toEqual({
    decimalSeparator: '.',
    thousandSeparator: ',',
  });
});

test('should return correct separators for pt-BR locale', () => {
  const separators = getNumberFormatSeparators('pt-BR');
  expect(separators).toEqual({
    decimalSeparator: ',',
    thousandSeparator: '.',
  });
});

test('should return correct separators for de-DE locale', () => {
  const separators = getNumberFormatSeparators('de-DE');
  expect(separators).toEqual({
    decimalSeparator: ',',
    thousandSeparator: '.',
  });
});

test('should return correct separators for es-ES locale', () => {
  const separators = getNumberFormatSeparators('es-ES');
  expect(separators).toEqual({
    decimalSeparator: ',',
    thousandSeparator: ',',
  });
});

test('should return correct separators for fr-FR locale', () => {
  const separators = getNumberFormatSeparators('fr-FR');
  expect(separators.decimalSeparator).toBe(',');
  // French uses a non-breaking space (U+202F) as thousand separator
  expect(separators.thousandSeparator).toBeTruthy();
  expect(separators.thousandSeparator.charCodeAt(0)).toBe(8239); // U+202F
});

test('should return default separators for invalid locale', () => {
  const separators = getNumberFormatSeparators('invalid');
  expect(separators.decimalSeparator).toBeDefined();
  expect(separators.thousandSeparator).toBeDefined();
});
