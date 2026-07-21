import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from 'src/App';
import { Stage } from 'src/studio/Stage';
import { ThemeStoreProvider } from 'src/studio/theme/themeStore';

/** Boot into the studio (Theme lens) through the task-first home. */
const renderStudio = () => {
  const utils = render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /Create a theme/ }));
  return utils;
};

test('renders the shell with brand, lens switcher, and side panels', () => {
  renderStudio();

  expect(screen.getByText('FSL Studio')).toBeInTheDocument();

  const lensGroup = screen.getByRole('radiogroup', { name: 'Lens' });
  expect(lensGroup).toBeInTheDocument();
  expect(screen.getByRole('radio', { name: 'Theme' })).toBeInTheDocument();
  expect(screen.getByRole('radio', { name: 'Components' })).toBeInTheDocument();
  expect(screen.getByRole('radio', { name: 'Generate' })).toBeInTheDocument();

  expect(
    screen.getByRole('complementary', { name: 'Navigator' })
  ).toBeInTheDocument();
  expect(
    screen.getByRole('complementary', { name: 'Inspector' })
  ).toBeInTheDocument();
});

test('stage renders fsl-ui components in light and dark panes', () => {
  renderStudio();

  const light = screen.getByTestId('stage-pane-light');
  const dark = screen.getByTestId('stage-pane-dark');

  expect(light).not.toHaveAttribute('data-tt-mode');
  expect(dark).toHaveAttribute('data-tt-mode', 'dark');

  // The same sample renders in both panes.
  expect(screen.getAllByRole('button', { name: 'Save' })).toHaveLength(2);
  expect(screen.getAllByRole('switch', { name: 'Notifications' })).toHaveLength(
    2
  );

  // The destructive action carries its consequence in the DOM contract.
  const [deleteButton] = screen.getAllByRole('button', { name: 'Delete' });
  expect(deleteButton).toHaveAttribute('data-consequence', 'destructive');
});

test('switching lens swaps the panels and the stage subject, keeping the frame', async () => {
  const user = userEvent.setup();
  renderStudio();

  const navigator = screen.getByRole('complementary', { name: 'Navigator' });
  const themeCopy = navigator.textContent;
  // Theme lens stage subject is the sample gallery.
  expect(screen.getAllByRole('button', { name: 'Save' })).toHaveLength(2);

  await user.click(screen.getByRole('radio', { name: 'Components' }));

  // Panels swap; the stage frame (both panes) persists (PRD §6.2).
  expect(navigator.textContent).not.toBe(themeCopy);
  expect(screen.getByTestId('stage-pane-light')).toBeInTheDocument();
  expect(screen.getByTestId('stage-pane-dark')).toBeInTheDocument();
});

test('lens selection cannot be emptied (one lens is always active)', async () => {
  const user = userEvent.setup();
  renderStudio();

  const themeLens = screen.getByRole('radio', { name: 'Theme' });
  expect(themeLens).toHaveAttribute('aria-checked', 'true');

  // Clicking the already-selected lens must not deselect it.
  await user.click(themeLens);
  expect(themeLens).toHaveAttribute('aria-checked', 'true');
});

test('stage theme CSS is emitted element-scoped for the panes', () => {
  const { container } = renderStudio();

  const stageStyle = container.querySelector('.stage style');
  expect(stageStyle?.textContent).toContain(
    '[data-tt-theme="fsl-studio-stage"]'
  );
  expect(stageStyle?.textContent).toContain('[data-tt-mode="dark"]');
});

test('the stage renders without a toolbar (optional prop)', () => {
  const { container } = render(
    <ThemeStoreProvider>
      <Stage
        renderSubject={() => {
          return <span>subject</span>;
        }}
      />
    </ThemeStoreProvider>
  );
  expect(container.querySelector('.stage-toolbar')).toBeNull();
  expect(screen.getAllByText('subject')).toHaveLength(2);
});
