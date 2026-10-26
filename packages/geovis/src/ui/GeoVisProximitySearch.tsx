import { useI18n } from '@ttoss/react-i18n';
import * as ReactDOM from 'react-dom';

import { useProximitySearch } from '../react/proximity';
import { metresPerPixel } from '../react/proximity.geo';
import type {
  ProximityCategory,
  ProximitySearch,
} from '../spec/types.proximity';
import { FocusPin } from './GeoVisProximitySearch.focusPin';
import { HitPin } from './GeoVisProximitySearch.hitPin';
import {
  useFocusedPinLook,
  useFocusOnSearchedPin,
  useFormatDistance,
  useMapFrame,
  useNativeMap,
  useSearchOnClick,
} from './GeoVisProximitySearch.hooks';
import { messages } from './GeoVisProximitySearch.messages';
import { RadiusArea } from './GeoVisProximitySearch.parts';
import { StatusBar } from './GeoVisProximitySearch.statusBar';
import { KEYFRAMES_CSS } from './GeoVisProximitySearch.styles';

/** Below this map width the bar drops the counts by kind. */
const COMPACT_WIDTH = 480;
/** Below this map width the bar shortens its texts too. */
const TIGHT_WIDTH = 360;

/** How the texts name what is searched: the spec's words, or "result(s)". */
const useNouns = (config: ProximitySearch) => {
  const { intl } = useI18n();
  return {
    one: config.labels?.one ?? intl.formatMessage(messages.resultOne),
    other: config.labels?.other ?? intl.formatMessage(messages.resultOther),
  };
};

/** The spec's categories, by id. */
const categoriesById = (config: ProximitySearch) => {
  return new Map<string, ProximityCategory>(
    (config.categories ?? []).map((category) => {
      return [category.id, category];
    })
  );
};

/**
 * The circle's radius on screen while the camera frames a search: as large as
 * the map allows, between 110 and 150 px — 110 on a compact map.
 */
const framePixelsFor = (width: number) => {
  const largest = width < COMPACT_WIDTH ? 110 : 150;
  return Math.max(110, Math.min(largest, Math.floor(width / 2) - 30));
};

/**
 * The proximity search `<GeoVisProvider>` auto-mounts when the spec declares
 * `proximitySearch`: clicking a feature of its layers searches the places
 * around it — see {@link ProximitySearch}. Drawn over the map, in its own
 * container, so what it places at a point follows the camera.
 *
 * @example
 * // Mounted by the provider — the spec only declares the search:
 * const spec = { ...base, proximitySearch: { layers: ['hospitals'], query } };
 */
export const GeoVisProximitySearch = ({
  config,
}: {
  config: ProximitySearch;
}) => {
  const { intl } = useI18n();
  const map = useNativeMap();
  const { width } = useMapFrame(map);
  const format = useFormatDistance();

  const nouns = useNouns(config);
  const { state, radii, searchFrom, clear, setRadius, select } =
    useProximitySearch({ config, map, framePixels: framePixelsFor(width) });
  useSearchOnClick({ map, layerIds: config.layers, searchFrom });
  useFocusOnSearchedPin(state.status === 'idle' ? null : state.focus);
  const focusedPin = useFocusedPinLook(state.focus);

  // Idle, there is no origin: only a search draws anything.
  const { origin } = state;
  if (!map || width === 0 || !origin) return null;

  const originPx = map.project(origin);
  const pixelsPerMetre = 1 / metresPerPixel(origin[1], map.getZoom());
  const R = state.radius * pixelsPerMetre;
  const scale = R < 120 ? 0.8 : 1;
  const categories = categoriesById(config);
  const visible = state.hits.filter((hit) => {
    return hit.distance <= state.radius;
  });
  const fresh = new Set(state.fresh);

  return ReactDOM.createPortal(
    <>
      <style>{KEYFRAMES_CSS}</style>
      <div
        style={{
          position: 'absolute',
          left: originPx.x,
          top: originPx.y,
          width: 0,
          height: 0,
          zIndex: 4,
        }}
      >
        <RadiusArea
          request={state.request}
          radius={state.radius}
          radii={radii}
          pixelsPerMetre={pixelsPerMetre}
          loading={state.status === 'loading'}
          formatRadius={format}
        />
        {visible.map((hit) => {
          const point = map.project(hit.lngLat);
          return (
            <HitPin
              key={`s${state.request}-${hit.id}`}
              hit={hit}
              category={categories.get(hit.categoryId ?? '')}
              x={point.x - originPx.x}
              y={point.y - originPx.y}
              scale={scale}
              selected={state.selectedId === hit.id}
              late={fresh.has(hit.id)}
              distance={intl.formatMessage(messages.fromPoint, {
                distance: format(hit.distance),
              })}
              onSelect={() => {
                select(hit.id);
              }}
            />
          );
        })}
        <FocusPin
          pin={focusedPin.pin}
          iconSize={focusedPin.iconSize}
          label={intl.formatMessage(messages.clear)}
          onClick={clear}
        />
      </div>
      <div
        style={{
          position: 'absolute',
          zIndex: 5,
          left: 8,
          right: 8,
          top: originPx.y + R + 14,
          display: 'flex',
          justifyContent: 'center',
          transform: `translateX(${originPx.x - width / 2}px)`,
          pointerEvents: 'none',
        }}
      >
        <StatusBar
          state={state}
          visible={visible}
          config={config}
          radii={radii}
          nouns={nouns}
          compact={width < COMPACT_WIDTH}
          tight={width < TIGHT_WIDTH}
          onRadius={(radius) => {
            void setRadius(radius);
          }}
          onClear={clear}
          format={format}
        />
      </div>
    </>,
    map.getContainer()
  );
};
