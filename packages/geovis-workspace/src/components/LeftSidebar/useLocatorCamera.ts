import { useGeoVis } from '@ttoss/geovis';

import type { GeovisWorkspaceSidebarLocatorOption } from '../../context/GeovisWorkspaceContext';

/**
 * Returns the move a locator entry asks of the camera.
 *
 * An entry that is a shape is framed as one, so `feature` comes first: a
 * `center`/`zoom` would be a guess at what the geometry already knows, and the
 * bounds are the runtime's to work out. Then `viewPresetId`, the more
 * deliberate of the two remaining — named in the spec, and the one an agent can
 * also reach — and last the entry's own `view`.
 *
 * The first two are dispatched, so they land in the action log and a rejection
 * — a preset the spec does not declare, a feature with no geometry to frame —
 * surfaces in the warnings panel rather than failing silently. `setView` does
 * not log: that one is user navigation, not a step an agent took.
 *
 * An entry declaring none of the three is searchable and moves nothing.
 *
 * @returns A function moving the camera to the given entry.
 *
 * @example
 * const moveCamera = useLocatorCamera();
 * moveCamera({ id: '1', label: 'Santos', view: { center: [-46.3, -23.9] } });
 */
export const useLocatorCamera = () => {
  const { dispatch, setView } = useGeoVis();

  return (option: GeovisWorkspaceSidebarLocatorOption) => {
    if (option.feature) {
      const { layerId, featureId = option.id, padding } = option.feature;
      dispatch({
        type: 'fit-feature',
        layerId,
        featureId,
        padding,
        animation: option.animation,
      });
      return;
    }

    if (option.viewPresetId) {
      dispatch({ type: 'set-view-preset', presetId: option.viewPresetId });
      return;
    }

    if (!option.view) return;

    const { center, zoom, pitch, bearing } = option.view;
    setView({ center, zoom, pitch, bearing, ...option.animation });
  };
};
