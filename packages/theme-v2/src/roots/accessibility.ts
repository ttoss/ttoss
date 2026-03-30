// ---------------------------------------------------------------------------
// WCAG 2.1 Contrast Validation Utilities
// ---------------------------------------------------------------------------

/**
 * Parse a hex color to RGB components.
 * Supports 3-digit (#abc) and 6-digit (#aabbcc) hex formats.
 *
 * @param hex - Color in hex format (with or without #)
 * @returns RGB object with r, g, b in [0, 255] range, or null if invalid
 */
export const hexToRgb = (
  hex: string
): { r: number; g: number; b: number } | null => {
  // Remove # if present
  const cleaned = hex.replace(/^#/, '');

  // Handle 3-digit hex (#abc → #aabbcc)
  const expanded =
    cleaned.length === 3
      ? cleaned
          .split('')
          .map((c) => {
            return c + c;
          })
          .join('')
      : cleaned;

  if (expanded.length !== 6) {
    return null;
  }

  const num = Number.parseInt(expanded, 16);
  if (Number.isNaN(num)) {
    return null;
  }

  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
};

/**
 * Calculate relative luminance according to WCAG 2.1 formula.
 *
 * @see https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 * @param rgb - RGB color components in [0, 255] range
 * @returns Relative luminance in [0, 1] range
 */
export const getLuminance = (rgb: {
  r: number;
  g: number;
  b: number;
}): number => {
  // Convert to [0, 1] range and apply sRGB → linear RGB conversion
  const toLinear = (channel: number): number => {
    const srgb = channel / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  };

  const r = toLinear(rgb.r);
  const g = toLinear(rgb.g);
  const b = toLinear(rgb.b);

  // WCAG luminance formula
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/**
 * Calculate contrast ratio between two colors according to WCAG 2.1.
 *
 * @see https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 * @param hex1 - First color in hex format
 * @param hex2 - Second color in hex format
 * @returns Contrast ratio in [1, 21] range, or null if invalid colors
 */
export const getContrastRatio = (hex1: string, hex2: string): number | null => {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);

  if (!rgb1 || !rgb2) {
    return null;
  }

  const lum1 = getLuminance(rgb1);
  const lum2 = getLuminance(rgb2);

  // Ensure lighter color is in numerator
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  // WCAG contrast ratio formula
  return (lighter + 0.05) / (darker + 0.05);
};

/**
 * WCAG 2.1 conformance levels for contrast ratios.
 */
export const WCAGLevels = {
  /** Normal text (< 18pt or < 14pt bold) — AA */
  AA_NORMAL: 4.5,
  /** Large text (≥ 18pt or ≥ 14pt bold) — AA */
  AA_LARGE: 3.0,
  /** Normal text — AAA */
  AAA_NORMAL: 7.0,
  /** Large text — AAA */
  AAA_LARGE: 4.5,
} as const;

/**
 * Check if a contrast ratio meets a specific WCAG level.
 *
 * @param ratio - Contrast ratio to check
 * @param level - Minimum required ratio (use WCAGLevels constants)
 * @returns true if the ratio meets or exceeds the level
 */
export const meetsWCAG = (ratio: number, level: number): boolean => {
  return ratio >= level;
};

/**
 * Get a human-readable description of WCAG conformance.
 *
 * @param ratio - Contrast ratio
 * @returns Object with conformance status for each level
 */
export const getWCAGConformance = (ratio: number) => {
  return {
    ratio: Number(ratio.toFixed(2)),
    aa: {
      normal: meetsWCAG(ratio, WCAGLevels.AA_NORMAL),
      large: meetsWCAG(ratio, WCAGLevels.AA_LARGE),
    },
    aaa: {
      normal: meetsWCAG(ratio, WCAGLevels.AAA_NORMAL),
      large: meetsWCAG(ratio, WCAGLevels.AAA_LARGE),
    },
  };
};
