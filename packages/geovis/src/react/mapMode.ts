import * as React from 'react';

import type { CameraView } from '../runtime/adapter';
import type { GeoVisRuntime } from '../runtime/createRuntime';
import { layerControlItems } from '../spec/layerControl';
import type { LayerControlItem, VisualizationSpec } from '../spec/types';
import type { LegendSpec } from '../spec/types.legend';

/** One map, or two side by side with their cameras kept together. */
export type GeoVisMapMode = 'single' | 'split';

/** The two sides of a split map: `a` on the left, `b` on the right. */
export type GeoVisSplitSide = 'a' | 'b';

/** The item id each side shows, `null` for a side showing no item. */
export type GeoVisSplitSides = Record<GeoVisSplitSide, string | null>;

export interface GeoVisMapModeContextValue {
  /** Whether the spec offers the mode button and has items to split between. */
  enabled: boolean;
  mode: GeoVisMapMode;
  /**
   * Switches the mode. Entering the split, the sides start over: the left one
   * on the first item switched on in the single map (in `control` order), the
   * right one on none — unless `sides` names them, as a shared link does.
   */
  setMode: (mode: GeoVisMapMode, sides?: Partial<GeoVisSplitSides>) => void;
  /** The `control` items the sides choose between. */
  options: LayerControlItem[];
  /** The item id each side shows, or `null` for a side showing none. */
  sides: GeoVisSplitSides;
  setSide: (side: GeoVisSplitSide, itemId: string | null) => void;
  /**
   * The latest camera of the map, single or split — where a side opens, and
   * what a side's spec is rebuilt with, so a spec update never throws the
   * camera back. `null` before any view reported one.
   */
  getCamera: () => CameraView | null;
  /** Records the camera a side moved to, so the single map resumes there. */
  recordCamera: (camera: CameraView) => void;
}

const SINGLE: GeoVisMapModeContextValue = {
  enabled: false,
  mode: 'single',
  setMode: () => {},
  options: [],
  sides: { a: null, b: null },
  setSide: () => {},
  getCamera: () => {
    return null;
  },
  recordCamera: () => {},
};

/**
 * Map-mode state of the nearest `<GeoVisProvider>`. Each provider supplies its
 * own, so the providers a split map nests for its sides read a single map and
 * never split again.
 */
export const GeoVisMapModeContext =
  React.createContext<GeoVisMapModeContextValue>(SINGLE);

/**
 * The map-mode state of the nearest `<GeoVisProvider>`: whether the map is
 * split, and what each side shows.
 *
 * @returns The context value; a single map when the spec does not opt in.
 *
 * @example
 * const { mode } = useGeoVisMapMode();
 * if (mode === 'split') hideMyOwnLegend();
 */
export const useGeoVisMapMode = () => {
  return React.useContext(GeoVisMapModeContext);
};

/** Whether any of an item's layers exists in the spec. */
const itemHasLayers = (item: LayerControlItem, spec: VisualizationSpec) => {
  return spec.layers.some((layer) => {
    return item.layers.includes(layer.id);
  });
};

/** Whether any of an item's layers is visible in the spec. */
const itemIsVisible = (item: LayerControlItem, spec: VisualizationSpec) => {
  return spec.layers.some((layer) => {
    return item.layers.includes(layer.id) && layer.visible !== false;
  });
};

/**
 * The `control` items a split side can show: every toggle, categories
 * flattened, whose layers exist in the spec — an item the layer control would
 * render disabled is no choice at all.
 *
 * @param spec - The provider's accepted spec.
 * @returns The selectable items, in `control` order.
 *
 * @example
 * splitOptions({ ...spec, control: { id: 'c', items: [ubs, missing] } }); // [ubs]
 */
export const splitOptions = (spec: VisualizationSpec): LayerControlItem[] => {
  return layerControlItems(spec.control?.items ?? []).filter((item) => {
    return itemHasLayers(item, spec);
  });
};

/**
 * The sides a split opens with: the left one carries on with what the single
 * map was showing — the first item switched on, in `control` order, or none —
 * and the right one starts empty, for the reader to choose.
 */
const openingSides = (
  options: LayerControlItem[],
  spec: VisualizationSpec
): GeoVisSplitSides => {
  const shown = options.find((item) => {
    return itemIsVisible(item, spec);
  });
  return { a: shown?.id ?? null, b: null };
};

/**
 * The chosen sides, with an id the spec no longer offers read as no item —
 * rather than as a side the picker cannot name.
 */
const offeredSides = (
  options: LayerControlItem[],
  chosen: GeoVisSplitSides
): GeoVisSplitSides => {
  const offered = (id: string | null) => {
    return options.some((item) => {
      return item.id === id;
    })
      ? id
      : null;
  };
  return { a: offered(chosen.a), b: offered(chosen.b) };
};

/**
 * The spec one split side renders: the provider's own, with the layers of the
 * `control` items switched so only the chosen item's are visible — none of
 * them for a side without an item — starting on `camera`. Layers no item references (a basemap overlay, boundaries) are kept
 * as they are. The control, the mode button and the legends of hidden layers
 * are dropped: the side is chosen from the picker above it, and a legend for
 * a layer it does not draw would misread the map.
 *
 * Only the `primary` side shows legends and the navigation control, so what
 * both sides share is not drawn twice. The other side keeps its legends
 * but unpositioned: a legend can drive its layer's fill colour, and only a
 * positioned one is drawn.
 *
 * @param params.spec - The provider's accepted spec.
 * @param params.item - The item this side shows, or `null` for none.
 * @param params.camera - Where the side opens, or `null` to keep `spec.view`.
 * @param params.primary - Whether this is the side that draws the legends and
 *   the navigation control.
 * @returns The side's spec.
 *
 * @example
 * deriveSplitSideSpec({ spec, item: ubs, camera: null, primary: true });
 */
export const deriveSplitSideSpec = ({
  spec,
  item,
  camera,
  primary,
}: {
  spec: VisualizationSpec;
  item: LayerControlItem | null;
  camera: CameraView | null;
  primary: boolean;
}): VisualizationSpec => {
  const managed = new Set(
    layerControlItems(spec.control?.items ?? []).flatMap((entry) => {
      return entry.layers;
    })
  );
  const { control: _control, mapModeControl: _mapModeControl, ...rest } = spec;
  const legends = (list: LegendSpec[] | undefined) => {
    if (primary || !list) return list;
    return list.map(({ position: _position, ...legend }) => {
      return legend;
    });
  };
  return {
    ...rest,
    ...(primary ? {} : { navigationControlEnabled: false }),
    legends: legends(spec.legends),
    view: camera
      ? {
          ...spec.view,
          center: camera.center,
          zoom: camera.zoom,
          pitch: camera.pitch,
          bearing: camera.bearing,
        }
      : spec.view,
    layers: spec.layers.map((layer) => {
      if (!managed.has(layer.id)) {
        return { ...layer, legends: legends(layer.legends) };
      }
      if (item?.layers.includes(layer.id)) {
        return { ...layer, visible: true, legends: legends(layer.legends) };
      }
      return { ...layer, visible: false, legends: undefined };
    }),
  };
};

/**
 * Owns a provider's map-mode state: the mode, each side's item and the camera
 * handed between the single map and the split. Falls back to a single map
 * whenever the spec stops offering the button.
 *
 * @param params.runtime - The provider's runtime, whose camera the split opens on.
 * @param params.spec - The provider's accepted spec.
 * @returns The value `<GeoVisProvider>` puts in {@link GeoVisMapModeContext}.
 */
export const useMapModeState = ({
  runtime,
  spec,
}: {
  runtime: GeoVisRuntime | null;
  spec: VisualizationSpec;
}): GeoVisMapModeContextValue => {
  const options = React.useMemo(() => {
    return splitOptions(spec);
  }, [spec]);
  const enabled = spec.mapModeControl === true && options.length >= 2;

  const [requestedMode, setMode] = React.useState<GeoVisMapMode>('single');
  const [chosenSides, setChosenSides] = React.useState<GeoVisSplitSides>({
    a: null,
    b: null,
  });
  const lastCamera = React.useRef<CameraView | null>(null);

  const mode: GeoVisMapMode = enabled ? requestedMode : 'single';

  // The single map's camera, so the split opens where the reader was.
  React.useEffect(() => {
    if (!runtime || !enabled) return;
    return runtime.onViewChange((camera) => {
      lastCamera.current = camera;
    });
  }, [runtime, enabled]);

  const sides = React.useMemo(() => {
    return offeredSides(options, chosenSides);
  }, [options, chosenSides]);

  const changeMode = React.useCallback(
    (next: GeoVisMapMode, requested?: Partial<GeoVisSplitSides>) => {
      if (next === requestedMode) return;
      if (next === 'split') {
        setChosenSides({ ...openingSides(options, spec), ...requested });
      } else if (runtime && lastCamera.current) {
        // The single map remounts from `runtime.spec`: moving its view first
        // makes it open where the reader left the split.
        const { center, zoom, pitch, bearing } = lastCamera.current;
        runtime.setView({ center, zoom, pitch, bearing, animate: false });
      }
      setMode(next);
    },
    [requestedMode, runtime, options, spec]
  );

  const setSide = React.useCallback(
    (side: GeoVisSplitSide, itemId: string | null) => {
      setChosenSides((prev) => {
        return { ...prev, [side]: itemId };
      });
    },
    []
  );

  const recordCamera = React.useCallback((camera: CameraView) => {
    lastCamera.current = camera;
  }, []);

  const getCamera = React.useCallback(() => {
    return lastCamera.current;
  }, []);

  return React.useMemo(() => {
    return {
      enabled,
      mode,
      setMode: changeMode,
      options,
      sides,
      setSide,
      getCamera,
      recordCamera,
    };
  }, [
    enabled,
    mode,
    changeMode,
    options,
    sides,
    setSide,
    getCamera,
    recordCamera,
  ]);
};
