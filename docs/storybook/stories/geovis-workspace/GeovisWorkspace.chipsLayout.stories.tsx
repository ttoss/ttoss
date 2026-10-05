import type { Meta, StoryObj } from '@storybook/react-webpack5';
import {
  GeovisWorkspace,
  type GeovisWorkspaceConfig,
  type GeovisWorkspaceSidebarChipsLayout,
} from '@ttoss/geovis-workspace';
import * as React from 'react';

import { withPtBr } from './GeovisWorkspace.decorators';
import { buildSpec } from './GeovisWorkspace.fixtures';

/**
 * **Chips layout.** A `chips` filter arranges its chips one of two ways,
 * chosen by its optional `layout`:
 *
 * - `{ kind: 'wrap' }` — the default, and what a chips control without
 *   `layout` gets. Each chip is as wide as its label, and the row flows onto
 *   the next line when it runs out of room, so rows come out ragged.
 * - `{ kind: 'grid', columns }` — `columns` equal-width columns. Each chip
 *   fills its cell, so the columns line up row after row. A label that does not
 *   fit ends in an ellipsis and reads in full on hover: wrapping it instead
 *   would make its row taller than the rest, which is the alignment the grid is
 *   there to keep.
 *
 * ```ts
 * { kind: 'chips', options, layout: { kind: 'grid', columns: 3 } }
 * ```
 *
 * `columns` only exists on the grid — a wrap that declares it, or a grid that
 * leaves it out, does not type-check. A value that is not a whole number of at
 * least 1 (`0`, a negative, a fraction) is floored and clamped to 1 rather
 * than breaking the layout.
 *
 * ## What to check
 *
 * 1. `Wrap` — the chips flow left to right at their own widths; the long
 *    **Cana-de-açúcar e derivados** label sits on a row of its own.
 * 2. `GridTwoColumns` and `GridThreeColumns` — the chips line up in columns,
 *    every row the same height. In three columns the long label is cut with an
 *    ellipsis; hover it to read it whole.
 * 3. In any of them, toggle a few chips: the tab badge counts them, and the
 *    "clear" action appears under the chips, outside the grid.
 */

const OPTIONS = [
  { id: 'soja', label: 'Soja', emoji: '🌱' },
  { id: 'milho', label: 'Milho', emoji: '🌽' },
  { id: 'cafe', label: 'Café', emoji: '☕' },
  { id: 'cana', label: 'Cana-de-açúcar e derivados', emoji: '🎋' },
  { id: 'laranja', label: 'Laranja', emoji: '🍊' },
  { id: 'mandioca', label: 'Mandioca', emoji: '🌿' },
  { id: 'arroz', label: 'Arroz', emoji: '🌾' },
  { id: 'feijao', label: 'Feijão', emoji: '🫘' },
];

const buildConfig = (
  layout?: GeovisWorkspaceSidebarChipsLayout
): GeovisWorkspaceConfig => {
  return {
    leftSidebar: {
      initialState: 'open',
      sections: [
        {
          id: 'filters',
          header: { title: 'Filtros', icon: 'lucide:filter' },
          body: {
            kind: 'filters',
            blocks: [
              {
                id: 'products',
                title: 'Produtos',
                icon: 'lucide:wheat',
                control: {
                  kind: 'chips',
                  options: OPTIONS,
                  defaultSelected: ['soja', 'cafe'],
                  ...(layout ? { layout } : {}),
                },
              },
            ],
          },
        },
      ],
    },
  };
};

const ChipsLayoutDemo = ({
  layout,
}: {
  /** The chips control's `layout`; omitted, the chips wrap. */
  layout?: GeovisWorkspaceSidebarChipsLayout;
}) => {
  const config = React.useMemo(() => {
    return buildConfig(layout);
  }, [layout]);

  const visualizationSpec = React.useMemo(() => {
    return buildSpec({ variable: 'cumulative-rate', age: '65-plus' });
  }, []);

  return (
    <div style={{ height: 640 }}>
      <GeovisWorkspace config={config} visualizationSpec={visualizationSpec} />
    </div>
  );
};

const meta = {
  title: 'Geovis Workspace/ChipsLayout',
  component: ChipsLayoutDemo,
  tags: ['autodocs'],
  decorators: [withPtBr],
} satisfies Meta<typeof ChipsLayoutDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

/** No `layout`: the default wrap, each chip as wide as its label. */
export const Wrap: Story = {};

/** `layout: { kind: 'grid', columns: 2 }` — two aligned columns. */
export const GridTwoColumns: Story = {
  args: { layout: { kind: 'grid', columns: 2 } },
};

/**
 * `layout: { kind: 'grid', columns: 3 }` — three aligned columns; the long
 * label is cut with an ellipsis and reads in full on hover.
 */
export const GridThreeColumns: Story = {
  args: { layout: { kind: 'grid', columns: 3 } },
};
