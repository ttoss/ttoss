import { useI18n } from '@ttoss/react-i18n';
import type { Map as MapLibreMap } from 'maplibre-gl';
import * as React from 'react';

import { useGeoVis } from '../react/contexts';
import { useGeoVisMapMode } from '../react/mapMode';
import type { ProximityState } from '../react/proximity';
import type { PinFocus } from '../runtime/adapter';
import type { ProximitySearch } from '../spec/types.proximity';
import { AnyPointButton } from './GeoVisProximitySearch.anyPoint';
import { AREA_IDS } from './GeoVisProximitySearch.area';
import { useSearchOnClick } from './GeoVisProximitySearch.hooks';
import {
  canLocate,
  LocateButton,
  LocatingToast,
  useUserLocation,
} from './GeoVisProximitySearch.locate';
import { LocationDialog } from './GeoVisProximitySearch.locationDialog';
import { messages } from './GeoVisProximitySearch.messages';

/**
 * The search from the reader's location, when the spec offers it: the button,
 * the dialog around the browser's request and the note while it looks the
 * reader up. Clicking the button while a search from the reader is shown
 * clears it instead.
 */
const FromUserLocation = ({
  state,
  results,
  searchFromUser,
  clear,
}: {
  state: ProximityState;
  results: string;
  searchFromUser: (origin: [number, number]) => Promise<void>;
  clear: () => void;
}) => {
  const { intl } = useI18n();
  const { enabled: mapModeShown } = useGeoVisMapMode();
  const onLocated = React.useCallback(
    (origin: [number, number]) => {
      void searchFromUser(origin);
    },
    [searchFromUser]
  );
  const { phase, start, locate, dismiss } = useUserLocation(onLocated);
  // Asked once: whether the browser can locate does not change on a page.
  const [available] = React.useState(canLocate);
  if (!available) return null;

  const active = state.fromUser && state.status !== 'idle';
  const title = intl.formatMessage(messages.locate, { results });
  return (
    <>
      <LocateButton
        belowMapMode={mapModeShown}
        active={active}
        locating={phase === 'locating'}
        // Capitalised: the label opens with the app's plural noun.
        title={title.charAt(0).toLocaleUpperCase(intl.locale) + title.slice(1)}
        label={intl.formatMessage(messages.locateLabel, { results })}
        onClick={() => {
          if (phase === 'locating') return;
          if (active) clear();
          else void start();
        }}
      />
      {phase === 'locating' && <LocatingToast />}
      {(phase === 'ask' || phase === 'denied') && (
        <LocationDialog
          phase={phase}
          results={results}
          onConfirm={locate}
          onCancel={dismiss}
        />
      )}
    </>
  );
};

/**
 * Whether a click on any point of the map searches from there: off until the
 * reader turns it on with the button `fromAnyPoint` offers, and never on
 * without it. One search spends it — the button turns off as the search
 * starts, so another point needs the button again.
 *
 * @returns The mode, its setter, and `searchFromPointOnce`: the search from a
 * point that turns the mode off.
 */
const useAnyPointMode = ({
  config,
  searchFromPoint,
}: {
  config: ProximitySearch;
  searchFromPoint: (origin: [number, number]) => Promise<void>;
}) => {
  const [on, setOn] = React.useState(false);
  const offered = config.fromAnyPoint === true;
  const setAnyPoint = React.useCallback(
    (next: boolean) => {
      if (offered) setOn(next);
    },
    [offered]
  );
  const searchFromPointOnce = React.useCallback(
    (origin: [number, number]) => {
      setOn(false);
      return searchFromPoint(origin);
    },
    [searchFromPoint]
  );
  return { anyPoint: offered && on, setAnyPoint, searchFromPointOnce };
};

/** The any-point mode, as the button and the app's store hold it. */
export type AnyPointMode = Pick<
  ReturnType<typeof useAnyPointMode>,
  'anyPoint' | 'setAnyPoint'
>;

/**
 * The search's buttons in the map's control column, under the map mode button
 * when there is one: the search from the reader's location, then the switch
 * for searching from any point of the map — each when the spec offers it.
 */
export const ColumnControls = ({
  config,
  state,
  results,
  searchFromUser,
  clear,
  anyPoint,
  setAnyPoint,
}: {
  config: ProximitySearch;
  state: ProximityState;
  results: string;
  searchFromUser: (origin: [number, number]) => Promise<void>;
  clear: () => void;
} & AnyPointMode) => {
  const { intl } = useI18n();
  const { enabled: mapModeShown } = useGeoVisMapMode();
  // Asked once, as the location button does: it is shown only where the
  // browser can locate.
  const [locateShown] = React.useState(() => {
    return config.fromUserLocation === true && canLocate();
  });
  const title = intl.formatMessage(messages.anyPoint, { results });
  return (
    <>
      {config.fromUserLocation && (
        <FromUserLocation
          state={state}
          results={results}
          searchFromUser={searchFromUser}
          clear={clear}
        />
      )}
      {config.fromAnyPoint && (
        <AnyPointButton
          slot={(mapModeShown ? 1 : 0) + (locateShown ? 1 : 0)}
          on={anyPoint}
          // Capitalised: the label opens with the app's plural noun.
          title={
            title.charAt(0).toLocaleUpperCase(intl.locale) + title.slice(1)
          }
          label={intl.formatMessage(messages.anyPointLabel, { results })}
          onClick={() => {
            setAnyPoint(!anyPoint);
          }}
        />
      )}
    </>
  );
};

/**
 * The layers whose click is their own — those that declare `click` or
 * `clickAnchor` — which a click on the bare map must not take over.
 */
const useOwnClickLayerIds = () => {
  const { spec } = useGeoVis();
  return React.useMemo(() => {
    return [
      ...spec.layers
        .filter((layer) => {
          return layer.click != null || layer.clickAnchor != null;
        })
        .map((layer) => {
          return layer.id;
        }),
      // The places' pins: a click on one opens its card.
      AREA_IDS.hits,
    ];
  }, [spec.layers]);
};

/**
 * Starts a search from what the reader clicks: a feature of the spec's
 * `layers`, or — while the any-point mode is on — any other point of the map,
 * a search that turns the mode off. See `useSearchOnClick` for which click
 * wins.
 *
 * @returns The any-point mode, for the button and the app's store.
 */
export const useClickToSearch = ({
  map,
  config,
  searchFrom,
  searchFromPoint,
}: {
  map: MapLibreMap | null;
  config: ProximitySearch;
  searchFrom: (
    origin: [number, number],
    focus: PinFocus | null
  ) => Promise<void>;
  searchFromPoint: (origin: [number, number]) => Promise<void>;
}): AnyPointMode => {
  const ownClickLayerIds = useOwnClickLayerIds();
  const { searchFromPointOnce, ...mode } = useAnyPointMode({
    config,
    searchFromPoint,
  });
  useSearchOnClick({
    map,
    layerIds: config.layers ?? [],
    ownClickLayerIds,
    fromAnyPoint: mode.anyPoint,
    searchFrom,
    searchFromPoint: searchFromPointOnce,
  });
  return mode;
};
