import type { ThemeTokens } from '../Types';
import { inlineRefsToVars, toCssVarName } from './toCssVars';

// ---------------------------------------------------------------------------
// Density projection (ADR-019) — control-inset remaps per density
// ---------------------------------------------------------------------------

/** Every density projected via `data-tt-density` (including the base reset). */
export const DENSITIES = ['compact', 'comfortable', 'spacious'] as const;

const CONTROL_STEPS = ['sm', 'md', 'lg'] as const;

/** A map from each density to its `semantic.spacing.inset.control.*` overrides. */
export type DensityVars = Record<
  (typeof DENSITIES)[number],
  Record<string, string>
>;

/**
 * Build the `semantic.spacing.inset.control.*` overrides for each density.
 * `compact`/`spacious` come from `core.density`; `comfortable` re-asserts the
 * base `semantic.spacing.inset.control` so a `comfortable` subtree nested
 * inside a denser ancestor resets correctly. Density touches inset only —
 * never `hit` (ADR-020) — so it never collides with the coarse-pointer override.
 */
export const buildDensityVars = (theme: ThemeTokens): DensityVars => {
  const out = { compact: {}, comfortable: {}, spacious: {} } as DensityVars;
  // comfortable = base semantic inset (`{ref}` values → inline to var()).
  const base = theme.semantic.spacing.inset.control;
  for (const step of CONTROL_STEPS) {
    out.comfortable[toCssVarName(`semantic.spacing.inset.control.${step}`)] =
      inlineRefsToVars(base[step]);
  }
  // compact/spacious = core.density (already value-only var() literals).
  for (const density of ['compact', 'spacious'] as const) {
    const control = theme.core.density[density].inset.control;
    for (const step of CONTROL_STEPS) {
      out[density][toCssVarName(`semantic.spacing.inset.control.${step}`)] =
        control[step];
    }
  }
  return out;
};

/**
 * Render the `[data-tt-density]` blocks for a base selector. Density is a
 * theme-level, mode-independent projection, so one set of blocks (scoped to
 * the base selector) applies across both colour modes.
 */
export const buildDensityBlocks = (
  baseSelector: string,
  densityVars: DensityVars
): string => {
  return DENSITIES.map((density) => {
    const lines = Object.entries(densityVars[density]).map(([name, value]) => {
      return `  ${name}: ${value};`;
    });
    return `${baseSelector}[data-tt-density="${density}"] {\n${lines.join(
      '\n'
    )}\n}`;
  }).join('\n\n');
};
