/**
 * Reads a named field out of a submitted form as a string.
 *
 * Every field on this page is named and rendered, so the `null` branch is not
 * reachable through the UI — but `String(null)` is the string `"null"`, so the
 * fallback has to exist. One helper with one tested branch is honest; five
 * `?? ''` fallbacks that no test can reach are five claims nobody checked.
 */
export const formText = (data: FormData, key: string): string => {
  return String(data.get(key) ?? '');
};

/**
 * A slug is the one field here with a rule the user can break, so it is the one
 * that carries validation — lowercase letters, digits and dashes, because it ends
 * up in a URL.
 */
export const validateSlug = (value: string): string | null => {
  if (value.trim() === '') return 'Enter a workspace slug.';
  if (!/^[a-z0-9-]+$/.test(value)) {
    return 'Use lowercase letters, numbers and dashes only.';
  }
  return null;
};
