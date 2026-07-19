import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from 'src/App';
import { ThemeInspector } from 'src/studio/theme/ThemeInspector';
import { ThemeStoreProvider } from 'src/studio/theme/themeStore';

const stageStyle = (container: HTMLElement): string => {
  return container.querySelector('.stage style')?.textContent ?? '';
};

/** Boot into the Theme lens through the task-first home (PRD §6.2). */
const renderThemeLab = () => {
  const utils = render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /Create a theme/ }));
  return utils;
};

test('editing the brand scale cascades to the stage (the wow)', () => {
  const { container } = renderThemeLab();

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
  renderThemeLab();
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
  renderThemeLab();
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
  renderThemeLab();
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
  renderThemeLab();
  const inspector = screen.getByRole('complementary', { name: 'Inspector' });

  fireEvent.change(screen.getByLabelText('brand 500 hex'), {
    target: { value: '#abcdef' },
  });
  expect(within(inspector).getByText('Changes (1)')).toBeInTheDocument();

  await user.click(screen.getByRole('radio', { name: 'Bruttal' }));
  expect(within(inspector).getByText(/No changes yet/)).toBeInTheDocument();
});

test('apply-to-Studio toggle exposes the safe-fallback control', async () => {
  const user = userEvent.setup();
  renderThemeLab();

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

test('contrast section surfaces curated pairs for light and dark', () => {
  renderThemeLab();
  const inspector = screen.getByRole('complementary', { name: 'Inspector' });
  // Each curated pair is checked in both modes (F2.6 dark follow-up done).
  expect(within(inspector).getByText('Light')).toBeInTheDocument();
  expect(within(inspector).getByText('Dark')).toBeInTheDocument();
  expect(within(inspector).getAllByText('Accent action')).toHaveLength(2);
  expect(within(inspector).getAllByText('Surface')).toHaveLength(2);
});

test('export peak ships all three formats', async () => {
  const user = userEvent.setup();
  renderThemeLab();
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
    renderThemeLab();
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

describe('semantic layer navigator (F2.1/F2.2)', () => {
  test('semantic families disclose leaves; a remap re-derives the theme', async () => {
    const user = userEvent.setup();
    const { container } = renderThemeLab();

    // Semantic radii family: 3 leaves (control, surface, round).
    await user.click(screen.getByRole('button', { name: 'radii · 3' }));
    const control = screen.getByLabelText('semantic.radii.control');
    expect(control).toHaveValue('{core.radii.md}');

    fireEvent.change(control, { target: { value: '{core.radii.none}' } });

    // The remap flows into the stage CSS same-frame (radius collapses to 0).
    expect(stageStyle(container)).toContain('0px');
    const inspector = screen.getByRole('complementary', { name: 'Inspector' });
    expect(within(inspector).getByText('Changes (1)')).toBeInTheDocument();
    expect(
      within(inspector).getByText(/semantic\.radii\.control/)
    ).toBeInTheDocument();
  });

  test('semantic colors group by ux context before leaves render', async () => {
    const user = userEvent.setup();
    renderThemeLab();

    // Two "colors" disclosures exist (semantic family, core scales); the
    // semantic one comes first in DOM order.
    const [semanticColors] = screen.getAllByRole('button', {
      name: /^colors · \d+$/,
    });
    await user.click(semanticColors);
    // Contexts appear as sub-disclosures; leaves are not rendered yet.
    expect(
      screen.getByRole('button', { name: /^action · \d+$/ })
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText(
        'semantic.colors.action.accent.background.default'
      )
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^action · \d+$/ }));
    expect(
      screen.getByLabelText('semantic.colors.action.accent.background.default')
    ).toBeInTheDocument();
  });

  test('a token row reverts its own override', async () => {
    const user = userEvent.setup();
    renderThemeLab();

    await user.click(screen.getByRole('button', { name: 'radii · 3' }));
    const control = screen.getByLabelText('semantic.radii.control');
    fireEvent.change(control, { target: { value: '{core.radii.none}' } });

    await user.click(
      screen.getByRole('button', { name: 'Revert semantic.radii.control' })
    );
    expect(screen.getByLabelText('semantic.radii.control')).toHaveValue(
      '{core.radii.md}'
    );
  });

  test('core families expose raw values one level down', async () => {
    const user = userEvent.setup();
    renderThemeLab();

    // Core radii: 6 leaves (none, sm, md, lg, xl, full).
    await user.click(screen.getByRole('button', { name: 'radii · 6' }));
    const md = screen.getByLabelText('core.radii.md');
    expect(md).toHaveValue('8px');

    fireEvent.change(md, { target: { value: '10px' } });
    const inspector = screen.getByRole('complementary', { name: 'Inspector' });
    expect(within(inspector).getByText(/core\.radii\.md/)).toBeInTheDocument();
  });
});

describe('broken refs: ambient validation + sanctioned escalation (F2.2)', () => {
  const breakOneRef = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByRole('button', { name: 'radii · 3' }));
    fireEvent.change(screen.getByLabelText('semantic.radii.control'), {
      target: { value: '{core.radii.nope}' },
    });
  };

  test('a broken remap surfaces ambiently: row badge + peripheral counter', async () => {
    const user = userEvent.setup();
    renderThemeLab();
    await breakOneRef(user);

    // Badge on the offending navigator row…
    expect(
      screen.getByRole('img', { name: 'Broken reference' })
    ).toBeInTheDocument();
    // …and on its diff row…
    expect(
      screen.getByRole('img', {
        name: 'Broken reference at semantic.radii.control',
      })
    ).toBeInTheDocument();
    // …and the peripheral header counter. Never a modal, never a toast.
    expect(screen.getByText('⚠ 1 ref error')).toBeInTheDocument();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();

    // Two broken tokens pluralize the counter.
    fireEvent.change(screen.getByLabelText('semantic.radii.surface'), {
      target: { value: '{core.radii.nada}' },
    });
    expect(screen.getByText('⚠ 2 ref errors')).toBeInTheDocument();
  });

  test('exporting with broken refs goes through the escalation dialog', async () => {
    const user = userEvent.setup();
    renderThemeLab();
    await breakOneRef(user);
    const inspector = screen.getByRole('complementary', { name: 'Inspector' });

    await user.click(
      within(inspector).getByRole('button', { name: 'Export theme' })
    );
    // The one sanctioned escalation (PRD §6.4-P2): a dialog, not a toast.
    expect(screen.getByText('Broken token references')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Export anyway' }));
    expect(screen.getByTestId('export-content')).toBeInTheDocument();
  });

  test('the escalation dialog pluralizes for multiple broken refs', async () => {
    const user = userEvent.setup();
    renderThemeLab();
    await breakOneRef(user);
    fireEvent.change(screen.getByLabelText('semantic.radii.surface'), {
      target: { value: '{core.radii.nada}' },
    });
    const inspector = screen.getByRole('complementary', { name: 'Inspector' });

    await user.click(
      within(inspector).getByRole('button', { name: 'Export theme' })
    );
    expect(screen.getByText(/2 tokens resolve/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Go back' }));
  });

  test('the escalation dialog can be declined', async () => {
    const user = userEvent.setup();
    renderThemeLab();
    await breakOneRef(user);
    const inspector = screen.getByRole('complementary', { name: 'Inspector' });

    await user.click(
      within(inspector).getByRole('button', { name: 'Export theme' })
    );
    await user.click(screen.getByRole('button', { name: 'Go back' }));
    expect(screen.queryByTestId('export-content')).not.toBeInTheDocument();
  });
});

test('an AI-origin diff entry shows the ✦ marker', () => {
  // Nothing in Phases 0–2 produces an AI edit; the marker activates with the
  // Generate lens (Phase 4). The store already tracks origin, so render the
  // inspector against a forked initial state carrying one.
  render(
    <ThemeStoreProvider
      initial={{
        overrides: { 'core.radii.md': '10px' },
        origins: { 'core.radii.md': 'ai' },
      }}
    >
      <ThemeInspector />
    </ThemeStoreProvider>
  );
  expect(screen.getByText(/✦ core\.radii\.md/)).toBeInTheDocument();
});

test('editing via the native color input updates the theme', () => {
  renderThemeLab();
  const colorInput = screen.getByLabelText('brand 500 color');
  fireEvent.change(colorInput, { target: { value: '#abcdef' } });
  expect(screen.getByLabelText('brand 500 hex')).toHaveValue('#abcdef');
});

test('a non-6-digit hex override falls back safely in the color input', () => {
  renderThemeLab();
  fireEvent.change(screen.getByLabelText('brand 500 hex'), {
    target: { value: '#fff' },
  });
  // The text field keeps the raw value; the native color input, which requires
  // #rrggbb, falls back rather than showing an invalid value.
  expect(screen.getByLabelText('brand 500 hex')).toHaveValue('#fff');
  expect(screen.getByLabelText('brand 500 color')).toHaveValue('#000000');
});
