/**
 * Joins class names, skipping falsy entries.
 */
export const cn = (...classes: (string | false | null | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};
