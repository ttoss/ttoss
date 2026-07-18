/* ==========================================================================
 * ttoss Design Tokens — Type Definitions (Assembler)
 * FSL Layer 4: Semantic Token Projection
 *
 * This file is the formal TypeScript type contract for the Semantic Token
 * Projection (layer 4). It derives from the FSL foundation (layers 1–2); the
 * Component Semantics Projection (layer 3, implemented by `@ttoss/fsl-ui`)
 * consumes these tokens. It must not define vocabulary that contradicts the
 * FSL Lexicon or FSL Structural Language.
 *
 * Structure (post-decomposition):
 *   - Per-family types live in `./families/<family>.ts` (one file per token
 *     family, mirroring `docs/.../design-tokens/families/*.md`).
 *   - This file is the assembler: it re-exports the primitives and family
 *     types, and defines the top-level `ThemeTokens`, `ThemeBundle`,
 *     `ModeOverride`, and `SemanticTokens` contracts that consumers depend on.
 *   - The dataviz extension lives under `./dataviz/Types.ts` and is plugged
 *     into `ThemeTokens` here as an optional sub-tree.
 *
 * Public API (unchanged): `RawValue`, `NumericValue`, `TokenRef`, `DeepPartial`,
 * `ThemeTokens`, `ThemeBundle`, `ModeOverride`, `SemanticTokens`.
 *
 * FSL dimension mapping (token grammar axis → FSL dimension):
 *
 *   Token axis  │ FSL dimension   │ Notes
 *   ────────────┼─────────────────┼───────────────────────────────────────────
 *   ux          │ Entity Kind     │ projection-scoped subset + renaming (§17.1)
 *   role        │ Evaluation      │ projection-scoped name for FSL Evaluation
 *   dimension   │ Structural Role │ subset: background | border | text
 *   state       │ State           │ values identical, no renaming
 *
 * Token naming grammar: {ux}.{role}.{dimension}.{state}
 *
 * Two token layers:
 *   1. Core Tokens   — raw primitives and responsiveness engines (immutable across modes)
 *   2. Semantic Tokens — stable aliases consumed by components (remapped per mode)
 *
 * Components must NEVER consume core tokens directly.
 * Semantic tokens should normally be references to core tokens, avoiding raw values.
 * Any semantic tokens that use raw values must be rare, intentional, and documented
 * exceptions — see model.md §RawValue Exceptions for the governing rule and audit inventory.
 *
 * @see /docs/design/design-system/fsl/fsl-lexicon — FSL Lexicon (layer 1)
 * @see /docs/design/design-system/fsl/fsl-structural-language — FSL Structural Language (layer 2)
 * @see /docs/design/design-system/component-model — Component Semantics Projection (layer 3)
 * @see /docs/design/design-system/design-tokens/model — Token Model (this layer)
 * @see /docs/design/design-system/design-tokens/colors — Semantic Color Grammar
 * For the default theme values, see `./baseTheme.ts`.
 * ========================================================================== */

import type { CoreDataviz, SemanticDataviz } from './dataviz/Types';
import type {
  CoreBorder,
  CoreBreakpoints,
  CoreColors,
  CoreDensity,
  CoreElevation,
  CoreFont,
  CoreMotion,
  CoreOpacity,
  CoreRadii,
  CoreSizing,
  CoreSpacingSteps,
  CoreZIndex,
  DeepPartial,
  SemanticBorder,
  SemanticColors,
  SemanticElevation,
  SemanticFocus,
  SemanticMotion,
  SemanticOpacity,
  SemanticOverlay,
  SemanticRadii,
  SemanticSizing,
  SemanticSpacing,
  SemanticText,
  SemanticZIndex,
} from './families';

// ---------------------------------------------------------------------------
// Public re-exports — primitives, helpers, and the dataviz extension types.
// Maintains the original Types.ts public surface so external imports keep working.
// ---------------------------------------------------------------------------

export type { CoreDataviz, SemanticDataviz } from './dataviz/Types';
export type {
  DeepPartial,
  NumericValue,
  RawValue,
  TokenRef,
} from './families/primitives';

// ---------------------------------------------------------------------------
// Theme Contract
// ---------------------------------------------------------------------------

/**
 * Full ttoss Design Tokens Theme contract.
 *
 * Two layers:
 *   - `core`     — raw primitives and responsive engines (immutable across modes)
 *   - `semantic` — stable aliases consumed by components (remapped per mode)
 *
 * Extensions are optional properties inside `core` and `semantic`.
 * When present they follow the same `core → semantic` contract.
 */
export interface ThemeTokens {
  core: {
    colors: CoreColors;
    elevation: CoreElevation;
    font: CoreFont;
    spacing: CoreSpacingSteps;
    sizing: CoreSizing;
    /** Per-density control-inset remaps (ADR-019). Projected via `data-tt-density`. */
    density: CoreDensity;
    radii: CoreRadii;
    border: CoreBorder;
    opacity: CoreOpacity;
    motion: CoreMotion;
    zIndex: CoreZIndex;
    /** Viewport threshold scale. Core-only — no semantic layer. @see CoreBreakpoints */
    breakpoints: CoreBreakpoints;
    /**
     * Data Visualization extension — analytical color palettes and non-color
     * encoding primitives. Optional: omit when the theme does not support dataviz.
     */
    dataviz?: CoreDataviz;
  };
  semantic: {
    colors: SemanticColors;
    elevation: SemanticElevation;
    text: SemanticText;
    spacing: SemanticSpacing;
    sizing: SemanticSizing;
    radii: SemanticRadii;
    border: SemanticBorder;
    focus: SemanticFocus;
    overlay: SemanticOverlay;
    opacity: SemanticOpacity;
    motion: SemanticMotion;
    zIndex: SemanticZIndex;
    /**
     * Data Visualization extension — semantic roles for analytical color,
     * non-color encodings, and geospatial overlays.
     * Optional: omit when the theme does not support dataviz.
     *
     * This is the **public API** of the dataviz extension.
     * Components consume these tokens; never `core.dataviz.*` directly.
     */
    dataviz?: SemanticDataviz;
  };
}

// ---------------------------------------------------------------------------
// Theme Bundle — packages a theme with optional color mode alternate
// ---------------------------------------------------------------------------

/**
 * Semantic-only overrides for the alternate color mode.
 *
 * Core tokens are immutable across modes. Only semantic token references
 * may change — remapping to different core tokens for the alternate mode.
 *
 * Uses `DeepPartial`: every nested key is optional. Omitting a key inherits
 * the value from the base theme (see `deepMerge` in `roots/helpers.ts`,
 * which treats `undefined` and absent keys identically). An alternate
 * supplies only the leaves that differ from the base.
 *
 * @see {@link modes.md} — "Modes remap semantic references, not core values."
 */
export interface ModeOverride {
  semantic: DeepPartial<ThemeTokens['semantic']>;
}

/**
 * Machine-readable theme brief — the design intent a theme declares *before*
 * token values are chosen (theme-authoring.md §"Theme brief"). It is the home
 * for the `FSL-DESIGN-001..003` gate (posture, density, accessibility target)
 * so those rules can be validated rather than living only as prose.
 *
 * **Orthogonal to tokens.** The brief lives on `ThemeBundle` alongside `base`,
 * never inside the token tree — DTCG and CSS emitters read `bundle.base`, so a
 * brief never affects interchange or CSS output. Optional by design: existing
 * `createTheme` callers stay valid.
 *
 * Allowed values mirror theme-authoring.md §"Allowed values".
 */
export interface ThemeBrief {
  /** Theme identity name (e.g. `'base'`, `'bruttal'`). */
  name: string;
  /** One line on what experience this theme should produce. */
  purpose?: string;
  /** Dominant behavioral personality (FSL-DESIGN-001). */
  primaryPosture:
    | 'calm'
    | 'productive'
    | 'technical'
    | 'expressive'
    | 'editorial'
    | 'premium';
  /** Optional secondary posture; one posture must dominate. */
  secondaryPosture?: ThemeBrief['primaryPosture'];
  /** Operational compactness (FSL-DESIGN-002). */
  densityProfile: 'compact' | 'balanced' | 'comfortable' | 'spacious';
  /** Reading vs operating vs scanning bias of the interface. */
  readingMode?: 'reading' | 'operating' | 'scanning' | 'mixed';
  /** Primary pointer type the hit-target model targets. */
  pointerProfile?: 'fine' | 'coarse' | 'hybrid';
  /** Risk profile of adjacent interactions. */
  interactionRisk?: 'low' | 'medium' | 'high';
  /** Surface layering strategy. */
  surfaceModel?: 'flat' | 'lightly-layered' | 'layered' | 'immersive';
  /** How much brand presence the theme carries. */
  brandEnergy?: 'quiet' | 'balanced' | 'expressive';
  /** Non-negotiable accessibility floor (FSL-DESIGN-003). */
  accessibilityTarget: 'AA' | 'AA+' | 'AAA-like';
  /** Color-mode support strategy. */
  colorModeStrategy?:
    | 'light-only'
    | 'dark-supported'
    | 'dark-first'
    | 'adaptive';
  /** Primary platform the theme is tuned for. */
  platformBias?: 'web' | 'mobile' | 'desktop' | 'cross-platform';
}

/**
 * A theme bundle packages a complete `ThemeTokens` (the base)
 * with an optional semantic-only override for the alternate color mode.
 *
 * - `baseMode` declares which mode the `base` theme represents.
 * - `alternate` remaps only semantic token references that differ in the
 *   opposite mode. Core token values stay immutable.
 *
 * **Why only two modes?** `prefers-color-scheme` is binary (`light` / `dark`);
 * that is the only axis `ThemeBundle` addresses. High-contrast, reduced-motion,
 * and coarse-pointer are orthogonal CSS `@media` axes — they are handled by
 * the dedicated blocks emitted by `toCssVars` and are not additional modes.
 * Proposals to generalize to `Record<ModeName, ModeOverride>` conflate these
 * independent axes and should be rejected.
 *
 * When no `alternate` is provided, the theme is single-mode.
 *
 * @example
 * ```ts
 * const bundle: ThemeBundle = {
 *   baseMode: 'light',
 *   base: baseTheme,
 *   alternate: {
 *     semantic: {
 *       colors: {
 *         informational: { primary: { background: { default: '{core.colors.neutral.900}' } } },
 *       },
 *     },
 *   },
 * };
 * ```
 */
export interface ThemeBundle {
  /**
   * Which color mode the `base` theme represents.
   * Constrained to `'light' | 'dark'` because `prefers-color-scheme` is binary.
   */
  baseMode: 'light' | 'dark';
  /** Complete theme for the base mode. */
  base: ThemeTokens;
  /**
   * Semantic remapping overrides for the opposite mode.
   * Only semantic references that differ need to be listed — core tokens are shared.
   */
  alternate?: ModeOverride;
  /**
   * Machine-readable design brief (posture, density, accessibility target, …).
   * Orthogonal to tokens — never serialized into DTCG/CSS. Optional so existing
   * callers stay valid; carrying one lets `FSL-DESIGN-001..003` be enforced.
   * @see {@link ThemeBrief}
   */
  meta?: ThemeBrief;
}

// ---------------------------------------------------------------------------
// SemanticTokens
// ---------------------------------------------------------------------------

/**
 * The semantic token layer of a theme. This is the **only** part of the token
 * system that components should consume — never `core.*` tokens directly.
 *
 * Obtain via `useTokens()` inside a `<ThemeProvider theme={...}>`.
 *
 * @see {@link useTokens}
 */
export type SemanticTokens = ThemeTokens['semantic'];
