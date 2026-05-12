/* ==========================================================================
 * Typography — Core font primitives + Semantic text styles.
 * @see typography.md
 * ========================================================================== */

import type {
  CoreFontRef,
  CoreFontScaleRef,
  NumericValue,
  RawValue,
} from './primitives';

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

/**
 * Core font optical sizing primitives — exhaustive enumeration of the CSS
 * `font-optical-sizing` property values. Closed set by spec, not by choice.
 *
 * Mapping (token → CSS keyword):
 * - `auto` → `auto`  (let the UA opt into optical sizing for variable fonts)
 * - `none` → `none`  (disable optical adjustments)
 *
 * The wrapper exists to satisfy the `CoreFontRef` invariant of `TextStyle`
 * (semantic styles reference core tokens only) and to register entries in the
 * CSS variable pipeline — not to enable per-theme variation, which the CSS
 * spec does not permit.
 */
interface CoreFontOptical {
  auto: RawValue;
  none: RawValue;
}

/**
 * Core font numeric variant primitives — figure shape, alignment, and special glyph
 * features exposed by the CSS `font-variant-numeric` property.
 *
 * The set covers the standalone keyword values of the CSS spec; combinations
 * (e.g. `tabular-nums slashed-zero`) are composed at the consumer site by
 * concatenating these values, not encoded as additional tokens.
 *
 * Mapping (token → CSS keyword):
 * - `proportional` → `proportional-nums`  (default figure widths)
 * - `tabular`      → `tabular-nums`       (uniform-width figures; dashboards, tables)
 * - `lining`       → `lining-nums`        (cap-height figures)
 * - `oldstyle`     → `oldstyle-nums`      (text-figure variants for body copy)
 * - `slashedZero`  → `slashed-zero`       (zero disambiguation; financial/code contexts)
 * - `ordinal`      → `ordinal`            (1st, 2nd, 3rd ordinal markers)
 * - `normal`       → `normal`             (reset to UA defaults)
 *
 * The wrapper exists to satisfy the `CoreFontRef` invariant of `TextStyle`
 * (semantic styles reference core tokens only) and to register entries in the
 * CSS variable pipeline — not to enable per-theme variation of the keyword
 * values themselves, which are fixed by the CSS spec.
 */
interface CoreFontNumeric {
  proportional: RawValue;
  tabular: RawValue;
  lining: RawValue;
  oldstyle: RawValue;
  slashedZero: RawValue;
  ordinal: RawValue;
  normal: RawValue;
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
export interface CoreFont {
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
  fontFamily: CoreFontRef;
  fontSize: CoreFontScaleRef;
  fontWeight: CoreFontRef;
  lineHeight: CoreFontRef;
  letterSpacing: CoreFontRef;
  fontOpticalSizing?: CoreFontRef;
  fontVariantNumeric?: CoreFontRef;
}

/**
 * Three-step size scale within a single text family.
 * Step is the *relative* hierarchy inside the family — never an absolute size.
 * Same step across families is not interchangeable: `display.md` and `body.md`
 * share only the step name, not the role.
 */
interface TextStyleLgMdSm {
  /** Largest step of this family — strongest hierarchy *within* the family. Use for the most prominent instance of this role on the surface. */
  lg: TextStyle;
  /** Default step of this family — the unmarked choice. Use unless the surface explicitly calls for `lg` or `sm`. */
  md: TextStyle;
  /** Smallest step of this family — compact / dense usage. Use when space is constrained or when the text is secondary within the role. */
  sm: TextStyle;
}

/**
 * Two-step size scale (no `lg`) for families where a hero step is not meaningful.
 * @see TextStyleLgMdSm — for the rationale of step semantics.
 */
interface TextStyleMdSm {
  /** Default step of this family — the unmarked choice. */
  md: TextStyle;
  /** Smallest step of this family — compact / dense usage. */
  sm: TextStyle;
}

/**
 * Semantic text styles — the only typography API consumed by components.
 *
 * Family is the typographic *role* (where in the interface this text sits);
 * step (`lg`/`md`/`sm`) is the relative size *within* the role. The pair
 * `family × step` selects one composite style; never mix `display.sm` with
 * `headline.lg` to "shrink a display" — pick the family whose role matches.
 *
 * HTML semantics (`h1…h6`, `p`, `label`) and visual style are decoupled —
 * `as="h2"` carries document structure; `text.title.md` carries appearance.
 *
 * @see typography.md — Text Families table.
 */
export interface SemanticText {
  /**
   * High-impact hero text — landing surfaces and prominent page headers.
   * Use sparingly; reserved for the single most important text on a page.
   * Pair with `headline` for the next hierarchy step; do not use for section
   * headings inside content — those are `headline`.
   */
  display: TextStyleLgMdSm;
  /**
   * Section or page headings that structure scanning of the document.
   * Use for the primary headings inside content (page title, major section breaks).
   * Below `display` in hierarchy, above `title`. Do not use for surface chrome
   * (card / panel / dialog headers) — those are `title`.
   */
  headline: TextStyleLgMdSm;
  /**
   * Titles for *surfaces* — cards, panels, dialogs, sheets, menus, structured sections.
   * Use as the heading of a contained surface, not the heading of a content section.
   * Pair with `body` / `label` inside the same surface; do not use for top-level
   * page or document headings — those are `headline` / `display`.
   */
  title: TextStyleLgMdSm;
  /**
   * Default reading text — paragraphs, descriptions, long-form content.
   * Use for any text the user will *read* rather than *scan* or *select*.
   * Optimized for readability; do not use for short UI strings or labels —
   * those are `label`.
   */
  body: TextStyleLgMdSm;
  /**
   * Short UI strings — field labels, button text, badges, metadata, captions.
   * Use for compact, scan-only text that names or describes adjacent UI.
   * Do not use for prose the user must read in sequence — that is `body`.
   */
  label: TextStyleLgMdSm;
  /**
   * Monospaced text for code snippets, logs, identifiers, or technical data.
   * Use whenever the text must align by character cell or distinguish similar
   * glyphs (`Il1O0`).
   * Do not use for UI strings that merely *look* technical — that is `body` or `label`.
   */
  code: TextStyleMdSm;
}
