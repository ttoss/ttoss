import { Icon } from '@ttoss/react-icons';
import { Box, Flex, Text } from '@ttoss/ui';

import type {
  GeovisWorkspaceSidebarColorRampOption,
  GeovisWorkspaceSidebarColorRampSetting,
} from '../../context/GeovisWorkspaceContext';
import { COLOR } from './theme';
import { useSettingValue } from './useSettingValue';

/**
 * The ramp's classes, drawn as one strip.
 *
 * The swatches sit flush against each other inside a clipped, hairlined box:
 * gaps between them would read as four colors that happen to be listed
 * together, where the point is the sweep from one end to the other. The hairline
 * is what keeps a pale first class off a pale surface.
 */
const RampStrip = ({ colors }: { colors: string[] }) => {
  return (
    <Flex
      sx={{
        flexShrink: 0,
        borderRadius: '3px',
        overflow: 'hidden',
        boxShadow: `0 0 0 1px ${COLOR.border}`,
      }}
    >
      {colors.map((color, index) => {
        return (
          <Box
            // Colors are the identity here and a ramp may repeat one, so the
            // index is what stays stable across a re-render.
            key={`${color}-${index}`}
            sx={{ width: '15px', height: '15px', backgroundColor: color }}
          />
        );
      })}
    </Flex>
  );
};

/** One ramp: its strip, its name, and a check once it is the chosen one. */
const RampRow = ({
  option,
  on,
  onSelect,
}: {
  option: GeovisWorkspaceSidebarColorRampOption;
  on: boolean;
  onSelect: () => void;
}) => {
  return (
    <Box
      as="button"
      {...({ type: 'button', 'aria-pressed': on } as object)}
      onClick={onSelect}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        width: '100%',
        padding: '7px 9px',
        borderRadius: '7px',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background-color 0.15s ease, border-color 0.15s ease',
        backgroundColor: on ? COLOR.primaryTint : 'transparent',
        border: `1px solid ${on ? COLOR.primaryTintBorder : 'transparent'}`,
        '&:hover': { backgroundColor: on ? COLOR.primaryTint : COLOR.fill },
      }}
    >
      <RampStrip colors={option.colors} />

      <Text
        sx={{
          flex: 1,
          minWidth: 0,
          fontSize: '12px',
          fontWeight: on ? 500 : 400,
          color: on ? COLOR.textStrong : COLOR.textMuted,
        }}
      >
        {option.label}
      </Text>

      {on ? (
        <Icon
          icon="lucide:check"
          style={{ flexShrink: 0, fontSize: '12px', color: COLOR.primary }}
        />
      ) : null}
    </Box>
  );
};

/**
 * A color-ramp setting: the ramps listed one per row, the chosen one marked.
 *
 * The check rather than the dot a variation row uses: the row already carries
 * its own colors, and a colored dot beside four colored swatches reads as a
 * fifth. The chosen ramp's `id` is published to the shared selection under
 * `menuId`, so the app repaints from it — the `colors` stay in the config the
 * app already holds, rather than being sent through a selection that holds one
 * string per key.
 *
 * @param params.control - The ramp list's spec.
 * @param params.label - The block's title, naming the list for assistive tech.
 * @returns The control.
 *
 * @example
 * <ColorRampSettingControl control={{ kind: 'colorRamp', menuId: 'ramp', options }} label="Mesh color" />
 */
export const ColorRampSettingControl = ({
  control,
  label,
}: {
  control: GeovisWorkspaceSidebarColorRampSetting;
  label: string;
}) => {
  const { options } = control;

  const [raw, setRaw] = useSettingValue({
    menuId: control.menuId,
    defaultValue: control.defaultValue ?? options[0]?.id ?? '',
  });

  /*
   * An id matching no option — a stale permalink, or a ramp dropped from the
   * config — rests on the first one rather than leaving the list with nothing
   * marked and the map painted by a ramp the user cannot see selected.
   */
  const chosen =
    options.find((option) => {
      return option.id === raw;
    }) ?? options[0];

  return (
    <Flex
      role="group"
      aria-label={label}
      sx={{ flexDirection: 'column', gap: '4px' }}
    >
      {options.map((option) => {
        return (
          <RampRow
            key={option.id}
            option={option}
            on={option.id === chosen?.id}
            onSelect={() => {
              setRaw(option.id);
            }}
          />
        );
      })}
    </Flex>
  );
};
