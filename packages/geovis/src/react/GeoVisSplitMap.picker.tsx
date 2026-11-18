import { defineMessages, useI18n } from '@ttoss/react-i18n';
import type * as React from 'react';

import type { LayerControlItem } from '../spec/types';
import { type GeoVisSplitSide, SPLIT_SIDE_COLOR } from './mapMode.split';

const messages = defineMessages({
  sideLayer: {
    defaultMessage: 'Map {side} layer',
    description:
      "Split map mode: the heading of a side's layer picker, and its accessible name. {side} is the side's letter, A (left) or B (right).",
  },
  sideLayerValue: {
    defaultMessage: 'Map {side} layer: {layer}',
    description:
      "Split map mode: accessible name of a side's picker button, naming the side (A or B) and the layer it shows.",
  },
  noLayer: {
    defaultMessage: 'No layer',
    description:
      "Split map mode: a side showing no layer — the picker's label, and the list entry that empties the side.",
  },
});

const ACCENT = '#0e9e6e';
const INK = '#1a2235';
const MUTED = '#6b7a90';

const ChevronIcon = ({ open }: { open: boolean }) => {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
      style={{
        display: 'block',
        transform: open ? 'rotate(180deg)' : 'none',
        transition: 'transform 0.2s',
      }}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
};

const CheckIcon = () => {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      aria-hidden
      style={{ display: 'block' }}
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
};

/** One entry of a side's list, and what its pill shows when chosen. */
export interface SidePickerEntry {
  /** `null` for the entry that empties the side. */
  id: string | null;
  label: string;
  /** The `control` item it shows, for its thumbnail. */
  item?: LayerControlItem | null;
}

/**
 * The item's thumbnail as a small swatch, a neutral dot for an item without
 * one, or an empty dashed ring for no item at all.
 */
const ItemSwatch = ({ entry }: { entry: SidePickerEntry | null }) => {
  const item = entry?.item;
  if (!entry || entry.id === null) {
    return (
      <span
        style={{
          flexShrink: 0,
          width: 9,
          height: 9,
          borderRadius: 999,
          border: '1px dashed #94a3b8',
        }}
      />
    );
  }
  if (item?.thumbnail) {
    return (
      <img
        src={item.thumbnail}
        alt=""
        style={{
          flexShrink: 0,
          width: 16,
          height: 16,
          borderRadius: 4,
          objectFit: 'cover',
        }}
      />
    );
  }
  return (
    <span
      style={{
        flexShrink: 0,
        width: 7,
        height: 7,
        borderRadius: 999,
        background: '#94a3b8',
      }}
    />
  );
};

/** Where a side's list opens relative to its pill. */
const MENU_POSITION: Record<'left' | 'center' | 'right', React.CSSProperties> =
  {
    left: { left: 0 },
    center: { left: '50%', transform: 'translateX(-50%)' },
    right: { right: 0 },
  };

/** A side's list of entries, below its pill. */
const SidePickerList = ({
  keyLabel,
  menuPosition,
  entries,
  selected,
  onPick,
}: {
  keyLabel: string;
  menuPosition: React.CSSProperties;
  entries: SidePickerEntry[];
  selected: string | null;
  onPick: (id: string | null) => void;
}) => {
  const { intl } = useI18n();
  const noLayer = intl.formatMessage(messages.noLayer);
  return (
    <div
      role="listbox"
      aria-label={intl.formatMessage(messages.sideLayer, { side: keyLabel })}
      style={{
        position: 'absolute',
        zIndex: 1,
        top: 'calc(100% + 6px)',
        ...menuPosition,
        width: 250,
        maxHeight: 300,
        overflowY: 'auto',
        padding: 6,
        borderRadius: 12,
        background: '#ffffff',
        boxShadow: '0 8px 28px rgba(0,0,0,0.16)',
        border: '1px solid rgba(0,0,0,0.07)',
      }}
    >
      <div
        style={{
          padding: '4px 8px 6px',
          fontSize: 10,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: MUTED,
        }}
      >
        {intl.formatMessage(messages.sideLayer, { side: keyLabel })}
      </div>
      {entries.map((entry) => {
        const on = entry.id === selected;
        return (
          <button
            key={entry.id ?? ''}
            type="button"
            role="option"
            aria-selected={on}
            onClick={() => {
              onPick(entry.id);
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '7px 8px',
              borderRadius: 6,
              border: 0,
              cursor: 'pointer',
              textAlign: 'left',
              background: on ? 'rgba(14,158,110,0.07)' : 'transparent',
            }}
          >
            <ItemSwatch entry={entry} />
            <span
              style={{
                flex: 1,
                minWidth: 0,
                fontSize: 12,
                color: entry.id === null ? MUTED : INK,
                fontWeight: on ? 500 : 400,
              }}
            >
              {entry.id === null ? noLayer : entry.label}
            </span>
            {on && (
              <span style={{ display: 'flex', color: ACCENT }}>
                <CheckIcon />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

/** What a pill names: its entry's label, or "No layer" for an empty side. */
const pillLabel = ({
  current,
  noLayer,
}: {
  current: SidePickerEntry | null;
  noLayer: string;
}) => {
  const empty = !current || current.id === null;
  return { empty, label: empty ? noLayer : current.label };
};

/** A pill's border: in its side's colour while edited, tinted while open. */
const pillBorder = ({
  active,
  open,
  color,
}: {
  active: boolean;
  open: boolean;
  color: string;
}) => {
  if (active) return `2px solid ${color}`;
  return `1px solid ${open ? 'rgba(14,158,110,0.4)' : 'rgba(0,0,0,0.08)'}`;
};

/**
 * One side's picker: a pill naming the side (A/B, in the side's colour) and
 * the `control` item it shows, opening the list of items to show on that side. The pill
 * of the side being edited is ringed in its colour.
 */
export const SidePicker = ({
  side,
  open,
  onToggle,
  maxWidth,
  style,
  menuAlign,
  current,
  entries,
  selected,
  onPick,
  active,
}: {
  side: GeoVisSplitSide;
  open: boolean;
  onToggle: () => void;
  maxWidth: number;
  style: React.CSSProperties;
  menuAlign: 'left' | 'center' | 'right';
  /** What the side shows, or `null` for an empty side. */
  current: SidePickerEntry | null;
  /** The list the pill opens; empty, the pill opens none. */
  entries: SidePickerEntry[];
  selected: string | null;
  onPick: (id: string | null) => void;
  /** Whether this is the side being edited. */
  active: boolean;
}) => {
  const { intl } = useI18n();
  const key = side.toUpperCase();
  const color = SPLIT_SIDE_COLOR[side];
  const { empty, label } = pillLabel({
    current,
    noLayer: intl.formatMessage(messages.noLayer),
  });
  const hasList = entries.length > 0;

  return (
    <div
      data-split-picker
      style={{ position: 'absolute', zIndex: 24, ...style }}
    >
      <button
        type="button"
        onClick={hasList ? onToggle : undefined}
        aria-expanded={hasList ? open : undefined}
        aria-haspopup={hasList ? 'listbox' : undefined}
        aria-label={intl.formatMessage(messages.sideLayerValue, {
          side: key,
          layer: label,
        })}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          maxWidth,
          height: 36,
          padding: '0 10px 0 6px',
          borderRadius: 10,
          cursor: hasList ? 'pointer' : 'default',
          background: '#ffffff',
          boxShadow: '0 4px 16px rgba(0,0,0,0.14)',
          border: pillBorder({ active, open, color }),
        }}
      >
        <span
          style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 22,
            height: 22,
            borderRadius: 6,
            background: color,
            color: '#ffffff',
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          {key}
        </span>
        <ItemSwatch entry={current} />
        <span
          style={{
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontSize: 12,
            fontWeight: empty ? 400 : 500,
            color: empty ? MUTED : INK,
          }}
        >
          {label}
        </span>
        {hasList && (
          <span style={{ flexShrink: 0, display: 'flex', color: '#8593a6' }}>
            <ChevronIcon open={open} />
          </span>
        )}
      </button>
      {open && hasList && (
        <SidePickerList
          keyLabel={key}
          menuPosition={MENU_POSITION[menuAlign]}
          entries={entries}
          selected={selected}
          onPick={(id) => {
            onPick(id);
            onToggle();
          }}
        />
      )}
    </div>
  );
};
