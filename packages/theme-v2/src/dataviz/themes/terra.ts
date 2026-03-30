import type { CoreDataviz } from '../Types';
import { coreDatavizDefault } from './default';

/**
 * **Terra** dataviz core palette — warm earthy tones for cream/warm light backgrounds.
 *
 * - Qualitative: amber-anchored (accent #FF8F00) with earthy contrast set.
 * - Sequential: amber ramp (FFF8E1 → E65100) — warm golden progression.
 * - Diverging: slate blue ← warm cream (#F5F5F0) → deep amber — cool/warm polarity.
 *
 * Encoding primitives (shape, pattern, stroke, opacity) are universal — inherited.
 */
export const coreDatavizTerra: CoreDataviz = {
  color: {
    qualitative: {
      1: '#FF8F00', // amber (terra accent)
      2: '#5D4037', // warm brown (terra brand)
      3: '#E53935', // red
      4: '#1565C0', // blue — cool contrast
      5: '#558B2F', // olive green
      6: '#F9A825', // gold
      7: '#6D4C41', // lighter brown
      8: '#BF360C', // deep burnt orange
    },
    sequential: {
      1: '#FFF8E1', // lightest cream-amber
      2: '#FFE082',
      3: '#FFD54F',
      4: '#FFCA28',
      5: '#FFB300',
      6: '#FF8F00',
      7: '#E65100', // deep amber-orange
    },
    diverging: {
      1: '#1565C0', // deep blue (negative — cool polarity)
      2: '#1E88E5',
      3: '#90CAF9',
      4: '#F5F5F0', // warm cream midpoint
      5: '#FFCC80',
      6: '#FFA726',
      7: '#E65100', // deep orange (positive — warm polarity)
    },
  },
  // Non-color encodings are theme-neutral — inherit defaults.
  shape: coreDatavizDefault.shape,
  pattern: coreDatavizDefault.pattern,
  stroke: coreDatavizDefault.stroke,
  opacity: coreDatavizDefault.opacity,
};
