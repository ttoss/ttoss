import * as React from 'react';

import type { GeovisWorkspaceSidebarChipsFilter } from '../../context/GeovisWorkspaceContext';
import { useGeovisWorkspace } from '../../hooks/useGeovisWorkspace';

/** Separator for the ids published to the shared selection. */
const DELIMITER = ',';

/** Parses a published value back into ids; `null` when nothing was published. */
const parseIds = (value: string | undefined): string[] | null => {
  if (value == null) return null;
  return value
    .split(DELIMITER)
    .map((id) => {
      return id.trim();
    })
    .filter(Boolean);
};

const toggleValue = ({
  current,
  id,
  multiple,
}: {
  current: string[];
  id: string;
  multiple: boolean;
}) => {
  const has = current.includes(id);

  if (!multiple) {
    return has ? [] : [id];
  }

  return has
    ? current.filter((entry) => {
        return entry !== id;
      })
    : [...current, id];
};

/**
 * The lifted chips selection: the active ids plus toggle/clear actions. Lives
 * here so the tab-bar badge can count the active chips. Honors `multiple:
 * false` by keeping at most one id selected.
 *
 * With `chips.menuId` the ids are published to the shared selection as a
 * comma-joined string, so the app can react to them — filtering a layer, say.
 * Without it the selection stays local, as it always was.
 */
export const useChipSelection = (chips?: GeovisWorkspaceSidebarChipsFilter) => {
  const { selection, setSelection } = useGeovisWorkspace();

  const menuId = chips?.menuId;

  const [selected, setSelected] = React.useState<string[]>(() => {
    // Seed from the shared selection when the chips drive it, so a controlled
    // or permalinked value is reflected on the first render.
    return (
      (menuId ? parseIds(selection[menuId]) : null) ??
      chips?.defaultSelected ??
      []
    );
  });

  const published = selected.join(DELIMITER);

  // Publish to the shared selection so the app can react. Writes only on a real
  // change: without the guard the effect would re-run on every render (an
  // unstable `setSelection`/`selection` identity) and loop. Mirrors
  // `useTimeline`, including publishing the initial value on mount so an
  // uncontrolled parent learns it without touching a chip.
  React.useEffect(() => {
    if (menuId && selection[menuId] !== published) {
      setSelection({ menuId, value: published });
    }
  }, [menuId, published, selection, setSelection]);

  const toggle = (id: string) => {
    setSelected((current) => {
      return toggleValue({ current, id, multiple: chips?.multiple !== false });
    });
  };

  const clear = () => {
    setSelected([]);
  };

  return { selected, toggle, clear };
};
