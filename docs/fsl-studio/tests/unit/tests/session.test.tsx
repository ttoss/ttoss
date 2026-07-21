import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from 'src/App';
import { listDrafts } from 'src/studio/session/drafts';
import { snapshotFromHash } from 'src/studio/session/sessionState';
import { bootFromHash, useSession } from 'src/studio/session/sessionStore';

const startThemeTask = () => {
  const utils = render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /Create a theme/ }));
  return utils;
};

describe('bootFromHash', () => {
  test('a valid #s= hash boots the studio as a fork', () => {
    startThemeTask();
    fireEvent.change(screen.getByLabelText('brand 500 hex'), {
      target: { value: '#abcdef' },
    });
    return waitFor(() => {
      const boot = bootFromHash(window.location.hash);
      expect(boot.screen).toBe('studio');
      expect(boot.snapshot?.theme.overrides['core.colors.brand.500']).toBe(
        '#abcdef'
      );
      // Fork semantics (AD-10): a fresh draft id every time.
      expect(boot.draftId).not.toBe(bootFromHash(window.location.hash).draftId);
    });
  });

  test('no hash boots home', () => {
    const boot = bootFromHash('');
    expect(boot.screen).toBe('home');
    expect(boot.snapshot).toBeNull();
  });
});

describe('URL is the state (F1.2 AC)', () => {
  test('an edit lands in the hash; a fresh boot from it restores the state', async () => {
    const first = startThemeTask();
    fireEvent.change(screen.getByLabelText('brand 500 hex'), {
      target: { value: '#abcdef' },
    });

    await waitFor(() => {
      const snapshot = snapshotFromHash(window.location.hash);
      expect(snapshot?.theme.overrides['core.colors.brand.500']).toBe(
        '#abcdef'
      );
    });
    first.unmount();

    // A "fresh browser" with the same deep link: state reproduced in full.
    render(<App />);
    expect(screen.getByLabelText('brand 500 hex')).toHaveValue('#abcdef');
    expect(
      screen.getByRole('complementary', { name: 'Inspector' })
    ).toHaveTextContent('Changes (1)');
  });

  test('drafts autosave silently while editing (F1.3)', async () => {
    startThemeTask();
    fireEvent.change(screen.getByLabelText('brand 500 hex'), {
      target: { value: '#abcdef' },
    });
    await waitFor(() => {
      const drafts = listDrafts();
      expect(drafts).toHaveLength(1);
      expect(drafts[0].snapshot.theme.overrides['core.colors.brand.500']).toBe(
        '#abcdef'
      );
    });
    // Ambient: no toast, no dialog announced the save.
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });
});

describe('stage altitudes (F1.4)', () => {
  test('page altitude shows an example page; grid shows the drift view', async () => {
    const user = userEvent.setup();
    startThemeTask();

    // Component altitude (default): the sample gallery.
    expect(screen.getAllByRole('button', { name: 'Save' })).toHaveLength(2);

    await user.click(screen.getByRole('radio', { name: 'Page' }));
    // First example page (form) in both panes.
    expect(screen.getAllByLabelText('Email')).toHaveLength(2);

    await user.click(screen.getByRole('radio', { name: 'Grid' }));
    // All four example pages, per pane.
    expect(screen.getAllByRole('region', { name: 'Wizard' })).toHaveLength(2);
    expect(
      screen.getAllByRole('region', { name: 'Form + validation' })
    ).toHaveLength(2);
  });

  test('altitude persists across lens switches (frame never resets)', async () => {
    const user = userEvent.setup();
    startThemeTask();

    await user.click(screen.getByRole('radio', { name: 'Grid' }));
    await user.click(screen.getByRole('radio', { name: 'Components' }));

    expect(screen.getByRole('radio', { name: 'Grid' })).toHaveAttribute(
      'aria-checked',
      'true'
    );
    expect(screen.getAllByRole('region', { name: 'Wizard' })).toHaveLength(2);
  });

  test('page altitude follows a selected example page', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(
      screen.getByRole('button', { name: /Explore components/ })
    );
    // "Wizard" names both the catalog composite and the example page; the
    // example-pages group renders after the catalog groups.
    const wizardButtons = screen.getAllByRole('button', { name: 'Wizard' });
    await user.click(wizardButtons[wizardButtons.length - 1]);
    await user.click(screen.getByRole('radio', { name: 'Page' }));
    expect(screen.getAllByText(/tell us about your project/)).toHaveLength(2);
  });
});

describe('home ↔ studio (PRD §6.2, F1.3)', () => {
  test('the brand button returns home and clears the hash', async () => {
    const user = userEvent.setup();
    startThemeTask();

    await user.click(screen.getByRole('button', { name: 'FSL Studio' }));
    expect(screen.getByText('What do you want to do?')).toBeInTheDocument();
    expect(window.location.hash).toBe('');
  });

  test('a draft continues from home under the same id (last-write-wins noted)', async () => {
    const user = userEvent.setup();
    startThemeTask();
    fireEvent.change(screen.getByLabelText('brand 500 hex'), {
      target: { value: '#abcdef' },
    });
    await waitFor(() => {
      expect(listDrafts()).toHaveLength(1);
    });
    const [draft] = listDrafts();

    await user.click(screen.getByRole('button', { name: 'FSL Studio' }));
    expect(screen.getByText(/last-write-wins/)).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: new RegExp(`^base · 1 edit ·`) })
    );
    expect(screen.getByLabelText('brand 500 hex')).toHaveValue('#abcdef');

    // Same draft id — continue, not fork.
    await waitFor(() => {
      expect(listDrafts()).toHaveLength(1);
    });
    expect(listDrafts()[0].id).toBe(draft.id);
  });

  test('deleting a draft removes it from the shelf', async () => {
    const user = userEvent.setup();
    startThemeTask();
    await waitFor(() => {
      expect(listDrafts()).toHaveLength(1);
    });
    const [draft] = listDrafts();

    await user.click(screen.getByRole('button', { name: 'FSL Studio' }));
    await user.click(
      screen.getByRole('button', { name: `Delete draft ${draft.id}` })
    );
    expect(listDrafts()).toHaveLength(0);
    expect(screen.queryByText(/last-write-wins/)).not.toBeInTheDocument();
  });

  test('opening a corrupted draft is a no-op (home stays)', async () => {
    const user = userEvent.setup();
    startThemeTask();
    await waitFor(() => {
      expect(listDrafts()).toHaveLength(1);
    });
    const [draft] = listDrafts();
    await user.click(screen.getByRole('button', { name: 'FSL Studio' }));

    // Corrupt the stored snapshot behind the listed draft.
    window.localStorage.setItem(
      'fsl-studio.drafts.v1',
      JSON.stringify({ [draft.id]: { updatedAt: 1, snapshot: { v: 99 } } })
    );
    // The list re-reads on render; the row is already on screen from before
    // corruption — clicking it must not crash into a broken studio.
    const open = screen.getByRole('button', { name: /^base · 0 edits ·/ });
    await user.click(open);
    expect(screen.getByText('What do you want to do?')).toBeInTheDocument();
  });
});

test('useSession outside a provider throws', () => {
  const Consumer = () => {
    useSession();
    return null;
  };
  const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
  expect(() => {
    return render(<Consumer />);
  }).toThrow('useSession must be used within a SessionProvider');
  spy.mockRestore();
});
