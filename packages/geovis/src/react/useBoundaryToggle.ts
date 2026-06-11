import * as React from 'react';

import type { BoundaryGroup } from '../spec/presets';
import { appendBoundaryGroup, toggleBoundaryGroup } from '../spec/presets';
import type { VisualizationSpec } from '../spec/types';

export interface BoundaryToggleResult {
  /** Spec com todos os grupos appended e visibilidade sincronizada. */
  spec: VisualizationSpec;
  /** Inverte a visibilidade do grupo informado. */
  toggle: (group: BoundaryGroup) => void;
  /** Retorna true quando o grupo está visível. */
  isVisible: (group: BoundaryGroup) => boolean;
}

/**
 * Manages visibility state for a fixed set of BoundaryGroups over a base spec.
 *
 * All groups start visible. The hook appends them once into `spec` and then
 * drives `layer.visible` via `toggleBoundaryGroup` — avoiding source
 * add/remove on each toggle (no map flicker).
 *
 * Uses object reference equality (Set<BoundaryGroup>) to track hidden groups,
 * which works correctly because preset constants are stable module-level references.
 *
 * @param baseSpec - Spec without any boundary groups.
 * @param groups - Ordered list of BoundaryGroups to manage. Must be stable
 *   across renders (module constants or memoised); changing the array reference
 *   re-appends all groups to the spec.
 * @returns Derived spec and toggle controls.
 *
 * @example
 * ```tsx
 * const { spec, toggle, isVisible } = useBoundaryToggle(baseSpec, [
 *   BRAZIL_STATE_OUTLINES.local,
 *   BRAZIL_SP_SUBPREFECTURE_OUTLINES.local,
 * ]);
 * return (
 *   <>
 *     <GeoVisProvider spec={spec}><GeoVisCanvas /></GeoVisProvider>
 *     <button onClick={() => toggle(BRAZIL_STATE_OUTLINES.local)}>
 *       {isVisible(BRAZIL_STATE_OUTLINES.local) ? 'Ocultar estados' : 'Mostrar estados'}
 *     </button>
 *   </>
 * );
 * ```
 */
export const useBoundaryToggle = (
  baseSpec: VisualizationSpec,
  groups: ReadonlyArray<BoundaryGroup>
): BoundaryToggleResult => {
  const [hiddenGroups, setHiddenGroups] = React.useState<
    ReadonlySet<BoundaryGroup>
  >(() => {
    return new Set();
  });

  const specWithAll = React.useMemo(() => {
    return groups.reduce((s, g) => {
      return appendBoundaryGroup(s, g);
    }, baseSpec);
  }, [baseSpec, groups]);

  const spec = React.useMemo(() => {
    return groups.reduce((s, g) => {
      return toggleBoundaryGroup(s, g, !hiddenGroups.has(g));
    }, specWithAll);
  }, [specWithAll, groups, hiddenGroups]);

  const toggle = React.useCallback((group: BoundaryGroup) => {
    setHiddenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) {
        next.delete(group);
      } else {
        next.add(group);
      }
      return next;
    });
  }, []);

  const isVisible = React.useCallback(
    (group: BoundaryGroup) => {
      return !hiddenGroups.has(group);
    },
    [hiddenGroups]
  );

  return { spec, toggle, isVisible };
};
