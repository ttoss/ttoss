import type { Scenario } from '../types.ts';
import { check, isToggledOn } from './check.ts';

export const themedComposite: Scenario = {
  id: 'themed-composite',
  title: 'Themed composite',
  prompt: [
    'Build a theme-aware notification settings card. Set up your UI',
    "library's theming system inside App (theme provider if the library has",
    'one; otherwise define design tokens as CSS custom properties and',
    'consume them). The card contains: a heading element with the text',
    "'Notification settings', a short descriptive text, a toggle switch",
    "labeled 'Email notifications' that the user can toggle on and off, and",
    "a button labeled 'Save preferences' with the strongest (primary) visual",
    'emphasis the library offers. Every color must come from the theming',
    'system or design tokens — do not hardcode color values (hex, rgb, hsl)',
    "in the component code. Activating 'Save preferences' renders the text",
    "'Preferences saved'.",
  ].join(' '),
  assert: async ({ screen, user, waitFor }) => {
    check(
      screen.getByRole('heading', { name: /notification settings/i }),
      "the card should have a heading 'Notification settings'"
    );

    const toggle = screen.getByLabelText(/email notifications/i);
    const before = isToggledOn(toggle);

    // Some libraries visually hide the real control behind the label —
    // clicking the label is exactly how a user toggles those.
    try {
      await user.click(toggle);
    } catch {
      await user.click(toggle.closest('label') ?? toggle);
    }

    await waitFor(() => {
      check(
        isToggledOn(toggle) !== before,
        "toggling 'Email notifications' should flip its state"
      );
    });

    await user.click(screen.getByRole('button', { name: /save preferences/i }));

    await waitFor(() => {
      check(
        screen.queryByText(/preferences saved/i),
        "activating 'Save preferences' should render 'Preferences saved'"
      );
    });
  },
};
