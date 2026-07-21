import type { Scenario } from '../types.ts';
import { check } from './check.ts';

export const destructiveConfirm: Scenario = {
  id: 'destructive-confirm',
  title: 'Destructive confirmation',
  prompt: [
    "Build a destructive delete flow. The page shows a button labeled 'Delete",
    "project'. Deletion is destructive and must require an explicit",
    "confirmation step: a single activation of 'Delete project' must never",
    'delete anything. The confirmation affordance must contain a button',
    "labeled 'Confirm delete' and a way to cancel labeled 'Cancel'. If your",
    "library's destructive-confirmation pattern requires arming (a second",
    'activation of the confirm control), the armed control may change its',
    "label. Once the deletion is confirmed, render the text 'Project",
    "deleted'.",
  ].join(' '),
  assert: async ({ screen, user, waitFor }) => {
    await user.click(screen.getByRole('button', { name: /delete project/i }));

    check(
      screen.queryByText(/project deleted/i) === null,
      "a single activation of 'Delete project' must never delete"
    );

    const confirm = await screen.findByRole('button', {
      name: /confirm delete/i,
    });
    check(confirm, "the confirmation step should offer 'Confirm delete'");
    check(
      screen.getByRole('button', { name: /cancel/i }),
      "the confirmation step should offer 'Cancel'"
    );

    await user.click(confirm);

    // Arming patterns (e.g. two-click destructive confirms) are legal: allow
    // one more activation of the (possibly relabeled) confirm control.
    if (screen.queryByText(/project deleted/i) === null) {
      const armed = screen.queryAllByRole('button').find((button) => {
        return /confirm|again/i.test(button.textContent ?? '');
      });

      check(
        armed,
        'after one confirm activation the flow should either complete or ' +
          'present an armed confirm control'
      );

      await user.click(armed as HTMLElement);
    }

    await waitFor(() => {
      check(
        screen.queryByText(/project deleted/i),
        "confirming should render 'Project deleted'"
      );
    });
  },
};
