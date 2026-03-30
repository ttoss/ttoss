import type { CoreDataviz } from '../Types';
import { coreDatavizDefault } from './default';

/**
 * **OCA** dataviz core palette — natural, earthy greens for light warm backgrounds.
 *
 * - Qualitative: forest green-anchored (brand #7CB342) with earthy warm contrasts.
 * - Sequential: green ramp (F1F8E9 → 1B5E20) — organic, single-hue progression.
 * - Diverging: warm sienna ← cream (#F5F5F0) → forest green — natural polarity.
 *
 * Encoding primitives (shape, pattern, stroke, opacity) are universal — inherited.
 */
export const coreDatavizOca: CoreDataviz = {
  color: {
    qualitative: {
      1: '#558B2F', // forest green (oca brand)
      2: '#C8860A', // warm gold/harvest
      3: '#A0522D', // sienna brown
      4: '#4682B4', // steel blue — cool contrast
      5: '#6B8E23', // olive
      6: '#8B4513', // saddle brown
      7: '#2E8B57', // sea green
      8: '#D2691E', // chocolate
    },
    sequential: {
      1: '#F1F8E9', // lightest lime-green
      2: '#DCEDC8',
      3: '#AED581',
      4: '#7CB342',
      5: '#558B2F',
      6: '#33691E',
      7: '#1B5E20', // darkest forest green
    },
    diverging: {
      1: '#8D4004', // deep sienna (negative)
      2: '#C8860A', // harvest gold
      3: '#DEB887', // burlywood
      4: '#F5F5F0', // warm cream midpoint
      5: '#A5C880', // light sage
      6: '#6A9E4F', // medium green
      7: '#2D5016', // deep forest (positive)
    },
  },
  // Non-color encodings are theme-neutral — inherit defaults.
  shape: coreDatavizDefault.shape,
  pattern: coreDatavizDefault.pattern,
  stroke: coreDatavizDefault.stroke,
  opacity: coreDatavizDefault.opacity,
};
