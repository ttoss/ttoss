import type { Meta, StoryObj } from '@storybook/react-webpack5';
import {
  GeovisWorkspace,
  type GeovisWorkspaceConfig,
  type GeovisWorkspaceSelection,
} from '@ttoss/geovis-workspace';
import * as React from 'react';

import { withPtBr } from './GeovisWorkspace.decorators';
import { buildSpec } from './GeovisWorkspace.fixtures';

/**
 * **Picks that cost a request.** A variation whose data has to be fetched leaves
 * the map showing the old numbers until the answer lands. Without a signal, that
 * gap is where a user stacks three more picks — and the app serves three
 * requests to paint one map, in whatever order they happen to return.
 *
 * The signal is the promise itself. `onVariableChange` may return one, and while
 * it is in flight every menu goes inert: the picked row keeps its active look
 * and spins, the rest dim. Nothing else is declared — no prop, no flag on the
 * variation, no state mirrored back into the workspace.
 *
 * ```tsx
 * <GeovisWorkspace
 *   variables={selection}
 *   onVariableChange={(next) => {
 *     setSelection(next);
 *     return fetchSeries(next); // ← the wait, and the lock
 *   }}
 * />
 * ```
 *
 * Returning nothing keeps the menus live, which is what a synchronous consumer
 * wants. And a rejection releases them exactly like a resolve: a request that
 * failed is a reason to let the user pick again, not to strand the sidebar.
 *
 * ## What to check
 *
 * 1. Pick another **Indicador**. Its row spins; every other row in *both* menus
 *    dims and stops responding. After ~1.2s the map recolors and they return.
 * 2. During that second, try clicking a dimmed row of **Faixa etária** — the
 *    lock is across menus, not per menu, because the request being served is
 *    for the whole selection.
 * 3. Pick **Faixa (falha ao carregar)**. It spins the same way and the request
 *    rejects; the menus come back and the map keeps the last good paint.
 * 4. Open **Linha do tempo** and press play, then go back to the menus. The
 *    years keep advancing and the menus stay live throughout: this consumer
 *    returns a promise on *every* change, and a timeline tick still locks
 *    nothing — only a menu pick asks to block. (The map ignores the year here;
 *    the timeline is in the story for what it does *not* do.)
 */
const REQUEST_MS = 1200;

/** A variation that resolves after a beat, or refuses to. */
const serve = ({ fails }: { fails: boolean }) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      return fails ? reject(new Error('upstream unavailable')) : resolve(null);
    }, REQUEST_MS);
  });
};

/** The failing pick, kept as a value so the handler and the list agree on it. */
const FAILING_AGE = '75-plus';

const config: GeovisWorkspaceConfig = {
  leftSidebar: {
    initialState: 'open',
    sections: [
      {
        id: 'variations',
        header: { icon: 'lucide:layout-list' },
        body: {
          kind: 'filters',
          blocks: [
            {
              id: 'variable',
              title: 'Indicador',
              icon: 'lucide:gauge',
              control: {
                kind: 'variations',
                menuId: 'variable',
                defaultValue: 'cumulative-rate',
                variations: [
                  {
                    value: 'cumulative-rate',
                    label: 'Taxa cumulativa (% do total)',
                    icon: 'lucide:chart-pie',
                    description: 'Série anual agregada por município',
                  },
                  {
                    value: 'cumulative-proportion',
                    label: 'Proporção cumulativa (% da pop 65+)',
                    icon: 'lucide:chart-column',
                  },
                  {
                    value: 'range',
                    label: 'Faixa (% da pop 65+)',
                    icon: 'lucide:chart-bar',
                  },
                ],
              },
            },
            {
              id: 'age',
              title: 'Faixa etária',
              icon: 'lucide:users',
              control: {
                kind: 'variations',
                menuId: 'age',
                defaultValue: '65-plus',
                variations: [
                  { value: '65-plus', label: '65 anos ou mais' },
                  { value: '70-plus', label: '70 anos ou mais' },
                  {
                    value: FAILING_AGE,
                    label: 'Faixa (falha ao carregar)',
                    icon: 'lucide:triangle-alert',
                    description: 'A requisição desta faixa sempre rejeita',
                  },
                ],
              },
            },
          ],
        },
      },
      {
        id: 'timeline',
        header: { icon: 'lucide:clock' },
        body: {
          kind: 'filters',
          blocks: [
            {
              id: 'year',
              title: 'Ano',
              icon: 'lucide:calendar',
              control: {
                kind: 'timeline',
                menuId: 'ano',
                min: 2019,
                max: 2024,
                step: 1,
                defaultValue: 2024,
                unitLabel: 'registros',
                histogram: [
                  { key: 2019, count: 38412 },
                  { key: 2020, count: 51930 },
                  { key: 2021, count: 70455 },
                  { key: 2022, count: 95674 },
                  { key: 2023, count: 121836 },
                  { key: 2024, count: 134502 },
                ],
              },
            },
          ],
        },
      },
    ],
  },
};

/**
 * The consumer: commits the selection at once (so the row it just lit is the
 * one that spins) and hands back the request. Which is the honest order — the
 * pick is the user's, the wait is the network's.
 */
const AsyncVariationsDemo = () => {
  const [selection, setSelection] = React.useState<GeovisWorkspaceSelection>({
    variable: 'cumulative-rate',
    age: '65-plus',
    ano: '2024',
  });

  const spec = React.useMemo(() => {
    return buildSpec({
      variable: selection.variable ?? 'cumulative-rate',
      age: selection.age ?? '65-plus',
    });
  }, [selection]);

  return (
    <GeovisWorkspace
      config={config}
      visualizationSpec={spec}
      variables={selection}
      onVariableChange={(next) => {
        setSelection(next);

        // Returned on every change, timeline ticks included — and the ticks
        // still never lock the menus, since blocking is decided where the
        // change comes from, not by what the consumer hands back.
        //
        // The rejection is deliberately left unhandled here: the workspace
        // settles on it either way, which is the behaviour under test.
        return serve({ fails: next.age === FAILING_AGE });
      }}
    />
  );
};

const meta = {
  title: 'Geovis Workspace/AsyncVariations',
  component: AsyncVariationsDemo,
  tags: ['autodocs'],
  decorators: [withPtBr],
} satisfies Meta<typeof AsyncVariationsDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Pick an indicator and watch both menus wait for the request it costs. */
export const Default: Story = {};
