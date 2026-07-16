import type { Scenario } from '../types.ts';
import { check } from './check.ts';

export const menu: Scenario = {
  id: 'menu',
  title: 'Actions menu',
  prompt: [
    "Build an actions menu. The page shows a button labeled 'Actions'.",
    'Activating it opens a menu (role menu for assistive technology) with',
    "exactly three items: 'Duplicate', 'Rename', 'Delete'.",
    "Selecting 'Rename' closes the menu and renders the text",
    "'Renaming item' on the page.",
  ].join(' '),
  assert: async ({ screen, user, waitFor }) => {
    await user.click(screen.getByRole('button', { name: /actions/i }));

    const menuElement = await screen.findByRole('menu');
    check(menuElement, "activating 'Actions' should open a menu");

    const items = screen.getAllByRole('menuitem');
    check(
      items.length === 3,
      `the menu should have exactly 3 items, found ${items.length}`
    );

    await user.click(screen.getByRole('menuitem', { name: /rename/i }));

    await waitFor(() => {
      check(
        screen.queryByText(/renaming item/i),
        "selecting 'Rename' should render 'Renaming item'"
      );
    });

    await waitFor(() => {
      check(
        screen.queryByRole('menu') === null,
        'the menu should close after selection'
      );
    });
  },
};
