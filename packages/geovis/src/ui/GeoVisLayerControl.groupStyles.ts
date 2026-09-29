import type * as React from 'react';

import { TRIGGER_SIZE } from './GeoVisLayerControl.styles';

/*
 * Styles of the layer control's categories: the card that opens a category's
 * panel, and the back button in that panel's header. Kept beside the item
 * styles (`GeoVisLayerControl.styles.ts`) and in their palette.
 */

const TEXT = '#3c4043';
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

/**
 * The chevron pinned to a category card's corner: the sign that the card
 * opens a panel of its own rather than switching anything on.
 */
export const groupChevronStyle: React.CSSProperties = {
  alignItems: 'center',
  backgroundColor: 'rgba(255,255,255,0.92)',
  borderRadius: 5,
  bottom: 4,
  boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
  color: TEXT,
  display: 'flex',
  height: 18,
  justifyContent: 'center',
  position: 'absolute',
  right: 4,
  width: 18,
};
