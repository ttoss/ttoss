import * as React from 'react';

import { useGeovisWorkspace } from '../../hooks/useGeovisWorkspace';

/**
 * A setting's value: held locally, seeded from the shared selection, and
 * published back to it as a string.
 *
 * Same contract the timeline uses, and for the same reasons. Seeding from the
 * selection is what reflects a controlled value on first render; publishing is
 * what lets the app redraw from it. The write is non-blocking — a setting is
 * dragged, and routing every frame of a drag through `onVariableChange` would
 * freeze the sidebar once per frame.
 *
 * The guard on the effect is load-bearing: `selection` and `setSelection` have
 * unstable identities, so an unconditional write would re-run the effect on
 * every render and loop.
 *
 * @param params.menuId - Menu id the value is published under.
 * @param params.defaultValue - Serialized value used when the selection has none.
 * @returns The serialized value and its setter.
 *
 * @example
 * const [raw, setRaw] = useSettingValue({ menuId: 'hexOpacity', defaultValue: '85' });
 */
export const useSettingValue = ({
  menuId,
  defaultValue,
}: {
  menuId: string;
  defaultValue: string;
}): [string, (next: string) => void] => {
  const { selection, setSelection } = useGeovisWorkspace();

  const [value, setValue] = React.useState<string>(() => {
    return selection[menuId] ?? defaultValue;
  });

  React.useEffect(() => {
    if (selection[menuId] !== value) {
      setSelection({ menuId, value });
    }
  }, [menuId, value, selection, setSelection]);

  return [value, setValue];
};
