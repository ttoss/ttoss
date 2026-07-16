/**
 * Internal Icon module barrel. NOT re-exported from the package root
 * (`src/index.ts`) — the Icon is an internal primitive consumed by other
 * components while `@ttoss/fsl-icon` is not yet a standalone package
 * (ROADMAP B1 / ADR-005).
 */
export { ensureIconGlyphs, iconifyName } from './glyphs';
export type { IconProps, IconSize } from './Icon';
export { Icon, iconMeta } from './Icon';
export type { IconIntent } from './intents';
export { ICON_INTENTS } from './intents';
