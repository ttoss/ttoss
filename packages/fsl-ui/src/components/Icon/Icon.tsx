import { Icon as IconifyIcon } from '@iconify-icon/react';
import { vars } from '@ttoss/fsl-theme/vars';
import type * as React from 'react';

import type { ComponentMeta } from '../../semantics';
import { ensureIconGlyphs, iconifyName } from './glyphs';
import type { IconIntent } from './intents';

// ---------------------------------------------------------------------------
// Semantic identity — Layer 1
//
// Entity = Structure → CONTRACT.md §1 row. Icon is a static, non-interactive
// glyph that reinforces meaning; it reads no color tokens (it inherits
// `currentColor` from its context per icon-system.md § Token Consumption) and
// only its size comes from a token (`vars.sizing.icon.*`). `structure: 'icon'`
// is legal for Structure in ENTITY_STRUCTURE.
//
// INTERNAL (ROADMAP B1): this component is deliberately NOT exported from
// `src/index.ts`. It is consumed only by other components in this package.
// Public promotion is the future `@ttoss/fsl-icon` package (ADR-005).
// ---------------------------------------------------------------------------

/** Formal semantic identity — Icon (Structure entity, static glyph). */
export const iconMeta = {
  displayName: 'Icon',
  entity: 'Structure',
  structure: 'icon',
} as const satisfies ComponentMeta<'Structure'>;

/**
 * Icon size step. Maps directly to `vars.sizing.icon.*` — the sizing scale
 * icon-system.md defines as the Icon contract. This is not the density
 * `size` prop CONTRACT.md §4 bans (that rule governs interactive hit
 * targets): a glyph legitimately scales with the context it reinforces.
 */
export type IconSize = 'sm' | 'md' | 'lg';

/** Props for the internal Icon component. */
export interface IconProps {
  /**
   * Semantic intent — what the icon *means* (`icon.{family}.{intent}`), not
   * which glyph renders. The theme maps it to a glyph (default: Lucide).
   */
  intent: IconIntent;
  /**
   * Size step, mapped to `vars.sizing.icon.{size}`. Defaults to `md`.
   */
  size?: IconSize;
  /**
   * Accessible label. When omitted the icon is decorative (`aria-hidden`) —
   * the default, since icons here reinforce a labelled host control. Supply
   * a (caller-localized) label only when the icon is the sole carrier of
   * meaning.
   */
  label?: string;
}

/**
 * Renders a semantic glyph via the Iconify provider (ADR-005).
 *
 * Icon is named by intent and inherits its color from context
 * (`currentColor`); only its size is a token. Glyphs are registered offline
 * on first render (`ensureIconGlyphs`), so no network request is made.
 *
 * @example
 * ```tsx
 * <Icon intent="disclosure.expand" />
 * <Icon intent="action.close" size="sm" label={closeLabel} />
 * ```
 */
export const Icon = ({ intent, size = 'md', label }: IconProps) => {
  ensureIconGlyphs();

  const decorative = label === undefined;

  return (
    <IconifyIcon
      data-scope="icon"
      data-part="icon"
      icon={iconifyName(intent)}
      noobserver
      // String, not boolean: on a custom element React renders `true` as an
      // empty attribute (`aria-hidden=""`), which does NOT hide from AT — the
      // value must literally be "true".
      aria-hidden={decorative ? 'true' : undefined}
      aria-label={label}
      role={decorative ? undefined : 'img'}
      style={
        {
          // iconify-icon scales with font-size (renders at 1em); color is
          // inherited via currentColor — no color token is read here.
          fontSize: vars.sizing.icon[size],
          lineHeight: 1,
          flexShrink: 0,
        } as React.CSSProperties
      }
    />
  );
};
Icon.displayName = iconMeta.displayName;
