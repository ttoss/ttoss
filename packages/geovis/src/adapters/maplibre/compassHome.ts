import * as maplibregl from 'maplibre-gl';

import { estimateMaxZoom } from '../../spec/bounds';
import type { GeoJSONBoundingBox, VisualizationSpec } from '../../spec/types';
import { computeResponsivePadding } from './fitBoundsToData';

/** How long the camera takes to fly back to the home view, in milliseconds. */
export const HOME_VIEW_DURATION_MS = 800;

/**
 * The compass button's tooltip, through MapLibre's `locale` option: the
 * default — "click to reset north" — no longer says what a click does.
 */
export const COMPASS_LOCALE = {
  'NavigationControl.ResetBearing':
    'Drag to rotate map, click to return to the initial view',
};

/** What the home view is read from: the declared spec and the data's box. */
export interface HomeViewSource {
  /** The spec the app declared — never a camera move's (see `flyToHomeView`). */
  spec: VisualizationSpec;
  /** The data's box, when the spec leaves the camera to fit it. */
  fitBbox: GeoJSONBoundingBox | null;
}

/**
 * Flies the camera back to the home view: the view the app's spec declares,
 * angles included, so a map whose spec is tilted or turned returns to that
 * tilt and turn rather than to a flat, north-up frame.
 *
 * The adapter's spec is the declared one: a camera move — `runtime.setView()`
 * or an action compiled to it — never reaches `adapter.update`, so it cannot
 * have overwritten the home it moved away from.
 *
 * A spec without `center`/`zoom` has no fixed frame: the camera fits the data
 * again, as on mount. With neither a frame nor a box yet — URL sources still
 * fetching — only the angles return.
 *
 * @param map - The mounted map.
 * @param source - The declared spec and the data's box.
 *
 * @example
 * flyToHomeView(map, { spec: { view: { center: [-46.6, -23.5], zoom: 10, pitch: 45 } }, fitBbox: null });
 */
export const flyToHomeView = (
  map: maplibregl.Map,
  { spec, fitBbox }: HomeViewSource
): void => {
  const view = spec.view ?? {};
  const angles = {
    pitch: view.pitch ?? 0,
    bearing: view.bearing ?? 0,
    roll: 0,
    duration: HOME_VIEW_DURATION_MS,
  };

  if (view.center !== undefined || view.zoom !== undefined) {
    map.flyTo({
      center: (view.center as maplibregl.LngLatLike) ?? map.getCenter(),
      zoom: view.zoom ?? map.getZoom(),
      ...angles,
    });
    return;
  }

  if (fitBbox) {
    map.fitBounds(
      [
        [fitBbox[0], fitBbox[1]],
        [fitBbox[2], fitBbox[3]],
      ],
      {
        padding: computeResponsivePadding(map.getContainer()),
        maxZoom: estimateMaxZoom(fitBbox),
        ...angles,
      }
    );
    return;
  }

  map.easeTo(angles);
};

/**
 * MapLibre's navigation control — zoom buttons and compass — with the
 * compass's click turned into a flight to the home view (see
 * {@link flyToHomeView}) instead of a reset to north.
 *
 * MapLibre binds the compass's click inside the control, with no option to
 * replace it, so this listens on the control's own container in the capture
 * phase — which runs before the button's listener — and stops the click there.
 * Dragging the compass still rotates and tilts the map: MapLibre swallows the
 * click that ends a drag on `window`, before it reaches the container.
 *
 * @example
 * map.addControl(new HomeNavigationControl(options, () => viewState));
 */
export class HomeNavigationControl extends maplibregl.NavigationControl {
  private readonly getSource: () => HomeViewSource | undefined;

  private group: HTMLElement | null = null;

  /**
   * @param options - MapLibre's navigation control options.
   * @param getSource - Reads the home view's source at click time, so a later
   *   spec update is honoured; `undefined` once the view is gone.
   */
  constructor(
    options: maplibregl.NavigationControlOptions,
    getSource: () => HomeViewSource | undefined
  ) {
    super(options);
    this.getSource = getSource;
  }

  private readonly onClick = (event: MouseEvent) => {
    const target = event.target as Element | null;
    if (!target?.closest('.maplibregl-ctrl-compass')) return;
    event.stopPropagation();
    const source = this.getSource();
    if (source && this._map) flyToHomeView(this._map, source);
  };

  onAdd(map: maplibregl.Map): HTMLElement {
    const group = super.onAdd(map);
    group.addEventListener('click', this.onClick, true);
    this.group = group;
    return group;
  }

  onRemove(): void {
    this.group?.removeEventListener('click', this.onClick, true);
    this.group = null;
    super.onRemove();
  }
}

/**
 * Mounts the navigation control — zoom buttons and a compass that flies home
 * (see {@link HomeNavigationControl}) — in the map's top-right corner.
 *
 * @param map - The mounted map.
 * @param getHome - Reads the home view's source at click time.
 *
 * @example
 * addHomeNavigationControl(map, () => viewState);
 */
export const addHomeNavigationControl = (
  map: maplibregl.Map,
  getHome: () => HomeViewSource | undefined
): void => {
  map.addControl(
    new HomeNavigationControl(
      {
        visualizePitch: true,
        visualizeRoll: true,
        showZoom: true,
        showCompass: true,
      },
      getHome
    )
  );
};
