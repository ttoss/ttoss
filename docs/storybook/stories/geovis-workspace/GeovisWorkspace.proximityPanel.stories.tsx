import type { Meta, StoryFn } from '@storybook/react-webpack5';
import {
  GeovisWorkspace,
  type GeovisWorkspaceConfig,
} from '@ttoss/geovis-workspace';
import { I18nProvider } from '@ttoss/react-i18n';

import { spec } from '../geovis/SearchingForServicesByDistance.fixtures';
import { ServicesNearbyPanel } from './ProximityPanel';

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
 * **The services near a pin, listed beside the map**: click a hospital's pin.
 * The search runs on the map as in the `SearchingForServicesByDistance` story,
 * and the right sidebar opens with the places it found, nearest first.
 *
 * Everything in the sidebar is the app's. The workspace hands it the whole
 * panel through `rightSidebar.content`, and the app reads the search with
 * `useGeoVisProximitySearch()`:
 *
 * ```tsx
 * const config = { rightSidebar: { content: ServicesNearbyPanel } };
 *
 * const ServicesNearbyPanel = () => {
 *   const search = useGeoVisProximitySearch();
 *   const { setRightSidebarOpen } = useGeovisWorkspace();
 *   // search.status, search.results, search.select(id), search.setRadius(m)…
 * };
 * ```
 *
 * The places' details — address, hours, phone — are the app's too: the search
 * answers ids, and the app looks each one up.
 *
 * ## What to check
 *
 * 1. Click a hospital. The sidebar opens on "Buscando serviços…" with a
 *    skeleton list, then fills in with the counts by kind and the places.
 * 2. Click a place in the list: it expands, and its card opens on the map.
 *    Click a service's pin on the map: its row expands in the list.
 * 3. Widen the radius in the bar under the circle: the title reads "Ampliando
 *    a busca…", then the new places join the list. Narrow it back: the list
 *    drops them at once, with no new request.
 * 4. Close the sidebar with its ×: the search stays on the map. Clear the
 *    search — the bar's ×, or the hospital again — and the sidebar closes.
 */
export default {
  title: 'GeovisWorkspace/ProximityPanel',
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

const config: GeovisWorkspaceConfig = {
  rightSidebar: { content: ServicesNearbyPanel },
};

/**
 * Hospitals and health posts as pins; clicking a hospital searches the
 * services around it and lists them in the right sidebar.
 */
export const ProximityPanel: StoryFn = () => {
  return (
    <div style={{ height: 640 }}>
      <GeovisWorkspace config={config} visualizationSpec={spec} />
    </div>
  );
};
