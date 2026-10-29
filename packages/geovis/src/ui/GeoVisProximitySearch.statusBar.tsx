import { useI18n } from '@ttoss/react-i18n';
import { Icon } from '@ttoss/react-icons';
import type * as React from 'react';

import type { ProximityHit, ProximityState } from '../react/proximity';
import type {
  ProximityCategory,
  ProximitySearch,
} from '../spec/types.proximity';
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

/** The kinds found, each with how many, in the order the spec declares them. */
const countByCategory = (
  hits: ProximityHit[],
  categories: ProximityCategory[]
) => {
  return categories
    .map((category) => {
      return {
        category,
        count: hits.filter((hit) => {
          return hit.categoryId === category.id;
        }).length,
      };
    })
    .filter(({ count }) => {
      return count > 0;
    });
};

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

/** What the bar says once the answer is in: the count, by kind when it fits. */
const FoundSummary = ({
  visible,
  categories,
  radius,
  nouns,
  compact,
  tight,
  fromUser,
  format,
}: {
  visible: ProximityHit[];
  categories: ProximityCategory[];
  radius: number;
  nouns: { one: string; other: string };
  compact: boolean;
  tight: boolean;
  fromUser: boolean;
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
              : messages.found,
          values
        );
  const counts = countByCategory(visible, categories);
  return (
    <>
      <strong style={{ fontWeight: 600 }}>{text}</strong>
      {count > 0 && !compact && counts.length > 0 && (
        <span
          style={{
            display: 'flex',
            gap: 8,
            paddingLeft: 8,
            borderLeft: '1px solid rgba(0,0,0,0.1)',
          }}
        >
          {counts.map(({ category, count: n }) => {
            return (
              <span
                key={category.id}
                title={category.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                  fontFamily: MONO,
                  fontSize: 10,
                  color: TEXT_MUTED,
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 99,
                    background: category.color,
                  }}
                />
                {n}
              </span>
            );
          })}
        </span>
      )}
    </>
  );
};

/**
 * The bar under the circle: a spinner while the search runs, and then the
 * count, the radius choice and a button that clears it.
 */
export const StatusBar = ({
  state,
  visible,
  config,
  radii,
  nouns,
  compact,
  tight,
  onRadius,
  onClear,
  format,
}: {
  state: ProximityState;
  visible: ProximityHit[];
  config: ProximitySearch;
  radii: number[];
  nouns: { one: string; other: string };
  compact: boolean;
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
              state.fromUser ? messages.searchingNearYou : messages.searching,
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
          categories={config.categories ?? []}
          radius={state.radius}
          nouns={nouns}
          compact={compact}
          tight={tight}
          fromUser={state.fromUser}
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
