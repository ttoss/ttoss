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
 * Compact container: a column so the panel stacks clear of the trigger row,
 * with the row itself still hugging the anchored corner.
 */
const buildCompactContainerStyle = (
  alignRight: boolean
): React.CSSProperties => {
  return {
    alignItems: alignRight ? 'flex-end' : 'flex-start',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  };
};

/**
 * Per-axis distance from the anchored map edges. A number applies to both axes;
 * `{ x, y }` sets each independently, either falling back to {@link EDGE_GAP}.
 */
const resolveGaps = (
  offset?: number | { x?: number; y?: number }
): { x: number; y: number } => {
  return {
    x: (typeof offset === 'number' ? offset : offset?.x) ?? EDGE_GAP,
    y: (typeof offset === 'number' ? offset : offset?.y) ?? EDGE_GAP,
  };
};

/**
 * Absolute-positioning style for the whole control, anchored to the map corner
 * named by `position`. `offset` (when set) overrides the default edge gap — a
 * number applies to both edges; `{ x, y }` offsets each axis independently
 * (each falling back to {@link EDGE_GAP}), so callers can push the control
 * clear of a side panel horizontally without lifting it off the bottom edge.
 *
 * `compact` switches the control to the narrow-viewport layout: both horizontal
 * edges are pinned so the container spans the map, and it stacks as a column so
 * the panel opens away from the anchored edge — above the trigger row for
 * bottom corners, below it for top ones — instead of expanding sideways into a
 * width the viewport cannot hold. The trigger row keeps hugging the anchored
 * corner via `alignItems`, so only the panel takes the full width.
 */
export const buildOuterStyle = ({
  position,
  offset,
  compact = false,
}: {
  position: LegendPosition;
  offset?: number | { x?: number; y?: number };
  compact?: boolean;
}): React.CSSProperties => {
  const isTop = position.startsWith('top');
  const isRight = position.endsWith('right');
  const { x: xGap, y: yGap } = resolveGaps(offset);
  return {
    ...resolvePositionStyle(position),
    ...(compact
      ? buildCompactContainerStyle(isRight)
      : buildContainerStyle(isTop)),
    // Sit just above the map but below app chrome (e.g. workspace
    // sidebars/drawers), so an opening panel covers the control instead of the
    // control floating over it. Same shared overlay z-index as the legend and
    // hover tooltip (resolvePositionStyle), restated here for clarity.
    zIndex: OVERLAY_Z_INDEX,
    // Push the trigger off the anchored edges (x → left/right, y → top/bottom).
    [isTop ? 'top' : 'bottom']: yGap,
    [isRight ? 'right' : 'left']: xGap,
    // Compact pins the opposite horizontal edge too — that is what lets the
    // panel span the map instead of sizing to its own content.
    ...(compact ? { [isRight ? 'left' : 'right']: xGap } : {}),
    // Animate a changed anchor distance so a shifting `offset` (e.g. a
    // workspace pushing the control clear of an opening side panel) slides the
    // control across instead of teleporting it. Matches the sidebar's own
    // `0.25s ease-in-out` slide, so the two move together. Only fires on
    // change, so the initial mount is not animated.
    transition:
      'top 0.25s ease-in-out, bottom 0.25s ease-in-out, left 0.25s ease-in-out, right 0.25s ease-in-out',
  };
};

// Item-card / thumbnail size in the expanded panel (unchanged — the panel
// "options" keep their Google-Maps-style square previews).
export const TRIGGER_SIZE = 64;

// Compact square trigger — a floating icon-only button (no label strip),
// matching the geovis-workspace prototype's layers button: rounded, white, a
// soft drop shadow, and a count badge in the corner.
export const TRIGGER_BUTTON_SIZE = 52;

export const buildTriggerStyle = (expanded: boolean): React.CSSProperties => {
  return {
    alignItems: 'center',
    backgroundColor: expanded ? HOVER_BG : '#ffffff',
    border: `1px solid ${expanded ? 'rgba(0,0,0,0.18)' : 'rgba(0,0,0,0.08)'}`,
    borderRadius: 14,
    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
    color: TEXT,
    cursor: 'pointer',
    display: 'flex',
    height: TRIGGER_BUTTON_SIZE,
    justifyContent: 'center',
    padding: 0,
    position: 'relative',
    width: TRIGGER_BUTTON_SIZE,
  };
};

/**
 * Trigger for the compact legend button that stands in for the floating legend
 * cards below the compact breakpoint. Matches the layer-control trigger's
 * footprint so the two sit as a pair, and adopts the same {@link ACCENT} the
 * panel already uses to mark an active item when the legend is showing.
 *
 * @param selected - Whether the legend panel is currently open.
 * @returns Inline style for the legend trigger button.
 */
export const buildLegendTriggerStyle = (
  selected: boolean
): React.CSSProperties => {
  return {
    ...buildTriggerStyle(false),
    backgroundColor: selected ? ACCENT : '#ffffff',
    border: `1px solid ${selected ? ACCENT : 'rgba(0,0,0,0.08)'}`,
    color: selected ? '#ffffff' : TEXT,
  };
};

/**
 * Panel holding the stacked legend cards below the compact breakpoint. Pins
 * **both** horizontal edges — the same gap the control bar uses — so the legend
 * spans the map from side to side instead of sitting as a narrow card, and
 * clears the trigger row by the trigger's own height plus the bar's gap.
 *
 * Anchored to the map, not to the trigger: nested inside the button it could
 * never be wider than the button itself.
 *
 * @param position - Corner the compact bar is anchored to.
 * @param offset - The control's edge gap, so the panel lines up with the bar.
 * @returns Inline style for the legend panel.
 */
export const buildLegendPanelStyle = ({
  position,
  offset,
}: {
  position: LegendPosition;
  offset?: number | { x?: number; y?: number };
}): React.CSSProperties => {
  const isTop = position.startsWith('top');
  const { x: xGap, y: yGap } = resolveGaps(offset);
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    // Both edges pinned — this is what makes the legend span the map.
    left: xGap,
    right: xGap,
    // Opens away from the anchored edge, clearing the trigger row.
    [isTop ? 'top' : 'bottom']: yGap + TRIGGER_BUTTON_SIZE + 8,
    maxHeight: '60vh',
    overflowY: 'auto',
    position: 'absolute',
    zIndex: OVERLAY_Z_INDEX,
  };
};

// Count of active items, pinned to the trigger's top-right corner.
export const triggerBadgeStyle: React.CSSProperties = {
  alignItems: 'center',
  backgroundColor: TEXT_MUTED,
  border: '1px solid #ffffff',
  borderRadius: 999,
  color: '#ffffff',
  display: 'flex',
  fontFamily: FONT,
  fontSize: 9,
  fontWeight: 600,
  height: 16,
  justifyContent: 'center',
  minWidth: 16,
  padding: '0 4px',
  position: 'absolute',
  right: -5,
  top: -5,
};

// The expanded panel is a horizontal strip of item "cards", each mirroring the
// square trigger: a map thumbnail with its label beneath it. This echoes Google
// Maps' layer picker, where every option is itself a little map preview.
/** Row of triggers inside the compact column — the layers button plus whatever
 * `trailing` control rides along with it (the legend button). Sizes to its
 * content, so the column's `alignItems` keeps it pinned to the anchored corner. */
export const compactBarStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
  gap: 8,
};

/**
 * The expanded panel's card. Roomy layouts keep the single sideways row of
 * square item cards.
 *
 * `compact` is the narrow-viewport form. The card is left to size itself to its
 * item cards — a couple of options make a card only as wide as they are — and
 * `flexWrap` is what handles the rest: once the options stop fitting, the card
 * has grown to the container's pinned edges and they wrap onto further lines.
 * No `alignSelf: stretch`, deliberately: that would widen the card to the map
 * even when two options sit in it. Height is capped the way the compact legend
 * panel caps its own (`60vh` + vertical scroll), so a long item list never
 * pushes the trigger row off the map.
 *
 * @param compact - Whether to build the narrow-viewport form. Defaults to `false`.
 * @returns Inline style for the panel card.
 *
 * @example
 * ```ts
 * buildPanelStyle({ compact: true }).flexWrap; // 'wrap'
 * buildPanelStyle({}).flexWrap; // undefined — roomy layout keeps one row
 * ```
 */
export const buildPanelStyle = ({
  compact = false,
}: {
  compact?: boolean;
}): React.CSSProperties => {
  return {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    boxShadow: CARD_SHADOW,
    color: TEXT,
    display: 'flex',
    flexDirection: 'row',
    fontFamily: FONT,
    gap: 4,
    padding: 12,
    ...(compact
      ? {
          flexWrap: 'wrap',
          maxHeight: '60vh',
          overflowY: 'auto',
        }
      : {}),
  };
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
