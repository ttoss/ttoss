import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from 'src/App';

const stageStyle = (container: HTMLElement): string => {
  return container.querySelector('.stage style')?.textContent ?? '';
};

test('editing the brand scale cascades to the stage (the wow)', () => {
  const { container } = render(<App />);

  // Accent surfaces resolve to the brand color; before editing, the distinctive
  // value is absent from the stage CSS.
  expect(stageStyle(container).toLowerCase()).not.toContain('#abcdef');

  const hexInput = screen.getByLabelText('brand 500 hex');
  fireEvent.change(hexInput, { target: { value: '#abcdef' } });

  // The edited brand color now appears in the stage's element-scoped CSS —
  // proving one core-color edit re-themes the rendered components.
  expect(stageStyle(container).toLowerCase()).toContain('#abcdef');
});

test('a color edit shows in the change diff and reverts individually', async () => {
  const user = userEvent.setup();
  render(<App />);
  const inspector = screen.getByRole('complementary', { name: 'Inspector' });

  expect(within(inspector).getByText(/No changes yet/)).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText('brand 500 hex'), {
    target: { value: '#abcdef' },
  });

  expect(within(inspector).getByText('Changes (1)')).toBeInTheDocument();
  expect(within(inspector).getByText(/brand\.500/)).toBeInTheDocument();

  // Revert via the navigator's per-leaf control.
  await user.click(screen.getByLabelText('Revert brand 500'));
  expect(within(inspector).getByText(/No changes yet/)).toBeInTheDocument();
});

test('reset all clears the diff', async () => {
  const user = userEvent.setup();
  render(<App />);
  const inspector = screen.getByRole('complementary', { name: 'Inspector' });

  fireEvent.change(screen.getByLabelText('brand 500 hex'), {
    target: { value: '#abcdef' },
  });
  fireEvent.change(screen.getByLabelText('neutral 0 hex'), {
    target: { value: '#fefefe' },
  });
  expect(within(inspector).getByText('Changes (2)')).toBeInTheDocument();

  await user.click(
    within(inspector).getByRole('button', { name: 'Reset all' })
  );
  expect(within(inspector).getByText(/No changes yet/)).toBeInTheDocument();
});

test('reverting via the diff row also works', async () => {
  const user = userEvent.setup();
  render(<App />);
  const inspector = screen.getByRole('complementary', { name: 'Inspector' });

  fireEvent.change(screen.getByLabelText('brand 500 hex'), {
    target: { value: '#abcdef' },
  });
  const diffRow = within(inspector)
    .getByText(/brand\.500/)
    .closest('li');
  expect(diffRow).not.toBeNull();
  await user.click(
    within(diffRow as HTMLElement).getByRole('button', {
      name: 'Revert',
    })
  );
  expect(within(inspector).getByText(/No changes yet/)).toBeInTheDocument();
});

test('switching preset starts a fresh diff', async () => {
  const user = userEvent.setup();
  render(<App />);
  const inspector = screen.getByRole('complementary', { name: 'Inspector' });

  fireEvent.change(screen.getByLabelText('brand 500 hex'), {
    target: { value: '#abcdef' },
  });
  expect(within(inspector).getByText('Changes (1)')).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'Bruttal' }));
  expect(within(inspector).getByText(/No changes yet/)).toBeInTheDocument();
});

test('apply-to-Studio toggle exposes the safe-fallback control', async () => {
  const user = userEvent.setup();
  render(<App />);

  const toggle = screen.getByRole('checkbox', {
    name: /Apply this theme to the Studio/,
  });
  expect(toggle).not.toBeChecked();

  await user.click(toggle);
  expect(toggle).toBeChecked();

  const fallback = screen.getByRole('button', {
    name: 'Reset Studio to a safe theme',
  });
  await user.click(fallback);
  expect(toggle).not.toBeChecked();
});

test('contrast section surfaces curated pairs ambiently', () => {
  render(<App />);
  const inspector = screen.getByRole('complementary', { name: 'Inspector' });
  expect(within(inspector).getByText('Accent action')).toBeInTheDocument();
  expect(within(inspector).getByText('Surface')).toBeInTheDocument();
});

test('export peak ships all three formats', async () => {
  const user = userEvent.setup();
  render(<App />);
  const inspector = screen.getByRole('complementary', { name: 'Inspector' });

  await user.click(
    within(inspector).getByRole('button', { name: 'Export theme' })
  );

  const content = screen.getByTestId('export-content');
  // Default tab: runnable TypeScript.
  expect(content.textContent).toContain('createTheme');

  await user.click(screen.getByRole('tab', { name: 'CSS' }));
  expect(screen.getByTestId('export-content').textContent).toContain('--tt-');

  await user.click(screen.getByRole('tab', { name: 'DTCG' }));
  expect(screen.getByTestId('export-content').textContent).toContain('brand');

  // Collapsing hides the export view.
  await user.click(
    within(inspector).getByRole('button', { name: 'Hide export' })
  );
  expect(screen.queryByTestId('export-content')).not.toBeInTheDocument();
});

describe('export copy', () => {
  // `userEvent.setup()` installs its own clipboard stub, so the copy tests use
  // fireEvent and control navigator.clipboard explicitly. `configurable: true`
  // keeps each redefinition legal.
  const setClipboard = (value: unknown) => {
    Object.defineProperty(navigator, 'clipboard', {
      value,
      configurable: true,
    });
  };

  afterEach(() => {
    setClipboard(undefined);
  });

  const openExport = () => {
    render(<App />);
    const inspector = screen.getByRole('complementary', { name: 'Inspector' });
    fireEvent.click(
      within(inspector).getByRole('button', { name: 'Export theme' })
    );
  };

  test('no clipboard: copy is a no-op', () => {
    setClipboard(undefined);
    openExport();
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument();
  });

  test('clipboard success shows Copied', async () => {
    setClipboard({
      writeText: () => {
        return Promise.resolve();
      },
    });
    openExport();
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    expect(
      await screen.findByRole('button', { name: 'Copied' })
    ).toBeInTheDocument();
  });

  test('clipboard failure keeps Copy', async () => {
    setClipboard({
      writeText: () => {
        return Promise.reject(new Error('denied'));
      },
    });
    openExport();
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    // The rejection handler runs setCopied(false); the label stays "Copy".
    expect(
      await screen.findByRole('button', { name: 'Copy' })
    ).toBeInTheDocument();
  });
});

test('editing via the native color input updates the theme', () => {
  render(<App />);
  const colorInput = screen.getByLabelText('brand 500 color');
  fireEvent.change(colorInput, { target: { value: '#abcdef' } });
  expect(screen.getByLabelText('brand 500 hex')).toHaveValue('#abcdef');
});

test('a non-6-digit hex override falls back safely in the color input', () => {
  render(<App />);
  fireEvent.change(screen.getByLabelText('brand 500 hex'), {
    target: { value: '#fff' },
  });
  // The text field keeps the raw value; the native color input, which requires
  // #rrggbb, falls back rather than showing an invalid value.
  expect(screen.getByLabelText('brand 500 hex')).toHaveValue('#fff');
  expect(screen.getByLabelText('brand 500 color')).toHaveValue('#000000');
});
