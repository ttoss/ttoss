import {
  bruttal,
  createTheme,
  type DeepPartial,
  type ThemeBrief,
  type ThemeBundle,
  type ThemeTokens,
} from '@ttoss/fsl-theme';

/**
 * Theme starting presets (PRD F2.4): the base foundation, the built-in
 * `bruttal` bundle, and Studio-authored starting points inspired by the
 * style-references library (`docs/website/docs/design/style-references`).
 *
 * The referenced style docs (minimalism, neobrutalism, glass, 90s) are still
 * stubs, so these presets are deliberately conservative: a brand color scale
 * plus a handful of semantic remaps that carry each style's clearest
 * token-layer signature (radii, elevation, border weight) — never a parallel
 * vocabulary, never recipe-layer effects (recorded in PRD §14). Each carries
 * a `ThemeBrief` so the design intent ships with the bundle.
 */
export type PresetId =
  | 'base'
  | 'bruttal'
  | 'minimalist'
  | 'neobrutalism'
  | 'glass'
  | 'nineties';

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
  {
    id: 'minimalist',
    label: 'Minimalist',
    description:
      'Quiet slate brand, tight radii, flat cards — a starting point inspired by the minimalism style reference.',
  },
  {
    id: 'neobrutalism',
    label: 'Neobrutalism',
    description:
      'Vivid violet brand, sharp corners, thick borders, no shadows — a starting point inspired by the neobrutalism style reference.',
  },
  {
    id: 'glass',
    label: 'Glass',
    description:
      'Deep sky brand, generous radii, lifted surfaces — a starting point inspired by the glass style reference.',
  },
  {
    id: 'nineties',
    label: '90s',
    description:
      'Saturated primary blue, square corners, bold borders — a starting point inspired by the 90s style reference.',
  },
];

interface AuthoredPreset {
  overrides: DeepPartial<ThemeTokens>;
  brief: ThemeBrief;
}

/**
 * Studio-authored preset definitions. Brand `500` steps are chosen to keep
 * ≥ 4.5:1 against white so filled accent surfaces stay WCAG AA (the same
 * discipline `bruttal` documents for its own brand scale).
 */
export const AUTHORED_PRESETS: Partial<Record<PresetId, AuthoredPreset>> = {
  minimalist: {
    overrides: {
      core: {
        colors: {
          brand: {
            50: '#f8fafc',
            100: '#f1f5f9',
            200: '#e2e8f0',
            300: '#cbd5e1',
            400: '#94a3b8',
            500: '#475569',
            600: '#334155',
            700: '#1e293b',
            800: '#0f172a',
            900: '#020617',
          },
        },
      },
      semantic: {
        radii: {
          control: '{core.radii.sm}',
          surface: '{core.radii.sm}',
        },
        elevation: {
          surface: {
            raised: '{core.elevation.level.0}',
          },
        },
      },
    },
    brief: {
      name: 'minimalist',
      purpose: 'quiet, content-first starting point',
      primaryPosture: 'calm',
      densityProfile: 'comfortable',
      brandEnergy: 'quiet',
      surfaceModel: 'flat',
      accessibilityTarget: 'AA',
    },
  },

  neobrutalism: {
    overrides: {
      core: {
        colors: {
          brand: {
            50: '#f5f3ff',
            100: '#ede9fe',
            200: '#ddd6fe',
            300: '#c4b5fd',
            400: '#8b5cf6',
            500: '#6d28d9',
            600: '#5b21b6',
            700: '#4c1d95',
            800: '#3b0764',
            900: '#2e1065',
          },
        },
        border: {
          width: {
            default: '2px',
            selected: '3px',
            focused: '3px',
          },
        },
      },
      semantic: {
        radii: {
          control: '{core.radii.none}',
          surface: '{core.radii.none}',
        },
        elevation: {
          surface: {
            flat: '{core.elevation.level.0}',
            raised: '{core.elevation.level.0}',
            overlay: '{core.elevation.level.0}',
            blocking: '{core.elevation.level.0}',
          },
        },
      },
    },
    brief: {
      name: 'neobrutalism',
      purpose: 'loud, raw, high-contrast starting point',
      primaryPosture: 'expressive',
      densityProfile: 'balanced',
      brandEnergy: 'expressive',
      surfaceModel: 'flat',
      accessibilityTarget: 'AA',
    },
  },

  glass: {
    overrides: {
      core: {
        colors: {
          brand: {
            50: '#f0f9ff',
            100: '#e0f2fe',
            200: '#bae6fd',
            300: '#7dd3fc',
            400: '#38bdf8',
            500: '#0369a1',
            600: '#075985',
            700: '#0c4a6e',
            800: '#082f49',
            900: '#05202f',
          },
        },
      },
      semantic: {
        radii: {
          control: '{core.radii.lg}',
          surface: '{core.radii.xl}',
        },
        elevation: {
          surface: {
            raised: '{core.elevation.level.2}',
            overlay: '{core.elevation.level.3}',
          },
        },
      },
    },
    brief: {
      name: 'glass',
      purpose: 'soft, layered, airy starting point',
      primaryPosture: 'premium',
      densityProfile: 'comfortable',
      brandEnergy: 'balanced',
      surfaceModel: 'layered',
      accessibilityTarget: 'AA',
    },
  },

  nineties: {
    overrides: {
      core: {
        colors: {
          brand: {
            50: '#ececff',
            100: '#d6d6ff',
            200: '#adadff',
            300: '#8585ff',
            400: '#4d4dff',
            500: '#2424d6',
            600: '#1d1db8',
            700: '#17179a',
            800: '#0f0f6b',
            900: '#08083d',
          },
        },
        border: {
          width: {
            default: '2px',
          },
        },
      },
      semantic: {
        radii: {
          control: '{core.radii.none}',
          surface: '{core.radii.none}',
        },
        elevation: {
          surface: {
            flat: '{core.elevation.level.0}',
            raised: '{core.elevation.level.0}',
            overlay: '{core.elevation.level.0}',
            blocking: '{core.elevation.level.0}',
          },
        },
      },
    },
    brief: {
      name: 'nineties',
      purpose: 'retro primary-blue starting point',
      primaryPosture: 'expressive',
      densityProfile: 'compact',
      brandEnergy: 'expressive',
      surfaceModel: 'flat',
      accessibilityTarget: 'AA',
    },
  },
};

const bundleCache = new Map<PresetId, ThemeBundle>();

/** The unedited bundle for a preset — also the "fallback" chrome theme. */
export const presetBundle = (preset: PresetId): ThemeBundle => {
  const cached = bundleCache.get(preset);
  if (cached) {
    return cached;
  }

  const authored = AUTHORED_PRESETS[preset];
  const bundle = authored
    ? createTheme({ overrides: authored.overrides, brief: authored.brief })
    : preset === 'bruttal'
      ? bruttal
      : createTheme();

  bundleCache.set(preset, bundle);
  return bundle;
};

export const findPreset = (id: string): PresetSpec | undefined => {
  return PRESETS.find((preset) => {
    return preset.id === id;
  });
};
