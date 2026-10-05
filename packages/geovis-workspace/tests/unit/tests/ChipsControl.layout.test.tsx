/**
 * The chips control's `layout`: the default wrapping row, the grid of equal
 * columns, and how an invalid column count is read.
 */

import { I18nProvider } from '@ttoss/react-i18n';
import { render, screen } from '@ttoss/test-utils/react';
import type { GeovisWorkspaceSidebarChipsFilter } from 'src';
import {
  ChipsControl,
  resolveColumns,
} from 'src/components/LeftSidebar/ChipsControl';

const options = [
  { id: 'soja', label: 'Soja', emoji: '🌱' },
  { id: 'cana', label: 'Cana-de-açúcar e derivados', icon: 'lucide:leaf' },
  { id: 'milho', label: 'Milho' },
];

const renderChips = (layout?: GeovisWorkspaceSidebarChipsFilter['layout']) => {
  render(
    <I18nProvider>
      <ChipsControl
        control={{ kind: 'chips', options, layout }}
        selected={[]}
        onToggle={jest.fn()}
        onClear={jest.fn()}
      />
    </I18nProvider>
  );

  const chip = screen.getByRole('button', { name: /Soja/ });
  return { chip, container: chip.parentElement as HTMLElement };
};

test('without a layout the chips wrap at their own widths', () => {
  const { chip, container } = renderChips();

  expect(container).toHaveStyle({ display: 'flex', flexWrap: 'wrap' });
  expect(chip).not.toHaveAttribute('title');
  // The label is the chip's own text: its only span is the emoji, with no
  // ellipsis-cut label span beside it.
  expect(chip.querySelectorAll('span')).toHaveLength(1);
  expect(chip).toHaveTextContent('🌱Soja');
});

test('an explicit wrap layout is the default', () => {
  const { container } = renderChips({ kind: 'wrap' });

  expect(container).toHaveStyle({ display: 'flex', flexWrap: 'wrap' });
});

test('a grid layout draws equal columns, each chip filling its cell', () => {
  const { chip, container } = renderChips({ kind: 'grid', columns: 3 });

  expect(container).toHaveStyle({
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  });
  expect(chip).toHaveStyle({ width: '100%' });
});

test('in a grid an overlong label is cut and reads whole on hover', () => {
  renderChips({ kind: 'grid', columns: 3 });

  const chip = screen.getByRole('button', {
    name: 'Cana-de-açúcar e derivados',
  });
  expect(chip).toHaveAttribute('title', 'Cana-de-açúcar e derivados');

  const label = screen.getByText('Cana-de-açúcar e derivados');
  expect(label).toHaveStyle({
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  });
});

test('an invalid column count still draws a grid', () => {
  const { container } = renderChips({ kind: 'grid', columns: 0 });

  expect(container).toHaveStyle({
    gridTemplateColumns: 'repeat(1, minmax(0, 1fr))',
  });
});

test.each([
  [2, 2],
  [2.7, 2],
  [1, 1],
  [0, 1],
  [-3, 1],
  [Number.NaN, 1],
  [Number.POSITIVE_INFINITY, 1],
])('resolveColumns(%p) is %p', (columns, expected) => {
  expect(resolveColumns(columns)).toBe(expected);
});
