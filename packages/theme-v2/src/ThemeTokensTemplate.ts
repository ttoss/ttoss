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
 * For the default theme values, see `./themes/default.ts`.
 * ========================================================================== */

// ---------------------------------------------------------------------------
// Type Definitions
// ---------------------------------------------------------------------------

/** A raw CSS value (color hex, px, clamp expression, etc.) */
type RawValue = string;

/** A reference to a core token, expressed as `{token.path}` */
type TokenRef = `{${string}}`;

/** A numeric raw value (font weight, opacity, line-height, z-index, etc.) */
type NumericValue = number;

// -- Colors -----------------------------------------------------------------

interface CoreBrandColors {
  /** Primary brand color for key actions and brand presence */
  main: RawValue;
  /** Secondary brand color that complements the main color */
  complimentary: RawValue;
  /** Accent color for emphasis and call-to-action elements */
  accent: RawValue;
  /** Dark neutral for text and strong contrast */
  darkNeutral: RawValue;
  /** Light neutral for backgrounds and subtle elements */
  lightNeutral: RawValue;
}

interface CoreNeutralColors {
  white: RawValue;
  gray50: RawValue;
  gray100: RawValue;
  gray200: RawValue;
  gray300: RawValue;
  gray500: RawValue;
  gray700: RawValue;
  gray900: RawValue;
  black: RawValue;
}

interface CoreHueScale {
  100: RawValue;
  200: RawValue;
  300: RawValue;
  400: RawValue;
  500: RawValue;
  600: RawValue;
  700: RawValue;
}

interface CoreColors {
  brand: CoreBrandColors;
  neutral: CoreNeutralColors;
  /** Hue scales that harmonize with the brand. Add hues as needed. */
  red: CoreHueScale;
  [hue: string]: CoreBrandColors | CoreNeutralColors | CoreHueScale;
}

/**
 * Semantic color token: `{ux}.{role}.{dimension}.{state?}`
 *
 * - ux: navigation | discovery | input | action | feedback | guidance | content
 * - role: primary | secondary | accent | muted | negative | positive | caution
 * - dimension: background | border | text
 * - state (optional): default | hover | active | focused | disabled | selected | checked | pressed | expanded | current | visited | indeterminate | droptarget
 */
interface ColorDimensionStates {
  default: TokenRef;
  hover?: TokenRef;
  active?: TokenRef;
  focused?: TokenRef;
  disabled?: TokenRef;
  selected?: TokenRef;
  checked?: TokenRef;
  pressed?: TokenRef;
  expanded?: TokenRef;
  current?: TokenRef;
  visited?: TokenRef;
  indeterminate?: TokenRef;
  droptarget?: TokenRef;
}

interface ColorDimensions {
  background: ColorDimensionStates;
  border: ColorDimensionStates;
  text: ColorDimensionStates;
}

interface ColorRoles {
  primary?: ColorDimensions;
  secondary?: ColorDimensions;
  accent?: ColorDimensions;
  muted?: ColorDimensions;
  negative?: ColorDimensions;
  positive?: ColorDimensions;
  caution?: ColorDimensions;
}

interface SemanticColors {
  action: ColorRoles;
  input: ColorRoles;
  content: ColorRoles;
  feedback: ColorRoles;
  navigation: ColorRoles;
  discovery?: ColorRoles;
  guidance?: ColorRoles;
  /** Expandable UX contexts */
  analytics?: ColorRoles;
  social?: ColorRoles;
  commerce?: ColorRoles;
  gamification?: ColorRoles;
}

// -- Elevation --------------------------------------------------------------

interface CoreElevationLevels {
  0: RawValue;
  1: RawValue;
  2: RawValue;
  3: RawValue;
  4: RawValue;
  5: RawValue;
}

interface SemanticElevation {
  /** Surfaces flush with the page (level 0) */
  flat: TokenRef;
  /** Cards and panels at rest (level 2) */
  resting: TokenRef;
  /** Interactive surfaces lifted on hover (level 3) */
  raised: TokenRef;
  /** Popovers and dropdowns (level 3–4) */
  overlay: TokenRef;
  /** Dialogs and sheets (level 4) */
  modal: TokenRef;
  /** Toasts and tooltips (level 5) */
  top: TokenRef;
  /** Surfaces being dragged (level 5 with enhanced offset) */
  dragged: TokenRef;
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
  gutter: {
    page: TokenRef;
    section: TokenRef;
  };
  separation: {
    interactive: {
      min: TokenRef;
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
  widthFull: RawValue;
}

interface CoreSize {
  ramp: {
    ui: CoreSizeRampUI;
    layout: CoreSizeRampLayout;
  };
  relative: CoreSizeRelative;
  behavior: CoreSizeBehavior;
  viewport: CoreSizeViewport;
}

interface SemanticSizing {
  hit: {
    min: RawValue;
    default: RawValue;
    prominent: RawValue;
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
  xs: RawValue;
  sm: RawValue;
  md: RawValue;
  lg: RawValue;
  full: RawValue;
}

interface SemanticRadii {
  surface: TokenRef;
  control: TokenRef;
  pill: TokenRef;
  avatar: TokenRef;
  toast: TokenRef;
}

// -- Borders ----------------------------------------------------------------

interface CoreBorderWidths {
  0: RawValue;
  hairline: RawValue;
  sm: RawValue;
  md: RawValue;
}

interface CoreBorderStyles {
  solid: RawValue;
  dashed: RawValue;
  dotted: RawValue;
  none: RawValue;
}

interface CoreBorders {
  width: CoreBorderWidths;
  style: CoreBorderStyles;
}

interface SemanticBorder {
  divider: { width: TokenRef; style: TokenRef };
  outline: { width: TokenRef; style: TokenRef };
  focus: { width: TokenRef; style: TokenRef };
  input: { width: TokenRef; style: TokenRef };
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
  overlay: {
    backdrop: { opacity: TokenRef };
    spinner: { opacity: TokenRef };
  };
  feedback: {
    disabled: {
      text: { opacity: TokenRef };
    };
  };
}

// -- Motion -----------------------------------------------------------------

interface CoreMotionDurations {
  xs: RawValue;
  sm: RawValue;
  md: RawValue;
  lg: RawValue;
  xl: RawValue;
}

interface CoreMotionEasings {
  standard: RawValue;
  decelerate: RawValue;
  accelerate: RawValue;
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
  feedback: { fast: SemanticMotionEntry };
  navigation: { standard: SemanticMotionEntry };
  decorative: { slow: SemanticMotionEntry };
}

// -- Z-Index ----------------------------------------------------------------

interface CoreZIndex {
  base: NumericValue;
  dropdown: NumericValue;
  sticky: NumericValue;
  overlay: NumericValue;
  modal: NumericValue;
  toast: NumericValue;
  tooltip: NumericValue;
}

interface SemanticZIndex {
  navigation: TokenRef;
  dropdownMenu: TokenRef;
  modalOverlay: TokenRef;
  modal: TokenRef;
  toast: TokenRef;
}

// -- Breakpoints ------------------------------------------------------------

interface CoreBreakpoints {
  xs: RawValue;
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
 * Full ttoss Design Tokens v2 Theme contract.
 *
 * Two layers:
 *   - `core`     — raw primitives and responsive engines
 *   - `semantic` — stable aliases consumed by components
 */
export interface ThemeTokensV2 {
  core: {
    colors: CoreColors;
    elevation: { level: CoreElevationLevels };
    font: CoreFont;
    type: { ramp: CoreTypeRamp };
    space: CoreSpaceSteps;
    size: CoreSize;
    radii: CoreRadii;
    borders: CoreBorders;
    opacity: CoreOpacity;
    motion: CoreMotion;
    zIndex: CoreZIndex;
    breakpoints: CoreBreakpoints;
  };
  semantic: {
    colors: SemanticColors;
    elevation: SemanticElevation;
    text: SemanticText;
    spacing: SemanticSpacing;
    sizing: SemanticSizing;
    radii: SemanticRadii;
    border: SemanticBorder;
    opacity: SemanticOpacity;
    motion: SemanticMotion;
    zIndex: SemanticZIndex;
  };
}
