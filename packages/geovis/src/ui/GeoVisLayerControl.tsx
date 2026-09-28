import { Icon } from '@ttoss/react-icons';
import * as React from 'react';

import type { LayerControlItem } from '../spec/types';
import { useGeoVis } from './contexts';
import { resolveItemActive } from './GeoVisLayerControl.items';
import { LayerControlExpandedPanel } from './GeoVisLayerControl.panels';
import {
  buildHoverHandlers,
  useDismissFullPanel,
  useExpandedState,
  useLayerVisibilitySync,
  useShowAll,
} from './GeoVisLayerControl.state';
import {
  buildOuterStyle,
  buildTriggerStyle,
  compactBarStyle,
  triggerBadgeStyle,
} from './GeoVisLayerControl.styles';
import { useCompactViewport } from './useCompactViewport';

/**
 * Stacked-sheets "layers" glyph (Material-style) for the trigger button — a
 * recognisable layers affordance in place of a map preview. Inherits its colour
 * from the wrapper via `currentColor`.
 */
const LayersIcon = () => {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      style={{ display: 'block' }}
    >
      <path d="M11.99 18.54l-7.37-5.73L3 14.07l9 7 9-7-1.63-1.27-7.38 5.74zM12 16l7.36-5.73L21 9l-9-7-9 7 1.63 1.27L12 16z" />
    </svg>
  );
};

/**
 * Trigger glyph: the spec's `@ttoss/react-icons` icon when set, otherwise the
 * built-in {@link LayersIcon}. Inherits its colour from the wrapper.
 */
const TriggerIcon = ({ icon }: { icon: string | undefined }) => {
  if (!icon) return <LayersIcon />;
  return <Icon icon={icon} style={{ display: 'block', fontSize: 22 }} />;
};

/**
 * Order of the container's children, which is what decides where the panel
 * opens. Roomy: the panel sits inboard of the trigger, so it grows toward the
 * map's centre. Compact: the triggers share a row and the panel takes the line
 * away from the anchored edge — above the row for bottom corners, below it for
 * top ones.
 */
const arrangeChildren = ({
  compact,
  isTop,
  isRight,
  panel,
  triggerButton,
  trailingNode,
}: {
  compact: boolean;
  isTop: boolean;
  isRight: boolean;
  panel: React.ReactNode;
  triggerButton: React.ReactNode;
  trailingNode: React.ReactNode;
}): React.ReactNode[] => {
  const row = isRight
    ? [trailingNode, triggerButton]
    : [triggerButton, trailingNode];
  if (!compact) {
    return isRight
      ? [panel, trailingNode, triggerButton]
      : [triggerButton, trailingNode, panel];
  }
  const bar = (
    <div key="bar" style={compactBarStyle}>
      {row}
    </div>
  );
  return isTop ? [bar, panel] : [panel, bar];
};

/** The square trigger, with its count of active items in the corner. */
const LayerControlTrigger = ({
  label,
  icon,
  expanded,
  activeCount,
  onToggle,
}: {
  label: string;
  icon: string | undefined;
  expanded: boolean;
  activeCount: number;
  onToggle: () => void;
}) => {
  return (
    <button
      type="button"
      aria-expanded={expanded}
      aria-label={label}
      title={label}
      style={buildTriggerStyle(expanded)}
      onClick={onToggle}
    >
      <TriggerIcon icon={icon} />
      {activeCount > 0 && <span style={triggerBadgeStyle}>{activeCount}</span>}
    </button>
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
 * With `control.maxVisibleItems` set and more items than that, the panel shows
 * only the first ones plus a "Ver mais" card; clicking it swaps in a larger
 * panel with every item, which stays open until closed (its close button,
 * `Escape`, a click outside, or the trigger) — even for the `'hover'` trigger.
 *
 * Renders `null` when `spec.control` is absent.
 */
export const GeoVisLayerControl = ({
  trailing,
  expanded: expandedProp,
  onExpandedChange,
}: {
  /**
   * Extra control rendered beside the trigger, inside the same anchored row.
   * Used below the compact breakpoint to sit the legend button next to this
   * one; the two then share a single corner anchor instead of each computing
   * its own offset and colliding when this control's panel opens sideways.
   */
  trailing?: React.ReactNode;
  /**
   * Whether the panel is open. Omit to let the control own that state — the
   * default. Pass it (with `onExpandedChange`) to coordinate the panel with a
   * sibling overlay: below the compact breakpoint `<GeoVisProvider>` does
   * exactly that, so opening the legend closes this panel and vice versa,
   * since both claim the space above the trigger row.
   */
  expanded?: boolean;
  /** Called with the requested open state. Required for `expanded` to take effect. */
  onExpandedChange?: (expanded: boolean) => void;
} = {}) => {
  const { spec, dispatch } = useGeoVis();
  const control = spec.control;

  const isCompact = useCompactViewport();
  const [expanded, setExpanded] = useExpandedState({
    expanded: expandedProp,
    onExpandedChange,
  });
  const [fullPanelOpen, openFullPanel] = useShowAll(expanded);
  const [hoveredId, setHoveredId] = React.useState<string | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
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

  useLayerVisibilitySync({
    control,
    layers: spec.layers,
    activeById,
    dispatch,
  });

  const collapse = () => {
    return setExpanded(false);
  };
  useDismissFullPanel({
    active: fullPanelOpen,
    ref: containerRef,
    onDismiss: collapse,
  });

  if (!control) return null;

  const label = control.label ?? 'Layers';
  const position = control.position ?? 'bottom-left';
  const activeCount = control.items.filter((item) => {
    return resolveItemActive(item, activeById);
  }).length;
  // No hover handlers below the compact breakpoint: that layout is for touch,
  // where there is no pointer to enter or leave, and the panel there sits
  // outside the trigger row so a `mouseleave` on the row would close it while
  // the pointer is over the panel. The trigger's own `onClick` still opens it.
  const hoverHandlers = isCompact
    ? {}
    : buildHoverHandlers({
        trigger: control.trigger ?? 'hover',
        pinned: fullPanelOpen,
        setExpanded,
      });

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
    <LayerControlTrigger
      key="trigger"
      label={label}
      icon={control.icon}
      expanded={expanded}
      activeCount={activeCount}
      onToggle={() => {
        return setExpanded((prev) => {
          return !prev;
        });
      }}
    />
  );

  const panel = expanded ? (
    <LayerControlExpandedPanel
      key="panel"
      label={label}
      compact={isCompact}
      items={control.items}
      maxVisibleItems={control.maxVisibleItems}
      showAll={fullPanelOpen}
      onShowAll={openFullPanel}
      onClose={collapse}
      activeById={activeById}
      layerIds={layerIds}
      hoveredId={hoveredId}
      onToggle={toggleItem}
      onHoverChange={setHoveredId}
    />
  ) : null;

  // Roomy layout: the trigger stays pinned to the anchored corner and the panel
  // expands to the side, growing toward the map's centre — to the trigger's
  // right for left corners, to its left for right corners. Both align on the
  // anchored horizontal edge (top for top corners, bottom for bottom).
  // `trailing` sits immediately inboard of the trigger, so the pair reads as one
  // control bar.
  //
  // Compact layout: one row of square item cards cannot fit a phone's width, so
  // the container becomes a column spanning the map and the panel opens away
  // from the anchored edge — above the trigger row for bottom corners, below it
  // for top ones. This mirrors the compact legend panel, which the trigger row
  // sits beside.
  const trailingNode = trailing ? (
    <React.Fragment key="trailing">{trailing}</React.Fragment>
  ) : null;

  return (
    <div
      ref={containerRef}
      style={buildOuterStyle({
        position,
        offset: control.offset,
        compact: isCompact,
      })}
      {...hoverHandlers}
    >
      {arrangeChildren({
        compact: isCompact,
        isTop: position.startsWith('top'),
        isRight: position.endsWith('right'),
        panel,
        triggerButton,
        trailingNode,
      })}
    </div>
  );
};
