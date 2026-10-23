import { useI18n } from '@ttoss/react-i18n';
import type { Map as MapLibreMap, MapMouseEvent } from 'maplibre-gl';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { useGeoVis } from '../react/contexts';
import type { PinFocus } from '../runtime/adapter';
import type { PinImage, SymbolPaint } from '../spec/types';

/**
 * The live map, once the canvas mounted it: the adapter only has one after
 * the view is mounted, which may come after this control.
 */
export const useNativeMap = () => {
  const { runtime } = useGeoVis();
  const [map, setMap] = React.useState<MapLibreMap | null>(null);
  React.useEffect(() => {
    if (!runtime) return;
    let frame = 0;
    const poll = () => {
      const native = runtime
        .getAdapter()
        .getNativeInstance() as MapLibreMap | null;
      if (native) setMap(native);
      else frame = requestAnimationFrame(poll);
    };
    poll();
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [runtime]);
  return map;
};

/**
 * Re-renders on every camera frame and resize, so what is drawn at a place
 * follows the map as it pans and zooms. Returns the map's size.
 *
 * The re-render is flushed inside the `move` event itself, the moment MapLibre
 * places its own markers, before the frame is painted: a re-render scheduled
 * for later paints a frame or two behind the map, and the drawing trails the
 * place it marks while the map is dragged.
 */
export const useMapFrame = (map: MapLibreMap | null) => {
  const [size, setSize] = React.useState({ width: 0, height: 0, tick: 0 });
  React.useEffect(() => {
    if (!map) return;
    const measure = () => {
      const container = map.getContainer();
      setSize((prev) => {
        return {
          width: container.clientWidth,
          height: container.clientHeight,
          tick: prev.tick + 1,
        };
      });
    };
    const update = () => {
      ReactDOM.flushSync(measure);
    };
    measure();
    map.on('move', update);
    map.on('resize', update);
    return () => {
      map.off('move', update);
      map.off('resize', update);
    };
  }, [map]);
  return size;
};

/** A distance as the texts show it: metres under 1 km, kilometres above. */
export const useFormatDistance = () => {
  const { intl } = useI18n();
  return React.useCallback(
    (metres: number) => {
      if (metres < 1000) {
        return `${intl.formatNumber(Math.round(metres))} m`;
      }
      return `${intl.formatNumber(metres / 1000, { maximumFractionDigits: 1 })} km`;
    },
    [intl]
  );
};

/**
 * Searches from a feature of `layerIds` when one is clicked: from a point's
 * own position, or from where the click landed on any other geometry.
 */
export const useSearchOnClick = ({
  map,
  layerIds,
  searchFrom,
}: {
  map: MapLibreMap | null;
  layerIds: string[];
  searchFrom: (
    origin: [number, number],
    focus: PinFocus | null
  ) => Promise<void>;
}) => {
  // Joined, so an inline array in the spec does not re-bind on every render.
  const layerKey = layerIds.join(',');
  React.useEffect(() => {
    if (!map || !layerKey) return;
    const ids = layerKey.split(',');
    const onClick = (event: MapMouseEvent) => {
      // Only the layers on the map: querying a missing one throws.
      const present = ids.filter((id) => {
        return map.getLayer(id) != null;
      });
      if (present.length === 0) return;
      const [feature] = map.queryRenderedFeatures(event.point, {
        layers: present,
      });
      if (!feature) return;
      const { geometry } = feature;
      void searchFrom(
        geometry.type === 'Point'
          ? (geometry.coordinates as [number, number])
          : [event.lngLat.lng, event.lngLat.lat],
        { layerId: feature.layer.id, featureId: feature.id ?? null }
      );
    };
    map.on('click', onClick);
    return () => {
      map.off('click', onClick);
    };
  }, [map, layerKey, searchFrom]);
};

/**
 * While a search is shown, keeps on the map only the pin it started from: the
 * engine hides every other pin, and shows them again once the search clears —
 * or this control unmounts, as when the map is split.
 */
export const useFocusOnSearchedPin = (focus: PinFocus | null) => {
  const { runtime } = useGeoVis();
  React.useEffect(() => {
    const adapter = runtime?.getAdapter();
    adapter?.setPinFocus?.(focus);
    return () => {
      adapter?.setPinFocus?.(null);
    };
  }, [runtime, focus]);
};

/**
 * How the pin a search started from looks: its layer's image in
 * `spec.images`, and the layer's icon size.
 */
export const useFocusedPinLook = (
  focus: PinFocus | null
): { pin: PinImage | undefined; iconSize: number } => {
  const { spec } = useGeoVis();
  const layer = focus
    ? spec.layers.find((candidate) => {
        return candidate.id === focus.layerId;
      })
    : undefined;
  const paint = layer?.paint as SymbolPaint | undefined;
  const pin = spec.images?.find((image) => {
    return image.id === paint?.iconImage;
  });
  return { pin, iconSize: paint?.iconSize ?? 1 };
};
