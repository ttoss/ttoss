import { Icon } from '@ttoss/react-icons';

import type { ProximityHit } from '../react/proximity';
import type { ProximityCategory } from '../spec/types.proximity';
import { KEYFRAMES, MONO } from './GeoVisProximitySearch.styles';
import { SURFACE, TEXT_MUTED, TEXT_STRONG } from './palette';

/** The pin colour of a place in no declared category. */
export const UNCATEGORISED = TEXT_MUTED;

/** A place's card: its kind in its colour, its name and its distance. */
const HitCard = ({
  hit,
  category,
  x,
  y,
  distance,
}: {
  hit: ProximityHit;
  category: ProximityCategory | undefined;
  x: number;
  y: number;
  distance: string;
}) => {
  const color = category?.color ?? UNCATEGORISED;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y - 44,
        zIndex: 6,
        transform: 'translate(-50%,-100%)',
        minWidth: 170,
        padding: '8px 10px',
        borderRadius: 10,
        background: SURFACE,
        boxShadow: '0 6px 20px rgba(0,0,0,0.18)',
        animation: `${KEYFRAMES.cardIn} .2s both`,
        pointerEvents: 'none',
      }}
    >
      {category && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 10,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color,
            fontWeight: 600,
          }}
        >
          <span
            style={{ width: 7, height: 7, borderRadius: 99, background: color }}
          />
          {category.label}
        </div>
      )}
      <div
        style={{
          marginTop: 3,
          fontSize: 12,
          fontWeight: 500,
          color: TEXT_STRONG,
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
          color: TEXT_MUTED,
        }}
      >
        {distance}
      </div>
    </div>
  );
};

/**
 * One place found: a drop pin in its category's colour, with its icon,
 * dropping in after the ones nearer the point. Clicking it opens its card.
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
          distance={distance}
        />
      )}
    </>
  );
};
