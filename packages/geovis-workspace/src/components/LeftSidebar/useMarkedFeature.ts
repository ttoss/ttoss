import { useGeoVis } from '@ttoss/geovis';
import * as React from 'react';

import type { GeovisWorkspaceSidebarLocatorOption } from '../../context/GeovisWorkspaceContext';

/** What the map is currently being told to show as selected. */
type Mark = { layerId: string; featureId: string | number };

/**
 * Keeps `feature-state.selected` on the map in step with the entry a locator is
 * showing as chosen.
 *
 * Driven by the entry rather than by the pick, so one rule covers all four ways
 * the choice changes — chosen, replaced, cleared, or restored from the shared
 * selection, including the restore that happens on the very first render, which
 * no event handler runs for.
 *
 * Marking is deliberately independent of framing: drag the camera away and the
 * shape stays marked as the one that was searched for.
 *
 * The ref holds what the map was last told, which the entry alone cannot say:
 * clearing has to name the layer the previous mark was on, and by then the
 * entry that named it is gone. It is also what keeps the mark from being re-sent
 * on every render that hands the hook a fresh `dispatch`.
 *
 * @param option - The entry currently shown as chosen, or `null`.
 *
 * @example
 * useMarkedFeature(selected);
 */
export const useMarkedFeature = (
  option: GeovisWorkspaceSidebarLocatorOption | null
) => {
  const { dispatch } = useGeoVis();
  const marked = React.useRef<Mark | null>(null);

  const feature = option?.feature;
  const layerId = feature?.layerId;
  const featureId = feature ? (feature.featureId ?? option.id) : undefined;

  React.useEffect(() => {
    if (layerId !== undefined && featureId !== undefined) {
      if (
        marked.current?.layerId === layerId &&
        marked.current?.featureId === featureId
      ) {
        return;
      }

      marked.current = { layerId, featureId };
      dispatch({ type: 'select-feature', layerId, featureId });
      return;
    }

    const previous = marked.current;
    if (!previous) return;

    marked.current = null;
    dispatch({
      type: 'select-feature',
      layerId: previous.layerId,
      featureId: null,
    });
  }, [layerId, featureId, dispatch]);
};
