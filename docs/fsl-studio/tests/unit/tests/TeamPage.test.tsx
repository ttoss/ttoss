import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { INITIAL_MEMBERS } from 'src/data';
import { TeamPage } from 'src/pages/TeamPage';
import { resetWorkspace } from 'src/store';

beforeEach(() => {
  resetWorkspace();
});

describe('TeamPage', () => {
  test('renders the full roster', () => {
    render(<TeamPage />);

    expect(screen.getByText('5 members')).toBeInTheDocument();
    for (const member of INITIAL_MEMBERS) {
      expect(screen.getByText(member.name)).toBeInTheDocument();
      expect(screen.getByText(member.email)).toBeInTheDocument();
    }
  });

  test('inviting a member adds them to the roster', async () => {
    const user = userEvent.setup();
    render(<TeamPage />);

    await user.click(screen.getByRole('button', { name: 'Invite member' }));

    const dialog = await screen.findByRole('dialog', {
      name: 'Invite member',
    });
    await user.type(
      within(dialog).getByRole('textbox', { name: 'Email' }),
      'joao@northline.dev'
    );
    await user.click(
      within(dialog).getByRole('checkbox', {
        name: /grants deploy access/,
      })
    );
    await user.click(
      within(dialog).getByRole('button', { name: 'Send invite' })
    );

    expect(await screen.findByText('6 members')).toBeInTheDocument();
    expect(screen.getByText('joao@northline.dev')).toBeInTheDocument();
  });

  test('the timezone ComboBox filters by typing and stores the picked zone', async () => {
    const user = userEvent.setup();
    render(<TeamPage />);

    await user.click(screen.getByRole('button', { name: 'Invite member' }));
    const dialog = await screen.findByRole('dialog', {
      name: 'Invite member',
    });

    await user.type(
      within(dialog).getByRole('textbox', { name: 'Email' }),
      'ana@northline.dev'
    );

    // The F-008 behaviour: 35 zones narrow to the typed match.
    const timezone = within(dialog).getByRole('combobox', {
      name: 'Timezone',
    });
    await user.clear(timezone);
    await user.type(timezone, 'Toky');
    await user.click(await screen.findByRole('option', { name: 'Tokyo' }));

    await user.click(
      within(dialog).getByRole('checkbox', {
        name: /grants deploy access/,
      })
    );
    await user.click(
      within(dialog).getByRole('button', { name: 'Send invite' })
    );

    expect(await screen.findByText('6 members')).toBeInTheDocument();
    const row = screen
      .getByText('ana@northline.dev')
      .closest('[role="row"]') as HTMLElement;
    expect(within(row).getByText('Tokyo')).toBeInTheDocument();
  });

  test('clearing the timezone falls back to the workspace default', async () => {
    const user = userEvent.setup();
    render(<TeamPage />);

    await user.click(screen.getByRole('button', { name: 'Invite member' }));
    const dialog = await screen.findByRole('dialog', {
      name: 'Invite member',
    });

    await user.type(
      within(dialog).getByRole('textbox', { name: 'Email' }),
      'bea@northline.dev'
    );
    await user.clear(
      within(dialog).getByRole('combobox', { name: 'Timezone' })
    );
    // Clearing reopens the list; Escape dismisses it without restoring a zone.
    await user.keyboard('{Escape}');
    await user.click(
      within(dialog).getByRole('checkbox', {
        name: /grants deploy access/,
      })
    );
    await user.click(
      within(dialog).getByRole('button', { name: 'Send invite' })
    );

    expect(await screen.findByText('6 members')).toBeInTheDocument();
    const row = screen
      .getByText('bea@northline.dev')
      .closest('[role="row"]') as HTMLElement;
    expect(within(row).getByText('Lisbon')).toBeInTheDocument();
  });

  test('an invalid invite email blocks submission', async () => {
    const user = userEvent.setup();
    render(<TeamPage />);

    await user.click(screen.getByRole('button', { name: 'Invite member' }));
    const dialog = await screen.findByRole('dialog', {
      name: 'Invite member',
    });
    await user.type(
      within(dialog).getByRole('textbox', { name: 'Email' }),
      'not-an-email'
    );
    await user.click(
      within(dialog).getByRole('checkbox', {
        name: /grants deploy access/,
      })
    );
    await user.click(
      within(dialog).getByRole('button', { name: 'Send invite' })
    );

    expect(
      await within(dialog).findByText('Enter a valid email address.')
    ).toBeInTheDocument();
    expect(screen.getByText('5 members')).toBeInTheDocument();
  });

  test('sorting by role groups the roster, descending on second click', async () => {
    const user = userEvent.setup();
    render(<TeamPage />);

    const table = screen.getByRole('grid', { name: 'Team members' });

    await user.click(screen.getByText('Role'));
    expect(within(table).getAllByRole('row')[1]).toHaveTextContent('Admin');

    await user.click(screen.getByText('Role'));
    expect(within(table).getAllByRole('row')[1]).toHaveTextContent('Viewer');
  });

  test('removing a member requires the destructive arming protocol', async () => {
    const user = userEvent.setup();
    render(<TeamPage />);

    const row = screen.getByRole('row', { name: /Marina Costa/ });
    await user.click(within(row).getByRole('button', { name: 'Remove' }));

    const dialog = await screen.findByRole('dialog');
    const confirm = within(dialog).getByRole('button', {
      name: 'Remove member',
    });

    // First click arms; the roster must be intact.
    await user.click(confirm);
    expect(screen.getByText('5 members')).toBeInTheDocument();
    expect(
      within(dialog).getByRole('button', { name: 'Click again to confirm' })
    ).toBeInTheDocument();

    // Second click confirms.
    await user.click(
      within(dialog).getByRole('button', { name: 'Click again to confirm' })
    );

    expect(await screen.findByText('4 members')).toBeInTheDocument();
    expect(screen.queryByText('Marina Costa')).not.toBeInTheDocument();
  });
});
