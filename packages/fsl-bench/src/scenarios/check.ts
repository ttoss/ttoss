/**
 * Minimal assertion helper for scenario checks. The gauntlet runs outside
 * jest, so scenarios throw plain errors instead of using expect() matchers —
 * the message is what the repair loop feeds back to the model.
 */
export const check = (condition: unknown, message: string): void => {
  if (!condition) {
    throw new Error(`Behavior check failed: ${message}`);
  }
};

/**
 * Reads the toggled state of a switch-like control regardless of how the
 * library renders it (role="switch" with aria-checked, or a native
 * checkbox input).
 */
export const isToggledOn = (element: Element): boolean => {
  const ariaChecked = element.getAttribute('aria-checked');

  if (ariaChecked !== null) {
    return ariaChecked === 'true';
  }

  return (element as HTMLInputElement).checked === true;
};
