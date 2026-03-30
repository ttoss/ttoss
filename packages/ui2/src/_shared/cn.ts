/**
 * Merge CSS class names, filtering out falsy values.
 *
 * @example
 * cn('ui2-button', className)        // "ui2-button custom"
 * cn('ui2-button', undefined)        // "ui2-button"
 * cn('ui2-button', false && 'active') // "ui2-button"
 */
export const cn = (
  ...classes: (string | undefined | null | false)[]
): string => {
  return classes.filter(Boolean).join(' ');
};
