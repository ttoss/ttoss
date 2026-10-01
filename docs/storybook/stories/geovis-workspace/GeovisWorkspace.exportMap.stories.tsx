import type { Meta, StoryObj } from '@storybook/react-webpack5';
import {
  GeovisWorkspace,
  type GeovisWorkspaceConfig,
  type GeovisWorkspaceLeftSidebarState,
  type GeovisWorkspaceSelection,
  getInitialSelection,
} from '@ttoss/geovis-workspace';
import * as React from 'react';

import { withPtBr } from './GeovisWorkspace.decorators';
import { buildSpec } from './GeovisWorkspace.fixtures';

/**
 * **Export the map as PNG.** The left sidebar's top-right corner carries a
 * download button beside the close control. It is always there, with no config
 * to turn it on: every workspace with a left sidebar can export its map.
 *
 * The button opens a dialog with a preview of the image as it will be saved,
 * a file name and two toggles:
 *
 * - **Incluir legenda** — the active legend's color rows, in a card at the
 *   bottom-right. It is the legend the map is painted from (the layer's
 *   `activeLegendId`), resolved by `@ttoss/geovis`'s `resolveLegendItems`, so
 *   its labels match the on-screen legend exactly.
 * - **Incluir menu** — the left sidebar, drawn over the map exactly where it
 *   sits on screen, with whatever tab is open. Off by default. The map is a
 *   WebGL canvas but the sidebar is DOM, so the menu is rendered to an image
 *   with `html-to-image`.
 *
 * The map and the menu are captured once, when the dialog opens. The toggles
 * only change what is drawn over that frame, so either one redraws the preview
 * at once and the download is built from the same pixels the preview shows. The
 * image keeps the map canvas's own resolution — the size of the map on screen
 * times the device pixel ratio — which the dialog shows under the preview.
 *
 * The file name is suggested from the active variation and the timeline's
 * value (`taxa-cumulativa-do-total_2024`) and can be edited; `.png` is added on
 * download, and characters no file system accepts are dropped as you type.
 *
 * Basemap tiles must be served with CORS headers: a cross-origin tile without
 * them taints the canvas, and the browser then refuses to encode it. The dialog
 * stays open and says so rather than downloading a broken file.
 *
 * ## What to check
 *
 * 1. Press the **download** button in the sidebar header. The dialog opens over
 *    the whole workspace, sidebars included, with the preview of the map.
 * 2. Toggle **Incluir legenda** off and on — the legend card leaves and returns
 *    in the preview.
 * 3. Turn **Incluir menu** on — the sidebar appears over the left of the map,
 *    on the tab that was open. Close the dialog, switch tabs, reopen it, and the
 *    menu in the preview follows.
 * 4. Pick another variable in **Variável**, or move the **Ano** timeline, then
 *    reopen the dialog: the suggested file name follows.
 * 5. Edit the file name, press **Baixar PNG** and open the file: it matches
 *    the preview, at the resolution shown under it.
 * 6. Close with **Esc**, a click on the backdrop, the **✕** or **Cancelar**.
 *
 * `NoHeaderBand` declares no section titles, so the header band goes away and
 * the button moves with the close control into the tab row.
 */

const FIRST_YEAR = 2015;
const LAST_YEAR = 2024;

const leftSidebar: GeovisWorkspaceLeftSidebarState = {
  initialState: 'open',
  sections: [
    {
      id: 'variable',
      header: { title: 'Variável', icon: 'lucide:layers' },
      body: {
        kind: 'variations',
        menuId: 'variable',
        defaultValue: 'cumulative-rate',
        groups: [
          {
            id: 'metrics',
            label: 'Métricas',
            variations: [
              {
                value: 'cumulative-rate',
                label: 'Taxa cumulativa (% do total)',
              },
              {
                value: 'cumulative-proportion',
                label: 'Proporção cumulativa (% da pop 65+)',
              },
              { value: 'range', label: 'Faixa (% da pop 65+)' },
            ],
          },
        ],
      },
    },
    {
      id: 'time',
      header: { title: 'Período', icon: 'lucide:clock' },
      body: {
        kind: 'filters',
        blocks: [
          {
            id: 'year',
            title: 'Ano',
            icon: 'lucide:calendar',
            control: {
              kind: 'timeline',
              // Only names the exported file here — the fixture's map has no years.
              menuId: 'ano',
              min: FIRST_YEAR,
              max: LAST_YEAR,
              step: 1,
              defaultValue: LAST_YEAR,
            },
          },
        ],
      },
    },
  ],
};

const config: GeovisWorkspaceConfig = {
  leftSidebar,
};

/** The same sidebar with every section title removed: no header band. */
const noHeaderBandConfig: GeovisWorkspaceConfig = {
  ...config,
  leftSidebar: {
    ...leftSidebar,
    sections: leftSidebar.sections.map((section) => {
      return { ...section, header: { icon: section.header.icon } };
    }),
  },
};

const ExportMapDemo = ({ config }: { config: GeovisWorkspaceConfig }) => {
  const [selection, setSelection] = React.useState<GeovisWorkspaceSelection>(
    () => {
      return getInitialSelection({ config });
    }
  );

  const visualizationSpec = React.useMemo(() => {
    return buildSpec({
      variable: selection.variable ?? 'cumulative-rate',
      age: '65-plus',
    });
  }, [selection.variable]);

  return (
    <div style={{ height: 640 }}>
      <GeovisWorkspace
        config={config}
        visualizationSpec={visualizationSpec}
        variables={selection}
        onVariableChange={setSelection}
      />
    </div>
  );
};

const meta = {
  title: 'Geovis Workspace/ExportMap',
  component: ExportMapDemo,
  tags: ['autodocs'],
  decorators: [withPtBr],
  args: { config },
} satisfies Meta<typeof ExportMapDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * The export button sits in the header band, beside the close control. Open it,
 * flip the two toggles and watch the preview follow.
 */
export const Default: Story = {};

/**
 * No section declares a title, so the header band is dropped and the export
 * button travels with the close control into the tab row.
 */
export const NoHeaderBand: Story = {
  args: { config: noHeaderBandConfig },
};
