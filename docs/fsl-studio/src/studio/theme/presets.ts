import { bruttal, createTheme, type ThemeBundle } from '@ttoss/fsl-theme';

/**
 * Theme starting presets (PRD F2.4): the built-in themes `@ttoss/fsl-theme`
 * actually ships — the default FSL foundation (`createTheme()`) and the
 * `bruttal` bundle. Nothing else exists as a built-in theme today, so nothing
 * else appears here.
 *
 * History (2026-07-18): earlier revisions shipped style-reference-inspired
 * presets (minimalist, neobrutalism, glass, 90s). They were removed. In the
 * Visual Reference Architecture (`docs/website/docs/design/style-references`) a
 * *style reference* is a distinct layer from a *built-in theme* — it documents
 * a visual language, it is not a concrete token implementation — and those
 * reference docs are still stubs. Presenting them as selectable themes
 * conflated the two concepts and shipped fictional themes. The picker now
 * offers only real built-in themes and grows when `fsl-theme` ships more.
 */
export type PresetId = 'base' | 'bruttal';

export interface PresetSpec {
  id: PresetId;
  label: string;
  description: string;
}

export const PRESETS: readonly PresetSpec[] = [
  {
    id: 'base',
    label: 'Base',
    description:
      'The default FSL foundation — light base with a dark alternate.',
  },
  {
    id: 'bruttal',
    label: 'Bruttal',
    description: 'The built-in high-contrast, expressive brand theme.',
  },
];

const bundleCache = new Map<PresetId, ThemeBundle>();

/** The unedited bundle for a preset — also the "fallback" chrome theme. */
export const presetBundle = (preset: PresetId): ThemeBundle => {
  const cached = bundleCache.get(preset);
  if (cached) {
    return cached;
  }

  const bundle = preset === 'bruttal' ? bruttal : createTheme();

  bundleCache.set(preset, bundle);
  return bundle;
};

export const findPreset = (id: string): PresetSpec | undefined => {
  return PRESETS.find((preset) => {
    return preset.id === id;
  });
};
