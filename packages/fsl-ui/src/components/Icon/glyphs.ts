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
import arrowDownWideNarrowGlyph from '@iconify/icons-lucide/arrow-down-wide-narrow';
import arrowUpNarrowWideGlyph from '@iconify/icons-lucide/arrow-up-narrow-wide';
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
 * The per-icon lucide modules are CommonJS (`exports.default = data` with
 * `__esModule`). Bundlers disagree on default-import interop: Babel/Jest
 * respect `__esModule` (import = the data), while Node-mode interop
 * (Vite/Rolldown, Node ESM) makes the import the whole `module.exports` —
 * `{ __esModule, default: data }`. Normalize both shapes; without this,
 * `addIcon` receives an invalid payload and rejects it *silently*, every
 * icon falls back to an Iconify API fetch, and no glyph renders in
 * production builds (friction F-012).
 */
const unwrapGlyph = (mod: GlyphData | { default: GlyphData }): GlyphData => {
  return 'body' in mod ? mod : mod.default;
};

/**
 * The default (Lucide) glyph for every intent. `satisfies Record<…>` makes a
 * missing intent a compile error — the completeness rule from icon-system.md.
 */
const INTENT_GLYPHS = {
  'disclosure.expand': unwrapGlyph(chevronDownGlyph),
  'disclosure.collapse': unwrapGlyph(chevronRightGlyph),
  'selection.checked': unwrapGlyph(checkGlyph),
  'selection.indeterminate': unwrapGlyph(minusGlyph),
  'action.close': unwrapGlyph(xGlyph),
  'action.search': unwrapGlyph(searchGlyph),
  'action.increment': unwrapGlyph(plusGlyph),
  'action.decrement': unwrapGlyph(minusGlyph),
  'action.sortAscending': unwrapGlyph(arrowUpNarrowWideGlyph),
  'action.sortDescending': unwrapGlyph(arrowDownWideNarrowGlyph),
} satisfies Record<IconIntent, GlyphData>;

/**
 * The Iconify registry name for an intent — `fsl-ui:{family}-{intent}`. The
 * `fsl-ui` prefix namespaces our glyphs so `addIcon` never clobbers (or is
 * clobbered by) icons an application registers under bare names.
 */
export const iconifyName = (intent: IconIntent): string => {
  // Iconify only accepts lowercase [a-z0-9-] names and `addIcon` rejects
  // anything else *silently* (the element renders 0×0 with no SVG). Intents
  // are camelCase (`action.sortAscending`), so kebab-case the humps.
  const kebab = intent.replace('.', '-').replace(/[A-Z]/g, (letter) => {
    return `-${letter.toLowerCase()}`;
  });
  return `fsl-ui:${kebab}`;
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
    const name = iconifyName(intent as IconIntent);
    // `addIcon` returns false on invalid names/data instead of throwing —
    // the silent path behind F-012 (no icon ever rendered in production
    // builds). Registration failure is a hard bug: fail loudly.
    if (!addIcon(name, glyph)) {
      throw new Error(
        `fsl-ui Icon: failed to register glyph "${name}" for intent "${intent}" — invalid Iconify name or data.`
      );
    }
  }
  registered = true;
};
