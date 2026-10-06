import type { Meta, StoryObj } from '@storybook/react-webpack5';
import {
  GeovisWorkspace,
  type GeovisWorkspaceConfig,
  type GeovisWorkspaceSelection,
  type GeovisWorkspaceSidebarChipsFilter,
} from '@ttoss/geovis-workspace';
import * as React from 'react';

import { withPtBr } from './GeovisWorkspace.decorators';
import { buildSpec } from './GeovisWorkspace.fixtures';

/**
 * **Chips selection.** How a `chips` filter with a `menuId` picks, and how it
 * follows the app.
 *
 * - `required: true` keeps at least one chip active: the last one cannot be
 *   toggled off, and no "clear" action or tab badge is offered. With
 *   `multiple: false` that is a required single choice — a variations menu in
 *   chip form. With `multiple: true` several stay selectable, never none.
 * - With a `menuId`, the chips show what the shared selection holds. An app
 *   that rewrites the value — here, fitting the age band to the indicator's
 *   options — sees the chips follow instead of fighting it.
 *
 * ```ts
 * { kind: 'chips', menuId: 'age', multiple: false, required: true, options }
 * ```
 *
 * The selection the app receives is printed under the map.
 *
 * ## What to check
 *
 * **RequiredSingle** — the age bands of an indicator, as in a choropleth app.
 *
 * 1. Open **Filtros**: **Todos** is active, the tab has no badge and there is
 *    no "clear" action.
 * 2. Pick **70 a 74 anos**: it lights and **Todos** goes out. Click it again:
 *    nothing changes — one band is always active.
 * 3. Pick **Todos**, then switch the indicator under **Variações** to
 *    **Faixa (% da pop 65+)**, which has no "Todos". The app fits the band to
 *    **65 a 69 anos**; back in **Filtros** that chip is the active one, and the
 *    readout agrees.
 * 4. Switch back to **Taxa cumulativa**: the four chips return and **65 a 69
 *    anos** stays active.
 *
 * **RequiredMultiple** — several products, never none. Toggle chips on and
 * off; the last active one refuses to go out.
 *
 * **Optional** — the chips as they were: several, none allowed, a "clear"
 * action and a count badge on the tab.
 */

type Mode = 'requiredSingle' | 'requiredMultiple' | 'optional';

const INDICATORS = [
  {
    value: 'taxa',
    label: 'Taxa cumulativa (% do total)',
    icon: 'lucide:pie-chart',
  },
  { value: 'faixa', label: 'Faixa (% da pop 65+)', icon: 'lucide:bar-chart-3' },
];

const ALL_AGES = [
  { id: '65', label: 'Todos' },
  { id: '65-69', label: '65 a 69 anos' },
  { id: '70-74', label: '70 a 74 anos' },
  { id: '75', label: '75 anos ou mais' },
];

/** The band indicator has no "Todos": the 65+ as a share of itself is 100%. */
const agesFor = (indicator: string) => {
  return indicator === 'faixa'
    ? ALL_AGES.filter((age) => {
        return age.id !== '65';
      })
    : ALL_AGES;
};

/**
 * What the app does with a reported band: keep it when the indicator lists it,
 * otherwise land on the indicator's first band. The chips must follow this.
 */
const fitAge = ({ indicator, age }: { indicator: string; age?: string }) => {
  const options = agesFor(indicator);
  return options.some((option) => {
    return option.id === age;
  })
    ? age
    : options[0].id;
};

const PRODUCTS = [
  { id: 'soja', label: 'Soja', emoji: '🌱' },
  { id: 'milho', label: 'Milho', emoji: '🌽' },
  { id: 'cafe', label: 'Café', emoji: '☕' },
  { id: 'laranja', label: 'Laranja', emoji: '🍊' },
];

const chipsFor = ({
  mode,
  indicator,
}: {
  mode: Mode;
  indicator: string;
}): GeovisWorkspaceSidebarChipsFilter => {
  if (mode === 'requiredSingle') {
    return {
      kind: 'chips',
      menuId: 'age',
      multiple: false,
      required: true,
      options: agesFor(indicator),
      defaultSelected: ['65'],
    };
  }
  return {
    kind: 'chips',
    menuId: 'products',
    required: mode === 'requiredMultiple',
    options: PRODUCTS,
    defaultSelected: ['soja', 'cafe'],
  };
};

const buildConfig = ({
  mode,
  indicator,
}: {
  mode: Mode;
  indicator: string;
}): GeovisWorkspaceConfig => {
  return {
    leftSidebar: {
      initialState: 'open',
      sections: [
        {
          id: 'variacoes',
          header: { title: 'Variações', icon: 'lucide:layers' },
          body: {
            kind: 'variations',
            menuId: 'indicator',
            defaultValue: 'taxa',
            groups: [
              {
                id: 'indicadores',
                label: 'Indicadores',
                variations: INDICATORS,
              },
            ],
          },
        },
        {
          id: 'filtros',
          header: { title: 'Filtros', icon: 'lucide:filter' },
          body: {
            kind: 'filters',
            blocks: [
              {
                id: 'chips',
                title: mode === 'requiredSingle' ? 'Faixa etária' : 'Produtos',
                icon:
                  mode === 'requiredSingle' ? 'lucide:users' : 'lucide:wheat',
                control: chipsFor({ mode, indicator }),
              },
            ],
          },
        },
      ],
    },
  };
};

const ChipsSelectionDemo = ({
  mode,
}: {
  /** Which chips behaviour the Filtros tab shows. */
  mode: Mode;
}) => {
  const [selection, setSelection] = React.useState<GeovisWorkspaceSelection>({
    indicator: 'taxa',
  });

  // The app's own rule, applied to every report: the age band is fitted to the
  // indicator, so switching indicators can rewrite it.
  const onVariableChange = React.useCallback(
    (next: GeovisWorkspaceSelection) => {
      const indicator = next.indicator ?? 'taxa';
      setSelection(
        next.age === undefined
          ? next
          : { ...next, age: fitAge({ indicator, age: next.age }) }
      );
    },
    []
  );

  const indicator = selection.indicator ?? 'taxa';

  const config = React.useMemo(() => {
    return buildConfig({ mode, indicator });
  }, [mode, indicator]);

  const visualizationSpec = React.useMemo(() => {
    return buildSpec({ variable: 'cumulative-rate', age: '65-plus' });
  }, []);

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <div style={{ height: 600 }}>
        <GeovisWorkspace
          config={config}
          visualizationSpec={visualizationSpec}
          variables={selection}
          onVariableChange={onVariableChange}
        />
      </div>
      <code style={{ fontSize: 12 }}>
        selection: {JSON.stringify(selection)}
      </code>
    </div>
  );
};

const meta = {
  title: 'Geovis Workspace/ChipsSelection',
  component: ChipsSelectionDemo,
  tags: ['autodocs'],
  decorators: [withPtBr],
} satisfies Meta<typeof ChipsSelectionDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

/** `multiple: false, required: true` — one age band, always; follows the app. */
export const RequiredSingle: Story = {
  args: { mode: 'requiredSingle' },
};

/** `required: true` — several products, never none. */
export const RequiredMultiple: Story = {
  args: { mode: 'requiredMultiple' },
};

/** No `required` — several, none allowed, with "clear" and the tab badge. */
export const Optional: Story = {
  args: { mode: 'optional' },
};
