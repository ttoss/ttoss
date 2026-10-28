import { Icon } from '@ttoss/react-icons';

import type { ProximityHit } from '../react/proximity';
import type { ProximityCategory } from '../spec/types.proximity';
import { KEYFRAMES, MONO } from './GeoVisProximitySearch.styles';
import { TEXT_MUTED } from './palette';

/** The pin colour of a place in no declared category. */
export const UNCATEGORISED = TEXT_MUTED;

/** The card's own colours: white, with slate text, as the design draws it. */
const CARD_SURFACE = '#ffffff';
const CARD_TEXT = '#1a2235';
const CARD_TEXT_MUTED = '#6b7a90';
const CARD_CLOSE = '#8593a6';

/** The condensed face the card's kind is set in, the app's when it loads one. */
const CONDENSED = "'Barlow Condensed', sans-serif";

/**
 * A place's card: its kind in its colour, its name and its distance, over a
 * tail pointing at the pin, with a button that closes it.
 */
const HitCard = ({
  hit,
  category,
  x,
  y,
  scale,
  distance,
  closeLabel,
  onClose,
}: {
  hit: ProximityHit;
  category: ProximityCategory | undefined;
  x: number;
  y: number;
  scale: number;
  distance: string;
  closeLabel: string;
  onClose: () => void;
}) => {
  const color = category?.color ?? UNCATEGORISED;
  return (
    // A point clear of the pin's head, with room for the tail: the card hangs
    // from it by its bottom edge, so it grows upwards whatever its height,
    // and the fade-in only has to slide it, never to lift it.
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y - Math.round(36 * scale) - 14,
        width: 0,
        height: 0,
        zIndex: 6,
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          bottom: 0,
          transform: 'translateX(-50%)',
          minWidth: 170,
          padding: '8px 30px 8px 10px',
          borderRadius: 10,
          background: CARD_SURFACE,
          boxShadow: '0 6px 20px rgba(0,0,0,0.18)',
          animation: `${KEYFRAMES.cardIn} .2s both`,
        }}
      >
        <button
          type="button"
          aria-label={closeLabel}
          title={closeLabel}
          onClick={(event) => {
            event.stopPropagation();
            onClose();
          }}
          style={{
            position: 'absolute',
            top: 4,
            right: 4,
            width: 22,
            height: 22,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            border: 'none',
            borderRadius: 6,
            background: 'transparent',
            color: CARD_CLOSE,
            cursor: 'pointer',
          }}
        >
          <Icon icon="lucide:x" style={{ fontSize: 13, display: 'block' }} />
        </button>
        {/* The tail: a square turned on its corner, half under the card. */}
        <span
          style={{
            position: 'absolute',
            left: '50%',
            bottom: -6,
            width: 12,
            height: 12,
            marginLeft: -6,
            background: CARD_SURFACE,
            transform: 'rotate(45deg)',
            boxShadow: '3px 3px 6px rgba(0,0,0,0.08)',
          }}
        />
        {category && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: CONDENSED,
              fontSize: 10,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color,
              fontWeight: 600,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: 99,
                background: color,
              }}
            />
            {category.label}
          </div>
        )}
        <div
          style={{
            marginTop: 3,
            fontSize: 12,
            fontWeight: 500,
            color: CARD_TEXT,
            whiteSpace: 'nowrap',
          }}
        >
          {hit.name}
        </div>
        <div
          style={{
            marginTop: 2,
            fontFamily: MONO,
            fontSize: 10,
            color: CARD_TEXT_MUTED,
          }}
        >
          {distance}
        </div>
      </div>
    </div>
  );
};

/**
 * One place found: a drop pin in its category's colour, with its icon,
 * dropping in after the ones nearer the point. Clicking it opens its card;
 * clicking it again, or the card's ×, closes it.
 *
 * @param params.late - Brought by a widening, so it drops in without waiting
 * for the circle to grow.
 */
export const HitPin = ({
  hit,
  category,
  x,
  y,
  scale,
  selected,
  late,
  distance,
  closeLabel,
  onSelect,
}: {
  hit: ProximityHit;
  category: ProximityCategory | undefined;
  x: number;
  y: number;
  scale: number;
  selected: boolean;
  late: boolean;
  distance: string;
  /** Accessible name of the card's close button. */
  closeLabel: string;
  onSelect: () => void;
}) => {
  const color = category?.color ?? UNCATEGORISED;
  const pinWidth = Math.round(30 * scale);
  const drop = Math.round(24 * scale);
  const delay = (late ? 0 : 120) + hit.order * 90;
  return (
    <>
      {/* The shadow on the ground, under the tip: it fades in where the pin
          lands rather than falling with it. */}
      <span
        style={{
          position: 'absolute',
          left: x,
          top: y - 2 * scale,
          width: 12 * scale,
          height: 4 * scale,
          borderRadius: '50%',
          background: 'rgba(0,0,0,0.22)',
          transform: 'translate(-50%,-50%)',
          pointerEvents: 'none',
          animation: `${KEYFRAMES.fadeIn} .5s ${delay}ms both`,
        }}
      />
      <button
        type="button"
        title={hit.name}
        aria-label={hit.name}
        onClick={(event) => {
          event.stopPropagation();
          onSelect();
        }}
        style={{
          position: 'absolute',
          left: x,
          top: y,
          zIndex: selected ? 3 : 1,
          width: pinWidth,
          height: Math.round(36 * scale),
          padding: 0,
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          animation: `${KEYFRAMES.drop} .5s cubic-bezier(.3,1.3,.5,1) ${delay}ms both`,
        }}
      >
        <span
          style={{
            position: 'absolute',
            left: 3 * scale,
            top: 0,
            width: drop,
            height: drop,
            boxSizing: 'border-box',
            borderRadius: '50% 50% 50% 0',
            transform: 'rotate(-45deg)',
            background: color,
            border: '2px solid #ffffff',
            boxShadow: selected
              ? `0 0 0 3px ${color}55, 0 3px 8px rgba(0,0,0,0.25)`
              : '0 3px 8px rgba(0,0,0,0.25)',
          }}
        />
        <span
          style={{
            position: 'absolute',
            left: 3 * scale,
            top: 0,
            width: drop,
            height: drop,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
          }}
        >
          {category?.icon && (
            <Icon
              icon={category.icon}
              style={{ fontSize: Math.round(12 * scale), display: 'block' }}
            />
          )}
        </span>
      </button>
      {selected && (
        <HitCard
          hit={hit}
          category={category}
          x={x}
          y={y}
          scale={scale}
          distance={distance}
          closeLabel={closeLabel}
          // The open card's pin toggles it, so selecting it again closes it.
          onClose={onSelect}
        />
      )}
    </>
  );
};
