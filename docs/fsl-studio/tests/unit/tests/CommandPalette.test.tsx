import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from 'src/App';

const startThemeTask = () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /Create a theme/ }));
};

const openPalette = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(
    screen.getByRole('button', { name: 'Open command palette' })
  );
  return screen.getByRole('combobox', { name: 'Search commands' });
};

test('⌘K toggles the palette; Escape closes it', async () => {
  const user = userEvent.setup();
  startThemeTask();

  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  fireEvent.keyDown(window, { key: 'k', metaKey: true });
  expect(
    screen.getByRole('dialog', { name: 'Command palette' })
  ).toBeInTheDocument();

  // ⌘K again closes (toggle).
  fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

  fireEvent.keyDown(window, { key: 'k', metaKey: true });
  await user.keyboard('{Escape}');
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

test('filtering + Enter runs a command (lens switch)', async () => {
  const user = userEvent.setup();
  startThemeTask();

  const input = await openPalette(user);
  await user.type(input, 'lens: components');
  await user.keyboard('{Enter}');

  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.getByRole('radio', { name: 'Components' })).toHaveAttribute(
    'aria-checked',
    'true'
  );
});

test('arrow keys move the active option; clamped at both ends', async () => {
  const user = userEvent.setup();
  startThemeTask();

  const input = await openPalette(user);
  await user.type(input, 'lens:');
  // Three lens commands; walk down past the end and back up past the start.
  await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}');
  expect(input).toHaveAttribute('aria-activedescendant', 'palette-option-2');
  await user.keyboard('{ArrowUp}{ArrowUp}{ArrowUp}{ArrowUp}');
  expect(input).toHaveAttribute('aria-activedescendant', 'palette-option-0');
});

test('clicking an option runs it; a component command switches lens too', async () => {
  const user = userEvent.setup();
  startThemeTask();

  await openPalette(user);
  await user.click(screen.getByRole('option', { name: 'Component: Button' }));

  expect(screen.getByRole('radio', { name: 'Components' })).toHaveAttribute(
    'aria-checked',
    'true'
  );
  // The Button preview is on stage in both panes.
  expect(screen.getAllByRole('button', { name: 'Save changes' })).toHaveLength(
    2
  );
});

test('page and preset commands are available', async () => {
  const user = userEvent.setup();
  startThemeTask();

  // Preset first, while the Theme lens (with the preset picker) is visible.
  let input = await openPalette(user);
  await user.type(input, 'preset: bruttal');
  await user.keyboard('{Enter}');
  expect(screen.getByRole('radio', { name: 'Bruttal' })).toHaveAttribute(
    'aria-checked',
    'true'
  );

  // The page command also switches to the Components lens.
  input = await openPalette(user);
  await user.type(input, 'page: wizard');
  await user.keyboard('{Enter}');
  expect(screen.getAllByText(/tell us about your project/)).toHaveLength(2);
});

test('an altitude command moves the stage', async () => {
  const user = userEvent.setup();
  startThemeTask();

  const input = await openPalette(user);
  await user.type(input, 'stage: grid');
  await user.keyboard('{Enter}');
  expect(screen.getByRole('radio', { name: 'Grid' })).toHaveAttribute(
    'aria-checked',
    'true'
  );
});

test('the apply-to-Studio command toggles and re-titles', async () => {
  const user = userEvent.setup();
  startThemeTask();

  let input = await openPalette(user);
  await user.type(input, 'apply the theme');
  await user.keyboard('{Enter}');
  expect(
    screen.getByRole('checkbox', { name: /Apply this theme to the Studio/ })
  ).toBeChecked();

  input = await openPalette(user);
  await user.type(input, 'stop applying');
  await user.keyboard('{Enter}');
  expect(
    screen.getByRole('checkbox', { name: /Apply this theme to the Studio/ })
  ).not.toBeChecked();
});

test('the go-home command leaves the studio', async () => {
  const user = userEvent.setup();
  startThemeTask();

  const input = await openPalette(user);
  await user.type(input, 'go home');
  await user.keyboard('{Enter}');
  expect(screen.getByText('What do you want to do?')).toBeInTheDocument();
});

test('no match shows the teaching empty state; Enter is a no-op', async () => {
  const user = userEvent.setup();
  startThemeTask();

  const input = await openPalette(user);
  await user.type(input, 'zzz-nothing');
  expect(screen.getByText(/No matching command/)).toBeInTheDocument();
  expect(input).not.toHaveAttribute('aria-activedescendant');
  await user.keyboard('{Enter}');
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

test('clicking the backdrop closes; clicking inside does not', async () => {
  const user = userEvent.setup();
  startThemeTask();

  const input = await openPalette(user);
  await user.click(input);
  expect(screen.getByRole('dialog')).toBeInTheDocument();

  await user.click(screen.getByTestId('palette-overlay'));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
