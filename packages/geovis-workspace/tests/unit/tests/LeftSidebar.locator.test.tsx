/**
 * The locator filter: its combobox, the keyboard walk through the results, the
 * recent picks, the selected card, and the two things a pick does — the camera
 * move it dispatches and the selection it publishes. The rest of the left
 * sidebar is covered in LeftSidebar.test.tsx, whose preview config and helpers
 * this suite shares.
 */

import {
  act,
  fireEvent,
  render,
  screen,
  within,
} from '@ttoss/test-utils/react';
import type * as React from 'react';
import { GeovisWorkspace } from 'src';

import {
  click,
  locatorPreview,
  openFiltros,
  type Preview,
  preview,
  Provider,
  visualizationSpec,
} from './leftSidebarTestUtils';

jest.mock('@ttoss/geovis', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- the factory is hoisted above imports
  return require('./leftSidebarTestUtils').createGeoVisMock();
});

const renderPreview = (
  props: Partial<React.ComponentProps<typeof GeovisWorkspace>> = {},
  previewConfig: Preview = preview
) => {
  return render(
    <GeovisWorkspace
      config={{ leftSidebar: { initialState: 'open', ...previewConfig } }}
      visualizationSpec={visualizationSpec}
      {...props}
    />,
    { wrapper: Provider }
  );
};

/** The locator block starts collapsed in the shared preview. */
const openLocator = async () => {
  await openFiltros();
  await click(screen.getByRole('button', { name: /Local/ }));
};

test('the locator searches, selects, and marks the match', async () => {
  renderPreview();
  await openLocator();

  const input = screen.getByRole('combobox');

  // Below `minChars` → no list at all, so the field is not a combobox yet.
  await act(async () => {
    fireEvent.change(input, { target: { value: 's' } });
  });
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  expect(input).toHaveAttribute('aria-expanded', 'false');

  // At/above `minChars` → the matching options, with their value readouts.
  await act(async () => {
    fireEvent.change(input, { target: { value: 'san' } });
  });
  expect(input).toHaveAttribute('aria-expanded', 'true');
  expect(screen.getAllByRole('option')).toHaveLength(2);
  expect(screen.getByText('1.240')).toBeInTheDocument();

  // The matched run is marked inside the label rather than replacing it, so
  // the row still reads as the whole name.
  const santos = screen.getByRole('option', { name: 'Santos' });
  expect(within(santos).getByText('San')).toBeInTheDocument();

  await act(async () => {
    fireEvent.mouseDown(santos);
  });

  expect(screen.getByText('Selecionado')).toBeInTheDocument();
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
});

/*
 * The arrow keys move a cursor through the list without moving focus off the
 * input — `aria-activedescendant` is what carries it — so the query stays
 * editable while the list is walked.
 */
test('the locator walks its results with the arrow keys', async () => {
  renderPreview();
  await openLocator();

  const input = screen.getByRole('combobox');
  await act(async () => {
    fireEvent.change(input, { target: { value: 'san' } });
  });

  const [first, second] = screen.getAllByRole('option');
  expect(first).toHaveAttribute('aria-selected', 'true');
  expect(input).toHaveAttribute('aria-activedescendant', first.id);

  await act(async () => {
    fireEvent.keyDown(input, { key: 'ArrowDown' });
  });
  expect(second).toHaveAttribute('aria-selected', 'true');
  expect(input).toHaveAttribute('aria-activedescendant', second.id);

  // Clamped at the end rather than wrapping: a jump back to the first row
  // reads as a scroll that lost its place.
  await act(async () => {
    fireEvent.keyDown(input, { key: 'ArrowDown' });
  });
  expect(second).toHaveAttribute('aria-selected', 'true');

  await act(async () => {
    fireEvent.keyDown(input, { key: 'ArrowUp' });
  });
  expect(screen.getAllByRole('option')[0]).toHaveAttribute(
    'aria-selected',
    'true'
  );

  // The pointer moves the same cursor the arrows do, so a row picked by mouse
  // is the row Enter would have taken.
  await act(async () => {
    fireEvent.mouseEnter(second);
  });
  expect(second).toHaveAttribute('aria-selected', 'true');
  await act(async () => {
    fireEvent.keyDown(input, { key: 'ArrowUp' });
  });

  // Enter takes the cursored row.
  await act(async () => {
    fireEvent.keyDown(input, { key: 'Enter' });
  });
  expect(screen.getByText('Selecionado')).toBeInTheDocument();
  expect(input).toHaveValue('Santos');
});

test('the locator closes its list on Escape, keeping the query', async () => {
  renderPreview();
  await openLocator();

  const input = screen.getByRole('combobox');
  await act(async () => {
    fireEvent.change(input, { target: { value: 'san' } });
  });
  expect(screen.getByRole('listbox')).toBeInTheDocument();

  await act(async () => {
    fireEvent.keyDown(input, { key: 'Escape' });
  });
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  expect(input).toHaveValue('san');
});

test('the locator says so when a query matches nothing', async () => {
  renderPreview();
  await openLocator();

  await act(async () => {
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'zzz' },
    });
  });

  expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  expect(screen.getByText(/Nada corresponde a/)).toBeInTheDocument();
});

test('the locator offers its previous picks back once the field is empty', async () => {
  renderPreview();
  await openLocator();

  const input = screen.getByRole('combobox');
  await act(async () => {
    fireEvent.change(input, { target: { value: 'san' } });
  });
  await act(async () => {
    fireEvent.mouseDown(screen.getByRole('option', { name: 'Santos' }));
  });

  // A pick fills the field, so the recents stay out of the way until it is
  // cleared.
  expect(screen.queryByText('Buscas recentes')).not.toBeInTheDocument();

  await act(async () => {
    fireEvent.mouseDown(screen.getByRole('button', { name: 'Limpar busca' }));
  });

  expect(screen.getByText('Buscas recentes')).toBeInTheDocument();

  // The chip picks the same place again, without retyping it.
  await act(async () => {
    fireEvent.mouseDown(screen.getByRole('button', { name: 'Santos' }));
  });
  expect(input).toHaveValue('Santos');
  expect(screen.getByText('Selecionado')).toBeInTheDocument();
});

test('the locator card carries its sublabel, its value, and its own way out', async () => {
  renderPreview();
  await openLocator();

  const input = screen.getByRole('combobox');
  await act(async () => {
    fireEvent.change(input, { target: { value: 'são' } });
  });
  await act(async () => {
    fireEvent.mouseDown(screen.getByRole('option', { name: 'São Paulo' }));
  });
  expect(screen.getByText('SP · Brasil')).toBeInTheDocument();

  // Removing the pick leaves the query alone — the field is how you search,
  // the card is what you searched for.
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Remover seleção' }));
  });
  expect(screen.queryByText('SP · Brasil')).not.toBeInTheDocument();
  expect(input).toHaveValue('São Paulo');
});

/*
 * The camera move is an action on the runtime, not a spec rebuild: the layers
 * and sources on screen are never re-created just to pan.
 */
test('the locator dispatches its entry view preset on pick', async () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- the mock module is required, not imported
  const { __dispatch } = require('@ttoss/geovis');
  __dispatch.mockClear();

  renderPreview();
  await openLocator();

  await act(async () => {
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'san' },
    });
  });
  await act(async () => {
    fireEvent.mouseDown(screen.getByRole('option', { name: 'Santos' }));
  });

  expect(__dispatch).toHaveBeenCalledWith({
    type: 'set-view-preset',
    presetId: 'santos',
  });
});

test('the locator moves nothing for an entry declaring no camera', async () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- the mock module is required, not imported
  const { __dispatch, __setView } = require('@ttoss/geovis');
  __dispatch.mockClear();
  __setView.mockClear();

  renderPreview();
  await openLocator();

  await act(async () => {
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'san' },
    });
  });
  await act(async () => {
    fireEvent.mouseDown(
      screen.getByRole('option', { name: 'Santo André, 1.240' })
    );
  });

  expect(__dispatch).not.toHaveBeenCalled();
  expect(__setView).not.toHaveBeenCalled();
});

test('the locator reports its pick through the shared selection', async () => {
  const onVariableChange = jest.fn();
  renderPreview({ onVariableChange });
  await openLocator();

  await act(async () => {
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'san' },
    });
  });
  await act(async () => {
    fireEvent.mouseDown(screen.getByRole('option', { name: 'Santos' }));
  });

  expect(onVariableChange).toHaveBeenCalledWith(
    expect.objectContaining({ local: '2' })
  );
});

/*
 * A permalink restored into `variables` opens with that entry on the card. The
 * field stays empty — the query is how the entry was found, not what it is.
 */
test('the locator opens on the entry the selection names', async () => {
  renderPreview({ variables: { local: '1' } });
  await openLocator();

  expect(screen.getByText('SP · Brasil')).toBeInTheDocument();
  expect(screen.getByRole('combobox')).toHaveValue('');
});

/*
 * The entry carrying its own camera goes through `setView`, not `dispatch`: it
 * is user navigation out of the app's data, not a step bounded by the spec, so
 * it leaves no entry in the action log.
 */
test("an entry's own view moves the camera through setView", async () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- the mock module is required, not imported
  const { __setView, __dispatch } = require('@ttoss/geovis');
  __setView.mockClear();
  __dispatch.mockClear();

  renderPreview();
  await openLocator();

  await act(async () => {
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'rec' },
    });
  });
  await act(async () => {
    fireEvent.mouseDown(screen.getByRole('option', { name: 'Recife' }));
  });

  expect(__setView).toHaveBeenCalledWith({
    center: [-34.88, -8.05],
    zoom: 9,
    pitch: undefined,
    bearing: undefined,
    duration: 2400,
    essential: true,
  });
  expect(__dispatch).not.toHaveBeenCalled();
});

/*
 * A named, spec-declared camera is the more deliberate of the two, and the only
 * one an agent can also reach — so an entry declaring both takes that one.
 */
test('a preset wins over a view declared on the same entry', async () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- the mock module is required, not imported
  const { __setView, __dispatch } = require('@ttoss/geovis');
  __setView.mockClear();
  __dispatch.mockClear();

  renderPreview(
    {},
    locatorPreview({
      kind: 'locator',
      minChars: 2,
      options: [
        {
          id: '1',
          label: 'Santos',
          viewPresetId: 'santos',
          view: { center: [0, 0], zoom: 2 },
        },
      ],
    })
  );
  await openLocator();

  await act(async () => {
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'san' },
    });
  });
  await act(async () => {
    fireEvent.mouseDown(screen.getByRole('option', { name: 'Santos' }));
  });

  expect(__dispatch).toHaveBeenCalledWith({
    type: 'set-view-preset',
    presetId: 'santos',
  });
  expect(__setView).not.toHaveBeenCalled();
});

/*
 * The names being searched carry accents the person typing mostly will not, so
 * the match ignores them — while the row still reads as the name is written.
 */
test('the locator finds accented names typed without accents', async () => {
  renderPreview(
    {},
    locatorPreview({
      kind: 'locator',
      minChars: 2,
      menuId: 'local',
      options: [
        { id: '1', label: 'São Paulo' },
        { id: '2', label: 'Goiânia' },
        { id: '3', label: 'Recife' },
      ],
    })
  );
  await openLocator();

  const input = screen.getByRole('combobox');
  await act(async () => {
    fireEvent.change(input, { target: { value: 'sao' } });
  });

  const option = screen.getByRole('option', { name: 'São Paulo' });
  expect(screen.getAllByRole('option')).toHaveLength(1);

  // The accent survives the round trip: the marked run is mapped back onto the
  // label as written, not onto the folded text the match was made on.
  expect(within(option).getByText('São')).toBeInTheDocument();

  await act(async () => {
    fireEvent.change(input, { target: { value: 'goiania' } });
  });
  expect(screen.getByRole('option', { name: 'Goiânia' })).toBeInTheDocument();
});

/*
 * A list loaded from a file arrives after the first render. A card seeded only
 * once would stay empty while the selection named one of its entries.
 */
test('the locator adopts the named entry when the options arrive late', async () => {
  const empty = locatorPreview({
    kind: 'locator',
    minChars: 2,
    menuId: 'local',
    options: [],
  });

  const { rerender } = renderPreview({ variables: { local: '1' } }, empty);
  await openLocator();

  expect(screen.queryByText('Selecionado')).not.toBeInTheDocument();

  const loaded = locatorPreview({
    kind: 'locator',
    minChars: 2,
    menuId: 'local',
    options: [{ id: '1', label: 'São Paulo', sublabel: 'SP · Brasil' }],
  });

  await act(async () => {
    rerender(
      <GeovisWorkspace
        config={{ leftSidebar: { initialState: 'open', ...loaded } }}
        visualizationSpec={visualizationSpec}
        variables={{ local: '1' }}
      />
    );
  });

  expect(screen.getByText('Selecionado')).toBeInTheDocument();
  expect(screen.getByText('SP · Brasil')).toBeInTheDocument();
});

/*
 * An entry that is a shape is framed as one — the zoom is the size of the
 * territory — and marked, which is what the layer's `selectedPaint` draws. Two
 * actions, because the marking outlives the framing: drag the map away and the
 * shape stays marked as the one that was searched for.
 */
test('an entry standing for a shape is framed and marked', async () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- the mock module is required, not imported
  const { __dispatch, __setView } = require('@ttoss/geovis');
  __dispatch.mockClear();
  __setView.mockClear();

  renderPreview();
  await openLocator();

  await act(async () => {
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'belo' },
    });
  });
  await act(async () => {
    fireEvent.mouseDown(screen.getByRole('option', { name: 'Belo Horizonte' }));
  });

  expect(__dispatch).toHaveBeenCalledWith({
    type: 'select-feature',
    layerId: 'municipios',
    featureId: 3106200,
  });
  expect(__dispatch).toHaveBeenCalledWith({
    type: 'fit-feature',
    layerId: 'municipios',
    featureId: 3106200,
    padding: undefined,
    animation: { duration: 2400, essential: true },
  });

  // The bounds are the runtime's to work out, so nothing here sends a camera.
  expect(__setView).not.toHaveBeenCalled();
});

/** How many times the map was told to mark something. */
const markCount = (dispatch: jest.Mock) => {
  return dispatch.mock.calls.filter((call: [{ type: string }]) => {
    return call[0].type === 'select-feature';
  }).length;
};

/*
 * Once, not once per render. Every provider render hands the control a fresh
 * `dispatch` — the real one is a `useCallback` over the committed result — and
 * a mark re-sent on each of those would flood the action log with the same
 * selection and re-write a feature-state that already says so.
 */
test('a marked shape is not re-marked when the provider re-renders', async () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- the mock module is required, not imported
  const { __dispatch } = require('@ttoss/geovis');
  __dispatch.mockClear();

  const { rerender } = renderPreview();
  await openLocator();

  await act(async () => {
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'belo' },
    });
  });
  await act(async () => {
    fireEvent.mouseDown(screen.getByRole('option', { name: 'Belo Horizonte' }));
  });

  expect(markCount(__dispatch)).toBe(1);

  await act(async () => {
    rerender(
      <GeovisWorkspace
        config={{ leftSidebar: { initialState: 'open', ...preview } }}
        visualizationSpec={{ ...visualizationSpec }}
      />
    );
  });

  expect(markCount(__dispatch)).toBe(1);
  expect(screen.getByText('Selecionado')).toBeInTheDocument();
});

/*
 * The arrangement to aim for: one key — an IBGE code, a district code — that
 * searches, frames, marks and travels in the permalink, so `featureId` never
 * has to be written down.
 */
test('a shape entry without featureId addresses the feature by its own id', async () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- the mock module is required, not imported
  const { __dispatch } = require('@ttoss/geovis');
  __dispatch.mockClear();

  renderPreview(
    {},
    locatorPreview({
      kind: 'locator',
      minChars: 2,
      menuId: 'local',
      options: [
        {
          id: '3550308',
          label: 'São Paulo',
          feature: { layerId: 'municipios', padding: 80 },
        },
      ],
    })
  );
  await openLocator();

  await act(async () => {
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'sao' },
    });
  });
  await act(async () => {
    fireEvent.mouseDown(screen.getByRole('option', { name: 'São Paulo' }));
  });

  expect(__dispatch).toHaveBeenCalledWith({
    type: 'fit-feature',
    layerId: 'municipios',
    featureId: '3550308',
    padding: 80,
    animation: undefined,
  });
  expect(__dispatch).toHaveBeenCalledWith({
    type: 'select-feature',
    layerId: 'municipios',
    featureId: '3550308',
  });
});

test('clearing a shape entry takes its mark off the map', async () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- the mock module is required, not imported
  const { __dispatch } = require('@ttoss/geovis');

  renderPreview();
  await openLocator();

  await act(async () => {
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'belo' },
    });
  });
  await act(async () => {
    fireEvent.mouseDown(screen.getByRole('option', { name: 'Belo Horizonte' }));
  });

  __dispatch.mockClear();

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Remover seleção' }));
  });

  expect(__dispatch).toHaveBeenCalledWith({
    type: 'select-feature',
    layerId: 'municipios',
    featureId: null,
  });
});

/*
 * Reopening on a shape marks it without travelling to it: what is chosen shows
 * as chosen, while the spec's own `view` still frames the first paint.
 */
test('a restored shape entry comes back marked, not travelled to', async () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- the mock module is required, not imported
  const { __dispatch } = require('@ttoss/geovis');
  __dispatch.mockClear();

  renderPreview({ variables: { local: '3106200' } });
  await openLocator();

  expect(screen.getByText('Selecionado')).toBeInTheDocument();
  expect(__dispatch).toHaveBeenCalledWith({
    type: 'select-feature',
    layerId: 'municipios',
    featureId: 3106200,
  });
  expect(__dispatch).not.toHaveBeenCalledWith(
    expect.objectContaining({ type: 'fit-feature' })
  );
});

test('the locator focus state, and both clear paths', async () => {
  jest.useFakeTimers();
  try {
    renderPreview();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Filtros' }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Local/ }));
    });

    const input = screen.getByRole('combobox');

    // Focusing opens the list on a query that already matches.
    act(() => {
      fireEvent.focus(input);
    });
    act(() => {
      fireEvent.change(input, { target: { value: 'são' } });
    });
    act(() => {
      fireEvent.mouseDown(screen.getByRole('option', { name: 'São Paulo' }));
    });

    // The inline clear takes both the query and the selection.
    act(() => {
      fireEvent.mouseDown(screen.getByRole('button', { name: 'Limpar busca' }));
    });
    expect(screen.queryByText('SP · Brasil')).not.toBeInTheDocument();

    // Emptying the field by typing clears the selection too.
    act(() => {
      fireEvent.change(input, { target: { value: 'sa' } });
    });
    act(() => {
      fireEvent.change(input, { target: { value: '' } });
    });
    expect(screen.queryByText('Selecionado')).not.toBeInTheDocument();

    // Blurring hides the list only after its grace period, so a pick made with
    // the pointer still lands.
    act(() => {
      fireEvent.change(input, { target: { value: 'san' } });
    });
    act(() => {
      fireEvent.blur(input);
    });
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  } finally {
    jest.useRealTimers();
  }
});

/*
 * Dropping the pick reports the empty string, the same "nothing chosen" the
 * chips publish when their last one goes — a selection left holding the id
 * would restore, from a permalink, an entry the user had removed.
 */
test('the locator publishes an empty selection when its pick is dropped', async () => {
  const onVariableChange = jest.fn();
  renderPreview({ onVariableChange });
  await openLocator();

  await act(async () => {
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'san' },
    });
  });
  await act(async () => {
    fireEvent.mouseDown(screen.getByRole('option', { name: 'Santos' }));
  });

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Remover seleção' }));
  });

  expect(onVariableChange).toHaveBeenLastCalledWith(
    expect.objectContaining({ local: '' })
  );
});

/*
 * Both of the locator's opt-ins left out: the pick stays inside the control,
 * and the query has to reach the default two characters to be searched on.
 */
test('a locator with neither menuId nor minChars keeps its pick to itself', async () => {
  const onVariableChange = jest.fn();
  renderPreview(
    { onVariableChange },
    locatorPreview({
      kind: 'locator',
      placeholder: 'Buscar município...',
      options: [{ id: 'a', label: 'Santos' }],
    })
  );
  await openLocator();

  const input = screen.getByRole('combobox');
  await act(async () => {
    fireEvent.change(input, { target: { value: 's' } });
  });
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

  await act(async () => {
    fireEvent.change(input, { target: { value: 'sa' } });
  });
  await act(async () => {
    fireEvent.mouseDown(screen.getByRole('option', { name: 'Santos' }));
  });

  expect(screen.getByText('Selecionado')).toBeInTheDocument();

  // Dropping it publishes nothing either: there is no key to report under.
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Remover seleção' }));
  });
  expect(screen.queryByText('Selecionado')).not.toBeInTheDocument();
  expect(onVariableChange).not.toHaveBeenCalledWith(
    expect.objectContaining({ local: expect.anything() })
  );
});

/*
 * `minChars: 0` is the short-list shape: there is nothing to narrow down to, so
 * the options are all there the moment the field is focused, with no matched
 * run to mark inside their labels.
 */
test('a locator with no minimum lists every option on focus, unmarked', async () => {
  renderPreview(
    {},
    locatorPreview({
      kind: 'locator',
      minChars: 0,
      menuId: 'local',
      options: [
        { id: '1', label: 'Santos' },
        { id: '2', label: 'Recife' },
      ],
    })
  );
  await openLocator();

  await act(async () => {
    fireEvent.focus(screen.getByRole('combobox'));
  });

  const options = screen.getAllByRole('option');
  expect(options).toHaveLength(2);
  expect(options[0]).toHaveTextContent('Santos');
});

test('the locator ignores keys that are not its own and arrows with nothing to walk', async () => {
  renderPreview();
  await openLocator();

  const input = screen.getByRole('combobox');

  // A query that matches nothing: the arrows have no row to move onto, and the
  // "nothing matches" note stays where the list would have been.
  await act(async () => {
    fireEvent.change(input, { target: { value: 'zzz' } });
  });
  await act(async () => {
    fireEvent.keyDown(input, { key: 'ArrowDown' });
  });
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  expect(input).not.toHaveAttribute('aria-activedescendant');

  // Any other key is left to the input, which is what keeps the field typable.
  await act(async () => {
    fireEvent.change(input, { target: { value: 'san' } });
  });
  await act(async () => {
    fireEvent.keyDown(input, { key: 'Tab' });
  });
  expect(screen.getAllByRole('option')[0]).toHaveAttribute(
    'aria-selected',
    'true'
  );
});
