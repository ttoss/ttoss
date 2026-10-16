import { Icon } from '@ttoss/react-icons';
import { Box, Flex, Text } from '@ttoss/ui';

import type { GeovisWorkspaceSidebarChoiceOption } from '../../context/GeovisWorkspaceContext';
import { COLOR, FONT_MONO } from './theme';

/** A list row's look for a given on/disabled pair. */
const rowAppearance = ({
  on,
  disabled,
}: {
  on: boolean;
  disabled: boolean;
}) => {
  return {
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    backgroundColor: on ? COLOR.primaryTint : COLOR.fillAlt,
    borderColor: on ? COLOR.primaryTintBorder : 'transparent',
    iconColor: on ? COLOR.primary : COLOR.textGhost,
    labelColor: on ? COLOR.textStrong : COLOR.textMuted,
    labelWeight: on ? 500 : 400,
    hover: disabled || on ? {} : { backgroundColor: COLOR.fill },
  };
};

/** The option's icon, label and — under it, in mono — its sublabel. */
const RowText = ({
  option,
  iconColor,
  labelColor,
  labelWeight,
}: {
  option: GeovisWorkspaceSidebarChoiceOption;
  iconColor: string;
  labelColor: string;
  labelWeight: number;
}) => {
  return (
    <>
      {option.icon ? (
        <Box sx={{ display: 'flex', flexShrink: 0, color: iconColor }}>
          <Icon icon={option.icon} style={{ fontSize: '14px' }} />
        </Box>
      ) : null}

      <Flex sx={{ flex: 1, minWidth: 0, flexDirection: 'column', gap: '1px' }}>
        <Text
          sx={{
            fontSize: '12px',
            fontWeight: labelWeight,
            lineHeight: 1.3,
            color: labelColor,
          }}
        >
          {option.label}
        </Text>
        {option.sublabel ? (
          <Text
            sx={{
              fontFamily: FONT_MONO,
              fontSize: '10px',
              lineHeight: 1.3,
              color: COLOR.textFaint,
            }}
          >
            {option.sublabel}
          </Text>
        ) : null}
      </Flex>
    </>
  );
};

/**
 * The option's `count`, in the numeric face on a small pill: tinted with the
 * row while it is the chosen one, grey otherwise.
 */
const CountPill = ({ count, on }: { count: number | string; on: boolean }) => {
  return (
    <Box
      as="span"
      data-testid="choice-count"
      sx={{
        flexShrink: 0,
        fontFamily: FONT_MONO,
        fontSize: '11px',
        fontWeight: 500,
        lineHeight: 1.4,
        paddingX: '6px',
        paddingY: '1px',
        borderRadius: '4px',
        color: on ? COLOR.primaryDark : COLOR.textFaint,
        backgroundColor: on ? COLOR.primaryTintStrong : COLOR.fill,
      }}
    >
      {count}
    </Box>
  );
};

/** The check on the chosen option, repeating what the tint says. */
const Check = () => {
  return (
    <Box
      data-testid="choice-check"
      sx={{ display: 'flex', flexShrink: 0, color: COLOR.primary }}
    >
      <Icon icon="lucide:check" style={{ fontSize: '12px' }} />
    </Box>
  );
};

/**
 * One row of a `list` choice: icon, label and sublabel, with the option's
 * `count` on the right, or — without one — a check on the chosen row. The
 * check repeats what the tint says, so the state still reads where the tint
 * cannot be told apart; a count pill takes the tint itself, so it does the
 * same.
 */
export const ChoiceListRow = ({
  option,
  on,
  disabled,
  onPick,
}: {
  option: GeovisWorkspaceSidebarChoiceOption;
  on: boolean;
  disabled: boolean;
  onPick: () => void;
}) => {
  const appearance = rowAppearance({ on, disabled });

  return (
    <Box
      as="button"
      {...({ type: 'button', role: 'radio', disabled } as object)}
      aria-checked={on}
      aria-disabled={disabled ? 'true' : undefined}
      onClick={onPick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        width: '100%',
        padding: '8px 10px',
        borderRadius: '8px',
        textAlign: 'left',
        border: '1px solid',
        borderColor: appearance.borderColor,
        backgroundColor: appearance.backgroundColor,
        cursor: appearance.cursor,
        opacity: appearance.opacity,
        transition: 'background-color 0.15s ease, border-color 0.15s ease',
        '&:hover': appearance.hover,
      }}
    >
      <RowText
        option={option}
        iconColor={appearance.iconColor}
        labelColor={appearance.labelColor}
        labelWeight={appearance.labelWeight}
      />

      {option.count !== undefined ? (
        <CountPill count={option.count} on={on} />
      ) : on ? (
        <Check />
      ) : null}
    </Box>
  );
};

/**
 * One button of a `grid` choice: a compact cell with the label on the left —
 * cut with an ellipsis, whole on hover, so every row keeps its height — and a
 * check on the chosen one.
 */
export const ChoiceGridButton = ({
  option,
  on,
  disabled,
  onPick,
}: {
  option: GeovisWorkspaceSidebarChoiceOption;
  on: boolean;
  disabled: boolean;
  onPick: () => void;
}) => {
  const appearance = rowAppearance({ on, disabled });

  return (
    <Box
      as="button"
      {...({
        type: 'button',
        role: 'radio',
        disabled,
        title: option.label,
      } as object)}
      aria-checked={on}
      aria-disabled={disabled ? 'true' : undefined}
      onClick={onPick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        minWidth: 0,
        height: '34px',
        paddingX: '10px',
        borderRadius: '8px',
        textAlign: 'left',
        fontSize: '12px',
        fontWeight: appearance.labelWeight,
        color: appearance.labelColor,
        border: '1px solid',
        borderColor: appearance.borderColor,
        backgroundColor: appearance.backgroundColor,
        cursor: appearance.cursor,
        opacity: appearance.opacity,
        transition: 'background-color 0.15s ease, border-color 0.15s ease',
        '&:hover': appearance.hover,
      }}
    >
      {option.icon ? (
        <Box
          sx={{ display: 'flex', flexShrink: 0, color: appearance.iconColor }}
        >
          <Icon icon={option.icon} style={{ fontSize: '12px' }} />
        </Box>
      ) : null}

      <Box
        as="span"
        sx={{
          flex: 1,
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {option.label}
      </Box>

      {on ? <Check /> : null}
    </Box>
  );
};

/**
 * The single option of a `list` choice, as a read-only card: there is nothing
 * to pick, but the reader still sees what the value stands for. Tinted as a
 * chosen row is, since it is the one in effect.
 */
export const ChoiceSingleCard = ({
  option,
}: {
  option: GeovisWorkspaceSidebarChoiceOption;
}) => {
  return (
    <Flex
      sx={{
        alignItems: 'center',
        gap: '10px',
        padding: '9px 10px',
        borderRadius: '8px',
        backgroundColor: COLOR.primaryTint,
        border: `1px solid ${COLOR.primaryTintBorder}`,
      }}
    >
      {/* Label only, as in the prototype: with one dataset there is no range
          to tell it apart from another. */}
      <RowText
        option={{ ...option, sublabel: undefined }}
        iconColor={COLOR.primary}
        labelColor={COLOR.textStrong}
        labelWeight={500}
      />
    </Flex>
  );
};
