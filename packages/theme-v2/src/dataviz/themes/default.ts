import type { CoreDataviz } from '../Types';

/**
 * **Default** dataviz core palette — neutral baseline for light backgrounds.
 *
 * - Qualitative: Tableau Classic 10 (8-color) — perceptually distinct, broad-gamut.
 * - Sequential: ColorBrewer Blues (7-class) — light → dark, light-bg optimized.
 * - Diverging: ColorBrewer RdBu (7-class) — red ← neutral (#f7f7f7) → blue.
 */
export const coreDatavizDefault: CoreDataviz = {
  color: {
    qualitative: {
      1: '#4e79a7', // blue
      2: '#f28e2b', // orange
      3: '#e15759', // red
      4: '#76b7b2', // teal
      5: '#59a14f', // green
      6: '#edc948', // yellow
      7: '#b07aa1', // purple
      8: '#ff9da7', // pink
    },
    sequential: {
      1: '#eff3ff',
      2: '#bdd7e7',
      3: '#6baed6',
      4: '#3182bd',
      5: '#1a6fae',
      6: '#085fa0',
      7: '#084594',
    },
    diverging: {
      1: '#d73027', // strong negative
      2: '#f46d43',
      3: '#fdae61',
      4: '#f7f7f7', // neutral midpoint
      5: '#a6d9ef',
      6: '#5baed6',
      7: '#4575b4', // strong positive
    },
  },
  shape: {
    1: 'circle',
    2: 'square',
    3: 'triangle',
    4: 'diamond',
    5: 'cross',
    6: 'star',
    7: 'wye',
    8: 'pentagon',
  },
  pattern: {
    1: 'solid',
    2: 'diagonal-stripes',
    3: 'horizontal-stripes',
    4: 'vertical-stripes',
    5: 'dots',
    6: 'cross-hatch',
  },
  stroke: {
    solid: 'none',
    dashed: '6 3',
    dotted: '2 2',
  },
  opacity: {
    context: 0.15,
    muted: 0.35,
    uncertainty: 0.25,
  },
};
