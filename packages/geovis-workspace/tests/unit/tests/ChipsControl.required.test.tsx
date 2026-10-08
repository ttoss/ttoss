/**
 * A chips filter that drives the shared selection: `required` keeps one chip
 * on, and a `menuId` makes the chips show what the selection holds — so an app
 * that rewrites the value sees them follow instead of fighting it.
 */

import { render, screen, within } from '@ttoss/test-utils/react';
import * as React from 'react';
import {
  GeovisWorkspace,
  type GeovisWorkspaceSelection,
  type GeovisWorkspaceSidebarChipsFilter,
} from 'src';

import { click, Provider, visualizationSpec } from './leftSidebarTestUtils';

jest.mock('@ttoss/geovis', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- the factory is hoisted above imports
  return require('./leftSidebarTestUtils').createGeoVisMock();
});

const AGES = [
  { id: '65', label: 'Todos' },
  { id: '65-69', label: '65 a 69' },
  { id: '70-74', label: '70 a 74' },
];

const configWith = (chips: GeovisWorkspaceSidebarChipsFilter) => {
  return {
    leftSidebar: {
      initialState: 'open' as const,
      sections: [
        {
          id: 'filtros',
          header: { title: 'Filtros', icon: 'lucide:filter' },
          body: {
            kind: 'filters' as const,
            blocks: [{ id: 'idade', title: 'Faixa etária', control: chips }],
          },
        },
      ],
    },
  };
};

const chip = (label: string) => {
  return screen.getByRole('button', { name: label });
};

const tab = () => {
  return screen.getByRole('button', { name: 'Filtros' });
};

const renderChips = ({
  chips,
  variables,
  onVariableChange,
}: {
  chips: GeovisWorkspaceSidebarChipsFilter;
  variables?: GeovisWorkspaceSelection;
  onVariableChange?: (selection: GeovisWorkspaceSelection) => void;
}) => {
  return render(
    <GeovisWorkspace
      config={configWith(chips)}
      visualizationSpec={visualizationSpec}
      variables={variables}
      onVariableChange={onVariableChange}
    />,
    { wrapper: Provider }
  );
};

const requiredSingle: GeovisWorkspaceSidebarChipsFilter = {
  kind: 'chips',
  menuId: 'age',
  multiple: false,
  required: true,
  options: AGES,
  defaultSelected: ['65'],
};

describe('required single choice', () => {
  test('moves the choice, and keeps it when the active chip is clicked', async () => {
    const onVariableChange = jest.fn();
    renderChips({ chips: requiredSingle, onVariableChange });

    expect(chip('Todos')).toHaveAttribute('aria-pressed', 'true');
    expect(onVariableChange).toHaveBeenLastCalledWith({ age: '65' });

    await click(chip('70 a 74'));
    expect(chip('70 a 74')).toHaveAttribute('aria-pressed', 'true');
    expect(chip('Todos')).toHaveAttribute('aria-pressed', 'false');
    expect(onVariableChange).toHaveBeenLastCalledWith({ age: '70-74' });

    const calls = onVariableChange.mock.calls.length;
    await click(chip('70 a 74'));
    expect(chip('70 a 74')).toHaveAttribute('aria-pressed', 'true');
    expect(onVariableChange).toHaveBeenCalledTimes(calls);
  });

  test('offers no clear action and no tab badge', () => {
    renderChips({ chips: requiredSingle });

    expect(screen.queryByRole('button', { name: /Limpar/ })).toBeNull();
    expect(within(tab()).queryByText('1')).toBeNull();
  });

  test('lights the first option when nothing else is', () => {
    const onVariableChange = jest.fn();
    renderChips({
      chips: { ...requiredSingle, defaultSelected: undefined },
      onVariableChange,
    });

    expect(chip('Todos')).toHaveAttribute('aria-pressed', 'true');
    expect(onVariableChange).toHaveBeenLastCalledWith({ age: '65' });
  });

  test('replaces a value naming no current option with the first one', () => {
    const onVariableChange = jest.fn();
    renderChips({
      chips: requiredSingle,
      variables: { age: '75' },
      onVariableChange,
    });

    expect(chip('Todos')).toHaveAttribute('aria-pressed', 'true');
    expect(onVariableChange).toHaveBeenLastCalledWith({ age: '65' });
  });

  test('keeps one chip of a multi-id value', () => {
    renderChips({ chips: requiredSingle, variables: { age: '65-69,70-74' } });

    expect(chip('65 a 69')).toHaveAttribute('aria-pressed', 'true');
    expect(chip('70 a 74')).toHaveAttribute('aria-pressed', 'false');
  });

  test('publishes nothing when there is no option to fall back on', () => {
    const onVariableChange = jest.fn();
    renderChips({
      chips: { ...requiredSingle, options: [] },
      onVariableChange,
    });

    expect(onVariableChange).toHaveBeenLastCalledWith({ age: '' });
  });
});

/**
 * An app with its own rule over the value: the band is fitted to the options
 * it currently offers, as a choropleth fits an age band to the indicator.
 */
const FittingApp = () => {
  const [selection, setSelection] = React.useState<GeovisWorkspaceSelection>({
    age: '65',
  });
  const [offerTodos, setOfferTodos] = React.useState(true);
  const options = offerTodos
    ? AGES
    : AGES.filter((age) => {
        return age.id !== '65';
      });

  const fit = (next: GeovisWorkspaceSelection) => {
    const known = options.some((option) => {
      return option.id === next.age;
    });
    return known ? next : { ...next, age: options[0].id };
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOfferTodos(false);
          setSelection((current) => {
            return current.age === '65'
              ? { ...current, age: '65-69' }
              : current;
          });
        }}
      >
        drop Todos
      </button>
      <GeovisWorkspace
        config={configWith({ ...requiredSingle, options })}
        visualizationSpec={visualizationSpec}
        variables={selection}
        onVariableChange={(next) => {
          setSelection(fit(next));
        }}
      />
    </>
  );
};

test('the chips follow a value the app rewrites', async () => {
  render(<FittingApp />, { wrapper: Provider });
  expect(chip('Todos')).toHaveAttribute('aria-pressed', 'true');

  await click(screen.getByRole('button', { name: 'drop Todos' }));

  expect(screen.queryByRole('button', { name: 'Todos' })).toBeNull();
  expect(chip('65 a 69')).toHaveAttribute('aria-pressed', 'true');
});

describe('required multiple choice', () => {
  const requiredMultiple: GeovisWorkspaceSidebarChipsFilter = {
    kind: 'chips',
    menuId: 'products',
    required: true,
    options: AGES,
    defaultSelected: ['65', '65-69'],
  };

  test('toggles freely, but the last chip stays on', async () => {
    const onVariableChange = jest.fn();
    renderChips({ chips: requiredMultiple, onVariableChange });

    await click(chip('Todos'));
    expect(onVariableChange).toHaveBeenLastCalledWith({ products: '65-69' });

    await click(chip('65 a 69'));
    expect(chip('65 a 69')).toHaveAttribute('aria-pressed', 'true');
    expect(onVariableChange).toHaveBeenLastCalledWith({ products: '65-69' });

    await click(chip('70 a 74'));
    expect(onVariableChange).toHaveBeenLastCalledWith({
      products: '65-69,70-74',
    });
    expect(screen.queryByRole('button', { name: /Limpar/ })).toBeNull();
  });
});

test('optional chips still clear to nothing, with a badge', async () => {
  const onVariableChange = jest.fn();
  renderChips({
    chips: { ...requiredSingle, required: false },
    onVariableChange,
  });

  expect(within(tab()).getByText('1')).toBeInTheDocument();

  await click(chip('Todos'));
  expect(onVariableChange).toHaveBeenLastCalledWith({ age: '' });
  expect(chip('Todos')).toHaveAttribute('aria-pressed', 'false');
});
