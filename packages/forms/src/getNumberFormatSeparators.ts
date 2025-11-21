/**
 * Extracts decimal and thousand separators from a given locale using Intl.NumberFormat.
 * This function formats a sample number and parses the parts to identify the separators.
 *
 * @param locale - The locale string (e.g., 'en-US', 'pt-BR', 'de-DE')
 * @returns An object containing decimalSeparator and thousandSeparator
 */
export const getNumberFormatSeparators = (locale: string) => {
  const parts = new Intl.NumberFormat(locale).formatToParts(1234.56);

  const decimalSeparator =
    parts.find((part) => {
      return part.type === 'decimal';
    })?.value || '.';

  const thousandSeparator =
    parts.find((part) => {
      return part.type === 'group';
    })?.value || ',';

  return {
    decimalSeparator,
    thousandSeparator,
  };
};
