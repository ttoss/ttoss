import { type ThemeBundle } from '@ttoss/fsl-theme';
import { toFlatTokens } from '@ttoss/fsl-theme/css';

import { mergeDeep } from './overrides';

/**
 * Palette helpers for the Theme Lab — WCAG contrast math and the curated
 * text/background pairs the Studio surfaces ambiently (PRD F2.6).
 *
 * All resolved core color values in fsl-theme are hex strings, so the parser
 * only handles `#rgb` / `#rrggbb`; anything else yields `null` and the pair is
 * skipped (never a false contrast claim — PRD §6.6).
 */

/** Parse a `#rgb` or `#rrggbb` string to `[r, g, b]` in 0–255, or null. */
export const parseHex = (value: string): [number, number, number] | null => {
  const hex = value.trim().replace(/^#/, '');

  if (hex.length === 3) {
    const r = hex[0];
    const g = hex[1];
    const b = hex[2];
    if (!/^[0-9a-fA-F]{3}$/.test(hex)) {
      return null;
    }
    return [parseInt(r + r, 16), parseInt(g + g, 16), parseInt(b + b, 16)];
  }

  if (hex.length === 6 && /^[0-9a-fA-F]{6}$/.test(hex)) {
    return [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16),
    ];
  }

  return null;
};

/** Relative luminance per WCAG 2.x. */
const relativeLuminance = ([r, g, b]: [number, number, number]): number => {
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

/**
 * WCAG contrast ratio between two hex colors (1–21), or null if either value
 * is not a parseable hex color.
 */
export const contrastRatio = (
  foreground: string,
  background: string
): number | null => {
  const fg = parseHex(foreground);
  const bg = parseHex(background);
  if (!fg || !bg) {
    return null;
  }
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
};

/** WCAG rating for normal-size body text at a given ratio. */
export type ContrastRating = 'AAA' | 'AA' | 'fail';

export const rateContrast = (ratio: number): ContrastRating => {
  if (ratio >= 7) {
    return 'AAA';
  }
  if (ratio >= 4.5) {
    return 'AA';
  }
  return 'fail';
};

/**
 * Curated semantic text/background pairs to check. Keys are flat-token paths
 * (as produced by `toFlatTokens`). Pairs whose keys are absent from a given
 * theme are skipped at render time, so this list can be generous.
 *
 * `action.accent` is first on purpose: its background resolves to the brand
 * color, so editing the brand scale moves this row live — tying the ambient
 * a11y signal to the Studio's headline "wow" (PRD SC-1).
 */
export interface ContrastPairSpec {
  label: string;
  foreground: string;
  background: string;
}

export const CONTRAST_PAIRS: readonly ContrastPairSpec[] = [
  {
    label: 'Accent action',
    foreground: 'semantic.colors.action.accent.text.default',
    background: 'semantic.colors.action.accent.background.default',
  },
  {
    label: 'Primary action',
    foreground: 'semantic.colors.action.primary.text.default',
    background: 'semantic.colors.action.primary.background.default',
  },
  {
    label: 'Surface',
    foreground: 'semantic.colors.informational.primary.text.default',
    background: 'semantic.colors.informational.primary.background.default',
  },
  {
    label: 'Negative action',
    foreground: 'semantic.colors.action.negative.text.default',
    background: 'semantic.colors.action.negative.background.default',
  },
];

export interface ContrastResult {
  label: string;
  foreground: string;
  background: string;
  ratio: number;
  rating: ContrastRating;
}

/**
 * Compute contrast results for the curated pairs against a resolved flat-token
 * map (`toFlatTokens(bundle.base)`). Pairs with missing or non-hex values are
 * omitted rather than reported as failures.
 */
export const computeContrast = (
  resolved: Record<string, string | number>
): ContrastResult[] => {
  const results: ContrastResult[] = [];

  for (const pair of CONTRAST_PAIRS) {
    const fg = resolved[pair.foreground];
    const bg = resolved[pair.background];
    if (typeof fg !== 'string' || typeof bg !== 'string') {
      continue;
    }
    const ratio = contrastRatio(fg, bg);
    if (ratio == null) {
      continue;
    }
    results.push({
      label: pair.label,
      foreground: fg,
      background: bg,
      ratio,
      rating: rateContrast(ratio),
    });
  }

  return results;
};

export interface ThemeContrast {
  light: ContrastResult[];
  /** Empty when the bundle opted out of an alternate mode. */
  dark: ContrastResult[];
}

/**
 * Contrast for both modes of a bundle (PRD F2.6, dark follow-up). The dark
 * tokens are the base with the alternate's semantic remaps merged on top —
 * the same projection `getThemeStylesContent` emits for the dark selector.
 * `lightFlat` is the pre-resolved light map (shared with broken-ref
 * detection, so each edit resolves the base once).
 */
export const computeThemeContrast = (
  bundle: ThemeBundle,
  lightFlat: Record<string, string | number>
): ThemeContrast => {
  const { alternate } = bundle;
  return {
    light: computeContrast(lightFlat),
    dark: alternate
      ? computeContrast(
          toFlatTokens(
            mergeDeep(
              bundle.base as unknown as Record<string, unknown>,
              alternate as unknown as Record<string, unknown>
            ) as unknown as ThemeBundle['base']
          )
        )
      : [],
  };
};
