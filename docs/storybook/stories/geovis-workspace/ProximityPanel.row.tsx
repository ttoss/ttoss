/**
 * One place in the `ProximityPanel` story's sidebar: its kind, name and
 * distance, expanding into its details.
 */
import type { ProximityHit } from '@ttoss/geovis';
import { Icon } from '@ttoss/react-icons';
import * as React from 'react';

import { CATEGORIES } from '../geovis/SearchingForServicesByDistance.fixtures';
import {
  AMBER,
  detailsOf,
  FAINT,
  fieldLabel,
  FONT_HEAD,
  FONT_MONO,
  formatDistance,
  GREEN,
  HAIRLINE,
  INK,
  MUTED,
  travelTimes,
} from './ProximityPanel.parts';

/** The expanded part of a row: the place's details and how far it is. */
const PlaceDetails = ({ hit }: { hit: ProximityHit }) => {
  const details = detailsOf(hit);
  const { walk, car } = travelTimes(hit.distance);
  const value: React.CSSProperties = { fontSize: 12, color: INK };
  return (
    <div style={{ padding: '0 20px 16px 64px' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '74px 1fr',
          gap: '5px 10px',
          alignItems: 'baseline',
        }}
      >
        <div style={fieldLabel}>Endereço</div>
        <div style={{ ...value, lineHeight: 1.45 }}>{details.address}</div>
        <div style={fieldLabel}>Horário</div>
        <div style={value}>{details.hours}</div>
        <div style={fieldLabel}>Atende</div>
        <div style={value}>{details.serves}</div>
        <div style={fieldLabel}>Telefone</div>
        <div style={{ ...value, fontFamily: FONT_MONO, fontSize: 11 }}>
          {details.phone}
        </div>
        <div style={fieldLabel}>Trajeto</div>
        <div
          style={{
            ...value,
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px 10px',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icon icon="lucide:footprints" width={12} />
            {walk} min a pé
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icon icon="lucide:car" width={12} />
            {car} min de carro
          </span>
        </div>
      </div>
    </div>
  );
};

/** Open or closed right now, as a coloured dot and a word. */
const OpenStatus = ({ open }: { open: boolean }) => {
  const color = open ? GREEN : AMBER;
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color }}>
      <span
        style={{ width: 5, height: 5, borderRadius: 99, background: color }}
      />
      {open ? 'Aberto agora' : 'Fechado agora'}
    </span>
  );
};

/** The place's kind as an icon on a square of its colour. */
const KindChip = ({ color, icon }: { color: string; icon?: string }) => {
  return (
    <span
      style={{
        flexShrink: 0,
        width: 32,
        height: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 9,
        background: color,
        color: '#ffffff',
      }}
    >
      {icon && <Icon icon={icon} width={16} />}
    </span>
  );
};

/** The chevron that turns as the row opens. */
const Chevron = ({ expanded }: { expanded: boolean }) => {
  return (
    <span
      style={{
        flexShrink: 0,
        display: 'flex',
        color: FAINT,
        paddingTop: 8,
        transition: 'transform .2s',
        transform: expanded ? 'rotate(180deg)' : 'none',
      }}
    >
      <Icon icon="lucide:chevron-down" width={16} />
    </span>
  );
};

/** One place: its kind, name, distance and whether it is open, expandable. */
export const PlaceRow = ({
  hit,
  expanded,
  onToggle,
}: {
  hit: ProximityHit;
  expanded: boolean;
  onToggle: () => void;
}) => {
  const category = CATEGORIES.find((c) => {
    return c.id === hit.categoryId;
  });
  const color = category?.color ?? FAINT;
  const ref = React.useRef<HTMLDivElement>(null);

  // A pin clicked on the map expands its row: bring it into view.
  React.useEffect(() => {
    if (expanded) ref.current?.scrollIntoView({ block: 'nearest' });
  }, [expanded]);

  return (
    <div
      ref={ref}
      style={{
        borderBottom: HAIRLINE,
        background: expanded ? `${color}0d` : 'transparent',
        transition: 'background .15s',
      }}
    >
      <button
        type="button"
        className="pp-row"
        onClick={onToggle}
        aria-expanded={expanded}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
          padding: '14px 20px',
          border: 0,
          background: 'transparent',
          textAlign: 'left',
          cursor: 'pointer',
          font: 'inherit',
        }}
      >
        <KindChip color={color} icon={category?.icon} />
        <span
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}
        >
          <span
            style={{
              fontFamily: FONT_HEAD,
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color,
            }}
          >
            {category?.label}
          </span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 500,
              lineHeight: 1.3,
              color: INK,
              textWrap: 'pretty',
            }}
          >
            {hit.name}
          </span>
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginTop: 2,
              fontSize: 11,
              color: MUTED,
            }}
          >
            <span style={{ fontFamily: FONT_MONO, fontSize: 10.5, color: INK }}>
              {formatDistance(hit.distance)}
            </span>
            <span>·</span>
            <OpenStatus open={detailsOf(hit).open} />
          </span>
        </span>
        <Chevron expanded={expanded} />
      </button>
      {expanded && <PlaceDetails hit={hit} />}
    </div>
  );
};
