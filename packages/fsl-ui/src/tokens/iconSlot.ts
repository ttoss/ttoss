import type * as React from 'react';

/**
 * Style for the element that *hosts* an `Icon` inside a component — the
 * `icon` / `indicator` / `*Adornment` part every glyph-bearing composite
 * wraps its glyph in.
 *
 * ## Why this exists
 *
 * `iconify-icon` renders as an inline-level box, so in a normal (non-flex)
 * wrapper it participates in **baseline** alignment: the glyph's bottom edge
 * sits on the wrapper's text baseline and the descender space of the
 * wrapper's inherited font falls *below* it. The wrapper therefore ends up
 * taller than the glyph and the glyph reads visibly high — measured at −2px
 * against the adjacent label in `Button`/`Select`/`Disclosure` and −1px in
 * `Checkbox`, while every wrapper that already happened to be a flex
 * container measured a perfect 0.
 *
 * Making the host a flex container removes its line box entirely, so the
 * glyph is centred as a box instead of aligned as text. That is the fix — and
 * because it is a shared constant rather than four hand-copied declarations,
 * the next glyph-bearing component cannot reintroduce the drift.
 *
 * Do **not** set `display` on the `Icon` itself: the public `Icon` is
 * legitimately usable inline within a text run (feature lists, inline hints),
 * and blockifying it would break that flow. The host owns the layout; the
 * glyph stays layout-agnostic.
 *
 * @example
 * ```tsx
 * <span data-scope="button" data-part="icon" aria-hidden style={ICON_SLOT_STYLE}>
 *   <Icon intent="action.search" size="sm" />
 * </span>
 * ```
 */
export const ICON_SLOT_STYLE = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
} as const satisfies React.CSSProperties;
