import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import {
  EnvironmentsPage,
  EVENT_LABELS,
  validateEnvironmentName,
} from 'src/pages/EnvironmentsPage';
import { resetWorkspace, useWorkspace } from 'src/store';

beforeEach(() => {
  resetWorkspace();
});

const openForm = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: 'New environment' }));
};

describe('the environments list', () => {
  test('renders the workspace environments', () => {
    render(<EnvironmentsPage />);

    const table = screen.getByRole('grid', { name: 'Environments' });
    // The name column is the row header — the type Badge repeats the word
    // "production", so the query is by role, not by text.
    expect(
      within(table).getByRole('rowheader', { name: 'production' })
    ).toBeVisible();
    expect(
      within(table).getByRole('rowheader', { name: 'staging' })
    ).toBeVisible();
    expect(within(table).getByText('Failed, Rolled back')).toBeVisible();
  });

  test('the SearchField filters by name and the clear button restores', async () => {
    const user = userEvent.setup();
    render(<EnvironmentsPage />);

    const filter = screen.getByRole('searchbox', {
      name: 'Filter environments',
    });
    await user.type(filter, 'prod');

    const table = screen.getByRole('grid', { name: 'Environments' });
    expect(
      within(table).getByRole('rowheader', { name: 'production' })
    ).toBeVisible();
    expect(
      within(table).queryByRole('rowheader', { name: 'staging' })
    ).toBeNull();

    // The clear button exists only while there is a value (the item D guard,
    // standing in a real flow), and clicking it restores the full list.
    await user.click(screen.getByRole('button', { name: 'Clear filter' }));
    expect(filter).toHaveValue('');
    expect(
      within(screen.getByRole('grid', { name: 'Environments' })).getByRole(
        'rowheader',
        { name: 'staging' }
      )
    ).toBeVisible();
  });

  test('a filter that matches nothing says so instead of an empty grid', async () => {
    const user = userEvent.setup();
    render(<EnvironmentsPage />);

    await user.type(
      screen.getByRole('searchbox', { name: 'Filter environments' }),
      'nope'
    );

    expect(screen.queryByRole('grid')).toBeNull();
    expect(screen.getByText('No environments match "nope".')).toBeVisible();
  });
});

describe('validateEnvironmentName', () => {
  test.each([
    ['', 'Enter an environment name.'],
    ['  ', 'Enter an environment name.'],
    ['Prod', 'Use lowercase letters, numbers and dashes only.'],
    ['pre view', 'Use lowercase letters, numbers and dashes only.'],
    ['preview-eu-1', null],
  ])('%s → %s', (value, message) => {
    expect(validateEnvironmentName(value)).toBe(message);
  });
});

describe('the create form', () => {
  test('an empty submit is blocked natively and focuses the first invalid field', async () => {
    const user = userEvent.setup();
    render(<EnvironmentsPage />);
    await openForm(user);

    await user.click(
      screen.getByRole('button', { name: 'Create environment' })
    );

    // React Aria's inherited behaviour (FORMS §1): the submit is blocked and
    // the first invalid field takes focus.
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveFocus();
    expect(
      screen.getByRole('grid', { name: 'Environments' })
    ).toBeInTheDocument();
  });

  test('the radio group is required — a named field cannot be skipped', async () => {
    const user = userEvent.setup();
    render(<EnvironmentsPage />);
    await openForm(user);

    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'preview');
    await user.click(
      screen.getByRole('button', { name: 'Create environment' })
    );

    const group = screen.getByRole('radiogroup', { name: 'Type' });
    expect(group).toHaveAttribute('data-invalid', 'true');
  });

  test('a duplicate name is refused by the server and reported on the field', async () => {
    const user = userEvent.setup();
    render(<EnvironmentsPage />);
    await openForm(user);

    await user.type(
      screen.getByRole('textbox', { name: 'Name' }),
      'production'
    );
    await user.click(screen.getByRole('radio', { name: 'Staging' }));
    const submit = screen.getByRole('button', { name: 'Create environment' });
    await user.click(submit);

    // The pending window: the button disarms and marks itself while the
    // fictional backend answers — the isPending capability, consumed. Pending
    // is aria-disabled, never `disabled`: the button stays focusable so the
    // keyboard user is not dropped mid-submit.
    const pending = screen.getByRole('button', { name: 'Creating…' });
    expect(pending).toHaveAttribute('data-pending', 'true');
    expect(pending).toHaveAttribute('aria-disabled', 'true');
    expect(pending).not.toBeDisabled();

    // The refusal lands on the name field via Form validationErrors.
    expect(
      await screen.findByText(
        'An environment named "production" already exists.'
      )
    ).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'Name' })).toBeInvalid();
    // The form stays open for the correction.
    expect(
      screen.getByRole('button', { name: 'Create environment' })
    ).toBeEnabled();
  });

  test('the complete flow: every field kind lands in the store', async () => {
    const user = userEvent.setup();
    const Probe = () => {
      const { environments } = useWorkspace();
      const created = environments.find((environment) => {
        return environment.name === 'preview-eu';
      });
      return (
        <output data-testid="created">
          {created
            ? `${created.type}|${created.branch}|${created.instances}|${created.cpuTarget}|${created.notifications.join('+')}`
            : 'none'}
        </output>
      );
    };

    render(
      <>
        <EnvironmentsPage />
        <Probe />
      </>
    );
    await openForm(user);

    await user.type(
      screen.getByRole('textbox', { name: 'Name' }),
      'preview-eu'
    );
    await user.click(screen.getByRole('radio', { name: 'Preview' }));

    // The branch keeps its default; instances steps up from 2 to 3 through
    // the NumberField's increment stepper (named by its Icon label plus the
    // field label).
    await user.click(screen.getByRole('button', { name: /increase/i }));

    // The slider moves by keyboard — one step down from 70% to 65% (the
    // thumb is focused directly: jsdom's click carries no coordinates for a
    // track, and the keyboard is the interaction worth pinning anyway).
    const slider = screen.getByRole('slider', { name: /Scale up at CPU/ });
    expect(screen.getByText('70%')).toBeVisible();
    slider.focus();
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByText('65%')).toBeVisible();

    // Notifications: Failed is on by default; add Rolled back.
    const notify = screen.getByRole('group', { name: 'Notify on' });
    expect(
      within(notify).getByRole('checkbox', { name: EVENT_LABELS.failed })
    ).toBeChecked();
    await user.click(
      within(notify).getByRole('checkbox', {
        name: EVENT_LABELS['rolled-back'],
      })
    );

    await user.click(
      screen.getByRole('button', { name: 'Create environment' })
    );

    await waitFor(() => {
      expect(screen.getByTestId('created')).toHaveTextContent(
        'preview|main|3|0.65|failed+rolled-back'
      );
    });
    // The form closed, the toast fired, and the list shows the new row.
    expect(screen.queryByRole('textbox', { name: 'Name' })).toBeNull();
    expect(
      within(screen.getByRole('grid', { name: 'Environments' })).getByText(
        'preview-eu'
      )
    ).toBeVisible();
  });

  test('a submit during the pending window does not double-create', async () => {
    const user = userEvent.setup();
    const Probe = () => {
      const { environments } = useWorkspace();
      return <output data-testid="count">{environments.length}</output>;
    };

    render(
      <>
        <EnvironmentsPage />
        <Probe />
      </>
    );
    await openForm(user);

    const name = screen.getByRole('textbox', { name: 'Name' });
    await user.type(name, 'preview-eu');
    await user.click(screen.getByRole('radio', { name: 'Preview' }));
    // No notifications at all — the list's empty-cell branch.
    await user.click(
      within(screen.getByRole('group', { name: 'Notify on' })).getByRole(
        'checkbox',
        { name: EVENT_LABELS.failed }
      )
    );
    await user.click(
      screen.getByRole('button', { name: 'Create environment' })
    );

    // The pending button disarms itself, but the FORM can still fire — the
    // platform's implicit submission is out of any button's reach (in this
    // multi-input form React Aria's type swap happens to suppress it, in a
    // one-input form it would not — measured in fsl-ui's guard). The direct
    // dispatch stands in for every such path; the handler's re-entry guard
    // is what turns it into a no-op.
    fireEvent.submit(name.closest('form') as HTMLFormElement);

    await waitFor(() => {
      expect(screen.getByTestId('count')).toHaveTextContent('3');
    });
    // Had the guard been missing, the second submit would race a duplicate:
    // resolve both and the count reads 4, or reject the second and the closed
    // form would be showing a server error. One create, exactly.
    expect(screen.queryByRole('textbox', { name: 'Name' })).toBeNull();

    // The created environment subscribed to nothing, and its row says so.
    expect(
      within(
        screen
          .getByRole('rowheader', { name: 'preview-eu' })
          .closest('tr') as HTMLElement
      ).getByText('—')
    ).toBeVisible();
  });

  test('Cancel closes the form without touching the store', async () => {
    const user = userEvent.setup();
    render(<EnvironmentsPage />);
    await openForm(user);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('textbox', { name: 'Name' })).toBeNull();
    expect(
      screen.getByRole('button', { name: 'New environment' })
    ).toBeVisible();
  });

  test('the contextual help explains types without renaming the group', async () => {
    const user = userEvent.setup();
    render(<EnvironmentsPage />);
    await openForm(user);

    expect(
      screen.getByRole('radiogroup', { name: 'Type' })
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'About environment types' })
    );
    expect(
      await screen.findByRole('heading', { name: 'Environment types' })
    ).toBeVisible();
  });

  test('the open form has no axe violations', async () => {
    const user = userEvent.setup();
    const { container } = render(<EnvironmentsPage />);
    await openForm(user);

    expect(await axe(container)).toHaveNoViolations();
  });
});
