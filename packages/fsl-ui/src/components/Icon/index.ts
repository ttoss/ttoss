/**
 * Icon module barrel. Public since ADR-010 (`Icon`, `iconMeta`, intent
 * types re-exported from `src/index.ts`); `ensureIconGlyphs`/`iconifyName`
 * stay package-internal plumbing.
 */
export { ensureIconGlyphs, iconifyName } from './glyphs';
export type { IconProps, IconSize } from './Icon';
export { Icon, iconMeta } from './Icon';
export type { IconIntent } from './intents';
export { ICON_INTENTS } from './intents';
