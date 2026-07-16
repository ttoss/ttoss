/**
 * Default glyph mapping — intent → Lucide (via Iconify).
 *
 * This is the "theme glyph mapping" from icon-system.md, housed internally
 * while `@ttoss/fsl-icon` is not yet its own package. Glyphs come from the
 * official provider (**Iconify**, ADR-005), sourced per-icon from
 * `@iconify/icons-lucide/*` so bundlers keep only the icons actually
 * referenced (tree-shakeable, mirroring `@ttoss/theme`'s `BruttalIcons`).
 * No SVG is hand-authored here; no icon is fetched from the Iconify API at
 * runtime — every glyph is registered offline via `addIcon`, so rendering is
 * SSR-safe and network-free.
 *
 * @see ./intents.ts — the intents these glyphs satisfy
 * @see ../../../CONTRIBUTING.md ADR-005
 */
import checkGlyph from '@iconify/icons-lucide/check';
import chevronDownGlyph from '@iconify/icons-lucide/chevron-down';
import chevronRightGlyph from '@iconify/icons-lucide/chevron-right';
import minusGlyph from '@iconify/icons-lucide/minus';
import plusGlyph from '@iconify/icons-lucide/plus';
import searchGlyph from '@iconify/icons-lucide/search';
import xGlyph from '@iconify/icons-lucide/x';
import { addIcon } from '@iconify-icon/react';

import type { IconIntent } from './intents';

/** Iconify data shape (`{ body, width, height }`) as published per-icon. */
type GlyphData = { body: string; width?: number; height?: number };

/**
 * The default (Lucide) glyph for every intent. `satisfies Record<…>` makes a
 * missing intent a compile error — the completeness rule from icon-system.md.
 */
const INTENT_GLYPHS = {
  'disclosure.expand': chevronDownGlyph,
  'disclosure.collapse': chevronRightGlyph,
  'selection.checked': checkGlyph,
  'selection.indeterminate': minusGlyph,
  'action.close': xGlyph,
  'action.search': searchGlyph,
  'action.increment': plusGlyph,
  'action.decrement': minusGlyph,
} as const satisfies Record<IconIntent, GlyphData>;

/**
 * The Iconify registry name for an intent — `fsl-ui:{family}-{intent}`. The
 * `fsl-ui` prefix namespaces our glyphs so `addIcon` never clobbers (or is
 * clobbered by) icons an application registers under bare names.
 */
export const iconifyName = (intent: IconIntent): string => {
  return `fsl-ui:${intent.replace('.', '-')}`;
};

let registered = false;

/**
 * Registers every intent's glyph with Iconify exactly once (idempotent).
 * Mirrors the `ensureKeyframes()` pattern: called from the component render
 * path rather than at module top-level, so `sideEffects: false` bundlers do
 * not drop the registration as dead code.
 */
export const ensureIconGlyphs = (): void => {
  if (registered) return;
  for (const [intent, glyph] of Object.entries(INTENT_GLYPHS)) {
    addIcon(iconifyName(intent as IconIntent), glyph);
  }
  registered = true;
};
