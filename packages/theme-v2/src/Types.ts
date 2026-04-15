/* ==========================================================================
 * ttoss Design Tokens v2 — Type Definitions
 *
 * This file defines the type contract for the ttoss Design System v2.
 * It is divided into two layers:
 *
 *   1. Core Tokens  — raw primitives and responsiveness engines.
 *   2. Semantic Tokens — stable aliases consumed by components.
 *
 * Components must NEVER consume core tokens directly.
 * Semantic tokens should normally be references to core tokens, avoiding raw values.
 * Any semantic tokens that use raw values must be rare, intentional, and documented exceptions.
 *
 * Token naming follows the grammar defined in the Design Tokens v2 documentation.
 *
 * For the default theme values, see `./baseTheme.ts`.
 * ========================================================================== */

// ---------------------------------------------------------------------------
// Type Definitions
// ---------------------------------------------------------------------------

/** A raw CSS value (color hex, px, clamp expression, etc.) */
export type RawValue = string;

/** A reference to a core token, expressed as `{token.path}` */
export type TokenRef = `{${string}}`;

/** A numeric raw value (font weight, opacity, line-height, z-index, etc.) */
export type NumericValue = number;

// ---------------------------------------------------------------------------
// Deprecation Metadata
// ---------------------------------------------------------------------------

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
 * Layer 1 — ux:        action | input | navigation | feedback | guidance | discovery | content
 * Layer 2 — role:      primary | secondary | accent | muted | positive | caution | negative
 * Layer 3 — dimension: background | border | text  (per component; not all are required)
 * Layer 4 — state:     default | hover | active | focused | disabled | selected | …
 *
 * Role sets and extra states are constrained per UX context (see colors.md).
 * @see colors.md — Canonical Registry and Legal Combinations.
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
  guidance?: GuidanceColorRoles;
  discovery?: DiscoveryColorRoles;
  content: ContentColorRoles;
}

// -- Elevation --------------------------------------------------------------

interface CoreElevationLevels {
  0: RawValue;
  1: RawValue;
  2: RawValue;
  3: RawValue;
  4: RawValue;
}

interface SemanticElevation {
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
}

// -- Typography -------------------------------------------------------------

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

interface CoreFontOpticalSizing {
  auto: RawValue;
  none: RawValue;
}

interface CoreFontNumeric {
  proportional: RawValue;
  tabular: RawValue;
}

interface CoreFont {
  family: CoreFontFamilies;
  weight: CoreFontWeights;
  leading: CoreFontLeading;
  tracking: CoreFontTracking;
  opticalSizing: CoreFontOpticalSizing;
  numeric: CoreFontNumeric;
}

interface RampScale6 {
  1: RawValue;
  2: RawValue;
  3: RawValue;
  4: RawValue;
  5: RawValue;
  6: RawValue;
}

interface CoreTypeRamp {
  /** Body text, labels, and dense UI typography */
  text: RampScale6;
  /** Headings, titles, and high-hierarchy display text */
  display: RampScale6;
}

/** Semantic text style composition — references core tokens only */
interface TextStyle {
  fontFamily: TokenRef;
  fontSize: TokenRef;
  fontWeight: TokenRef;
  lineHeight: TokenRef;
  letterSpacing: TokenRef;
  fontOpticalSizing?: TokenRef;
  fontVariantNumeric?: TokenRef;
}

interface TextSizeLgMdSm {
  lg: TextStyle;
  md: TextStyle;
  sm: TextStyle;
}

interface TextSizeMdSm {
  md: TextStyle;
  sm: TextStyle;
}

interface SemanticText {
  display: TextSizeLgMdSm;
  headline: TextSizeLgMdSm;
  title: TextSizeLgMdSm;
  body: TextSizeLgMdSm;
  label: TextSizeLgMdSm;
  code: TextSizeMdSm;
}

// -- Spacing ----------------------------------------------------------------

interface CoreSpaceSteps {
  /** Responsive engine — container-first clamp formula */
  unit: RawValue;
  0: RawValue;
  1: RawValue;
  2: RawValue;
  3: RawValue;
  4: RawValue;
  6: RawValue;
  8: RawValue;
  12: RawValue;
  16: RawValue;
  /** Optional container-aware unit */
  unitCq?: RawValue;
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

// -- Sizing -----------------------------------------------------------------

interface CoreSizeRampUI {
  1: RawValue;
  2: RawValue;
  3: RawValue;
  4: RawValue;
  5: RawValue;
  6: RawValue;
  7: RawValue;
  8: RawValue;
}

interface CoreSizeRampLayout {
  1: RawValue;
  2: RawValue;
  3: RawValue;
  4: RawValue;
  5: RawValue;
  6: RawValue;
}

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
  heightFull: RawValue;
}

interface CoreSizeHitScale {
  min: RawValue;
  default: RawValue;
  prominent: RawValue;
}

interface CoreSizeHit {
  /** Fine pointer (mouse/trackpad) hit targets */
  fine: CoreSizeHitScale;
  /** Coarse pointer (touch) hit targets */
  coarse: CoreSizeHitScale;
}

interface CoreSize {
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
  hit: {
    /** Resolves to fine-pointer value; coarse-pointer override emitted by toCssVars */
    min: TokenRef;
    default: TokenRef;
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
    reading: RawValue;
  };
  surface: {
    maxWidth: TokenRef;
  };
  viewport: {
    height: {
      full: TokenRef;
    };
  };
}

// -- Radii ------------------------------------------------------------------

interface CoreRadii {
  none: RawValue;
  sm: RawValue;
  md: RawValue;
  lg: RawValue;
  xl: RawValue;
  full: RawValue;
}

interface SemanticRadii {
  control: TokenRef;
  surface: TokenRef;
  round: TokenRef;
}

// -- Borders ----------------------------------------------------------------

interface CoreBorderWidths {
  none: RawValue;
  default: RawValue;
  selected: RawValue;
  focused: RawValue;
}

interface CoreBorderStyles {
  solid: RawValue;
  dashed: RawValue;
  dotted: RawValue;
  none: RawValue;
}

interface CoreBorder {
  width: CoreBorderWidths;
  style: CoreBorderStyles;
}

interface SemanticBorderOutline {
  width: TokenRef;
  style: TokenRef;
}

interface SemanticBorder {
  divider: { width: TokenRef; style: TokenRef };
  outline: {
    surface: SemanticBorderOutline;
    control: SemanticBorderOutline;
  };
  selected: { width: TokenRef; style: TokenRef };
}

interface SemanticFocus {
  ring: { width: TokenRef; style: TokenRef };
}

// -- Opacity ----------------------------------------------------------------

interface CoreOpacity {
  100: NumericValue;
  75: NumericValue;
  50: NumericValue;
  25: NumericValue;
  0: NumericValue;
}

interface SemanticOpacity {
  scrim: TokenRef;
  loading: TokenRef;
  disabledMedia: TokenRef;
}

// -- Motion -----------------------------------------------------------------

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

interface CoreMotion {
  duration: CoreMotionDurations;
  easing: CoreMotionEasings;
}

interface SemanticMotionEntry {
  duration: TokenRef;
  easing: TokenRef;
}

interface SemanticMotion {
  feedback: SemanticMotionEntry;
  transition: {
    enter: SemanticMotionEntry;
    exit: SemanticMotionEntry;
  };
  emphasis: SemanticMotionEntry;
  decorative: SemanticMotionEntry;
}

// -- Z-Index ----------------------------------------------------------------

interface CoreZIndexLevels {
  0: NumericValue;
  1: NumericValue;
  2: NumericValue;
  3: NumericValue;
  4: NumericValue;
}

interface CoreZIndex {
  level: CoreZIndexLevels;
}

interface SemanticZIndex {
  layer: {
    base: TokenRef;
    sticky: TokenRef;
    overlay: TokenRef;
    blocking: TokenRef;
    transient: TokenRef;
  };
}

// -- Breakpoints ------------------------------------------------------------

interface CoreBreakpoints {
  sm: RawValue;
  md: RawValue;
  lg: RawValue;
  xl: RawValue;
  '2xl': RawValue;
}

// ---------------------------------------------------------------------------
// Extension imports
// ---------------------------------------------------------------------------

import type { CoreDataviz, SemanticDataviz } from './dataviz/Types';

export type { CoreDataviz, SemanticDataviz } from './dataviz/Types';

// ---------------------------------------------------------------------------
// Theme Contract
// ---------------------------------------------------------------------------

/**
 * Full ttoss Design Tokens v2 Theme contract.
 *
 * Two layers:
 *   - `core`     — raw primitives and responsive engines (immutable across modes)
 *   - `semantic` — stable aliases consumed by components (remapped per mode)
 *
 * Extensions are optional properties inside `core` and `semantic`.
 * When present they follow the same `core → semantic` contract.
 */
export interface ThemeTokensV2 {
  core: {
    colors: CoreColors;
    elevation: {
      /** Base shadow recipes (used by light mode by default). */
      level: CoreElevationLevels;
      /**
       * Dark-optimized shadow recipes.
       *
       * Themes that support a dark mode enrich core with these recipes,
       * so that the dark semantic alternate can remap to them without
       * mutating the base `level` tokens.
       */
      dark?: CoreElevationLevels;
    };
    font: CoreFont;
    type: { ramp: CoreTypeRamp };
    space: CoreSpaceSteps;
    size: CoreSize;
    radii: CoreRadii;
    border: CoreBorder;
    opacity: CoreOpacity;
    motion: CoreMotion;
    zIndex: CoreZIndex;
    /** Viewport thresholds. Core-only — no semantic layer. */
    breakpoint: CoreBreakpoints;
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
// DeepPartial
// ---------------------------------------------------------------------------

/**
 * Recursive partial type. Every nested property becomes optional,
 * enabling selective overrides at any depth.
 */
export type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;

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
export type ModeOverride = {
  semantic: DeepPartial<ThemeTokensV2['semantic']>;
};

// ---------------------------------------------------------------------------
// Icon System
// ---------------------------------------------------------------------------

/**
 * All canonical icon intents. Follows the grammar: `{family}.{intent}`
 *
 * @see icon-system.md — Canonical Intent Registry
 */
export type IconIntent =
  // action
  | 'action.add'
  | 'action.edit'
  | 'action.copy'
  | 'action.paste'
  | 'action.search'
  | 'action.download'
  | 'action.upload'
  | 'action.share'
  | 'action.refresh'
  | 'action.close'
  | 'action.clear'
  | 'action.delete'
  // navigation
  | 'navigation.back'
  | 'navigation.forward'
  | 'navigation.external'
  // disclosure
  | 'disclosure.expand'
  | 'disclosure.collapse'
  // visibility
  | 'visibility.show'
  | 'visibility.hide'
  // selection
  | 'selection.checked'
  | 'selection.unchecked'
  | 'selection.indeterminate'
  // status
  | 'status.success'
  | 'status.warning'
  | 'status.error'
  | 'status.info'
  // object
  | 'object.user'
  | 'object.calendar'
  | 'object.attachment'
  | 'object.settings';

/**
 * Complete mapping from every canonical intent to a renderable glyph.
 *
 * The glyph is a provider-specific string — an Iconify ID, a sprite reference,
 * or any other format the consuming Icon component understands.
 * The theme decides the format; the contract enforces completeness.
 */
export type IconGlyphMap = Record<IconIntent, string>;

/**
 * A theme bundle packages a complete `ThemeTokensV2` (the base)
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
  base: ThemeTokensV2;
  /**
   * Semantic remapping overrides for the opposite mode.
   * Only semantic references that differ need to be listed — core tokens are shared.
   */
  alternate?: ModeOverride;
  /**
   * Glyph mapping — assigns a renderable glyph to every canonical icon intent.
   *
   * Icon glyphs are not CSS tokens and are not serialized to CSS custom properties.
   * They live here, separate from `base`, because they are renderable assets
   * consumed by the Icon component at runtime, not by the CSS cascade.
   *
   * A theme that omits `icons` inherits the default mapping from the base bundle.
   * A theme that provides `icons` must map every canonical intent — partial
   * mappings are a contract violation enforced by the TypeScript type system.
   */
  icons?: IconGlyphMap;
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
export type SemanticTokens = ThemeTokensV2['semantic'];
