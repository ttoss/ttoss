import type { Meta, StoryObj } from '@storybook/react-webpack5';
import {
  GeovisWorkspace,
  type GeovisWorkspaceConfig,
  type GeovisWorkspaceSelection,
  type GeovisWorkspaceSidebarChoiceOption,
} from '@ttoss/geovis-workspace';
import * as React from 'react';

import { withPtBr } from './GeovisWorkspace.decorators';
import { buildSpec } from './GeovisWorkspace.fixtures';

/**
 * **Choice filters.** A `choice` — one option always chosen, published under
 * its `menuId` — in a `filters` block, the way it already sits in a `settings`
 * block. Two layouts suit the filters:
 *
 * - `layout: 'list'` — one row per option, with its `sublabel` under the label
 *   and its `count` on the right, in the numeric face. Here, the geographic
 *   level the map is drawn at, with how many areas each one has.
 * - `layout: { kind: 'grid', columns }` — compact buttons in equal columns,
 *   with a check on the chosen one. Here, the age band.
 *
 * ```ts
 * { kind: 'choice', menuId: 'level', layout: 'list', options }
 * { kind: 'choice', menuId: 'age', layout: { kind: 'grid', columns: 2 }, options }
 * ```
 *
 * Both blocks declare `collapsible`, so their headers fold them. The selection
 * the app receives is printed under the map.
 *
 * ## What to check
 *
 * 1. **Recortes**: **Distritos** is chosen — tinted, its count pill green.
 *    Pick **Subprefeituras**: the tint and the green pill move to it, and the
 *    readout shows `level: "subprefeitura"`. Clicking the chosen row again
 *    changes nothing — one level is always chosen.
 * 2. **Faixa etária**: **Todos** carries the check. Pick **70 a 74 anos**: the
 *    check moves and the readout shows `age: "70-74"`.
 * 3. Fold and unfold each block from its header.
 * 4. `WithIcons` — the same blocks with an icon before each label.
 */

const LEVELS: GeovisWorkspaceSidebarChoiceOption[] = [
  {
    value: 'distrito',
    label: 'Distritos',
    sublabel: 'Divisão administrativa básica',
    count: 96,
    icon: 'lucide:grid-2x2',
  },
  {
    value: 'subprefeitura',
    label: 'Subprefeituras',
    sublabel: 'Gestão regional do município',
    count: 32,
    icon: 'lucide:pentagon',
  },
  {
    value: 'supervisao-saude',
    label: 'Supervisões de saúde',
    sublabel: 'Território da rede de saúde',
    count: 26,
    icon: 'lucide:hexagon',
  },
  {
    value: 'coordenadoria-saude',
    label: 'Coordenadorias de saúde',
    sublabel: 'Macrorregiões de saúde',
    count: 5,
    icon: 'lucide:shapes',
  },
];

const AGES: GeovisWorkspaceSidebarChoiceOption[] = [
  { value: '65-plus', label: 'Todos', icon: 'lucide:circle-plus' },
  { value: '65-69', label: '65 a 69 anos', icon: 'lucide:move-horizontal' },
  { value: '70-74', label: '70 a 74 anos', icon: 'lucide:move-horizontal' },
  { value: '75-plus', label: '75 anos ou mais', icon: 'lucide:circle-plus' },
];

/** The options as declared, or without their icons. */
const withIcons = ({
  options,
  icons,
}: {
  options: GeovisWorkspaceSidebarChoiceOption[];
  icons: boolean;
}) => {
  return icons
    ? options
    : options.map(({ icon: _icon, ...option }) => {
        return option;
      });
};

const buildConfig = (icons: boolean): GeovisWorkspaceConfig => {
  return {
    leftSidebar: {
      initialState: 'open',
      sections: [
        {
          id: 'filtros',
          header: { title: 'Filtros', icon: 'lucide:filter' },
          body: {
            kind: 'filters',
            blocks: [
              {
                id: 'level',
                title: 'Recortes',
                icon: 'lucide:map',
                collapsible: true,
                control: {
                  kind: 'choice',
                  menuId: 'level',
                  layout: 'list',
                  options: withIcons({ options: LEVELS, icons }),
                },
              },
              {
                id: 'age',
                title: 'Faixa etária',
                icon: 'lucide:users',
                collapsible: true,
                control: {
                  kind: 'choice',
                  menuId: 'age',
                  layout: { kind: 'grid', columns: 2 },
                  options: withIcons({ options: AGES, icons }),
                },
              },
            ],
          },
        },
      ],
    },
  };
};

const ChoiceFiltersDemo = ({
  icons = false,
}: {
  /** Whether each option carries an icon before its label. */
  icons?: boolean;
}) => {
  const [selection, setSelection] = React.useState<GeovisWorkspaceSelection>(
    {}
  );

  const config = React.useMemo(() => {
    return buildConfig(icons);
  }, [icons]);

  // The age band scales the fictitious values, so a pick shows on the map.
  const visualizationSpec = React.useMemo(() => {
    return buildSpec({
      variable: 'cumulative-rate',
      age: selection.age ?? '65-plus',
    });
  }, [selection.age]);

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <div style={{ height: 640 }}>
        <GeovisWorkspace
          config={config}
          visualizationSpec={visualizationSpec}
          variables={selection}
          onVariableChange={setSelection}
        />
      </div>
      <code style={{ fontSize: 12 }}>
        selection: {JSON.stringify(selection)}
      </code>
    </div>
  );
};

const meta = {
  title: 'Geovis Workspace/ChoiceFilters',
  component: ChoiceFiltersDemo,
  tags: ['autodocs'],
  decorators: [withPtBr],
} satisfies Meta<typeof ChoiceFiltersDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A `list` choice with sublabels and counts, and a two-column `grid` choice. */
export const Default: Story = {};

/** The same blocks with an icon before each option's label. */
export const WithIcons: Story = {
  args: { icons: true },
};
