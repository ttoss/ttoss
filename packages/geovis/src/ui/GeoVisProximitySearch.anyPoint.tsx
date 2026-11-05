import * as React from 'react';

import { OVERLAY_Z_INDEX } from './GeoVisLayerControl.styles';
import { RIGHT, SIZE, TOP } from './GeoVisMapModeControl';
import { STACK_GAP } from './GeoVisProximitySearch.locate';
import {
  ACCENT,
  ACCENT_TINT,
  ACCENT_TINT_BORDER,
  BORDER,
  SURFACE,
  TEXT_MUTED,
  TEXT_STRONG,
} from './palette';

/** Lucide's `mouse-pointer-click`: a pointer clicking. */
const PointerClickIcon = () => {
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
      <path d="M14 4.1 12 6" />
      <path d="m5.1 8-2.9-.8" />
      <path d="m6 12-1.9 2" />
      <path d="M7.2 2.2 8 5.1" />
      <path d="M9.037 9.69a.498.498 0 0 1 .653-.653l11 4.5a.5.5 0 0 1-.074.949l-4.349 1.041a1 1 0 0 0-.74.739l-1.04 4.35a.5.5 0 0 1-.95.074z" />
    </svg>
  );
};

/**
 * The button that turns on searching from any point of the map, in the map's
 * control column, styled as the map mode button: tinted and pressed while on.
 *
 * @param params.slot - How many buttons stand above it in the column — the
 * map mode button and the location button, when shown.
 */
export const AnyPointButton = ({
  slot,
  on,
  title,
  label,
  onClick,
}: {
  slot: number;
  on: boolean;
  title: string;
  label: string;
  onClick: () => void;
}) => {
  const [hovered, setHovered] = React.useState(false);
  return (
    <div
      style={{
        position: 'absolute',
        zIndex: OVERLAY_Z_INDEX,
        top: TOP + slot * (SIZE + STACK_GAP),
        right: RIGHT,
      }}
    >
      <button
        type="button"
        onClick={onClick}
        title={title}
        aria-label={label}
        aria-pressed={on}
        onMouseEnter={() => {
          setHovered(true);
        }}
        onMouseLeave={() => {
          setHovered(false);
        }}
        style={{
          width: SIZE,
          height: SIZE,
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 12,
          border: `1px solid ${on ? ACCENT_TINT_BORDER : BORDER}`,
          boxShadow: '0 4px 16px rgba(0,0,0,0.14)',
          cursor: 'pointer',
          background: on ? ACCENT_TINT : SURFACE,
          color: on ? ACCENT : hovered ? TEXT_STRONG : TEXT_MUTED,
          transition: 'color 0.15s ease',
        }}
      >
        <PointerClickIcon />
      </button>
    </div>
  );
};
