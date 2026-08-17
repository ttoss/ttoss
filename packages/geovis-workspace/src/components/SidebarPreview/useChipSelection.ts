import * as React from 'react';

import type { GeovisWorkspaceSidebarChipsFilter } from '../../context/GeovisWorkspaceContext';

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
 */
export const useChipSelection = (chips?: GeovisWorkspaceSidebarChipsFilter) => {
  const [selected, setSelected] = React.useState<string[]>(() => {
    return chips?.defaultSelected ?? [];
  });

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
