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

/** The ids the chips show: the source's, trimmed to one when `multiple` is off. */
const normalize = ({
  ids,
  chips,
}: {
  ids: string[];
  chips?: GeovisWorkspaceSidebarChipsFilter;
}): string[] => {
  return chips?.multiple === false ? ids.slice(0, 1) : ids;
};

/**
 * The lifted chips selection: the active ids plus toggle/clear actions. Lives
 * here so the tab-bar badge can count the active chips. Honors `multiple:
 * false` by keeping at most one id selected.
 *
 * With `chips.menuId` the shared selection is the source of truth: the chips
 * show what it holds and write each toggle straight to it, so an app that
 * rewrites the value — restoring a permalink, say — sees the chips follow. The
 * value is published only when
 * the selection holds none yet (on mount, so an uncontrolled parent learns it)
 * or holds one the chips had to normalize — never a stale copy over the app's.
 * Without a `menuId` the selection stays local, as it always was.
 */
export const useChipSelection = (chips?: GeovisWorkspaceSidebarChipsFilter) => {
  const { selection, setSelection } = useGeovisWorkspace();

  const menuId = chips?.menuId;

  const [local, setLocal] = React.useState<string[]>(() => {
    return chips?.defaultSelected ?? [];
  });

  const shared = menuId ? parseIds(selection[menuId]) : null;
  const selected = normalize({ ids: shared ?? local, chips });
  const published = selected.join(DELIMITER);

  // Writes only on a real difference: without the guard the effect would
  // re-run on every render (an unstable `setSelection`/`selection` identity)
  // and loop. Mirrors `useTimeline`.
  React.useEffect(() => {
    if (menuId && selection[menuId] !== published) {
      setSelection({ menuId, value: published });
    }
  }, [menuId, published, selection, setSelection]);

  const commit = (next: string[]) => {
    setLocal(next);
    if (menuId) setSelection({ menuId, value: next.join(DELIMITER) });
  };

  const toggle = (id: string) => {
    const next = toggleValue({
      current: selected,
      id,
      multiple: chips?.multiple !== false,
    });
    commit(next);
  };

  const clear = () => {
    commit([]);
  };

  return { selected, toggle, clear };
};
