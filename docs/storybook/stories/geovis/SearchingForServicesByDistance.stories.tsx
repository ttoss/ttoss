import type { Meta, StoryFn } from '@storybook/react-webpack5';
import type { VisualizationSpec } from '@ttoss/geovis';
import { GeoVisCanvas, GeoVisProvider } from '@ttoss/geovis';
import { I18nProvider } from '@ttoss/react-i18n';
import * as React from 'react';

import { GeoVisFixtureStory } from './GeoVisFixtureStory';
import {
  PROXIMITY_SEARCH,
  spec,
} from './SearchingForServicesByDistance.fixtures';

const loadLocaleData = async (locale: string) => {
  switch (locale) {
    case 'pt-BR': {
      return (await import('../../i18n/compiled/pt-BR.json')).default;
    }
    default: {
      return (await import('../../i18n/compiled/en.json')).default;
    }
  }
};

/**
 * **Searching for services by distance**, through `spec.proximitySearch`:
 * click a hospital's pin. The other hospitals step aside and the services
 * within 1 km of it drop in around it; the bar under the circle counts them by
 * kind and widens the search to 2 or 3 km, asking only for the ring the first
 * answer did not cover. Click a service for its card; click the hospital
 * again, or the bar's ×, to clear the search and bring the hospitals back.
 *
 * With `fromUserLocation`, a button under the map's controls searches from
 * the reader's own location instead — see the "From user location" story.
 *
 * A fake request stands in for the search — it answers after a moment, with
 * services placed at random within the ring asked for.
 */
export default {
  title: 'GeoVis/SearchingForServicesByDistance',
  tags: ['autodocs'],
  decorators: [
    (Story) => {
      return (
        <I18nProvider locale="pt-BR" loadLocaleData={loadLocaleData}>
          <Story />
        </I18nProvider>
      );
    },
  ],
} as Meta;

/**
 * Hospitals and health posts as pins; clicking a hospital searches the
 * services around it.
 */
export const SearchingForServicesByDistance: StoryFn = () => {
  return <GeoVisFixtureStory spec={spec} />;
};

/** Where the fake browser places the reader: Avenida Paulista. */
const USER_LOCATION: [number, number] = [-46.6559, -23.5614];

/** How long the fake browser takes to find the reader, in milliseconds. */
const LOCATE_DELAY_MS = 1100;

/**
 * Stands in for the browser's geolocation while the story is open, and puts
 * the real one back when it closes: the permission starts undecided, and the
 * lookup answers {@link USER_LOCATION} — or, with `outcome: 'denied'`, fails
 * as a refused permission does. Once answered, the permission stays decided.
 */
const useFakeGeolocation = (outcome: 'granted' | 'denied') => {
  React.useLayoutEffect(() => {
    let permission: PermissionState = 'prompt';
    const geolocation = {
      getCurrentPosition: (
        success: PositionCallback,
        failure?: PositionErrorCallback | null
      ) => {
        setTimeout(() => {
          permission = outcome;
          if (outcome === 'granted') {
            success({
              coords: {
                longitude: USER_LOCATION[0],
                latitude: USER_LOCATION[1],
                accuracy: 20,
              },
              timestamp: Date.now(),
            } as GeolocationPosition);
          } else {
            failure?.({
              code: 1,
              message: 'User denied Geolocation',
            } as GeolocationPositionError);
          }
        }, LOCATE_DELAY_MS);
      },
    };
    const permissions = {
      query: async () => {
        return { state: permission } as PermissionStatus;
      },
    };
    const originals = {
      geolocation: Object.getOwnPropertyDescriptor(navigator, 'geolocation'),
      permissions: Object.getOwnPropertyDescriptor(navigator, 'permissions'),
    };
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: geolocation,
    });
    Object.defineProperty(navigator, 'permissions', {
      configurable: true,
      value: permissions,
    });
    return () => {
      for (const key of ['geolocation', 'permissions'] as const) {
        const original = originals[key];
        if (original) Object.defineProperty(navigator, key, original);
        else delete (navigator as unknown as Record<string, unknown>)[key];
      }
    };
  }, [outcome]);
};

const userLocationSpec: VisualizationSpec = {
  ...spec,
  title: 'Searching for services near the reader',
  description:
    'Click the location button under the zoom controls: the services within 1 km of you drop in around you.',
  proximitySearch: { ...PROXIMITY_SEARCH, fromUserLocation: true },
};

/**
 * **From the reader's location**, through `proximitySearch.fromUserLocation`:
 * the crosshair button under the zoom controls first explains why the location is
 * needed, then asks the browser for it and searches from there — the reader a
 * blue "You" dot, the bar saying "near you". Clicking the button again, the
 * dot or the bar's × clears the search. Clicking a hospital still searches
 * from it, replacing the search from the reader.
 *
 * The browser's geolocation is faked: it places you on Avenida Paulista after
 * a moment. Set `outcome` to `denied` for the dialog shown when the location
 * cannot be had.
 */
export const FromUserLocation: StoryFn<{ outcome: 'granted' | 'denied' }> = ({
  outcome,
}) => {
  useFakeGeolocation(outcome);
  // Its own frame, positioned, as in the MapMode story: the location button,
  // its dialog and its note sit in the map's corner, not the story's.
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div>
        <strong>{userLocationSpec.title}</strong>
        <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 14 }}>
          {userLocationSpec.description}
        </p>
      </div>
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: 560,
          border: '1px solid #d4d4d8',
        }}
      >
        <GeoVisProvider key={outcome} spec={userLocationSpec}>
          <GeoVisCanvas viewId="primary" />
        </GeoVisProvider>
      </div>
    </div>
  );
};

FromUserLocation.args = { outcome: 'granted' };
FromUserLocation.argTypes = {
  outcome: {
    control: 'inline-radio',
    options: ['granted', 'denied'],
    description: 'What the fake browser answers when asked for the location.',
  },
};
