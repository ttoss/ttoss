import { defineMessages, useI18n } from '@ttoss/react-i18n';
import * as React from 'react';

import { type GeoVisMapMode, useGeoVisMapMode } from '../react/mapMode';
import {
  ACCENT,
  ACCENT_TINT,
  ACCENT_TINT_BORDER,
  ACCENT_TINT_STRONG,
  BORDER,
  NEUTRAL_FILL,
  SURFACE,
  TEXT_MUTED,
  TEXT_STRONG,
} from './palette';

const messages = defineMessages({
  mapMode: {
    defaultMessage: 'Map mode',
    description:
      'Map mode control: the button label and the heading of its menu, which switches between one map and two side by side.',
  },
  single: {
    defaultMessage: 'Single map',
    description: 'Map mode menu option: one map.',
  },
  singleDescription: {
    defaultMessage: 'One map, full screen',
    description: 'Map mode menu: what the "Single map" option shows.',
  },
  split: {
    defaultMessage: 'Split in two',
    description: 'Map mode menu option: two maps side by side.',
  },
  splitDescription: {
    defaultMessage: 'Compare side by side',
    description: 'Map mode menu: what the "Split in two" option is for.',
  },
});

/** The engine's navigation control: 29px buttons, 10px from the corner. */
const NAV_BUTTON = 29;
const NAV_MARGIN = 10;

/**
 * The button's side: roomier than the navigation control's buttons, so the
 * glyph breathes as in the workspace's own floating buttons.
 */
const SIZE = 36;

/**
 * Where the button sits: right under the navigation control (zoom in, zoom
 * out and compass), centred on that column rather than flush with its edge —
 * being wider, flush would leave it visibly off the column's axis.
 */
const TOP = NAV_MARGIN + 3 * NAV_BUTTON + 2 + 10;
const RIGHT = NAV_MARGIN - (SIZE - NAV_BUTTON) / 2;

/** How many maps the badge counts while split. */
const SPLIT_COUNT = 2;

/** The two modes the menu offers, with the panes their thumbnails draw. */
const MODES: {
  id: GeoVisMapMode;
  label: keyof typeof messages;
  description: keyof typeof messages;
  panes: [x: number, width: number][];
}[] = [
  {
    id: 'single',
    label: 'single',
    description: 'singleDescription',
    panes: [[1, 38]],
  },
  {
    id: 'split',
    label: 'split',
    description: 'splitDescription',
    panes: [
      [1, 18],
      [21, 18],
    ],
  },
];

/** `layout-panel-left`: the button's glyph, a panel beside a split column. */
const ModeIcon = () => {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      style={{ display: 'block' }}
    >
      <rect x="3" y="3" width="7" height="18" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
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

/** A mode's thumbnail: its panes as outlined rectangles, tinted when chosen. */
const ModeThumbnail = ({
  panes,
  on,
}: {
  panes: [number, number][];
  on: boolean;
}) => {
  return (
    <svg
      viewBox="0 0 40 28"
      width="40"
      height="28"
      aria-hidden
      style={{ display: 'block', flexShrink: 0 }}
    >
      {panes.map(([x, width]) => {
        return (
          <rect
            key={x}
            x={x}
            y={1}
            width={width}
            height={26}
            rx={3}
            fill={on ? ACCENT_TINT_STRONG : NEUTRAL_FILL}
            stroke={on ? ACCENT : BORDER}
            strokeWidth={1}
          />
        );
      })}
    </svg>
  );
};

/** Closes the menu on `Escape` or a pointer down outside the control. */
const useDismiss = (open: boolean, close: () => void) => {
  React.useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (target?.closest?.('[data-map-mode]')) return;
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

/** The badge counting the maps while split. */
const SplitBadge = () => {
  return (
    <span
      style={{
        position: 'absolute',
        top: -6,
        right: -6,
        height: 13,
        minWidth: 13,
        padding: '0 3px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 999,
        background: ACCENT,
        border: '1px solid #ffffff',
        color: '#ffffff',
        fontSize: 8,
        fontWeight: 600,
        lineHeight: 1,
      }}
    >
      {SPLIT_COUNT}
    </span>
  );
};

/** One mode in the menu: its thumbnail, name and what it is for. */
const ModeOption = ({
  option,
  on,
  onPick,
}: {
  option: (typeof MODES)[number];
  on: boolean;
  onPick: () => void;
}) => {
  const { intl } = useI18n();
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      onClick={onPick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 10px 8px 8px',
        borderRadius: 8,
        cursor: 'pointer',
        textAlign: 'left',
        background: on ? ACCENT_TINT : 'transparent',
        border: `1px solid ${on ? ACCENT_TINT_BORDER : 'transparent'}`,
      }}
    >
      <ModeThumbnail panes={option.panes} on={on} />
      <span style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            display: 'block',
            fontSize: 12,
            fontWeight: on ? 500 : 400,
            color: TEXT_STRONG,
          }}
        >
          {intl.formatMessage(messages[option.label])}
        </span>
        <span
          style={{
            display: 'block',
            marginTop: 1,
            fontSize: 10,
            lineHeight: 1.35,
            color: TEXT_MUTED,
          }}
        >
          {intl.formatMessage(messages[option.description])}
        </span>
      </span>
      {on && (
        <span style={{ display: 'flex', color: ACCENT }}>
          <CheckIcon />
        </span>
      )}
    </button>
  );
};

/** The menu beside the button: one radio per mode. */
const ModeMenu = ({
  mode,
  onPick,
}: {
  mode: GeoVisMapMode;
  onPick: (mode: GeoVisMapMode) => void;
}) => {
  const { intl } = useI18n();
  const title = intl.formatMessage(messages.mapMode);
  return (
    <div
      role="radiogroup"
      aria-label={title}
      style={{
        position: 'absolute',
        top: 0,
        right: 'calc(100% + 10px)',
        width: 248,
        padding: 10,
        borderRadius: 12,
        background: SURFACE,
        boxShadow: '0 8px 28px rgba(0,0,0,0.14)',
        border: `1px solid ${BORDER}`,
      }}
    >
      <div
        style={{
          padding: '2px 4px 10px',
          fontSize: 10,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: TEXT_MUTED,
        }}
      >
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {MODES.map((option) => {
          return (
            <ModeOption
              key={option.id}
              option={option}
              on={mode === option.id}
              onPick={() => {
                onPick(option.id);
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

/**
 * The "Modo do mapa" button `<GeoVisProvider>` auto-mounts in the map's
 * top-right corner when `spec.mapModeControl` is set: a menu choosing between
 * one map and two side by side. Tinted, with a "2" badge, while split.
 *
 * @example
 * // Mounted by the provider — the spec only opts in:
 * const spec = { ...base, control, mapModeControl: true };
 */
export const GeoVisMapModeControl = () => {
  const { enabled, mode, setMode } = useGeoVisMapMode();
  const { intl } = useI18n();
  const [open, setOpen] = React.useState(false);
  const [hovered, setHovered] = React.useState(false);
  const close = React.useCallback(() => {
    setOpen(false);
  }, []);
  useDismiss(open, close);

  if (!enabled) return null;

  const split = mode === 'split';
  const active = open || split;
  const label = intl.formatMessage(messages.mapMode);

  return (
    <div
      data-map-mode
      style={{ position: 'absolute', zIndex: 23, top: TOP, right: RIGHT }}
    >
      <button
        type="button"
        onClick={() => {
          setOpen((prev) => {
            return !prev;
          });
        }}
        title={label}
        aria-label={label}
        aria-expanded={open}
        onMouseEnter={() => {
          setHovered(true);
        }}
        onMouseLeave={() => {
          setHovered(false);
        }}
        style={{
          position: 'relative',
          width: SIZE,
          height: SIZE,
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 12,
          border: `1px solid ${active ? ACCENT_TINT_BORDER : BORDER}`,
          boxShadow: '0 4px 16px rgba(0,0,0,0.14)',
          cursor: 'pointer',
          background: active ? ACCENT_TINT : SURFACE,
          // As the workspace's button: hover darkens only the icon.
          color: active ? ACCENT : hovered ? TEXT_STRONG : TEXT_MUTED,
          transition: 'color 0.15s ease',
        }}
      >
        <ModeIcon />
        {split && <SplitBadge />}
      </button>
      {open && (
        <ModeMenu
          mode={mode}
          onPick={(next) => {
            setMode(next);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
};
