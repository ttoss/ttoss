import { type ThemeMode, useColorMode } from '@ttoss/fsl-theme/react';
import { Button } from '@ttoss/fsl-ui';

/**
 * Chrome color-mode control (PRD §6.1). The stage always shows light + dark
 * side by side; this lets the *chrome* itself be steered — the Studio must
 * never be locked into whichever mode the OS happens to prefer. Cycles
 * system → light → dark so the system default stays one click away.
 */
const NEXT_MODE: Record<ThemeMode, ThemeMode> = {
  system: 'light',
  light: 'dark',
  dark: 'system',
};

const MODE_LABEL: Record<ThemeMode, string> = {
  system: 'System',
  light: 'Light',
  dark: 'Dark',
};

export const ColorModeToggle = () => {
  const { mode, setMode } = useColorMode();

  return (
    <Button
      evaluation="muted"
      aria-label={`Color mode: ${MODE_LABEL[mode]}. Activate to switch.`}
      onPress={() => {
        return setMode(NEXT_MODE[mode]);
      }}
    >
      {MODE_LABEL[mode]}
    </Button>
  );
};
