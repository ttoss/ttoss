import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { formText, SettingsPage, validateSlug } from 'src/pages/SettingsPage';
import { resetWorkspace, useWorkspace } from 'src/store';

beforeEach(() => {
  resetWorkspace();
});

const control = (name: string) => {
  return screen.getByRole('textbox', { name });
};

describe('SettingsPage', () => {
  test('renders the workspace it is editing', () => {
    render(<SettingsPage />);

    expect(screen.getByRole('heading', { name: 'Settings' })).toBeVisible();
    expect(control('Name')).toHaveValue('northline');
    expect(control('Slug')).toHaveValue('northline');
  });

  test('saving writes the edited values to the workspace', async () => {
    const user = userEvent.setup();
    const Probe = () => {
      const { settings } = useWorkspace();
      return (
        <output>
          {`${settings.name}|${settings.requireReview}|${settings.enforceTwoFactor}`}
        </output>
      );
    };

    render(
      <>
        <SettingsPage />
        <Probe />
      </>
    );

    await user.clear(control('Name'));
    await user.type(control('Name'), 'northline-eu');
    await user.click(
      screen.getByRole('checkbox', { name: /Require a review/ })
    );
    await user.click(
      screen.getByRole('switch', { name: /Enforce two-factor/ })
    );
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(screen.getByRole('status')).toHaveTextContent(
      'northline-eu|false|true'
    );
  });

  test('the Region label hosts contextual help without renaming the field', async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    // The help sits beside the label, outside the <label> element — so the
    // field's accessible name gains nothing from it. (A Select's name is
    // value-then-label by React Aria's own order, so never query it exactly.)
    const trigger = document.querySelector<HTMLElement>(
      '[data-scope="select"] [data-part="trigger"]'
    );
    expect(trigger).toHaveAccessibleName(/Region/);
    expect(trigger).not.toHaveAccessibleName(/About regions/);

    await user.click(screen.getByRole('button', { name: 'About regions' }));
    expect(
      screen.getByRole('dialog', { name: 'About regions' })
    ).toHaveTextContent(/schedules a data migration/);
  });

  test('the enforcement switch carries its consequence as a description', () => {
    render(<SettingsPage />);

    // The envelope the SwitchField root restored (forms item E): the copy is
    // supporting text linked via aria-describedby, not a second label — the
    // switch's accessible name stays the label alone.
    const input = screen.getByRole('switch', {
      name: 'Enforce two-factor authentication',
    });
    const description = document.querySelector<HTMLElement>(
      '[data-scope="switch"][data-part="description"]'
    );

    expect(description).toHaveTextContent(/signed out at the next deploy/);
    expect(input.getAttribute('aria-describedby')).toContain(
      description?.id as string
    );
  });

  test('an invalid slug blocks the save and states the rule', async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    await user.clear(control('Slug'));
    await user.type(control('Slug'), 'North Line');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(
      await screen.findByText('Use lowercase letters, numbers and dashes only.')
    ).toBeVisible();
  });

  test('the form puts every label in one shared column', () => {
    render(<SettingsPage />);

    const form = document.querySelector<HTMLElement>(
      '[data-scope="form"][data-part="root"]'
    );

    // The Studio is the consumer that pulled `labelPosition="side"` in, so this
    // asserts the surface actually asks for it — a package feature with no caller
    // is the reserved API the plan refuses. The alignment itself is subgrid's job
    // and is proven by browser measurement, not here (jsdom has no layout).
    expect(form).toHaveAttribute('data-label-position', 'side');
    expect(form?.style.display).toBe('grid');
  });

  test('the checkbox row sits in the control column, not the label column', () => {
    render(<SettingsPage />);

    // Regression guard for what the browser caught: the row landed in the label
    // column and shared a grid row with the submit button, reading as its caption.
    expect(
      document.querySelector<HTMLElement>(
        '[data-scope="checkbox"][data-part="root"]'
      )?.style.gridColumn
    ).toBe('2');
  });
});

describe('validateSlug', () => {
  test.each([
    ['northline', null],
    ['north-line-2', null],
    ['', 'Enter a workspace slug.'],
    ['   ', 'Enter a workspace slug.'],
    ['North Line', 'Use lowercase letters, numbers and dashes only.'],
    ['north_line', 'Use lowercase letters, numbers and dashes only.'],
  ])('%s → %s', (value, expected) => {
    expect(validateSlug(value)).toBe(expected);
  });
});

describe('formText', () => {
  test('reads a present field', () => {
    const data = new FormData();
    data.set('name', 'northline');

    expect(formText(data, 'name')).toBe('northline');
  });

  test('an absent field reads as empty, not as the string "null"', () => {
    // Not reachable through this page's UI — every field is named and rendered —
    // but `String(null)` is `"null"`, which would be saved as a workspace name.
    expect(formText(new FormData(), 'name')).toBe('');
  });
});

describe('clearing the timezone falls back to the saved zone', () => {
  test('an empty ComboBox keeps the current value', async () => {
    const user = userEvent.setup();
    const Probe = () => {
      const { settings } = useWorkspace();
      return <output>{settings.timezone}</output>;
    };

    render(
      <>
        <SettingsPage />
        <Probe />
      </>
    );

    await user.clear(screen.getByRole('combobox', { name: 'Timezone' }));
    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(screen.getByRole('status')).toHaveTextContent('Europe/Lisbon');
  });
});
