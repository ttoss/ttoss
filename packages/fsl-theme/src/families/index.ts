/* ==========================================================================
 * Families barrel — re-exports every family's public types.
 *
 * Families are organized 1:1 with the design tokens documentation under
 * `docs/website/docs/design/01-design-system/02-design-tokens/02-families/`.
 *
 * Each family file owns its Core* and Semantic* interfaces. Cross-family
 * dependencies flow only through `primitives.ts` (the only leaf module),
 * with the single exception of `focus.ts` composing `SemanticBorderOutline`
 * from `borders.ts`.
 * ========================================================================== */

export * from './borders';
export * from './breakpoints';
export * from './colors';
export * from './elevation';
export * from './focus';
export * from './motion';
export * from './opacity';
export * from './overlay';
export * from './primitives';
export * from './radii';
export * from './sizing';
export * from './spacing';
export * from './typography';
export * from './z-index';
