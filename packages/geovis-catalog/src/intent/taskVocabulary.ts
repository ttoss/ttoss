/**
 * Closed analytical task vocabulary an `AnalyticalIntent` may name (PRD-005
 * plan D2). The first seven come from strategy §12, quoted in PRD-005's own
 * text; `composition`/`normalized-comparison` were added on the evidence of
 * a real production catalogue (PRD-006 plan D9) and are called out
 * explicitly in PRD-005's Must item rather than folded in silently.
 *
 * A `readonly` const array (not a bare TS union) because Phase 1's
 * completeness test — "one test per task, and a schema/type parity test" —
 * needs to iterate the vocabulary at runtime, the same reason PRD-006's
 * `TASK_RULES` indexes off this array.
 */
export const ANALYTICAL_TASKS = [
  'distribution',
  'comparison',
  'ranking',
  'change-over-time',
  'outlier-detection',
  'feature-lookup',
  'coverage',
  'composition',
  'normalized-comparison',
] as const;

export type AnalyticalTask = (typeof ANALYTICAL_TASKS)[number];
