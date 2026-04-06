/* ==========================================================================
 * ttoss Design Tokens — Type Definitions
 *
 * This file defines the type contract for the ttoss Design System.
 * It is divided into two layers:
 *
 *   1. Core Tokens  — raw primitives and responsiveness engines.
 *   2. Semantic Tokens — stable aliases consumed by components.
 *
 * Components must NEVER consume core tokens directly.
 * Semantic tokens should normally be references to core tokens, avoiding raw values.
 * Any semantic tokens that use raw values must be rare, intentional, and documented exceptions.
 *
 * Token naming follows the grammar defined in the Design Tokens documentation.
 * @see /docs/website/docs/design/02-design-tokens/
 *
 * For the default theme values, see `./baseTheme.ts`.
 * ========================================================================== */

import type { CoreDataviz, SemanticDataviz } from './dataviz/Types';

export type { CoreDataviz, SemanticDataviz } from './dataviz/Types';

// ---------------------------------------------------------------------------
// Type Definitions
// ---------------------------------------------------------------------------

/** A raw CSS value (color hex, px, clamp expression, etc.) */
export type RawValue = string;

/** A reference to a core token, expressed as `{token.path}` */
export type TokenRef = `{${string}}`;

/** A numeric raw value (font weight, opacity, line-height, z-index, etc.) */
export type NumericValue = number;

/**
 * Recursive partial type. Every nested property becomes optional,
 * enabling selective overrides at any depth.
 */
export type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;

// -- Colors -----------------------------------------------------------------

/**
 * Unified color scale steps (0–1000).
 * Themes may use any subset; step 500 is always required as the canonical mid-point.
 */
type CoreColorStep =
  | 0
  | 50
  | 100
  | 200
  | 300
  | 400
  | 500
  | 600
  | 700
  | 800
  | 900
  | 1000;

/**
 * Palette scale — partial record over CoreColorStep with 500 required.
 * Sparse palettes (100/300/500/700/900) and dense palettes (0–1000) both conform.
 */
type CoreColorScale = Partial<Record<CoreColorStep, RawValue>> & {
  500: RawValue;
};

/**
 * Core color tokens — intent-free palette primitives.
 *
 * Rules:
 * - Core names define palette families and scale positions, never usage.
 * - No semantic naming (no `danger`, `warning`, `link`, `surface`, etc.).
 * - No mode naming (core values are immutable across modes).
 * - No component naming (no `cardBg`, `inputBorder`, etc.).
 *
 * @see /docs/website/docs/design/02-design-tokens/02-families/colors.md
 */
interface CoreColors {
  /** Primary brand identity color scale. */
  brand: CoreColorScale;
  /**
   * Zero-saturation anchor scale (greyscale/slate).
   * Provides surfaces, text contrast, dividers, and subdued UI.
   * Named `neutral` by convention — not a semantic role, purely a palette family.
   * Use step 0 for white-end and step 1000 for black-end.
   */
  neutral: CoreColorScale;
  /**
   * Open hue families. Themes define which they need (red, green, yellow, blue, etc.).
   * No fixed set is required beyond `brand` and `neutral`.
   */
  [hue: string]: CoreColorScale;
}

// -- Semantic Colors --------------------------------------------------------

/**
 * Semantic color token grammar: `{ux}.{role}.{dimension}.{state}`
 *
 * Layer 1 — ux (required): action | input | navigation | feedback | content
 *            ux (optional): guidance | discovery — present only when the product uses these patterns
 * Layer 2 — role:      primary | secondary | accent | muted | positive | caution | negative
 * Layer 3 — dimension: background | border | text  (per component; not all are required)
 * Layer 4 — state:     default | hover | active | focused | disabled | selected | …
 *
 * Role sets and extra states are constrained per UX context (see /docs/website/design-tokens/colors.md).
 * @see /docs/website/design-tokens/colors.md — Canonical Registry and Legal Combinations.
 */

/** Base interaction states — available in every UX context. */
interface BaseColorStates {
  default: TokenRef;
  hover?: TokenRef;
  active?: TokenRef;
  focused?: TokenRef;
  disabled?: TokenRef;
  selected?: TokenRef;
}

/** `action` context: adds `pressed` for toggle controls. */
interface ActionColorStates extends BaseColorStates {
  pressed?: TokenRef;
}

/** `input` context: adds `checked`, `indeterminate`, `pressed`, `expanded` for form controls. */
interface InputColorStates extends BaseColorStates {
  checked?: TokenRef;
  indeterminate?: TokenRef;
  pressed?: TokenRef;
  expanded?: TokenRef;
}

/** `navigation` context: adds `current`, `visited`, `expanded`. */
interface NavigationColorStates extends BaseColorStates {
  current?: TokenRef;
  visited?: TokenRef;
  expanded?: TokenRef;
}

/** `content` context: adds `visited` for links. */
interface ContentColorStates extends BaseColorStates {
  visited?: TokenRef;
}

/** `discovery` context: adds `expanded` (disclosure) and `droptarget` (drag-and-drop). */
interface DiscoveryColorStates extends BaseColorStates {
  expanded?: TokenRef;
  droptarget?: TokenRef;
}

/**
 * Color dimensions for a given UX context.
 * Each dimension is optional — components choose which they consume.
 * (e.g. a text link uses only `text`; a ghost button uses `text` + `border`)
 */
interface ColorDimensionOf<S extends BaseColorStates> {
  background?: S;
  border?: S;
  text?: S;
}

/** `action`: triggers actions or changes state. Roles: primary | secondary | accent | muted | negative */
interface ActionColorRoles {
  primary?: ColorDimensionOf<ActionColorStates>;
  secondary?: ColorDimensionOf<ActionColorStates>;
  accent?: ColorDimensionOf<ActionColorStates>;
  muted?: ColorDimensionOf<ActionColorStates>;
  negative?: ColorDimensionOf<ActionColorStates>;
}

/** `input`: data entry, selection, form controls. Roles: primary | secondary | muted | positive | caution | negative */
interface InputColorRoles {
  primary?: ColorDimensionOf<InputColorStates>;
  secondary?: ColorDimensionOf<InputColorStates>;
  muted?: ColorDimensionOf<InputColorStates>;
  positive?: ColorDimensionOf<InputColorStates>;
  caution?: ColorDimensionOf<InputColorStates>;
  negative?: ColorDimensionOf<InputColorStates>;
}

/** `navigation`: movement and orientation. Roles: primary | secondary | accent | muted */
interface NavigationColorRoles {
  primary?: ColorDimensionOf<NavigationColorStates>;
  secondary?: ColorDimensionOf<NavigationColorStates>;
  accent?: ColorDimensionOf<NavigationColorStates>;
  muted?: ColorDimensionOf<NavigationColorStates>;
}

/** `feedback`: reactive system/user-result messages. Roles: primary | muted | positive | caution | negative */
interface FeedbackColorRoles {
  primary?: ColorDimensionOf<BaseColorStates>;
  muted?: ColorDimensionOf<BaseColorStates>;
  positive?: ColorDimensionOf<BaseColorStates>;
  caution?: ColorDimensionOf<BaseColorStates>;
  negative?: ColorDimensionOf<BaseColorStates>;
}

/** `guidance`: preventive or instructional. Roles: primary | secondary | accent | muted | caution */
interface GuidanceColorRoles {
  primary?: ColorDimensionOf<BaseColorStates>;
  secondary?: ColorDimensionOf<BaseColorStates>;
  accent?: ColorDimensionOf<BaseColorStates>;
  muted?: ColorDimensionOf<BaseColorStates>;
  caution?: ColorDimensionOf<BaseColorStates>;
}

/** `discovery`: search, filter, exploration. Roles: primary | secondary | accent | muted */
interface DiscoveryColorRoles {
  primary?: ColorDimensionOf<DiscoveryColorStates>;
  secondary?: ColorDimensionOf<DiscoveryColorStates>;
  accent?: ColorDimensionOf<DiscoveryColorStates>;
  muted?: ColorDimensionOf<DiscoveryColorStates>;
}

/** `content`: informational surfaces and readable content. Roles: primary | secondary | accent | muted | positive | caution | negative */
interface ContentColorRoles {
  primary?: ColorDimensionOf<ContentColorStates>;
  secondary?: ColorDimensionOf<ContentColorStates>;
  accent?: ColorDimensionOf<ContentColorStates>;
  muted?: ColorDimensionOf<ContentColorStates>;
  positive?: ColorDimensionOf<ContentColorStates>;
  caution?: ColorDimensionOf<ContentColorStates>;
  negative?: ColorDimensionOf<ContentColorStates>;
}

interface SemanticColors {
  action: ActionColorRoles;
  input: InputColorRoles;
  navigation: NavigationColorRoles;
  feedback: FeedbackColorRoles;
  /** Preventive or instructional guidance patterns — omit when the product does not use them. */
  guidance?: GuidanceColorRoles;
  /** Search, filter, and exploration patterns — omit when the product does not use them. */
  discovery?: DiscoveryColorRoles;
  content: ContentColorRoles;
}

/**
 * -- Elevation --------------------------------------------------------------
 * @see elevation.md
 */

/**
 * Open shadow recipe ramp — themes define as many levels as needed.
 * Every key referenced by a semantic token must resolve to a defined entry here.
 */
type CoreElevationLevels = Record<string, RawValue>;

/**
 * Core elevation primitives — shadow recipe ramps.
 *
 * - `level`    — base recipes (standard opacity), used by default in light themes
 * - `emphatic` — high-opacity recipes for surfaces needing stronger depth contrast
 *               (e.g., on dark or heavily-colored backgrounds)
 *
 * Both ramps are open `Record<string, RawValue>` — themes define as many levels as
 * needed. Every key referenced by a semantic token must be defined here.
 *
 * Future expansion (non-breaking): add optional sibling ramps as needed.
 * @see elevation.md
 */
interface CoreElevation {
  /** Base shadow recipes — standard opacity, light-surface defaults. */
  level: CoreElevationLevels;
  /**
   * High-opacity shadow recipes for surfaces needing stronger depth contrast.
   * Mode-agnostic: expresses shadow weight, not a mode label.
   * Themes include this ramp when a dark alternate requires higher-opacity recipes.
   */
  emphatic?: CoreElevationLevels;
}

interface SemanticElevation {
  /**
   * Shadow-based surface strata — the primary depth contract.
   * Maps each stratum to a shadow recipe (core elevation reference).
   */
  surface: {
    /** Surfaces flush with the page */
    flat: TokenRef;
    /** Cards and panels */
    raised: TokenRef;
    /** Dropdowns, popovers, floating surfaces */
    overlay: TokenRef;
    /** Dialogs and blocking sheets */
    blocking: TokenRef;
  };
  /**
   * Tonal overlay tokens — optional surface color treatments paired with shadows
   * to preserve depth perception in dark or heavily-colored themes.
   *
   * Each token typically resolves to a color overlay (e.g., `color-mix`, rgba surface).
   * Omit when the product does not use tonal elevation.
   * When present, must cover the same strata that carry visible shadows.
   * @see elevation.md — "Surface + Shadow"
   */
  tonal?: {
    raised: TokenRef;
    overlay: TokenRef;
    blocking: TokenRef;
  };
}

/**
 * -- Typography -------------------------------------------------------------
 * @see typography.md
 */

interface CoreFontFamilies {
  sans: RawValue;
  mono: RawValue;
  serif?: RawValue;
}

interface CoreFontWeights {
  regular: NumericValue;
  medium: NumericValue;
  semibold: NumericValue;
  bold: NumericValue;
}

interface CoreFontLeading {
  tight: NumericValue;
  snug: NumericValue;
  normal: NumericValue;
  relaxed: NumericValue;
}

interface CoreFontTracking {
  tight: RawValue;
  normal: RawValue;
  wide: RawValue;
}

interface CoreFontOptical {
  auto: RawValue;
  none: RawValue;
}

interface CoreFontNumeric {
  proportional: RawValue;
  tabular: RawValue;
}

type RampScale6 = Record<1 | 2 | 3 | 4 | 5 | 6, RawValue>;

/**
 * Responsive font size scale — text and display size ramps.
 * Both ramps use `clamp()` expressions with container query units (cqi) as the
 * preferred fluid step, with viewport-safe fallbacks emitted by `toCssVars`.
 */
interface CoreFontScale {
  /** Body text, labels, and dense UI typography */
  text: RampScale6;
  /** Headings, titles, and high-hierarchy display text */
  display: RampScale6;
}

/** Core font primitive set — family, weight, leading (line height), tracking (letter spacing), optical sizing, numeric variant references, and the responsive size scale. */
interface CoreFont {
  family: CoreFontFamilies;
  weight: CoreFontWeights;
  leading: CoreFontLeading;
  tracking: CoreFontTracking;
  optical: CoreFontOptical;
  numeric: CoreFontNumeric;
  /** Responsive font size scale. @see CoreFontScale */
  scale: CoreFontScale;
}

/** Composite text style — groups 5–7 font token references that define a single typographic role. References core tokens only. */
interface TextStyle {
  fontFamily: TokenRef;
  fontSize: TokenRef;
  fontWeight: TokenRef;
  lineHeight: TokenRef;
  letterSpacing: TokenRef;
  fontOpticalSizing?: TokenRef;
  fontVariantNumeric?: TokenRef;
}

type TextStyleLgMdSm = Record<'lg' | 'md' | 'sm', TextStyle>;

type TextStyleMdSm = Record<'md' | 'sm', TextStyle>;

interface SemanticText {
  display: TextStyleLgMdSm;
  headline: TextStyleLgMdSm;
  title: TextStyleLgMdSm;
  body: TextStyleLgMdSm;
  label: TextStyleLgMdSm;
  code: TextStyleMdSm;
}

/**
 * -- Spacing ----------------------------------------------------------------
 * @see spacing.md
 */

interface CoreSpacingEngine {
  /** Responsive base unit — container-first clamp formula */
  unit: RawValue;
  /** Optional container-aware variant */
  unitCq?: RawValue;
}

interface CoreSpacingSteps {
  /** Responsive engine primitives — internal, not for direct component use */
  engine: CoreSpacingEngine;
  0: RawValue;
  1: RawValue;
  2: RawValue;
  3: RawValue;
  4: RawValue;
  6: RawValue;
  8: RawValue;
  12: RawValue;
  16: RawValue;
}

interface InsetSteps {
  sm: TokenRef;
  md: TokenRef;
  lg: TokenRef;
}

interface GapStackSteps {
  xs: TokenRef;
  sm: TokenRef;
  md: TokenRef;
  lg: TokenRef;
  xl: TokenRef;
}

interface GapInlineSteps {
  xs: TokenRef;
  sm: TokenRef;
  md: TokenRef;
  lg: TokenRef;
  xl: TokenRef;
}

interface SemanticSpacing {
  inset: {
    control: InsetSteps;
    surface: InsetSteps;
  };
  gap: {
    stack: GapStackSteps;
    inline: GapInlineSteps;
  };
  /**
   * `page` and `section` may use a `clamp()` expression with embedded `{token.path}` refs
   * (e.g. `clamp({core.space.4}, {core.space.6}, {core.space.12})`).
   * Typed as `RawValue` to allow both simple refs and responsive clamp expressions.
   */
  gutter: {
    page: RawValue;
    section: RawValue;
  };
  /**
   * May use a `clamp()` expression with an embedded `{token.path}` ref
   * (e.g. `clamp(8px, {core.space.2}, 12px)`).
   */
  separation: {
    interactive: {
      min: RawValue;
    };
  };
}

/**
 * -- Sizing -----------------------------------------------------------------
 * @see sizing.md
 */

type CoreSizeRampUI = Record<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8, RawValue>;

type CoreSizeRampLayout = Record<1 | 2 | 3 | 4 | 5 | 6, RawValue>;

interface CoreSizeRelative {
  em: RawValue;
  rem: RawValue;
}

interface CoreSizeBehavior {
  auto: RawValue;
  full: RawValue;
  fit: RawValue;
  min: RawValue;
  max: RawValue;
}

interface CoreSizeViewport {
  height: {
    full: RawValue;
  };
  width: {
    full: RawValue;
  };
}

/** Three-step hit target size ramp (min / base / prominent). */
interface CoreSizeHitScale {
  min: RawValue;
  base: RawValue;
  prominent: RawValue;
}

/**
 * Hit target sizes split by pointer type.
 * `toCssVars` automatically injects the `coarse` values under `@media (any-pointer: coarse)`.
 */
interface CoreSizeHit {
  /** Fine pointer (mouse/trackpad) hit targets */
  fine: CoreSizeHitScale;
  /** Coarse pointer (touch) hit targets */
  coarse: CoreSizeHitScale;
}

interface CoreSizing {
  ramp: {
    ui: CoreSizeRampUI;
    layout: CoreSizeRampLayout;
  };
  relative: CoreSizeRelative;
  behavior: CoreSizeBehavior;
  viewport: CoreSizeViewport;
  hit: CoreSizeHit;
}

interface SemanticSizing {
  /**
   * Ergonomic hit targets. Each token resolves to the **fine-pointer** value.
   * The CSS output layer (`toCssVars`) automatically injects coarse-pointer
   * overrides inside `@media (any-pointer: coarse)` — no component code needed.
   * These tokens must never resolve to fluid or intrinsic values.
   */
  hit: {
    min: TokenRef;
    base: TokenRef;
    prominent: TokenRef;
  };
  icon: {
    sm: TokenRef;
    md: TokenRef;
    lg: TokenRef;
  };
  identity: {
    sm: TokenRef;
    md: TokenRef;
    lg: TokenRef;
    xl: TokenRef;
  };
  measure: {
    /**
     * Typed as `RawValue` by design: `ch` units cannot be expressed as a core
     * token reference. Override with a validated character-based `clamp()`
     * expression only — never px or rem.
     */
    reading: RawValue;
  };
  surface: {
    maxWidth: TokenRef;
  };
  viewport: {
    height: {
      full: TokenRef;
    };
    width: {
      full: TokenRef;
    };
  };
}

/**
 * -- Radii ------------------------------------------------------------------
 * @see radii.md
 */

/**
 * Core radius scale — intent-free corner curvature primitives.
 * Ordered: none < sm < md < lg < xl << full.
 *
 * **Never reference core radii directly from components.**
 * Components consume only semantic radii (`radii.control`, `radii.surface`, `radii.round`).
 */
interface CoreRadii {
  none: RawValue;
  sm: RawValue;
  md: RawValue;
  lg: RawValue;
  xl: RawValue;
  /**
   * Fully-rounded intent (`9999px`).
   * Expresses shape intent — perfect circles still depend on element dimensions.
   */
  full: RawValue;
}

/**
 * Semantic radius contracts — stable shape API consumed by components.
 *
 * Pick by structural role:
 * - `control`  → interactive element (button, input, toggle, chip)
 * - `surface`  → containing surface (card, panel, dialog, menu)
 * - `round`    → explicitly fully-rounded shape intent (pill, capsule, avatar)
 *
 * @see radii.md — Decision Matrix and Rules of Engagement.
 */
interface SemanticRadii {
  /** Radius for interactive controls and touchable UI elements. */
  control: TokenRef;
  /** Radius for surfaces that contain or group content. */
  surface: TokenRef;
  /** Full-round shape intent for pills, capsules, and circular affordances. */
  round: TokenRef;
}

/**
 * -- Borders ----------------------------------------------------------------
 * @see borders.md
 */

/**
 * Core line widths — intent-free primitives.
 * `selected` and `focused` must resolve to a width strictly greater than `default`.
 * Never reference these directly from components — use semantic border tokens.
 */
interface CoreBorderWidths {
  none: RawValue;
  default: RawValue;
  selected: RawValue;
  focused: RawValue;
}

/**
 * Core line styles — intent-free primitives.
 * Default to `solid`; use `dashed` or `dotted` only when the pattern truly requires it.
 */
interface CoreBorderStyles {
  solid: RawValue;
  dashed: RawValue;
  dotted: RawValue;
  none: RawValue;
}

/** Intent-free line primitives — width and style only. */
interface CoreBorder {
  width: CoreBorderWidths;
  style: CoreBorderStyles;
}

/**
 * Shared shape for every semantic line contract: width + style references only.
 * Color is never part of this contract — pair with semantic color tokens.
 * @see SemanticColors — for border color tokens per UX context.
 */
interface SemanticBorderOutline {
  width: TokenRef;
  style: TokenRef;
}

/**
 * Semantic line contracts — the stable API consumed by components.
 *
 * Five canonical contracts (borders.md §Canonical semantic set):
 * @see borders.md
 * - `divider`         — structural separator between content groups
 * - `outline.surface` — boundary of containing surfaces (cards, panels, dialogs)
 * - `outline.control` — boundary of interactive controls (buttons, inputs, toggles)
 * - `selected`        — stronger-thickness indicator for selected/current state
 *
 * Rules:
 * - Components consume these tokens only — never `core.border.*` directly.
 * - `selected` must resolve to a width strictly greater than `outline.*`.
 * - Color meaning stays in the color system; these tokens define geometry only.
 * - Do not add component-specific tokens (`border.input`, `border.card`, etc.).
 */
interface SemanticBorder {
  divider: SemanticBorderOutline;
  outline: {
    surface: SemanticBorderOutline;
    control: SemanticBorderOutline;
  };
  selected: SemanticBorderOutline;
}

// -- Focus ------------------------------------------------------------------

/**
 * Dedicated accessibility contract for keyboard/programmatic focus.
 *
 * Distinct from `border.outline.*` — always implemented via CSS `outline`, not `border`,
 * to avoid layout shift and produce clearer accessible focus indicators.
 * Must resolve to a width ≥ `border.outline.*`.
 *
 * @example
 * ```css
 * :focus-visible {
 *   outline-width: var(--tt-focus-ring-width);
 *   outline-style: var(--tt-focus-ring-style);
 *   outline-color: var(--tt-colors-input-primary-border-focused);
 *   outline-offset: 2px;
 * }
 * ```
 */
interface SemanticFocus {
  ring: SemanticBorderOutline;
}

/**
 * -- Opacity ----------------------------------------------------------------
 * @see opacity.md
 */

/** Intent-free opacity scale. Components must use `SemanticOpacity` — never this directly.
 * Invariant: `0 ≤ 25 ≤ 50 ≤ 75 ≤ 100`, all in `[0, 1]`, no two adjacent steps equal. */
interface CoreOpacity {
  100: NumericValue;
  75: NumericValue;
  50: NumericValue;
  25: NumericValue;
  0: NumericValue;
}

/** Stable opacity contracts for components. Each must resolve to `(0, 1)` exclusive.
 * `scrim` — modal backdrops | `loading` — content veils | `disabled` — dimmed disabled media. */
interface SemanticOpacity {
  scrim: TokenRef;
  loading: TokenRef;
  disabled: TokenRef;
}

/**
 * -- Motion -----------------------------------------------------------------
 * @see motion.md
 */

interface CoreMotionDurations {
  none: RawValue;
  xs: RawValue;
  sm: RawValue;
  md: RawValue;
  lg: RawValue;
  xl: RawValue;
}

interface CoreMotionEasings {
  standard: RawValue;
  enter: RawValue;
  exit: RawValue;
  linear: RawValue;
}

/** Core motion primitives — duration steps and easing curves. Components consume only semantic motion tokens. */
interface CoreMotion {
  duration: CoreMotionDurations;
  easing: CoreMotionEasings;
}

/** A duration + easing pair that fully specifies motion for one use-case. */
interface SemanticMotionSpec {
  duration: TokenRef;
  easing: TokenRef;
}

interface SemanticMotion {
  feedback: SemanticMotionSpec;
  transition: {
    enter: SemanticMotionSpec;
    exit: SemanticMotionSpec;
  };
  emphasis: SemanticMotionSpec;
  decorative: SemanticMotionSpec;
}

/**
 * -- Z-Index ----------------------------------------------------------------
 * @see z-index.md
 */

/**
 * Intent-free z-index level scale. Components must use `SemanticZIndex` — never this directly.
 * Ordering invariant (strictly ascending): `level.0 < level.1 < level.2 < level.3 < level.4`.
 * `level.0` must be ≥ 0. Adjacent levels must differ by ≥ 10.
 */
type CoreZIndexLevels = Record<0 | 1 | 2 | 3 | 4, NumericValue>;

interface CoreZIndex {
  level: CoreZIndexLevels;
}

/** Stable stacking contexts consumed by components. Top-layer browser elements are out of scope. */
interface SemanticZIndex {
  layer: {
    base: TokenRef;
    sticky: TokenRef;
    overlay: TokenRef;
    blocking: TokenRef;
    transient: TokenRef;
  };
}

/**
 * -- Breakpoints ------------------------------------------------------------
 * @see breakpoints.md
 */

/**
 * Viewport threshold scale — adaptation infrastructure for macro layout changes.
 *
 * Rules:
 * - Core-only: no semantic layer exists for breakpoints (they are not brand-expressive).
 * - Mobile-first: base styles apply below `sm`; scale up with `min-width`. No `xs` step.
 * - Values must use `rem` units to respect user font-size preferences.
 * - Ordering invariant (strictly ascending): `sm < md < lg < xl < 2xl`.
 * - Adjacent steps must differ by ≥ 8rem to avoid over-granularity.
 * - Keep the scale small (≤ 5 steps). Add steps only when layout truly requires it.
 * - Device-category names (`mobile`, `tablet`, `desktop`) are forbidden — use scale names.
 * - CSS custom properties emitted from these tokens are for JS/tooling inspection only;
 *   they cannot be used in `@media` queries (CSS spec restriction on custom properties).
 *
 * @see breakpoints.md — Foundation Default Set, Rules, Validation.
 */
interface CoreBreakpoints {
  sm: RawValue;
  md: RawValue;
  lg: RawValue;
  xl: RawValue;
  '2xl': RawValue;
}

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
 * @see {@link modes.md} — "Modes remap semantic references, not core values."
 */
export interface ModeOverride {
  semantic: DeepPartial<ThemeTokens['semantic']>;
}

/**
 * A theme bundle packages a complete `ThemeTokens` (the base)
 * with an optional semantic-only override for the alternate color mode.
 *
 * - `baseMode` declares which mode the `base` theme represents.
 * - `alternate` remaps only semantic token references that differ in the
 *   opposite mode. Core token values stay immutable.
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
 *         content: { primary: { background: { default: '{core.colors.neutral.900}' } } },
 *       },
 *     },
 *   },
 * };
 * ```
 */
export interface ThemeBundle {
  /** Which color mode the `base` theme represents. */
  baseMode: 'light' | 'dark';
  /** Complete theme for the base mode. */
  base: ThemeTokens;
  /**
   * Semantic remapping overrides for the opposite mode.
   * Only semantic references that differ need to be listed — core tokens are shared.
   */
  alternate?: ModeOverride;
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
