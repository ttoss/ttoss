import * as React from 'react';

import type { LayerControlItem } from '../spec/types';
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
 * The larger panel opened from the "Ver mais" card, listing every item in a
 * grid under a title and a close button. Anchored where the summary strip was,
 * so it grows toward the map's centre the same way.
 */
const LayerControlFullPanel = ({
  label,
  compact,
  onClose,
  ...listProps
}: ItemListProps & {
  label: string;
  compact: boolean;
  onClose: () => void;
}) => {
  // The "Ver mais" button that opened this panel unmounts with the summary
  // strip, so move focus here instead of letting it drop to the page.
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
        <span style={fullPanelTitleStyle}>{label}</span>
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
  items: LayerControlItem[],
  maxVisibleItems: number | undefined
): { visible: LayerControlItem[]; hidden: LayerControlItem[] } => {
  if (maxVisibleItems == null || items.length <= maxVisibleItems) {
    return { visible: items, hidden: [] };
  }
  return {
    visible: items.slice(0, maxVisibleItems),
    hidden: items.slice(maxVisibleItems),
  };
};

/**
 * The expanded panel's content: the summary strip — every item, or, when
 * `maxVisibleItems` hides some, the first ones followed by a "Ver mais" card —
 * or, once that card is clicked (`showAll`), the full panel listing them all.
 */
export const LayerControlExpandedPanel = ({
  label,
  compact,
  items,
  maxVisibleItems,
  showAll,
  onShowAll,
  onClose,
  ...listProps
}: Omit<ItemListProps, 'items'> & {
  label: string;
  compact: boolean;
  items: LayerControlItem[];
  maxVisibleItems: number | undefined;
  showAll: boolean;
  onShowAll: () => void;
  onClose: () => void;
}) => {
  if (showAll) {
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
  const hiddenActiveCount = hidden.filter((item) => {
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
