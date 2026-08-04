import type * as React from 'react';

import type { LegendPosition } from '../spec/types';
import { resolvePositionStyle } from './GeoVisLegend.utils';

// Google-Maps-like palette. Kept as local constants (not theme tokens) on
// purpose: this overlay deliberately mimics Google Maps' "Layers" control, a
// recognisable look with its own fixed colours, matching the inline-styled
// convention already used across the geovis `ui/` overlays (see GeoVisLegend).
const FONT = "'Roboto', 'Helvetica Neue', Arial, sans-serif";
const TEXT = '#3c4043';
const TEXT_MUTED = '#5f6368';
const ACCENT = '#1a73e8';
const HOVER_BG = '#f1f3f4';
const CARD_SHADOW = '0 1px 4px rgba(0,0,0,0.3)';
// Just above the map canvas, but below app chrome such as geovis-workspace
// sidebars (z-index 2) so those overlays cover the control when they open.
const OVERLAY_Z_INDEX = 1;
// Distance from the anchored map edges. Larger than resolvePositionStyle's
// default so the square trigger clears the map corner (and MapLibre's
// attribution) with a comfortable margin.
const EDGE_GAP = 40;

const buildContainerStyle = (alignTop: boolean): React.CSSProperties => {
  return {
    alignItems: alignTop ? 'flex-start' : 'flex-end',
    display: 'flex',
    flexDirection: 'row',
    gap: 8,
  };
};

/**
 * Absolute-positioning style for the whole control, anchored to the map corner
 * named by `position`. `offset` (when set) overrides the default edge gap — a
 * number applies to both edges; `{ x, y }` offsets each axis independently
 * (each falling back to {@link EDGE_GAP}), so callers can push the control
 * clear of a side panel horizontally without lifting it off the bottom edge.
 */
export const buildOuterStyle = ({
  position,
  offset,
}: {
  position: LegendPosition;
  offset?: number | { x?: number; y?: number };
}): React.CSSProperties => {
  const isTop = position.startsWith('top');
  const isRight = position.endsWith('right');
  const xGap = (typeof offset === 'number' ? offset : offset?.x) ?? EDGE_GAP;
  const yGap = (typeof offset === 'number' ? offset : offset?.y) ?? EDGE_GAP;
  return {
    ...resolvePositionStyle(position),
    ...buildContainerStyle(isTop),
    // Sit just above the map but below app chrome (e.g. workspace
    // sidebars/drawers), so an opening panel covers the control instead of the
    // control floating over it. Same shared overlay z-index as the legend and
    // hover tooltip (resolvePositionStyle), restated here for clarity.
    zIndex: OVERLAY_Z_INDEX,
    // Push the trigger off the anchored edges (x → left/right, y → top/bottom).
    [isTop ? 'top' : 'bottom']: yGap,
    [isRight ? 'right' : 'left']: xGap,
    // Animate a changed anchor distance so a shifting `offset` (e.g. a
    // workspace pushing the control clear of an opening side panel) slides the
    // control across instead of teleporting it. Matches the sidebar's own
    // `0.25s ease-in-out` slide, so the two move together. Only fires on
    // change, so the initial mount is not animated.
    transition:
      'top 0.25s ease-in-out, bottom 0.25s ease-in-out, left 0.25s ease-in-out, right 0.25s ease-in-out',
  };
};

// Square trigger — modelled on Google Maps' "Layers" button, but showing a
// layers icon (stacked sheets) centred above a label strip along the bottom
// rather than a map preview. Larger and bolder than a text pill so it stands
// out against the map.
export const TRIGGER_SIZE = 64;

export const buildTriggerStyle = (expanded: boolean): React.CSSProperties => {
  return {
    backgroundColor: '#ffffff',
    border: 'none',
    borderRadius: 8,
    boxShadow: expanded ? `0 0 0 2px ${ACCENT}, ${CARD_SHADOW}` : CARD_SHADOW,
    cursor: 'pointer',
    display: 'block',
    height: TRIGGER_SIZE,
    overflow: 'hidden',
    padding: 0,
    position: 'relative',
    width: TRIGGER_SIZE,
  };
};

export const triggerLabelStyle: React.CSSProperties = {
  backgroundColor: 'rgba(255,255,255,0.92)',
  bottom: 0,
  color: TEXT,
  fontFamily: FONT,
  fontSize: 11,
  fontWeight: 600,
  left: 0,
  lineHeight: '15px',
  overflow: 'hidden',
  padding: '1px 3px',
  position: 'absolute',
  right: 0,
  textAlign: 'center',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

// Centres the layers icon in the square trigger, reserving room at the bottom
// for the absolutely-positioned label strip so the icon doesn't sit under it.
export const triggerIconWrapStyle: React.CSSProperties = {
  alignItems: 'center',
  color: ACCENT,
  display: 'flex',
  height: '100%',
  justifyContent: 'center',
  paddingBottom: 6,
  width: '100%',
};

// The expanded panel is a horizontal strip of item "cards", each mirroring the
// square trigger: a map thumbnail with its label beneath it. This echoes Google
// Maps' layer picker, where every option is itself a little map preview.
export const panelStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: 8,
  boxShadow: CARD_SHADOW,
  color: TEXT,
  display: 'flex',
  flexDirection: 'row',
  fontFamily: FONT,
  gap: 4,
  padding: 12,
};

// Each item card matches the trigger thumbnail's footprint, with a little extra
// width so the label can wrap to a second line without widening the strip.
const ITEM_THUMB_SIZE = TRIGGER_SIZE;
const ITEM_WIDTH = ITEM_THUMB_SIZE + 20;

export const buildItemStyle = ({
  disabled,
  hovered,
}: {
  disabled: boolean;
  hovered: boolean;
}): React.CSSProperties => {
  return {
    alignItems: 'center',
    backgroundColor: hovered && !disabled ? HOVER_BG : 'transparent',
    border: 'none',
    borderRadius: 8,
    cursor: disabled ? 'default' : 'pointer',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: FONT,
    gap: 6,
    padding: '6px 4px',
    width: ITEM_WIDTH,
  };
};

// The thumbnail wrapper carries the on/off affordance: an accent ring plus a
// check badge when active; dimmed and desaturated when inactive; greyed and
// faint when disabled (none of the item's layers exist in the current spec).
export const buildItemThumbStyle = ({
  active,
  disabled,
}: {
  active: boolean;
  disabled: boolean;
}): React.CSSProperties => {
  return {
    borderRadius: 8,
    boxShadow:
      active && !disabled ? `0 0 0 2px ${ACCENT}, ${CARD_SHADOW}` : CARD_SHADOW,
    filter: !disabled && !active ? 'grayscale(1)' : 'none',
    height: ITEM_THUMB_SIZE,
    opacity: disabled ? 0.4 : active ? 1 : 0.55,
    overflow: 'hidden',
    position: 'relative',
    width: ITEM_THUMB_SIZE,
  };
};

export const buildItemLabelStyle = ({
  active,
  disabled,
}: {
  active: boolean;
  disabled: boolean;
}): React.CSSProperties => {
  return {
    color: disabled ? '#9aa0a6' : active ? TEXT : TEXT_MUTED,
    fontFamily: FONT,
    fontSize: 11,
    fontWeight: active && !disabled ? 600 : 500,
    lineHeight: '14px',
    maxHeight: 28,
    overflow: 'hidden',
    textAlign: 'center',
    width: '100%',
  };
};

// Circular accent badge with a white check, pinned to the thumbnail's corner to
// signal the item is currently shown.
export const activeBadgeStyle: React.CSSProperties = {
  alignItems: 'center',
  backgroundColor: ACCENT,
  borderRadius: '50%',
  boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
  display: 'flex',
  height: 18,
  justifyContent: 'center',
  position: 'absolute',
  right: 4,
  top: 4,
  width: 18,
};
