import * as React from 'react';

import { isLayerControlGroup, layerControlItems } from '../spec/layerControl';
import type { LayerControlEntry, LayerControlGroup } from '../spec/types';
import {
  type ItemListProps,
  LayerControlItemList,
  resolveItemActive,
} from './GeoVisLayerControl.items';
import {
  buildFullPanelGridStyle,
  buildFullPanelStyle,
  buildItemLabelStyle,
  buildItemStyle,
  buildPanelStyle,
  fullPanelCloseStyle,
  fullPanelHeaderStyle,
  fullPanelTitleStyle,
  moreActiveBadgeStyle,
  moreThumbStyle,
} from './GeoVisLayerControl.styles';

/** Text of the card that opens the full panel. */
const MORE_LABEL = 'Ver mais';

/** Accessible name of the full panel's close button. */
const CLOSE_LABEL = 'Fechar';

/** Accessible name of a category panel's back button. */
const BACK_LABEL = 'Voltar';

/** Cross glyph for the full panel's close button. */
const CloseIcon = () => {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
    </svg>
  );
};

/** Back-arrow glyph for a category panel's back button. */
const BackIcon = () => {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
    </svg>
  );
};

/**
 * The card closing the summary strip when items are hidden: a tile with the
 * hidden count ("+12") labelled "Ver mais", plus an accent badge counting the
 * hidden items that are currently on, so a layer left active in the full panel
 * is never silently out of sight.
 */
const LayerControlMoreButton = ({
  hiddenCount,
  hiddenActiveCount,
  onOpen,
}: {
  hiddenCount: number;
  hiddenActiveCount: number;
  onOpen: () => void;
}) => {
  const [hovered, setHovered] = React.useState(false);
  const countText = `+${hiddenCount}`;
  const accessibleName = `${MORE_LABEL} (${countText})`;

  return (
    <button
      type="button"
      data-more
      aria-expanded={false}
      aria-label={accessibleName}
      style={buildItemStyle({ disabled: false, hovered })}
      onClick={onOpen}
      onMouseEnter={() => {
        return setHovered(true);
      }}
      onMouseLeave={() => {
        return setHovered(false);
      }}
    >
      <span style={moreThumbStyle}>
        {countText}
        {hiddenActiveCount > 0 ? (
          <span style={moreActiveBadgeStyle}>{hiddenActiveCount}</span>
        ) : null}
      </span>
      <span style={buildItemLabelStyle({ active: false, disabled: false })}>
        {MORE_LABEL}
      </span>
    </button>
  );
};

/**
 * A larger panel listing entries in a grid under a title and a close button:
 * the one the "Ver mais" card opens, with every entry, and a category's, with
 * its items and a back button. Anchored where the summary strip was, so it
 * grows toward the map's centre the same way.
 */
const LayerControlFullPanel = ({
  label,
  compact,
  onClose,
  onBack,
  ...listProps
}: ItemListProps & {
  label: string;
  compact: boolean;
  onClose: () => void;
  /** Set for a category's panel: returns to the view it was opened from. */
  onBack?: () => void;
}) => {
  // The card that opened this panel unmounts with the view it sat in, so move
  // focus here instead of letting it drop to the page.
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal={false}
      aria-label={label}
      tabIndex={-1}
      style={buildFullPanelStyle({ compact })}
    >
      <div style={fullPanelHeaderStyle}>
        {onBack ? (
          <button
            type="button"
            aria-label={BACK_LABEL}
            title={BACK_LABEL}
            style={fullPanelCloseStyle}
            onClick={onBack}
          >
            <BackIcon />
          </button>
        ) : null}
        <span
          style={{
            ...fullPanelTitleStyle,
            flex: 1,
            margin: onBack ? '0 6px' : 0,
            minWidth: 0,
          }}
        >
          {label}
        </span>
        <button
          type="button"
          aria-label={CLOSE_LABEL}
          title={CLOSE_LABEL}
          style={fullPanelCloseStyle}
          onClick={onClose}
        >
          <CloseIcon />
        </button>
      </div>
      <div
        role="group"
        aria-label={label}
        style={buildFullPanelGridStyle({
          compact,
          itemCount: listProps.items.length,
        })}
      >
        <LayerControlItemList {...listProps} />
      </div>
    </div>
  );
};

/**
 * Splits `items` into the summary strip's visible head and the hidden tail,
 * per `maxVisibleItems`. Nothing is hidden when the limit is unset or the list
 * already fits within it, so no "Ver mais" card is needed.
 */
const splitItems = (
  items: LayerControlEntry[],
  maxVisibleItems: number | undefined
): { visible: LayerControlEntry[]; hidden: LayerControlEntry[] } => {
  if (maxVisibleItems == null || items.length <= maxVisibleItems) {
    return { visible: items, hidden: [] };
  }
  return {
    visible: items.slice(0, maxVisibleItems),
    hidden: items.slice(maxVisibleItems),
  };
};

/**
 * The expanded panel's content: the summary strip — every entry, or, when
 * `maxVisibleItems` hides some, the first ones followed by a "Ver mais" card —
 * the full panel listing them all once that card is clicked, or a category's
 * panel once its card is. A category whose id is gone from the spec (the
 * control was rebuilt without it) falls back to the view beneath it.
 */
export const LayerControlExpandedPanel = ({
  label,
  compact,
  items,
  maxVisibleItems,
  view,
  onShowAll,
  onBack,
  onClose,
  ...listProps
}: Omit<ItemListProps, 'items'> & {
  label: string;
  compact: boolean;
  items: LayerControlEntry[];
  maxVisibleItems: number | undefined;
  view: { full: boolean; groupId: string | null };
  onShowAll: () => void;
  onBack: () => void;
  onClose: () => void;
}) => {
  const group = items.find((entry): entry is LayerControlGroup => {
    return isLayerControlGroup(entry) && entry.id === view.groupId;
  });

  if (group) {
    return (
      <LayerControlFullPanel
        label={group.label}
        compact={compact}
        items={group.items}
        onClose={onClose}
        onBack={onBack}
        {...listProps}
      />
    );
  }

  if (view.full) {
    return (
      <LayerControlFullPanel
        label={label}
        compact={compact}
        items={items}
        onClose={onClose}
        {...listProps}
      />
    );
  }

  const { visible, hidden } = splitItems(items, maxVisibleItems);
  // Counts toggles, so a category hidden behind the card counts its items.
  const hiddenActiveCount = layerControlItems(hidden).filter((item) => {
    return resolveItemActive(item, listProps.activeById);
  }).length;

  return (
    <div role="group" aria-label={label} style={buildPanelStyle({ compact })}>
      <LayerControlItemList items={visible} {...listProps} />
      {hidden.length > 0 ? (
        <LayerControlMoreButton
          hiddenCount={hidden.length}
          hiddenActiveCount={hiddenActiveCount}
          onOpen={onShowAll}
        />
      ) : null}
    </div>
  );
};
