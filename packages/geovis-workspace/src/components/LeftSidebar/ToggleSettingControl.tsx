import { Icon } from '@ttoss/react-icons';
import { Box, Text } from '@ttoss/ui';

import type { GeovisWorkspaceSidebarToggleSetting } from '../../context/GeovisWorkspaceContext';
import { COLOR, FONT_HEAD } from './theme';
import { useSettingValue } from './useSettingValue';

/** The switch itself: a track the knob slides across, tinted when on. */
const Switch = ({ on }: { on: boolean }) => {
  return (
    <Box
      sx={{
        position: 'relative',
        flexShrink: 0,
        width: '34px',
        height: '20px',
        borderRadius: '999px',
        transition: 'background-color 0.15s ease',
        backgroundColor: on ? COLOR.primary : COLOR.fill,
        border: `1px solid ${on ? COLOR.primary : COLOR.border}`,
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: '2px',
          left: on ? '16px' : '2px',
          width: '14px',
          height: '14px',
          borderRadius: '999px',
          backgroundColor: COLOR.surface,
          transition: 'left 0.15s ease',
        }}
      />
    </Box>
  );
};

/**
 * A boolean setting: a full-width row carrying its block's title and the switch.
 *
 * The switch is the only state indicator on screen — its knob and tint say
 * enough, and a word beside it would repeat them. `aria-pressed` on the row is
 * what carries the state where the tint cannot be seen.
 *
 * The row is the button, not just the switch — a 34×20 target is small, and the
 * label beside it is what the pointer is already aimed at. The state is
 * published to the shared selection under `menuId`, so the app redraws from it.
 *
 * @param params.control - The toggle's spec.
 * @param params.label - The block's title, rendered inside the row.
 * @returns The control.
 *
 * @example
 * <ToggleSettingControl control={{ kind: 'toggle', menuId: 'hideEmpty', defaultValue: false }} label="Hide empty cells" />
 */
export const ToggleSettingControl = ({
  control,
  label,
}: {
  control: GeovisWorkspaceSidebarToggleSetting;
  label: string;
}) => {
  const [raw, setRaw] = useSettingValue({
    menuId: control.menuId,
    defaultValue: String(control.defaultValue),
  });

  const on = raw === 'true';

  return (
    <Box
      as="button"
      {...({ type: 'button', 'aria-pressed': on } as object)}
      onClick={() => {
        setRaw(String(!on));
      }}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        width: '100%',
        padding: '10px 12px',
        borderRadius: '8px',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background-color 0.15s ease, border-color 0.15s ease',
        backgroundColor: on ? COLOR.primaryTint : COLOR.fillAlt,
        border: `1px solid ${on ? COLOR.primaryTintBorder : 'transparent'}`,
      }}
    >
      {control.icon ? (
        <Icon
          icon={control.icon}
          style={{
            fontSize: '14px',
            color: on ? COLOR.primary : COLOR.textFaint,
          }}
        />
      ) : null}

      <Text
        sx={{
          flex: 1,
          minWidth: 0,
          fontFamily: FONT_HEAD,
          fontSize: '13px',
          letterSpacing: '0.02em',
          color: COLOR.textStrong,
        }}
      >
        {label}
      </Text>

      <Switch on={on} />
    </Box>
  );
};
