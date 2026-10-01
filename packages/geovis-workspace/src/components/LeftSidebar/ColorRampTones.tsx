import { useI18n } from '@ttoss/react-i18n';
import { Icon } from '@ttoss/react-icons';
import { Box, Flex, Text } from '@ttoss/ui';
import type * as React from 'react';

import { messages } from '../../messages';
import { COLOR, FONT_HEAD } from './theme';

/*
 * The ramp editor's two openers of the custom-color picker: the pipette, which
 * picks the base the ramp is built from, and the row of tones, each of which
 * can be adjusted on its own. The editor owns the picker (see
 * `ColorRampEditor`); these only ask for it, and a second press on the one
 * that opened it closes it.
 */

/** What the picker is editing: the base color, or one tone by index. */
export type PickerTarget = 'base' | number;

/**
 * The pipette: opens the picker for the base color, and shows it is open —
 * tinted and solid-bordered while the picker edits the base, dashed at rest.
 */
export const CustomColorButton = ({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: (anchor: HTMLElement) => void;
}) => {
  const { intl } = useI18n();

  return (
    <Box
      as="button"
      {...({
        type: 'button',
        'aria-label': intl.formatMessage(messages.customColor),
        // Shown on hover: the button is an icon alone.
        title: intl.formatMessage(messages.customizeStyles),
        'aria-expanded': open,
        'aria-haspopup': 'dialog',
      } as object)}
      onClick={(event: React.MouseEvent<HTMLElement>) => {
        onToggle(event.currentTarget);
      }}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '26px',
        height: '26px',
        padding: 0,
        borderRadius: '6px',
        cursor: 'pointer',
        backgroundColor: open ? COLOR.primaryTint : COLOR.surface,
        border: open
          ? `1px solid ${COLOR.primarySoft}`
          : `1px dashed ${COLOR.textDisabled}`,
        color: open ? COLOR.primary : COLOR.textFaint,
      }}
    >
      <Icon icon="lucide:pipette" style={{ fontSize: '12px' }} />
    </Box>
  );
};

/** One tone: its color, a ring while the picker edits it, a dot once adjusted. */
const ToneButton = ({
  index,
  color,
  adjusted,
  editing,
  onEdit,
}: {
  index: number;
  color: string;
  adjusted: boolean;
  editing: boolean;
  onEdit: (anchor: HTMLElement) => void;
}) => {
  const { intl } = useI18n();
  const title = intl.formatMessage(messages.toneTitle, {
    index: index + 1,
    color: color.toUpperCase(),
  });

  return (
    <Box
      as="button"
      {...({
        type: 'button',
        title,
        'aria-label': title,
        'aria-expanded': editing,
        'aria-haspopup': 'dialog',
        'data-tone': index,
      } as object)}
      onClick={(event: React.MouseEvent<HTMLElement>) => {
        onEdit(event.currentTarget);
      }}
      sx={{
        position: 'relative',
        flex: 1,
        height: '30px',
        padding: 0,
        cursor: 'pointer',
        borderRadius: '6px',
        backgroundColor: color,
        border: `2px solid ${editing ? '#ffffff' : 'transparent'}`,
        boxShadow: editing
          ? `0 0 0 2px ${COLOR.textStrong}`
          : `0 0 0 1px ${COLOR.border}`,
      }}
    >
      {adjusted ? (
        <Box
          aria-hidden
          data-adjusted
          sx={{
            position: 'absolute',
            top: '3px',
            right: '3px',
            width: '6px',
            height: '6px',
            borderRadius: '999px',
            backgroundColor: '#ffffff',
            boxShadow: '0 0 0 1px rgba(0,0,0,0.35)',
          }}
        />
      ) : null}
    </Box>
  );
};

/**
 * The ramp the editor would save, as a row of tones the reader can adjust one
 * by one. It replaces the passive preview strip: what the row shows is exactly
 * what is saved, adjustments included. "Restaurar" appears once any tone was
 * adjusted, and puts every tone back to the one built from the base.
 *
 * @param params.colors - The tones, adjustments applied.
 * @param params.adjusted - Which of them the reader adjusted, by index.
 * @param params.editing - The tone the picker is editing, if any.
 * @param params.onEdit - Asks to open (or close) the picker for a tone.
 * @param params.onReset - Drops every adjustment.
 * @returns The labelled row.
 */
export const ToneRow = ({
  colors,
  adjusted,
  editing,
  onEdit,
  onReset,
}: {
  colors: string[];
  adjusted: ReadonlySet<number>;
  editing: number | null;
  onEdit: (index: number, anchor: HTMLElement) => void;
  onReset: () => void;
}) => {
  const { intl } = useI18n();

  return (
    <Box>
      <Flex
        sx={{
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: '8px',
          marginBottom: '6px',
        }}
      >
        <Text
          sx={{
            fontFamily: FONT_HEAD,
            fontSize: '10px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: COLOR.textMuted,
          }}
        >
          {intl.formatMessage(messages.toneRowLabel)}
        </Text>
        {adjusted.size > 0 ? (
          <Box
            as="button"
            {...({ type: 'button' } as object)}
            onClick={onReset}
            sx={{
              padding: 0,
              border: 0,
              backgroundColor: 'transparent',
              cursor: 'pointer',
              fontSize: '10px',
              color: COLOR.primaryDark,
            }}
          >
            {intl.formatMessage(messages.resetTones)}
          </Box>
        ) : null}
      </Flex>

      <Flex sx={{ gap: '4px' }}>
        {colors.map((color, index) => {
          return (
            <ToneButton
              // The ramp may repeat a color, so the index is what stays stable.
              key={index}
              index={index}
              color={color}
              adjusted={adjusted.has(index)}
              editing={editing === index}
              onEdit={(anchor) => {
                onEdit(index, anchor);
              }}
            />
          );
        })}
      </Flex>
    </Box>
  );
};
