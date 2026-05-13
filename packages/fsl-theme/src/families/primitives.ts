/* ==========================================================================
 * Token primitives — shared across every family.
 *
 * - Raw value types (`RawValue`, `NumericValue`)
 * - Token reference types (`TokenRef` + per-namespace aliases)
 * - Generic helpers (`DeepPartial`)
 *
 * All families import from this file. This file imports from no other family.
 * ========================================================================== */

/** A raw CSS value (color hex, px, clamp expression, etc.) */
export type RawValue = string;

/** A numeric raw value (font weight, opacity, line-height, z-index, etc.) */
export type NumericValue = number;

/**
 * A reference to a core token, expressed as `{token.path}`.
 *
 * Optionally narrowed to a path prefix family for autocomplete and typo
 * catching at high-leverage positions. Defaults to `string` — fully open —
 * which preserves the original (untyped-path) behavior for any external code
 * importing `TokenRef` directly.
 *
 * Narrowed aliases cover every semantic family. The only remaining open
 * `TokenRef` is `SemanticFocus.ring.color`, which intentionally references a
 * `semantic.*` path rather than a `core.*` one.
 *
 * @example
 * ```ts
 * // open — accepts any '{...}' string
 * const ref: TokenRef = '{core.colors.brand.500}';
 *
 * // narrowed — '{core.spacing.|' autocompletes; '{core.colorz.…}' errors
 * const gap: TokenRef<`core.spacing.${string}`> = '{core.spacing.4}';
 * ```
 */
export type TokenRef<TPath extends string = string> = `{${TPath}}`;

/** Reference into the `core.colors.*` namespace. */
export type CoreColorRef = TokenRef<`core.colors.${string}`>;
/** Reference into the `core.spacing.*` namespace. */
export type CoreSpacingRef = TokenRef<`core.spacing.${string}`>;
/** Reference into the `core.sizing.*` namespace. */
export type CoreSizingRef = TokenRef<`core.sizing.${string}`>;
/** Reference into the `core.font.scale.*` namespace (responsive size ramp). */
export type CoreFontScaleRef = TokenRef<`core.font.scale.${string}`>;
/** Reference into the `core.font.*` namespace (family, weight, leading, tracking, optical, numeric). */
export type CoreFontRef = TokenRef<`core.font.${string}`>;
/** Reference into the `core.elevation.*` namespace. */
export type CoreElevationRef = TokenRef<`core.elevation.${string}`>;
/** Reference into the `core.radii.*` namespace. */
export type CoreRadiiRef = TokenRef<`core.radii.${string}`>;
/** Reference into the `core.border.*` namespace (width and style sub-families). */
export type CoreBorderRef = TokenRef<`core.border.${string}`>;
/** Reference into the `core.opacity.*` namespace. */
export type CoreOpacityRef = TokenRef<`core.opacity.${string}`>;
/** Reference into the `core.motion.*` namespace (duration and easing sub-families). */
export type CoreMotionRef = TokenRef<`core.motion.${string}`>;
/** Reference into the `core.zIndex.*` namespace. */
export type CoreZIndexRef = TokenRef<`core.zIndex.${string}`>;

/**
 * Recursive partial type. Every nested property becomes optional,
 * enabling selective overrides at any depth.
 */
export type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;
