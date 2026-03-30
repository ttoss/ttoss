import type { CoreDataviz } from '../Types';
import { coreDatavizDefault } from './default';

/**
 * **Aurora** dataviz core palette — cool indigo/purple tones for light backgrounds.
 *
 * - Qualitative: purple-anchored (brand #7C4DFF as series 1) with warm contrasts.
 * - Sequential: purple/indigo ramp (F3E5F5 → 4527A0) — mirrors brand identity.
 * - Diverging: red ← light (#F5F5FF) → deep indigo — preserves standard direction.
 *
 * Encoding primitives (shape, pattern, stroke, opacity) are universal — inherited.
 */
export const coreDatavizAurora: CoreDataviz = {
  color: {
    qualitative: {
      1: '#7C4DFF', // purple (aurora brand)
      2: '#f28e2b', // orange — warm visual contrast
      3: '#E91E63', // pink-red
      4: '#4DABF7', // sky blue
      5: '#36B37E', // teal-green
      6: '#FFCA28', // amber
      7: '#AB47BC', // medium purple
      8: '#FF8A65', // coral
    },
    sequential: {
      1: '#F3E5F5', // lightest lavender
      2: '#CE93D8',
      3: '#AB47BC',
      4: '#8E24AA',
      5: '#7B1FA2',
      6: '#6A1B9A',
      7: '#4527A0', // deepest indigo
    },
    diverging: {
      1: '#C62828', // deep red (negative)
      2: '#F44336',
      3: '#FFAB91',
      4: '#F5F5FF', // near-white lavender midpoint
      5: '#B39DDB',
      6: '#9575CD',
      7: '#512DA8', // deep purple (positive)
    },
  },
  // Non-color encodings are theme-neutral — inherit defaults.
  shape: coreDatavizDefault.shape,
  pattern: coreDatavizDefault.pattern,
  stroke: coreDatavizDefault.stroke,
  opacity: coreDatavizDefault.opacity,
};
