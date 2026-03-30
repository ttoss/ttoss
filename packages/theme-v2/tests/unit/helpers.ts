/**
 * Shared test utilities for theme-v2.
 *
 * Pre-resolves all themes and bundles once for efficient parameterized testing.
 */

import { bundles, themes } from '../../src';
import { deepMerge } from '../../src/roots/helpers';
import { flattenAndResolve } from '../../src/roots/helpers';

/** All theme names for parameterized testing */
export const themeEntries = Object.entries(themes);

/** Pre-resolved flat tokens for each theme (computed once) */
export const resolvedThemes = Object.fromEntries(
  themeEntries.map(([name, theme]) => {
    return [name, flattenAndResolve(theme)];
  })
);

/** All bundle entries for parameterized testing */
export const bundleEntries = Object.entries(bundles);

/**
 * Pre-resolved flat tokens for each bundle mode (computed once).
 * For each bundle: `base` is always present, `alt` is present only
 * when the bundle has an alternate mode override.
 */
export const resolvedBundles = Object.fromEntries(
  bundleEntries.map(([name, bundle]) => {
    const base = flattenAndResolve(bundle.base);
    const alt = bundle.alternate
      ? flattenAndResolve(
          deepMerge(bundle.base, { semantic: bundle.alternate.semantic })
        )
      : undefined;
    return [name, { base, alt, baseMode: bundle.baseMode }];
  })
);
