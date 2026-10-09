import * as React from 'react';

import { isLayerControlGroup } from '../spec/layerControl';
import type { LayerControlEntry, LayerControlGroup } from '../spec/types';
import {
  type ItemListProps,
  LayerControlItemList,
} from './GeoVisLayerControl.items';
import {
  type EntrySection,
  sectionEntries,
  splitStripEntries,
} from './GeoVisLayerControl.order';
import {
  buildFullPanelGridStyle,
  buildFullPanelStyle,
  buildItemLabelStyle,
  buildItemStyle,
  buildPanelStyle,
  fullPanelBodyStyle,
  fullPanelCloseStyle,
  fullPanelHeaderStyle,
  fullPanelSectionTitleStyle,
  fullPanelTitleStyle,
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
 * hidden count ("+12") labelled "Ver mais". It carries no count of items on:
 * those all sit in the strip (see `splitStripEntries`), so none hides here.
 */
const LayerControlMoreButton = ({
  hiddenCount,
  onOpen,
}: {
  hiddenCount: number;
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
      <span style={moreThumbStyle}>{countText}</span>
      <span style={buildItemLabelStyle({ active: false, disabled: false })}>
        {MORE_LABEL}
      </span>
    </button>
  );
};

/**
 * The full panel's grids: one with every entry, or — when items declare a
 * `category` — one per section, each under its heading. Every grid is sized
 * for the longest section, so the columns line up from one to the next.
 */
const FullPanelSections = ({
  label,
  compact,
  sections,
  ...listProps
}: Omit<ItemListProps, 'items'> & {
  label: string;
  compact: boolean;
  sections: EntrySection[];
}) => {
  const itemCount = Math.max(
    0,
    ...sections.map((section) => {
      return section.entries.length;
    })
  );
  const flat = sections.length === 1 && sections[0].title === undefined;

  if (flat) {
    return (
      <div
        role="group"
        aria-label={label}
        style={buildFullPanelGridStyle({ compact, itemCount })}
      >
        <LayerControlItemList items={sections[0].entries} {...listProps} />
      </div>
    );
  }

  return (
    <div style={fullPanelBodyStyle}>
      {sections.map((section) => {
        const name = section.title ?? label;
        return (
          <div key={name} role="group" aria-label={name}>
            {section.title ? (
              <div style={fullPanelSectionTitleStyle}>{section.title}</div>
            ) : null}
            <div
              style={{
                ...buildFullPanelGridStyle({ compact, itemCount }),
                // The body scrolls as a whole, so the headings scroll with
                // their sections.
                overflowY: 'visible',
              }}
            >
              <LayerControlItemList items={section.entries} {...listProps} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

/**
 * A larger panel listing entries in a grid under a title and a close button:
 * the one the "Ver mais" card opens, with every entry sectioned by category,
 * and a category's, with its items and a back button. Anchored where the
 * summary strip was, so it grows toward the map's centre the same way.
 */
const LayerControlFullPanel = ({
  label,
  compact,
  onClose,
  onBack,
  items,
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
      <FullPanelSections
        label={label}
        compact={compact}
        // A category's own panel lists its items flat; only "Ver mais"
        // sections them.
        sections={onBack ? [{ entries: items }] : sectionEntries(items)}
        {...listProps}
      />
    </div>
  );
};

/**
 * The expanded panel's content: the summary strip — every entry, or, when
 * `maxVisibleItems` hides some, the ones that are on and then the first of
 * the rest, followed by a "Ver mais" card (see `splitStripEntries`) —
 * the full panel listing them all once that card is clicked, or a category's
 * panel once its card is. A category whose id is gone from the spec (the
 * control was rebuilt without it) falls back to the view beneath it.
 */
export const LayerControlExpandedPanel = ({
  label,
  compact,
  items,
  maxVisibleItems,
  stripActiveById,
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
  /** The choices the strip's order is read from, as they were at opening. */
  stripActiveById: Record<string, boolean>;
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

  const { visible, hidden } = splitStripEntries({
    items,
    maxVisibleItems,
    activeById: stripActiveById,
    layerIds: listProps.layerIds,
  });

  return (
    <div role="group" aria-label={label} style={buildPanelStyle({ compact })}>
      <LayerControlItemList items={visible} {...listProps} />
      {hidden.length > 0 ? (
        <LayerControlMoreButton
          hiddenCount={hidden.length}
          onOpen={onShowAll}
        />
      ) : null}
    </div>
  );
};
