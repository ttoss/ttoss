/**
 * The three lenses of the Studio (PRD §6.2). Lenses are projections over one
 * session state: switching lens swaps the navigator and inspector content but
 * never resets the stage.
 */
export const LENSES = ['theme', 'components', 'generate'] as const;

export type Lens = (typeof LENSES)[number];

export const LENS_LABELS: Record<Lens, string> = {
  theme: 'Theme',
  components: 'Components',
  generate: 'Generate',
};

/**
 * One-idea empty-state copy per lens (PRD §6.6: empty states teach one idea
 * in place — never an onboarding tour).
 */
export const LENS_EMPTY_STATE: Record<
  Lens,
  { navigator: string; inspector: string }
> = {
  theme: {
    navigator:
      'The token tree will live here: semantic tokens first, core tokens on demand. Edit a token and the stage re-themes instantly.',
    inspector:
      'Selected token details will live here: value, references, history with per-edit revert, and contrast checks.',
  },
  components: {
    navigator:
      'The component library will live here, grouped by Entity — plus your own session compositions.',
    inspector:
      'The legal props panel will live here: only combinations the FSL grammar allows, generated from the legality matrices.',
  },
  generate: {
    navigator:
      'Your session compositions will live here — proposals you accepted from the AI, each with its verification state.',
    inspector:
      'The prompt bar will live here: every request has an explicit target, every result is a proposal you accept or discard.',
  },
};
