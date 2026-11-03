import { useI18n } from '@ttoss/react-i18n';
import type { Map as MapLibreMap } from 'maplibre-gl';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { type ProximityState, useProximitySearch } from '../react/proximity';
import { circleRing, metresPerPixel } from '../react/proximity.geo';
import { usePublishProximitySearch } from '../react/proximityContext';
import type {
  ProximityCategory,
  ProximitySearch,
} from '../spec/types.proximity';
import { useLoadingSweep, useRadiusArea } from './GeoVisProximitySearch.area';
import {
  type AnyPointMode,
  ColumnControls,
  useClickToSearch,
} from './GeoVisProximitySearch.controls';
import { FocusPin } from './GeoVisProximitySearch.focusPin';
import { HitPin } from './GeoVisProximitySearch.hitPin';
import {
  useFocusedPinLook,
  useFocusOnSearchedPin,
  useFormatDistance,
  useMapFrame,
  useNativeMap,
} from './GeoVisProximitySearch.hooks';
import { messages } from './GeoVisProximitySearch.messages';
import {
  PointMarker,
  RadiusLabels,
  YouMarker,
} from './GeoVisProximitySearch.parts';
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
 * Hands the search to the app through the provider's store — see
 * `useGeoVisProximitySearch` — as the places within the radius shown.
 */
const usePublishSearch = ({
  state,
  radii,
  select,
  setRadius,
  clear,
  anyPoint,
  setAnyPoint,
}: Pick<
  ReturnType<typeof useProximitySearch>,
  'state' | 'radii' | 'select' | 'setRadius' | 'clear'
> &
  AnyPointMode) => {
  usePublishProximitySearch(
    React.useMemo(() => {
      return {
        status: state.status,
        origin: state.origin,
        fromUser: state.fromUser,
        fromPoint: state.fromPoint,
        radius: state.radius,
        radii,
        results: state.hits.filter((hit) => {
          return hit.distance <= state.radius;
        }),
        selectedId: state.selectedId,
        select,
        setRadius: (radius: number) => {
          void setRadius(radius);
        },
        clear,
        anyPoint,
        setAnyPoint,
      };
    }, [state, radii, select, setRadius, clear, anyPoint, setAnyPoint])
  );
};

/**
 * The lowest point on screen of the circle the map draws around `origin`,
 * in pixels from the map's top: where the bar goes, under the circle however
 * the map is tilted or turned.
 */
const circleBottom = ({
  map,
  origin,
  radius,
}: {
  map: MapLibreMap;
  origin: [number, number];
  radius: number;
}) => {
  return Math.max(
    ...circleRing({ origin, metres: radius, steps: 32 }).map((point) => {
      return map.project(point).y;
    })
  );
};

/**
 * What marks the point the search runs from, each clearing it when clicked:
 * the reader's blue dot, the dot on a point of the map, or the clicked pin.
 */
const OriginMarker = ({
  state,
  clear,
}: {
  state: ProximityState;
  clear: () => void;
}) => {
  const { intl } = useI18n();
  const focusedPin = useFocusedPinLook(state.focus);
  const label = intl.formatMessage(messages.clear);
  if (state.fromUser) {
    return (
      <YouMarker
        tag={intl.formatMessage(messages.you)}
        title={intl.formatMessage(messages.youClear)}
        label={label}
        onClick={clear}
      />
    );
  }
  if (state.fromPoint) {
    return (
      <PointMarker
        title={intl.formatMessage(messages.pointClear)}
        label={label}
        onClick={clear}
      />
    );
  }
  return (
    <FocusPin
      pin={focusedPin.pin}
      iconSize={focusedPin.iconSize}
      label={label}
      onClick={clear}
    />
  );
};

/**
 * The proximity search `<GeoVisProvider>` auto-mounts when the spec declares
 * `proximitySearch`: clicking a feature of its layers searches the places
 * around it — see {@link ProximitySearch}. Drawn over the map, in its own
 * container, so what it places at a point follows the camera. With
 * `fromUserLocation`, a button in the map's control column searches from the
 * reader's location instead; with `fromAnyPoint`, another button there turns
 * on searching from any point of the map the reader clicks.
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
  const {
    state,
    radii,
    searchFrom,
    searchFromUser,
    searchFromPoint,
    clear,
    setRadius,
    select,
  } = useProximitySearch({ config, map, framePixels: framePixelsFor(width) });
  const mode = useClickToSearch({ map, config, searchFrom, searchFromPoint });
  usePublishSearch({ state, radii, select, setRadius, clear, ...mode });
  useFocusOnSearchedPin(state.status === 'idle' ? null : state.focus);
  const { origin } = state;
  useRadiusArea({
    map,
    origin,
    radius: state.radius,
    radii,
    request: state.request,
  });
  useLoadingSweep({
    map,
    origin,
    radius: state.radius,
    loading: state.status === 'loading',
  });

  const controls = (
    <ColumnControls
      config={config}
      state={state}
      results={nouns.other}
      searchFromUser={searchFromUser}
      clear={clear}
      {...mode}
    />
  );

  // Idle, there is no origin: only a search draws anything.
  if (!map || width === 0 || !origin) return controls;

  const originPx = map.project(origin);
  const pixelsPerMetre = 1 / metresPerPixel(origin[1], map.getZoom());
  const R = state.radius * pixelsPerMetre;
  const scale = R < 120 ? 0.8 : 1;
  const categories = categoriesById(config);
  const visible = state.hits.filter((hit) => {
    return hit.distance <= state.radius;
  });
  const fresh = new Set(state.fresh);

  const search = ReactDOM.createPortal(
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
        <RadiusLabels
          request={state.request}
          origin={origin}
          radius={state.radius}
          radii={radii}
          originPx={originPx}
          project={(lngLat) => {
            return map.project(lngLat);
          }}
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
              closeLabel={intl.formatMessage(messages.closeCard)}
              onSelect={() => {
                select(hit.id);
              }}
            />
          );
        })}
        <OriginMarker state={state} clear={clear} />
      </div>
      <div
        style={{
          position: 'absolute',
          zIndex: 5,
          left: 8,
          right: 8,
          top: circleBottom({ map, origin, radius: state.radius }) + 14,
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
  return (
    <>
      {controls}
      {search}
    </>
  );
};
