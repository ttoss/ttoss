import type { Scenario } from '../types.ts';
import { check } from './check.ts';

export const dialog: Scenario = {
  id: 'dialog',
  title: 'Modal dialog',
  prompt: [
    'Build a settings dialog.',
    "The page shows a button labeled 'Open settings'. Activating it opens a",
    "modal dialog with the accessible title 'Settings' and a short body",
    "text. The dialog contains a button labeled 'Close' that closes it.",
    'The dialog must be a true modal dialog for assistive technology',
    '(role dialog, labelled by its title).',
  ].join(' '),
  assert: async ({ screen, user, waitFor }) => {
    check(
      screen.queryByRole('dialog') === null,
      'no dialog should be open before the trigger is activated'
    );

    await user.click(screen.getByRole('button', { name: /open settings/i }));

    const opened = await screen.findByRole('dialog', { name: /settings/i });
    check(opened, "activating 'Open settings' should open the dialog");

    await user.click(screen.getByRole('button', { name: /^close$/i }));

    await waitFor(() => {
      check(
        screen.queryByRole('dialog') === null,
        "activating 'Close' should close the dialog"
      );
    });
  },
};
