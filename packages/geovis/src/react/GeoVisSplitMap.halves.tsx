import { defineMessages, useI18n } from '@ttoss/react-i18n';
import type * as React from 'react';

import { useGeoVisMapMode } from './mapMode';
import { type GeoVisSplitSide, SPLIT_SIDE_COLOR } from './mapMode.split';

const messages = defineMessages({
  editSide: {
    defaultMessage: 'Edit map {side}',
    description:
      'Split map mode: the title and accessible name of the half that is not being edited; clicking it makes it the one edited. {side} is the side letter, A (left) or B (right).',
  },
});

const SIDES: GeoVisSplitSide[] = ['a', 'b'];

/**
 * Marks which half of a split map the reader is editing, while the app builds
 * the sides: that half is ringed in its side's colour, and the other is
 * veiled, a click on it making it the one edited. The veil takes that one
 * click; the edited half lets every gesture through to its map.
 */
export const SplitHalves = ({ dividerAt }: { dividerAt: number | string }) => {
  const { activeSide, setActiveSide } = useGeoVisMapMode();
  const { intl } = useI18n();

  return (
    <>
      {SIDES.map((side) => {
        const placement: React.CSSProperties =
          side === 'a'
            ? { left: 0, width: dividerAt }
            : { left: dividerAt, right: 0 };
        if (side === activeSide) {
          return (
            <div
              key={side}
              aria-hidden
              data-split-active={side}
              style={{
                position: 'absolute',
                zIndex: 3,
                top: 0,
                bottom: 0,
                ...placement,
                pointerEvents: 'none',
                boxShadow: `inset 0 0 0 3px ${SPLIT_SIDE_COLOR[side]}`,
                transition: 'box-shadow .2s',
              }}
            />
          );
        }
        const label = intl.formatMessage(messages.editSide, {
          side: side.toUpperCase(),
        });
        return (
          <button
            key={side}
            type="button"
            title={label}
            aria-label={label}
            onClick={() => {
              setActiveSide(side);
            }}
            style={{
              position: 'absolute',
              zIndex: 3,
              top: 0,
              bottom: 0,
              ...placement,
              padding: 0,
              border: 0,
              cursor: 'pointer',
              background: 'rgba(26,34,53,0.04)',
              transition: 'background .2s',
            }}
          />
        );
      })}
    </>
  );
};
