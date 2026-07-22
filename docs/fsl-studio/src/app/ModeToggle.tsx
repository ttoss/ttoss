import { type ThemeMode, useColorMode } from '@ttoss/fsl-theme/react';
import { ToggleButton, ToggleButtonGroup } from '@ttoss/fsl-ui';

/**
 * Light / System / Dark switcher bound to the fsl-theme runtime. Selection
 * semantics (one of a set) map to `ToggleButtonGroup` single-select mode.
 */
export const ModeToggle = () => {
  const { mode, setMode } = useColorMode();

  return (
    <ToggleButtonGroup
      aria-label="Color mode"
      selectionMode="single"
      disallowEmptySelection
      selectedKeys={[mode]}
      onSelectionChange={(keys) => {
        for (const key of keys) {
          setMode(key as ThemeMode);
        }
      }}
    >
      <ToggleButton id="light" evaluation="muted">
        Light
      </ToggleButton>
      <ToggleButton id="system" evaluation="muted">
        System
      </ToggleButton>
      <ToggleButton id="dark" evaluation="muted">
        Dark
      </ToggleButton>
    </ToggleButtonGroup>
  );
};
