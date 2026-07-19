import { fireEvent, render, screen } from '@testing-library/react';
import { App } from 'src/App';

/** Boot into the shell (the toggle lives in the chrome header). */
const renderShell = () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /Create a theme/ }));
};

const modeButton = () => {
  return screen.getByRole('button', { name: /Color mode:/ });
};

test('color-mode toggle cycles system → light → dark → system', () => {
  renderShell();

  // Boots at the system default.
  expect(modeButton()).toHaveTextContent('System');

  fireEvent.click(modeButton());
  expect(modeButton()).toHaveTextContent('Light');

  fireEvent.click(modeButton());
  expect(modeButton()).toHaveTextContent('Dark');

  fireEvent.click(modeButton());
  expect(modeButton()).toHaveTextContent('System');
});
