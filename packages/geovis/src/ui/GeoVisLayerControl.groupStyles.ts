import type * as React from 'react';

import { TRIGGER_SIZE } from './GeoVisLayerControl.styles';

/*
 * Styles of the layer control's categories: the card that opens a category's
 * panel. Kept beside the item styles (`GeoVisLayerControl.styles.ts`) and in
 * their palette.
 */

const CARD_SHADOW = '0 1px 4px rgba(0,0,0,0.3)';

/**
 * A category card's thumbnail: the item card's square, but never dimmed or
 * greyed for being "off" — a category is not a toggle, it opens a panel — and
 * faint only when every item in it is disabled.
 *
 * @param disabled - Whether every item of the category is disabled.
 * @returns Inline style for the thumbnail wrapper.
 */
export const buildGroupThumbStyle = (
  disabled: boolean
): React.CSSProperties => {
  return {
    borderRadius: 8,
    boxShadow: CARD_SHADOW,
    height: TRIGGER_SIZE,
    opacity: disabled ? 0.4 : 1,
    overflow: 'hidden',
    position: 'relative',
    width: TRIGGER_SIZE,
  };
};
