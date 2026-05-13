import type { CoreDataviz, SemanticDataviz } from './Types';

// ---------------------------------------------------------------------------
// Core dataviz encoding — non-color raw primitives
// ---------------------------------------------------------------------------

/**
 * **Default** dataviz encoding primitives — non-color, value-only.
 *
 * Analytical color comes from `core.colors.*` — see `semanticDataviz` below.
 */
export const coreDataviz: CoreDataviz = {
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

// ---------------------------------------------------------------------------
// Semantic dataviz mapping — refs to core tokens
// ---------------------------------------------------------------------------
//
// All themes share the same semantic→core structure. Only core VALUES differ.

export const semanticDataviz: SemanticDataviz = {
  color: {
    series: {
      1: '{core.colors.brand.500}',
      2: '{core.colors.orange.500}',
      3: '{core.colors.red.500}',
      4: '{core.colors.teal.500}',
      5: '{core.colors.green.500}',
      6: '{core.colors.yellow.500}',
      7: '{core.colors.purple.500}',
      8: '{core.colors.pink.500}',
    },
    scale: {
      sequential: {
        1: '{core.colors.brand.50}',
        2: '{core.colors.brand.100}',
        3: '{core.colors.brand.200}',
        4: '{core.colors.brand.300}',
        5: '{core.colors.brand.500}',
        6: '{core.colors.brand.700}',
        7: '{core.colors.brand.900}',
      },
      diverging: {
        neg3: '{core.colors.red.700}',
        neg2: '{core.colors.red.500}',
        neg1: '{core.colors.orange.300}',
        neutral: '{core.colors.neutral.50}',
        pos1: '{core.colors.brand.200}',
        pos2: '{core.colors.brand.500}',
        pos3: '{core.colors.brand.700}',
      },
    },
    reference: {
      baseline: '{core.colors.neutral.500}',
      target: '{core.colors.orange.700}',
    },
    state: {
      highlight: '{core.colors.yellow.500}',
      muted: '{core.colors.neutral.300}',
      selected: '{core.colors.brand.500}',
    },
    status: {
      missing: '{core.colors.neutral.200}',
      suppressed: '{core.colors.neutral.700}',
      na: '{core.colors.neutral.500}',
    },
  },
  encoding: {
    shape: {
      series: {
        1: '{core.dataviz.shape.1}',
        2: '{core.dataviz.shape.2}',
        3: '{core.dataviz.shape.3}',
        4: '{core.dataviz.shape.4}',
        5: '{core.dataviz.shape.5}',
        6: '{core.dataviz.shape.6}',
        7: '{core.dataviz.shape.7}',
        8: '{core.dataviz.shape.8}',
      },
    },
    pattern: {
      series: {
        1: '{core.dataviz.pattern.1}',
        2: '{core.dataviz.pattern.2}',
        3: '{core.dataviz.pattern.3}',
        4: '{core.dataviz.pattern.4}',
        5: '{core.dataviz.pattern.5}',
        6: '{core.dataviz.pattern.6}',
      },
    },
    stroke: {
      reference: '{core.dataviz.stroke.dashed}',
      forecast: '{core.dataviz.stroke.dashed}',
      uncertainty: '{core.dataviz.stroke.dotted}',
    },
    opacity: {
      context: '{core.dataviz.opacity.context}',
      muted: '{core.dataviz.opacity.muted}',
      uncertainty: '{core.dataviz.opacity.uncertainty}',
    },
  },
  geo: {
    context: {
      muted: '{core.colors.neutral.50}',
      boundary: '{core.colors.neutral.300}',
      label: '{core.colors.neutral.500}',
    },
    state: {
      selection: '{core.colors.brand.500}',
      focus: '{core.colors.brand.700}',
    },
  },
};
