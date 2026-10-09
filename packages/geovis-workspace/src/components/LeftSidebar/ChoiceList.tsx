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
 * One row of a `list` choice: icon, label and sublabel, with a check on the
 * chosen one. The check repeats what the tint says, so the state still reads
 * where the tint cannot be told apart.
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

      {on ? (
        <Box
          data-testid="choice-check"
          sx={{ display: 'flex', flexShrink: 0, color: COLOR.primary }}
        >
          <Icon icon="lucide:check" style={{ fontSize: '12px' }} />
        </Box>
      ) : null}
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
