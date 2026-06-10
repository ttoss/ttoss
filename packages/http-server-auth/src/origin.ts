/**
 * Returns true if origin matches any entry in the allowlist.
 * Strings are compared exactly; RegExps are tested.
 */
export const isOriginAllowed = (
  origin: string,
  allowedOrigins: Array<string | RegExp | undefined>
): boolean => {
  for (const entry of allowedOrigins) {
    if (entry === undefined) continue;
    if (typeof entry === 'string') {
      if (entry === origin) return true;
    } else {
      if (entry.test(origin)) return true;
    }
  }
  return false;
};
