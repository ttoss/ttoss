import type { CoreDataviz } from '../Types';
import { coreDatavizDefault } from './default';

/**
 * **Neon** dataviz core palette — dark-first, vibrant hues for near-black backgrounds.
 *
 * This is the most critical per-theme override. The default palette (ColorBrewer Blues
 * sequential, light neutral midpoint) is UNUSABLE on neon's #0D0D0D background:
 *   - Light sequential steps (~#eff3ff) have near-zero contrast against near-black
 *   - White/light neutral midpoints (#f7f7f7) disappear on dark surfaces
 *
 * Dark-optimized strategy:
 * - Qualitative: bright/saturated hues — each must pass WCAG AA (4.5:1) on #0D0D0D.
 * - Sequential: dim-to-vivid ramp — step 1 is dark/subdued, step 7 is bright/neon.
 * - Diverging: bright extremes with a medium-visibility neutral (#546E7A ~ 5:1 on #0D0D0D).
 *
 * Encoding primitives (shape, pattern, stroke, opacity) are universal — inherited.
 */
export const coreDatavizNeon: CoreDataviz = {
  color: {
    qualitative: {
      1: '#00E676', // neon green (neon brand)
      2: '#FF6D00', // deep orange
      3: '#FF1744', // vivid red
      4: '#00E5FF', // cyan
      5: '#FFCA28', // amber yellow
      6: '#E040FB', // magenta
      7: '#64DD17', // lime
      8: '#FF4081', // hot pink
    },
    /**
     * Sequential: dark navy (low) → vivid cyan (high).
     * All 7 steps are legible on #0D0D0D (min ~2:1 for context, max ~15:1 for high).
     * Step 1 intentionally dim — used for context/background fills, not foreground marks.
     */
    sequential: {
      1: '#0D3349', // deep dark (low — context only)
      2: '#0D4F72',
      3: '#0D7EA8',
      4: '#00ACC1',
      5: '#00BCD4',
      6: '#26D5E8',
      7: '#00E5FF', // neon cyan (high)
    },
    /**
     * Diverging: vivid red ← medium slate (#546E7A, ~5:1 on #0D0D0D) → teal/cyan.
     * Mid-tone neutral chosen to be visible without overwhelming the dark surface.
     */
    diverging: {
      1: '#FF1744', // strong negative (vivid red)
      2: '#FF6D00', // negative orange
      3: '#FFA726', // warm mid-negative
      4: '#546E7A', // neutral — medium slate, readable on dark
      5: '#26A69A', // positive teal
      6: '#1DE9B6', // bright teal
      7: '#00E5FF', // strong positive (vivid cyan)
    },
  },
  // Non-color encodings are theme-neutral — inherited.
  // Opacity slightly higher on dark bg for context/muted layers.
  shape: coreDatavizDefault.shape,
  pattern: coreDatavizDefault.pattern,
  stroke: coreDatavizDefault.stroke,
  opacity: {
    context: 0.2, // slightly more opaque — dark bg context layers need more weight
    muted: 0.4, // higher threshold — dim marks on dark fade faster than on light
    uncertainty: 0.3,
  },
};
