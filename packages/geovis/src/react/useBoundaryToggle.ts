import * as React from 'react';

import type { BoundaryGroup } from '../spec/boundaryGroup';
import {
  appendBoundaryGroup,
  getBoundaryGroupId,
  toggleBoundaryGroup,
} from '../spec/boundaryGroup';
import type { VisualizationSpec } from '../spec/types';

export interface BoundaryToggleResult {
  /** Spec with all groups appended and visibility synchronized. */
  spec: VisualizationSpec;
  /** Toggles the visibility of the specified group. */
  toggle: (group: BoundaryGroup) => void;
  /** Returns true when the group is visible. */
  isVisible: (group: BoundaryGroup) => boolean;
}

/**
 * Manages visibility state for a fixed set of BoundaryGroups over a base spec.
 *
 * All groups start visible. The hook appends them once into `spec` and then
 * drives `layer.visible` via `toggleBoundaryGroup` — avoiding source
 * add/remove on each toggle (no map flicker).
 *
 * Tracks hidden groups by stable source ID (`getBoundaryGroupId`) rather than
 * object reference. This allows groups to be recreated (e.g. when paint
 * overrides change) while preserving visibility state across renders.
 *
 * @param baseSpec - Spec without any boundary groups.
 * @param groups - Ordered list of BoundaryGroups to manage. Must be stable
 *   across renders (module constants or memoised); changing the array reference
 *   re-appends all groups to the spec.
 * @returns Derived spec and toggle controls.
 *
 * @example
 * ```tsx
 * const statesGroup = createBoundaryGroup({
 *   id: 'brazil-states',
 *   data: 'https://example.com/estados.geojson',
 * });
 * const { spec, toggle, isVisible } = useBoundaryToggle(baseSpec, [statesGroup]);
 * return (
 *   <>
 *     <GeoVisProvider spec={spec}><GeoVisCanvas /></GeoVisProvider>
 *     <button onClick={() => toggle(statesGroup)}>
 *       {isVisible(statesGroup) ? 'Hide states' : 'Show states'}
 *     </button>
 *   </>
 * );
 * ```
 */
export const useBoundaryToggle = (
  baseSpec: VisualizationSpec,
  groups: ReadonlyArray<BoundaryGroup>
): BoundaryToggleResult => {
  const [hiddenIds, setHiddenIds] = React.useState<ReadonlySet<string>>(() => {
    return new Set();
  });

  const specWithAll = React.useMemo(() => {
    return groups.reduce((s, g) => {
      return appendBoundaryGroup(s, g);
    }, baseSpec);
  }, [baseSpec, groups]);

  const spec = React.useMemo(() => {
    return groups.reduce((s, g) => {
      return toggleBoundaryGroup(s, g, !hiddenIds.has(getBoundaryGroupId(g)));
    }, specWithAll);
  }, [specWithAll, groups, hiddenIds]);

  const toggle = React.useCallback((group: BoundaryGroup) => {
    const id = getBoundaryGroupId(group);
    setHiddenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const isVisible = React.useCallback(
    (group: BoundaryGroup) => {
      return !hiddenIds.has(getBoundaryGroupId(group));
    },
    [hiddenIds]
  );

  return { spec, toggle, isVisible };
};
