/**
 * FSL-DESIGN-001..003 — every theme the package exports must declare a brief.
 *
 * theme-authoring.md requires a theme to declare posture (FSL-DESIGN-001),
 * density (FSL-DESIGN-002), and an accessibility target (FSL-DESIGN-003) before
 * values are chosen. `ThemeBundle.meta` (a `ThemeBrief`) is the machine-readable
 * home for that brief; this test enforces its presence on the built-in themes.
 *
 * `meta` is intentionally optional on `ThemeBundle` so user-authored themes stay
 * valid — this invariant applies only to the package's own exported themes.
 *
 * @see /docs/website/docs/design/design-system/design-tokens/theme-authoring.md
 */

import { baseBundle } from '../../../../src/baseBundle';
import { bruttal } from '../../../../src/themes/bruttal';
import type { ThemeBundle } from '../../../../src/Types';

const exportedThemes: [label: string, bundle: ThemeBundle][] = [
  ['baseBundle', baseBundle],
  ['bruttal', bruttal],
];

describe('FSL-DESIGN — exported themes declare a brief', () => {
  test.each(exportedThemes)('%s carries a meta brief', (_label, bundle) => {
    expect(bundle.meta).toBeDefined();
  });

  test.each(exportedThemes)(
    '%s declares the required FSL-DESIGN fields',
    (_label, bundle) => {
      const meta = bundle.meta;
      expect(meta).toBeDefined();
      if (!meta) return;
      // FSL-DESIGN-001: posture
      expect(typeof meta.name).toBe('string');
      expect(meta.name.length).toBeGreaterThan(0);
      expect(typeof meta.primaryPosture).toBe('string');
      // FSL-DESIGN-002: density
      expect(typeof meta.densityProfile).toBe('string');
      // FSL-DESIGN-003: accessibility target
      expect(typeof meta.accessibilityTarget).toBe('string');
    }
  );
});
