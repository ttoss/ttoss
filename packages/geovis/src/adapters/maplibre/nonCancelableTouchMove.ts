/** Replacement for `preventDefault` on events the browser will not cancel. */
const ignorePreventDefault = () => {};

/** The one thing this module needs from a map: its canvas container element. */
export interface CanvasContainerHost {
  /** Returns the element MapLibre binds its pointer and touch listeners to. */
  getCanvasContainer: () => HTMLElement;
}

/**
 * Stops Chrome's `[Intervention]` console notice during touch pans and pinches.
 *
 * MapLibre's touch handlers call `event.preventDefault()` without checking
 * `event.cancelable` (`TouchPanHandler.touchmove`, `TwoTouchHandler.touchmove`).
 * Once the compositor owns a gesture the browser delivers `touchmove` with
 * `cancelable: false`, ignores the call, and logs it:
 *
 * > Ignored attempt to cancel a touchmove event with cancelable=false, for
 * > example because scrolling is in progress and cannot be interrupted.
 *
 * The notice carries no information — the gesture is already committed, so the
 * ignored call changes nothing — but it repeats per frame and buries real
 * warnings for anyone debugging on a touch device.
 *
 * The listener is registered in the capture phase on the canvas container, the
 * same element MapLibre binds its bubble-phase `touchmove` listener to. Touches
 * land on the canvas or on a marker, both descendants, so capture always runs
 * first and shadows `preventDefault` with a no-op for that one event. Cancelable
 * events are left untouched, so panning, pinch-zoom and rotation are unchanged.
 *
 * Drop this once MapLibre guards those calls upstream.
 *
 * @param map - Map whose canvas container receives the listener. MapLibre
 * creates and destroys that element with the map, so `map.remove()` takes the
 * listener with it and no teardown is returned.
 * @returns Nothing.
 *
 * @example
 * ```ts
 * const map = new maplibregl.Map({ container, style });
 * silenceNonCancelableTouchMove(map);
 * ```
 */
export const silenceNonCancelableTouchMove = (
  map: CanvasContainerHost
): void => {
  map.getCanvasContainer().addEventListener(
    'touchmove',
    (event) => {
      if (event.cancelable) return;
      event.preventDefault = ignorePreventDefault;
    },
    { capture: true, passive: true }
  );
};
