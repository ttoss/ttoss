import type * as React from 'react';

import { isLayerControlGroup } from '../spec/layerControl';
import type {
  LayerControlEntry,
  LayerControlGroup,
  LayerControlItem,
} from '../spec/types';
import {
  buildGroupThumbStyle,
  groupChevronStyle,
} from './GeoVisLayerControl.groupStyles';
import {
  activeBadgeStyle,
  buildItemLabelStyle,
  buildItemStyle,
  buildItemThumbStyle,
  moreActiveBadgeStyle,
  TRIGGER_SIZE,
} from './GeoVisLayerControl.styles';

/**
 * Whether an item should be visible, given the user's remembered choices.
 * A choice recorded in `activeById` (by `item.id`) always wins; otherwise the
 * item's `defaultActive` (default `true`) applies. Keeping the decision keyed
 * by `item.id` — not by layer id — is what makes the toggled state persist
 * across spec rebuilds where the underlying layer ids differ (PRD map modes).
 */
export const resolveItemActive = (
  item: LayerControlItem,
  activeById: Record<string, boolean>
): boolean => {
  return activeById[item.id] ?? item.defaultActive ?? true;
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

/**
 * Image filling an item card: the spec-provided `thumbnail` (URL or data URI,
 * cropped to cover) when set, otherwise the built-in {@link MapThumbnail}. Kept
 * decorative (`alt=""`) since the item's `label` already names it below.
 */
const ItemThumbnail = ({ thumbnail }: { thumbnail?: string }) => {
  if (thumbnail == null) return <MapThumbnail />;
  return (
    <img
      src={thumbnail}
      alt=""
      style={{
        display: 'block',
        height: '100%',
        objectFit: 'cover',
        width: '100%',
      }}
    />
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
        <ItemThumbnail thumbnail={item.thumbnail} />
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

/** Whether none of an item's layers exist in the current spec. */
const isItemDisabled = (
  item: LayerControlItem,
  layerIds: Set<string>
): boolean => {
  return !item.layers.some((id) => {
    return layerIds.has(id);
  });
};

/** Chevron glyph on a category card: it opens a panel, it does not toggle. */
const ChevronIcon = () => {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M8.59 16.59 13.17 12 8.59 7.41 10 6l6 6-6 6z" />
    </svg>
  );
};

/**
 * A category's card: its thumbnail with a chevron, and a badge counting the
 * items in it that are on. Clicking it opens the category's panel — it never
 * toggles anything itself. Disabled when every item in it is.
 */
const LayerControlGroupButton = ({
  group,
  activeCount,
  disabled,
  hovered,
  onOpen,
  onHoverChange,
}: {
  group: LayerControlGroup;
  activeCount: number;
  disabled: boolean;
  hovered: boolean;
  onOpen: (group: LayerControlGroup) => void;
  onHoverChange: React.Dispatch<React.SetStateAction<string | null>>;
}) => {
  return (
    <button
      type="button"
      data-group-id={group.id}
      // Named by its label alone: the badge's count is not part of the name.
      aria-label={group.label}
      aria-haspopup="dialog"
      disabled={disabled}
      style={buildItemStyle({ disabled, hovered })}
      onClick={() => {
        return onOpen(group);
      }}
      onMouseEnter={() => {
        return onHoverChange(group.id);
      }}
      onMouseLeave={() => {
        return onHoverChange((prev) => {
          return prev === group.id ? null : prev;
        });
      }}
    >
      <span style={buildGroupThumbStyle(disabled)}>
        <ItemThumbnail thumbnail={group.thumbnail} />
        {activeCount > 0 ? (
          <span style={moreActiveBadgeStyle}>{activeCount}</span>
        ) : null}
        <span style={groupChevronStyle}>
          <ChevronIcon />
        </span>
      </span>
      <span style={buildItemLabelStyle({ active: false, disabled })}>
        {group.label}
      </span>
    </button>
  );
};

/** What every entry list (summary strip, full grid, category grid) needs. */
export type ItemListProps = {
  items: LayerControlEntry[];
  activeById: Record<string, boolean>;
  layerIds: Set<string>;
  hoveredId: string | null;
  onToggle: (item: LayerControlItem) => void;
  onOpenGroup: (group: LayerControlGroup) => void;
  onHoverChange: React.Dispatch<React.SetStateAction<string | null>>;
};

/**
 * One card per entry, shared by every panel: a toggle button per item, and a
 * category card per group.
 */
export const LayerControlItemList = ({
  items,
  activeById,
  layerIds,
  hoveredId,
  onToggle,
  onOpenGroup,
  onHoverChange,
}: ItemListProps) => {
  return (
    <>
      {items.map((entry) => {
        if (isLayerControlGroup(entry)) {
          return (
            <LayerControlGroupButton
              key={entry.id}
              group={entry}
              activeCount={
                entry.items.filter((item) => {
                  return resolveItemActive(item, activeById);
                }).length
              }
              disabled={entry.items.every((item) => {
                return isItemDisabled(item, layerIds);
              })}
              hovered={hoveredId === entry.id}
              onOpen={onOpenGroup}
              onHoverChange={onHoverChange}
            />
          );
        }
        return (
          <LayerControlItemButton
            key={entry.id}
            item={entry}
            active={resolveItemActive(entry, activeById)}
            disabled={isItemDisabled(entry, layerIds)}
            hovered={hoveredId === entry.id}
            onToggle={onToggle}
            onHoverChange={onHoverChange}
          />
        );
      })}
    </>
  );
};
