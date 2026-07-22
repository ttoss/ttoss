import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@ttoss/fsl-theme/react';
import { ToastRegion } from '@ttoss/fsl-ui';
import { axe } from 'jest-axe';

import { toastQueue } from '../../../src/app/toasts';
import { SettingsBlock } from '../../../src/blocks/SettingsBlock';
import { theme } from '../../../src/theme';

const renderBlock = () => {
  return render(
    <ThemeProvider theme={theme}>
      <SettingsBlock />
      <ToastRegion queue={toastQueue} />
    </ThemeProvider>
  );
};

// The queue is module-scoped and survives between tests in this file.
beforeEach(() => {
  for (const toast of [...toastQueue.visibleToasts]) {
    toastQueue.close(toast.key);
  }
});

test('renders the team list with no accessibility violations', async () => {
  const { container } = renderBlock();

  expect(
    screen.getByRole('heading', { name: 'Team members' })
  ).toBeInTheDocument();
  const list = screen.getByRole('grid', { name: 'Team members' });
  expect(within(list).getAllByRole('row')).toHaveLength(3);
  expect(screen.getByText('ada@ttoss.dev')).toBeInTheDocument();

  expect(await axe(container)).toHaveNoViolations();
});

test('inviting a member validates, adds the row, and toasts', async () => {
  const user = userEvent.setup();
  renderBlock();

  await user.click(screen.getByRole('button', { name: 'Invite member' }));
  const dialog = await screen.findByRole('dialog');

  // Empty submit runs the whole invalid pipeline, including the Select.
  await user.click(within(dialog).getByRole('button', { name: 'Send invite' }));
  expect(
    await within(dialog).findByText('Enter the member name')
  ).toBeInTheDocument();
  expect(
    within(dialog).getByText('Enter a valid email address')
  ).toBeInTheDocument();
  expect(within(dialog).getByRole('alert')).toHaveTextContent('Choose a role');

  await user.type(within(dialog).getByLabelText('Name'), 'Katherine Johnson');
  await user.type(
    within(dialog).getByLabelText('Email'),
    'katherine@ttoss.dev'
  );
  await user.click(within(dialog).getByRole('button', { name: /role/i }));
  await user.click(await screen.findByRole('option', { name: 'Editor' }));
  await user.click(within(dialog).getByRole('button', { name: 'Send invite' }));

  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  const list = screen.getByRole('grid', { name: 'Team members' });
  expect(within(list).getAllByRole('row')).toHaveLength(4);
  expect(within(list).getByText('katherine@ttoss.dev')).toBeInTheDocument();
  expect(await screen.findByText('Invitation sent')).toBeInTheDocument();
});

test('cancelling the invite dialog leaves the list unchanged', async () => {
  const user = userEvent.setup();
  renderBlock();

  await user.click(screen.getByRole('button', { name: 'Invite member' }));
  const dialog = await screen.findByRole('dialog');
  await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));

  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  const list = screen.getByRole('grid', { name: 'Team members' });
  expect(within(list).getAllByRole('row')).toHaveLength(3);
});

test('removing a member requires the two-click destructive arming', async () => {
  const user = userEvent.setup();
  renderBlock();

  const list = screen.getByRole('grid', { name: 'Team members' });
  const adaRow = within(list).getByRole('row', { name: /Ada Lovelace/ });
  await user.click(within(adaRow).getByRole('button', { name: 'Remove' }));

  const dialog = await screen.findByRole('dialog');
  expect(dialog).toHaveTextContent('Remove Ada Lovelace?');

  // First click arms; nothing is removed yet.
  await user.click(within(dialog).getByRole('button', { name: 'Remove' }));
  expect(screen.getByText('ada@ttoss.dev')).toBeInTheDocument();

  // Second click, on the armed label, commits.
  await user.click(
    within(dialog).getByRole('button', { name: 'Click again to remove' })
  );
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.queryByText('ada@ttoss.dev')).not.toBeInTheDocument();
  expect(
    within(screen.getByRole('grid', { name: 'Team members' })).getAllByRole(
      'row'
    )
  ).toHaveLength(2);
  expect(await screen.findByText('Member removed')).toBeInTheDocument();
});

test('cancelling the destructive confirm keeps the member', async () => {
  const user = userEvent.setup();
  renderBlock();

  const list = screen.getByRole('grid', { name: 'Team members' });
  const graceRow = within(list).getByRole('row', { name: /Grace Hopper/ });
  await user.click(within(graceRow).getByRole('button', { name: 'Remove' }));

  const dialog = await screen.findByRole('dialog');
  await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));

  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.getByText('grace@ttoss.dev')).toBeInTheDocument();
});
