import { useI18n } from '@ttoss/react-i18n';
import { Icon } from '@ttoss/react-icons';
import type * as React from 'react';

import type { ProximityHit, ProximityState } from '../react/proximity';
import { messages } from './GeoVisProximitySearch.messages';
import { Spinner } from './GeoVisProximitySearch.parts';
import { KEYFRAMES, MONO } from './GeoVisProximitySearch.styles';
import {
  ACCENT,
  NEUTRAL_FILL,
  SURFACE,
  TEXT_MUTED,
  TEXT_STRONG,
} from './palette';

/** The radius choice: one segment per radius on offer. */
const RadiusChoice = ({
  radii,
  radius,
  onPick,
  format,
}: {
  radii: number[];
  radius: number;
  onPick: (radius: number) => void;
  format: (metres: number) => string;
}) => {
  const { intl } = useI18n();
  return (
    <div
      role="radiogroup"
      aria-label={intl.formatMessage(messages.radiusGroup)}
      style={{
        display: 'flex',
        padding: 2,
        gap: 2,
        borderRadius: 8,
        background: NEUTRAL_FILL,
      }}
    >
      {radii.map((option) => {
        const on = option === radius;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => {
              onPick(option);
            }}
            title={intl.formatMessage(messages.radiusOption, {
              radius: format(option),
            })}
            style={{
              height: 24,
              padding: '0 8px',
              border: 'none',
              borderRadius: 6,
              background: on ? ACCENT : 'transparent',
              color: on ? '#ffffff' : TEXT_MUTED,
              fontFamily: MONO,
              fontSize: 11,
              fontWeight: 600,
              cursor: on ? 'default' : 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: on ? '0 1px 3px rgba(0,0,0,0.15)' : 'none',
            }}
          >
            {format(option)}
          </button>
        );
      })}
    </div>
  );
};

/** What the bar says once the answer is in: how many were found, and where. */
const FoundSummary = ({
  visible,
  radius,
  nouns,
  tight,
  fromUser,
  fromPoint,
  format,
}: {
  visible: ProximityHit[];
  radius: number;
  nouns: { one: string; other: string };
  tight: boolean;
  fromUser: boolean;
  fromPoint: boolean;
  format: (metres: number) => string;
}) => {
  const { intl } = useI18n();
  const count = visible.length;
  const values = { count, radius: format(radius), ...nouns };
  const text =
    count === 0
      ? intl.formatMessage(messages.nothing, values)
      : intl.formatMessage(
          tight
            ? messages.foundShort
            : fromUser
              ? messages.foundNearYou
              : fromPoint
                ? messages.foundNearPoint
                : messages.found,
          values
        );
  return <strong style={{ fontWeight: 600 }}>{text}</strong>;
};

/**
 * The bar under the circle: a spinner while the search runs, and then the
 * count, the radius choice and a button that clears it.
 */
export const StatusBar = ({
  state,
  visible,
  radii,
  nouns,
  tight,
  onRadius,
  onClear,
  format,
}: {
  state: ProximityState;
  visible: ProximityHit[];
  radii: number[];
  nouns: { one: string; other: string };
  tight: boolean;
  onRadius: (radius: number) => void;
  onClear: () => void;
  format: (metres: number) => string;
}) => {
  const { intl } = useI18n();
  const radius = format(state.radius);
  const clearLabel = intl.formatMessage(messages.clear);
  let content: React.ReactNode;
  if (state.status === 'loading') {
    content = (
      <>
        <Spinner />
        {state.fetched === 0
          ? intl.formatMessage(
              state.fromUser
                ? messages.searchingNearYou
                : state.fromPoint
                  ? messages.searchingNearPoint
                  : messages.searching,
              { results: nouns.other }
            )
          : intl.formatMessage(messages.widening, { radius })}
      </>
    );
  } else {
    content = (
      <>
        <FoundSummary
          visible={visible}
          radius={state.radius}
          nouns={nouns}
          tight={tight}
          fromUser={state.fromUser}
          fromPoint={state.fromPoint}
          format={format}
        />
        {radii.length > 1 && (
          <RadiusChoice
            radii={radii}
            radius={state.radius}
            onPick={onRadius}
            format={format}
          />
        )}
        <button
          type="button"
          onClick={onClear}
          aria-label={clearLabel}
          title={clearLabel}
          style={{
            display: 'flex',
            padding: 2,
            marginRight: -4,
            border: 'none',
            background: 'none',
            color: TEXT_MUTED,
            cursor: 'pointer',
          }}
        >
          <Icon icon="lucide:x" style={{ fontSize: 13, display: 'block' }} />
        </button>
      </>
    );
  }
  const key =
    state.status === 'done' ? 'done' : `${state.status}${state.radius}`;
  return (
    <div
      key={key}
      style={{
        maxWidth: '100%',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        minHeight: 36,
        padding: '4px 6px 4px 12px',
        borderRadius: 10,
        background: SURFACE,
        boxShadow: '0 4px 16px rgba(0,0,0,0.14)',
        fontSize: 12,
        fontWeight: 500,
        color: TEXT_STRONG,
        whiteSpace: 'nowrap',
        animation: `${KEYFRAMES.fadeIn} .25s both`,
        pointerEvents: state.status === 'done' ? 'auto' : 'none',
      }}
    >
      {content}
    </div>
  );
};
