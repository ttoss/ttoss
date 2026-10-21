import { defineMessages, useI18n } from '@ttoss/react-i18n';
import * as React from 'react';

import type { LayerControlItem } from '../spec/types';
import { type GeoVisSplitSide, useGeoVisMapMode } from './mapMode';

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

/**
 * The item's thumbnail as a small swatch, a neutral dot for an item without
 * one, or an empty dashed ring for no item at all.
 */
const ItemSwatch = ({ item }: { item: LayerControlItem | null }) => {
  if (!item) {
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
  if (item.thumbnail) {
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

/**
 * One side's picker: a pill naming the side (A/B) and its item, opening the
 * list of items to show on that side.
 */
/** Where a side's list opens relative to its pill. */
const MENU_POSITION: Record<'left' | 'center' | 'right', React.CSSProperties> =
  {
    left: { left: 0 },
    center: { left: '50%', transform: 'translateX(-50%)' },
    right: { right: 0 },
  };

/** A side's list of items, "No layer" first, below its pill. */
const SidePickerList = ({
  keyLabel,
  menuPosition,
  entries,
  selected,
  onPick,
}: {
  keyLabel: string;
  menuPosition: React.CSSProperties;
  entries: {
    id: string | null;
    label: string;
    item: LayerControlItem | null;
  }[];
  selected: string | null;
  onPick: (id: string | null) => void;
}) => {
  const { intl } = useI18n();
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
            <ItemSwatch item={entry.item} />
            <span
              style={{
                flex: 1,
                minWidth: 0,
                fontSize: 12,
                color: entry.item ? INK : MUTED,
                fontWeight: on ? 500 : 400,
              }}
            >
              {entry.label}
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

export const SidePicker = ({
  side,
  open,
  onToggle,
  maxWidth,
  style,
  menuAlign,
}: {
  side: GeoVisSplitSide;
  open: boolean;
  onToggle: () => void;
  maxWidth: number;
  style: React.CSSProperties;
  menuAlign: 'left' | 'center' | 'right';
}) => {
  const { options, sides, setSide } = useGeoVisMapMode();
  const { intl } = useI18n();
  const noLayer = intl.formatMessage(messages.noLayer);
  const current =
    options.find((item) => {
      return item.id === sides[side];
    }) ?? null;
  // "No layer" first, so a side can be emptied again after a choice.
  const entries = [
    { id: null, label: noLayer, item: null },
    ...options.map((item) => {
      return { id: item.id, label: item.label, item };
    }),
  ];
  const key = side.toUpperCase();
  const menuPosition = MENU_POSITION[menuAlign];

  return (
    <div
      data-split-picker
      style={{ position: 'absolute', zIndex: 24, ...style }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={intl.formatMessage(messages.sideLayerValue, {
          side: key,
          layer: current?.label ?? noLayer,
        })}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          maxWidth,
          height: 36,
          padding: '0 10px 0 6px',
          borderRadius: 10,
          cursor: 'pointer',
          background: '#ffffff',
          boxShadow: '0 4px 16px rgba(0,0,0,0.14)',
          border: `1px solid ${open ? 'rgba(14,158,110,0.4)' : 'rgba(0,0,0,0.08)'}`,
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
            background: INK,
            color: '#ffffff',
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          {key}
        </span>
        <ItemSwatch item={current} />
        <span
          style={{
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontSize: 12,
            fontWeight: current ? 500 : 400,
            color: current ? INK : MUTED,
          }}
        >
          {current?.label ?? noLayer}
        </span>
        <span style={{ flexShrink: 0, display: 'flex', color: '#8593a6' }}>
          <ChevronIcon open={open} />
        </span>
      </button>
      {open && (
        <SidePickerList
          keyLabel={key}
          menuPosition={menuPosition}
          entries={entries}
          selected={sides[side]}
          onPick={(id) => {
            setSide(side, id);
            onToggle();
          }}
        />
      )}
    </div>
  );
};

/** Closes the open picker on `Escape` or a pointer down outside any picker. */
export const useDismissPicker = (
  open: GeoVisSplitSide | null,
  close: () => void
) => {
  React.useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (target?.closest?.('[data-split-picker]')) return;
      close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, close]);
};

/**
 * Where each picker sits: centred over its own half, or — when the map is too
 * narrow for two pills side by side — stacked over the divider.
 */
export const pickerPlacement = (side: GeoVisSplitSide, stacked: boolean) => {
  if (stacked) {
    return {
      style: {
        top: side === 'a' ? 12 : 56,
        left: '50%',
        transform: 'translateX(-50%)',
      },
      menuAlign: 'center' as const,
    };
  }
  return {
    style: {
      top: 12,
      left: side === 'a' ? '25%' : '75%',
      transform: 'translateX(-50%)',
    },
    menuAlign: 'center' as const,
  };
};
