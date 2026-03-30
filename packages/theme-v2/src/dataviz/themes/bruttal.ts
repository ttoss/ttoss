import type { CoreDataviz } from '../Types';
import { coreDatavizDefault } from './default';

/**
 * **Bruttal** dataviz core palette — bold, high-contrast for light backgrounds.
 *
 * - Qualitative: red-anchored (brand #FF2D20 as series 1) with accessible, bold hues.
 * - Sequential: near-black grayscale ramp — matches the monochrome brutalist aesthetic.
 * - Diverging: red ← white (#FFFFFF) → near-black — maximum contrast, brand-aligned.
 *
 * Encoding primitives (shape, pattern, stroke, opacity) are universal — inherited.
 */
export const coreDatavizBruttal: CoreDataviz = {
  color: {
    qualitative: {
      1: '#FF2D20', // red (bruttal brand)
      2: '#1565C0', // accessible blue
      3: '#2E7D32', // accessible green
      4: '#E65100', // deep orange
      5: '#6A1B9A', // purple
      6: '#F9A825', // gold/amber
      7: '#37474F', // dark slate
      8: '#AD1457', // deep pink
    },
    sequential: {
      1: '#FAFAFA', // near-white
      2: '#E5E5E5',
      3: '#BDBDBD',
      4: '#757575',
      5: '#525252',
      6: '#292929',
      7: '#0A0A0A', // near-black
    },
    diverging: {
      1: '#B71C1C', // darkest red (negative)
      2: '#E53935',
      3: '#EF9A9A',
      4: '#FAFAFA', // white midpoint — clean, brutalist
      5: '#BDBDBD',
      6: '#525252',
      7: '#0A0A0A', // near-black (positive)
    },
  },
  // Non-color encodings are theme-neutral — inherit defaults.
  shape: coreDatavizDefault.shape,
  pattern: coreDatavizDefault.pattern,
  stroke: coreDatavizDefault.stroke,
  opacity: coreDatavizDefault.opacity,
};
