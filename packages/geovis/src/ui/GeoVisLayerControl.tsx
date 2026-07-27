import * as React from 'react';

import type { LayerControlItem, LegendPosition } from '../spec/types';
import { useGeoVis } from './contexts';
import { resolvePositionStyle } from './GeoVisLegend.utils';

/**
 * Whether an item should be visible, given the user's remembered choices.
 * A choice recorded in `activeById` (by `item.id`) always wins; otherwise the
 * item's `defaultActive` (default `true`) applies. Keeping the decision keyed
 * by `item.id` — not by layer id — is what makes the toggled state persist
 * across spec rebuilds where the underlying layer ids differ (PRD map modes).
 */
const resolveItemActive = (
  item: LayerControlItem,
  activeById: Record<string, boolean>
): boolean => {
  return activeById[item.id] ?? item.defaultActive ?? true;
};

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
 * named by `position`. `offset` (when set) overrides the default edge gap.
 */
const buildOuterStyle = ({
  position,
  offset,
}: {
  position: LegendPosition;
  offset?: number;
}): React.CSSProperties => {
  const isTop = position.startsWith('top');
  const isRight = position.endsWith('right');
  const gap = offset ?? EDGE_GAP;
  return {
    ...resolvePositionStyle(position),
    ...buildContainerStyle(isTop),
    // Sit just above the map but below app chrome (e.g. workspace
    // sidebars/drawers), so an opening panel covers the control instead of the
    // control floating over it. Overrides resolvePositionStyle's higher default.
    zIndex: OVERLAY_Z_INDEX,
    // Push the trigger off the anchored edges.
    [isTop ? 'top' : 'bottom']: gap,
    [isRight ? 'right' : 'left']: gap,
  };
};

// Square, map-thumbnail trigger — modelled on Google Maps' "Layers" button: a
// small map preview with the label on a strip along the bottom. Larger and
// bolder than a text pill so it stands out against the map.
const TRIGGER_SIZE = 64;

const buildTriggerStyle = (expanded: boolean): React.CSSProperties => {
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

const triggerLabelStyle: React.CSSProperties = {
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

// The expanded panel is a horizontal strip of item "cards", each mirroring the
// square trigger: a map thumbnail with its label beneath it. This echoes Google
// Maps' layer picker, where every option is itself a little map preview.
const panelStyle: React.CSSProperties = {
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

const buildItemStyle = ({
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
const buildItemThumbStyle = ({
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

const buildItemLabelStyle = ({
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
const activeBadgeStyle: React.CSSProperties = {
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

/**
 * Stylised map preview that fills the square trigger — land, water, a park and
 * a few roads — evoking Google Maps' layers-button thumbnail without needing a
 * real map raster.
 */
const MapThumbnail = () => {
  return (
    <svg
      width={TRIGGER_SIZE}
      height={TRIGGER_SIZE}
      viewBox="0 0 64 64"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
      style={{ display: 'block' }}
    >
      <rect width="64" height="64" fill="#eaeee3" />
      <path d="M0 40 L24 33 L44 43 L64 36 L64 64 L0 64 Z" fill="#a9d3f0" />
      <path d="M42 0 L64 0 L64 18 L47 22 Z" fill="#cfe8c9" />
      <rect x="6" y="7" width="13" height="9" rx="1" fill="#dfe4d6" />
      <rect x="46" y="30" width="12" height="9" rx="1" fill="#dfe4d6" />
      <path d="M-2 20 L66 30" stroke="#ffffff" strokeWidth="4" fill="none" />
      <path d="M24 -2 L31 66" stroke="#ffffff" strokeWidth="3" fill="none" />
      <path d="M-2 12 L66 6" stroke="#fbd66b" strokeWidth="3" fill="none" />
    </svg>
  );
};

/** White checkmark shown inside an active checkbox. */
const CheckIcon = () => {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="#ffffff" aria-hidden>
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
    </svg>
  );
};

/**
 * Floating panel of layer-visibility toggles, driven entirely by `spec.control`
 * and auto-mounted by `<GeoVisProvider>` — consumers never place it manually.
 *
 * It renders a collapsed trigger button anchored to a map corner; expanding it
 * (on hover or click, per `control.trigger`) reveals one button per
 * `control.items` entry. Clicking an item flips the visibility of its
 * referenced layers via `dispatch({ type: 'toggle-layer' })`.
 *
 * Each item has three visual states: **active** (its layers are shown),
 * **inactive** (its layers are hidden), and **disabled** (none of its layers
 * exist in the current spec — the button is greyed and non-interactive). The
 * on/off choice is remembered by `item.id` and re-applied whenever the spec
 * changes, so hiding a layer persists across spec rebuilds (e.g. map-mode
 * switches) as long as the `control` remains present.
 *
 * Renders `null` when `spec.control` is absent.
 */
type SetExpanded = React.Dispatch<React.SetStateAction<boolean>>;

/**
 * Hover/focus handlers that expand the panel, active only for the `hover`
 * trigger. Returns an empty object for the `click` trigger so the panel opens
 * solely from the trigger button's `onClick`.
 */
const buildHoverHandlers = ({
  trigger,
  setExpanded,
}: {
  trigger: string;
  setExpanded: SetExpanded;
}): React.HTMLAttributes<HTMLDivElement> => {
  if (trigger !== 'hover') return {};
  return {
    onMouseEnter: () => {
      return setExpanded(true);
    },
    onMouseLeave: () => {
      return setExpanded(false);
    },
    onFocus: () => {
      return setExpanded(true);
    },
    onBlur: (event) => {
      // Collapse only when focus leaves the whole panel, not when it moves
      // between the trigger and the item buttons inside it.
      if (!event.currentTarget.contains(event.relatedTarget)) {
        setExpanded(false);
      }
    },
  };
};

/**
 * A single toggle button inside the expanded panel. Split out to keep the
 * per-item active/disabled derivation and its nested handlers off the main
 * component's cyclomatic complexity.
 */
const LayerControlItemButton = ({
  item,
  active,
  disabled,
  hovered,
  onToggle,
  onHoverChange,
}: {
  item: LayerControlItem;
  active: boolean;
  disabled: boolean;
  hovered: boolean;
  onToggle: (item: LayerControlItem) => void;
  onHoverChange: React.Dispatch<React.SetStateAction<string | null>>;
}) => {
  return (
    <button
      key={item.id}
      type="button"
      data-item-id={item.id}
      aria-pressed={active}
      disabled={disabled}
      style={buildItemStyle({ disabled, hovered })}
      onClick={() => {
        return onToggle(item);
      }}
      onMouseEnter={() => {
        return onHoverChange(item.id);
      }}
      onMouseLeave={() => {
        return onHoverChange((prev) => {
          return prev === item.id ? null : prev;
        });
      }}
    >
      <span
        style={buildItemThumbStyle({ active: active && !disabled, disabled })}
      >
        <MapThumbnail />
        {active && !disabled ? (
          <span style={activeBadgeStyle}>
            <CheckIcon />
          </span>
        ) : null}
      </span>
      <span
        style={buildItemLabelStyle({ active: active && !disabled, disabled })}
      >
        {item.label}
      </span>
    </button>
  );
};

/** The expanded panel listing every toggleable `control.items` entry. */
const LayerControlPanel = ({
  label,
  items,
  activeById,
  layerIds,
  hoveredId,
  onToggle,
  onHoverChange,
}: {
  label: string;
  items: LayerControlItem[];
  activeById: Record<string, boolean>;
  layerIds: Set<string>;
  hoveredId: string | null;
  onToggle: (item: LayerControlItem) => void;
  onHoverChange: React.Dispatch<React.SetStateAction<string | null>>;
}) => {
  return (
    <div key="panel" role="group" aria-label={label} style={panelStyle}>
      {items.map((item) => {
        const disabled = !item.layers.some((id) => {
          return layerIds.has(id);
        });
        return (
          <LayerControlItemButton
            key={item.id}
            item={item}
            active={resolveItemActive(item, activeById)}
            disabled={disabled}
            hovered={hoveredId === item.id}
            onToggle={onToggle}
            onHoverChange={onHoverChange}
          />
        );
      })}
    </div>
  );
};

export const GeoVisLayerControl = () => {
  const { spec, dispatch } = useGeoVis();
  const control = spec.control;

  const [expanded, setExpanded] = React.useState(false);
  const [hoveredId, setHoveredId] = React.useState<string | null>(null);
  const [activeById, setActiveById] = React.useState<Record<string, boolean>>(
    {}
  );

  const layerIds = React.useMemo(() => {
    return new Set(
      spec.layers.map((layer) => {
        return layer.id;
      })
    );
  }, [spec.layers]);

  // Re-apply the remembered on/off choices to the live map whenever the spec
  // or a choice changes. This is what makes the state persist across spec
  // rebuilds: a fresh spec resets `layer.visible`, and this effect drives each
  // referenced-and-existing layer back to its intended visibility. Each
  // `dispatch` is idempotent (explicit `visible`) and only fires on a genuine
  // mismatch, so the resulting spec update re-runs this effect to a fixpoint
  // rather than looping.
  React.useEffect(() => {
    if (!control) return;
    for (const item of control.items) {
      const desired = resolveItemActive(item, activeById);
      for (const layer of spec.layers) {
        if (!item.layers.includes(layer.id)) continue;
        const currentlyVisible = layer.visible !== false;
        if (currentlyVisible !== desired) {
          dispatch({
            type: 'toggle-layer',
            layerId: layer.id,
            visible: desired,
          });
        }
      }
    }
  }, [control, spec.layers, activeById, dispatch]);

  if (!control) return null;

  const label = control.label ?? 'Layers';
  const position = control.position ?? 'bottom-left';
  const trigger = control.trigger ?? 'hover';
  const hoverHandlers = buildHoverHandlers({ trigger, setExpanded });

  const toggleItem = (item: LayerControlItem) => {
    const existing = item.layers.filter((id) => {
      return layerIds.has(id);
    });
    // Disabled item: none of its layers exist in the current spec.
    if (existing.length === 0) return;
    const next = !resolveItemActive(item, activeById);
    setActiveById((prev) => {
      return { ...prev, [item.id]: next };
    });
  };

  const triggerButton = (
    <button
      key="trigger"
      type="button"
      aria-expanded={expanded}
      style={buildTriggerStyle(expanded)}
      onClick={() => {
        return setExpanded((prev) => {
          return !prev;
        });
      }}
    >
      <MapThumbnail />
      <span style={triggerLabelStyle}>{label}</span>
    </button>
  );

  const panel = expanded ? (
    <LayerControlPanel
      label={label}
      items={control.items}
      activeById={activeById}
      layerIds={layerIds}
      hoveredId={hoveredId}
      onToggle={toggleItem}
      onHoverChange={setHoveredId}
    />
  ) : null;

  // The trigger stays pinned to the anchored corner; the panel expands to the
  // side, growing toward the map's centre — to the trigger's right for left
  // corners, to its left for right corners. Both align on the anchored
  // horizontal edge (top for top corners, bottom for bottom).
  const isRight = position.endsWith('right');
  const children = isRight ? [panel, triggerButton] : [triggerButton, panel];

  return (
    <div
      style={buildOuterStyle({ position, offset: control.offset })}
      {...hoverHandlers}
    >
      {children}
    </div>
  );
};
