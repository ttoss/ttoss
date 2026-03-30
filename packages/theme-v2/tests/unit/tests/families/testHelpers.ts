/**
 * Shared test helpers for family validation tests.
 *
 * Centralizes common parsing, filtering, and validation logic to avoid
 * duplication across test files.
 */

// ---------------------------------------------------------------------------
// CSS Value Parsing
// ---------------------------------------------------------------------------

/**
 * Parse CSS length value to numeric pixels for comparison.
 *
 * Supports:
 * - px values: "4px" → 4
 * - rem values: "1rem" → 16 (assumes 16px base)
 * - numeric zero: "0" or 0 → 0
 * - none keyword: "none" → 0
 *
 * Returns NaN for unparseable values.
 *
 * @example
 * parseCssLength("4px") // 4
 * parseCssLength("1rem") // 16
 * parseCssLength("0") // 0
 * parseCssLength("none") // 0
 * parseCssLength("invalid") // NaN
 */
export const parseCssLength = (value: string | number): number => {
  if (typeof value === 'number') {
    return value;
  }

  const str = String(value).trim();

  // Handle "0" or "none" → 0
  if (str === '0' || str === 'none') {
    return 0;
  }

  // Handle px values
  if (str.endsWith('px')) {
    return parseFloat(str);
  }

  // Handle rem values (assume 16px base for browser default)
  if (str.endsWith('rem')) {
    return parseFloat(str) * 16;
  }

  // Unknown format
  return NaN;
};

// ---------------------------------------------------------------------------
// Token Filtering
// ---------------------------------------------------------------------------

/**
 * Filter flat token object to only include tokens matching a specific prefix.
 *
 * @param tokens - Flat token object (e.g., from resolvedBundles)
 * @param prefix - Token path prefix (e.g., "semantic.opacity.")
 * @returns Array of [key, value] entries matching the prefix
 *
 * @example
 * const opacityTokens = filterTokensByPrefix(base, "semantic.opacity.");
 * // Returns: [["semantic.opacity.scrim", 0.5], ["semantic.opacity.loading", 0.75], ...]
 */
export const filterTokensByPrefix = (
  tokens: Record<string, string | number>,
  prefix: string
): Array<[string, string | number]> => {
  return Object.entries(tokens).filter(([key]) => {
    return key.startsWith(prefix);
  });
};

/**
 * Get a single resolved token value from flat tokens.
 *
 * @param tokens - Flat token object
 * @param path - Token path (e.g., "semantic.radii.control")
 * @returns The resolved value or undefined if not found
 *
 * @example
 * const controlRadii = getTokenValue(base, "semantic.radii.control");
 */
export const getTokenValue = (
  tokens: Record<string, string | number>,
  path: string
): string | number | undefined => {
  return tokens[path];
};

// ---------------------------------------------------------------------------
// Numeric Validation Helpers
// ---------------------------------------------------------------------------

/**
 * Validate that a value is a valid number (not NaN, not Infinity).
 *
 * @param value - Value to check
 * @returns True if value is a finite number
 */
export const isValidNumber = (value: number): boolean => {
  return Number.isFinite(value);
};

/**
 * Assert that all values in an array are valid numbers.
 * Throws helpful error message if any value is invalid.
 *
 * @param values - Object with name-value pairs to validate
 * @throws Error if any value is NaN or Infinity
 */
export const assertAllValidNumbers = (values: Record<string, number>): void => {
  for (const [name, value] of Object.entries(values)) {
    if (!isValidNumber(value)) {
      throw new Error(`${name} is not a valid number: ${value}`);
    }
  }
};

// ---------------------------------------------------------------------------
// Order Validation Helpers
// ---------------------------------------------------------------------------

/**
 * Validate strict ascending order for an array of values.
 *
 * @param values - Array of numeric values to check
 * @returns True if each value is strictly less than the next
 *
 * @example
 * isStrictlyAscending([0, 0.25, 0.5, 0.75, 1.0]) // true
 * isStrictlyAscending([0, 0.25, 0.25, 0.75, 1.0]) // false (duplicate)
 */
export const isStrictlyAscending = (values: number[]): boolean => {
  for (let i = 0; i < values.length - 1; i++) {
    if (values[i] >= values[i + 1]) {
      return false;
    }
  }
  return true;
};

/**
 * Validate non-strict ascending order (allows equal adjacent values).
 *
 * @param values - Array of numeric values to check
 * @returns True if each value is less than or equal to the next
 *
 * @example
 * isAscending([0, 0, 1, 2, 3]) // true (allows duplicates)
 * isAscending([0, 1, 0, 2]) // false (decreases)
 */
export const isAscending = (values: number[]): boolean => {
  for (let i = 0; i < values.length - 1; i++) {
    if (values[i] > values[i + 1]) {
      return false;
    }
  }
  return true;
};
