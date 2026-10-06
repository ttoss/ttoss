import { Icon } from '@ttoss/react-icons';
import { Box, Flex, Text } from '@ttoss/ui';
import * as React from 'react';

import type {
  GeovisWorkspaceSidebarChoiceOption,
  GeovisWorkspaceSidebarChoiceSetting,
} from '../../context/GeovisWorkspaceContext';
import { useGeovisWorkspace } from '../../hooks/useGeovisWorkspace';
import { COLOR, FONT_MONO } from './theme';
import { ChoiceSettingsContext } from './useChoiceSettings';
import { isGateOpen, useSidebarSections } from './useSections';

/** Glyph cells when the setting declares no colors: light to dark primary. */
const DEFAULT_GLYPH_COLORS = ['#A9CDBB', '#6FA88C', '#337C59', '#266044'];

/** Greys a disabled option's glyph, so it reads as unavailable at a glance. */
const DISABLED_GLYPH_COLORS = ['#E4DED3', '#CFC6B8', '#CFC6B8', '#B0A594'];

/** Mixes two `#rrggbb` colors, `t` of the way from `a` to `b`. */
const mix = ({ a, b, t }: { a: string; b: string; t: number }): string => {
  const channel = (hex: string, index: number) => {
    return parseInt(hex.slice(1 + index * 2, 3 + index * 2), 16);
  };
  const parts = [0, 1, 2].map((index) => {
    const value = Math.round(
      channel(a, index) + (channel(b, index) - channel(a, index)) * t
    );
    return value.toString(16).padStart(2, '0');
  });
  return `#${parts.join('')}`;
};

/** The three cells of a glyph: x offset, ramp class, and extruded height. */
const GLYPH_CELLS = [
  { x: 8, colorIndex: 0, height: 6 },
  { x: 24, colorIndex: 3, height: 14 },
  { x: 40, colorIndex: 1, height: 9 },
];

/**
 * The option's drawing: three map cells seen at an angle, lying flat or
 * standing as prisms of different heights. The prisms' side is shaded and
 * their top lit, which is what makes them read as volume at 64×36.
 */
const Glyph = ({
  glyph,
  colors,
}: {
  glyph: NonNullable<GeovisWorkspaceSidebarChoiceOption['glyph']>;
  colors: string[];
}) => {
  const y = 22;
  const width = 16;
  const depth = 6;
  const faces = GLYPH_CELLS.flatMap(({ x, colorIndex, height }) => {
    const fill = colors[Math.min(colors.length - 1, colorIndex)];
    if (glyph === 'flat') {
      return [
        {
          points: `${x},${y} ${x + width},${y} ${x + width + depth},${y - depth} ${x + depth},${y - depth}`,
          fill,
        },
      ];
    }
    const top = y - height;
    return [
      {
        points: `${x},${y} ${x + width},${y} ${x + width},${top} ${x},${top}`,
        fill,
      },
      {
        points: `${x + width},${y} ${x + width + depth},${y - depth} ${x + width + depth},${top - depth} ${x + width},${top}`,
        fill: mix({ a: fill, b: '#000000', t: 0.22 }),
      },
      {
        points: `${x},${top} ${x + width},${top} ${x + width + depth},${top - depth} ${x + depth},${top - depth}`,
        fill: mix({ a: fill, b: '#ffffff', t: 0.18 }),
      },
    ];
  });

  return (
    <svg
      viewBox="0 0 64 36"
      width="100%"
      height="36"
      aria-hidden="true"
      style={{ display: 'block' }}
    >
      {faces.map((face) => {
        return (
          <polygon
            key={face.points}
            points={face.points}
            fill={face.fill}
            stroke="#ffffff"
            strokeWidth={0.8}
            strokeLinejoin="round"
          />
        );
      })}
    </svg>
  );
};

/**
 * The option's look for a given on/disabled pair. Lifted out of the component
 * so the card's `sx` stays a flat object instead of a ternary per entry.
 */
const optionAppearance = ({
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
    labelColor: on ? COLOR.primaryDark : COLOR.textStrong,
    hover: disabled || on ? {} : { backgroundColor: COLOR.fill },
  };
};

/** One option card: the glyph when it has one, then its label and sublabel. */
const ChoiceOption = ({
  option,
  on,
  disabled,
  glyphColors,
  onPick,
}: {
  option: GeovisWorkspaceSidebarChoiceOption;
  on: boolean;
  disabled: boolean;
  glyphColors: string[];
  onPick: () => void;
}) => {
  const appearance = optionAppearance({ on, disabled });
  // A card with no drawing and no second line is a plain button: the label
  // alone is the option, set in the numeric face like the slider readouts.
  const compact = option.glyph === undefined && option.sublabel === undefined;

  return (
    <Box
      as="button"
      {...({ type: 'button', role: 'radio', disabled } as object)}
      aria-checked={on}
      aria-disabled={disabled ? 'true' : undefined}
      onClick={onPick}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px',
        minWidth: 0,
        paddingX: '8px',
        paddingY: compact ? '7px' : '10px',
        borderRadius: '6px',
        border: '1px solid',
        borderColor: appearance.borderColor,
        backgroundColor: appearance.backgroundColor,
        cursor: appearance.cursor,
        opacity: appearance.opacity,
        transition: 'background-color 0.15s ease, border-color 0.15s ease',
        '&:hover': appearance.hover,
      }}
    >
      {option.glyph ? (
        <Glyph
          glyph={option.glyph}
          colors={disabled ? DISABLED_GLYPH_COLORS : glyphColors}
        />
      ) : null}

      <Flex sx={{ flexDirection: 'column', alignItems: 'center', gap: '1px' }}>
        <Text
          sx={{
            fontFamily: compact ? FONT_MONO : undefined,
            fontSize: compact ? '11px' : '13px',
            fontWeight: compact ? 400 : 600,
            lineHeight: 1.2,
            color: appearance.labelColor,
          }}
        >
          {option.label}
        </Text>
        {option.sublabel ? (
          <Text
            sx={{ fontSize: '10px', lineHeight: 1.2, color: COLOR.textFaint }}
          >
            {option.sublabel}
          </Text>
        ) : null}
      </Flex>
    </Box>
  );
};

/** The hint of an unavailable option, under the cards. */
const DisabledHint = ({ hint }: { hint: string }) => {
  return (
    <Flex
      sx={{
        alignItems: 'flex-start',
        gap: '8px',
        marginTop: '10px',
        padding: '8px 10px',
        borderRadius: '6px',
        backgroundColor: COLOR.fillAlt,
      }}
    >
      <Box sx={{ display: 'flex', color: COLOR.textFaint, paddingTop: '1px' }}>
        <Icon icon="lucide:info" style={{ fontSize: '12px' }} />
      </Box>
      <Text sx={{ fontSize: '11px', lineHeight: 1.45, color: COLOR.textMuted }}>
        {hint}
      </Text>
    </Flex>
  );
};

/**
 * A choice among a few options, laid out side by side as cards.
 *
 * Presentational: which option is on, and what a pick does, come from the
 * sidebar's lifted choice state (`useChoiceSettings`). That state publishes
 * the *effective* value — the reader's pick while its option is available, the
 * first available option while its `enabledWhen` gate is closed — and keeps
 * the pick for when the gate reopens, whichever tab is open at the time.
 *
 * @param params.control - The choice's spec.
 * @param params.label - The block's title, naming the radio group.
 * @returns The control.
 *
 * @example
 * <ChoiceSettingControl control={{ kind: 'choice', menuId: 'view', options }} label="Visualização" />
 */
export const ChoiceSettingControl = ({
  control,
  label,
}: {
  control: GeovisWorkspaceSidebarChoiceSetting;
  label: string;
}) => {
  const { selection } = useGeovisWorkspace();
  const choices = React.useContext(ChoiceSettingsContext)!;
  const sections = useSidebarSections();
  const { menuId, options } = control;
  const effective = choices.effective(menuId);

  const availability = options.map((option) => {
    return {
      option,
      available: isGateOpen({
        gate: option.enabledWhen,
        sections,
        selection,
      }),
    };
  });

  const hints = availability.flatMap(({ option, available }) => {
    return !available && option.disabledHint ? [option.disabledHint] : [];
  });

  return (
    <Box>
      <Box
        role="radiogroup"
        aria-label={label}
        sx={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.max(1, options.length)}, minmax(0, 1fr))`,
          gap: '6px',
        }}
      >
        {availability.map(({ option, available }) => {
          return (
            <ChoiceOption
              key={option.value}
              option={option}
              on={option.value === effective}
              disabled={!available}
              glyphColors={control.glyphColors ?? DEFAULT_GLYPH_COLORS}
              onPick={() => {
                choices.pick({ menuId, value: option.value });
              }}
            />
          );
        })}
      </Box>

      {hints.map((hint) => {
        return <DisabledHint key={hint} hint={hint} />;
      })}
    </Box>
  );
};
