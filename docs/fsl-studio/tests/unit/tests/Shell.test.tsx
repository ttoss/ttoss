import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

import { App } from '../../../src/App';

test('renders the conventional shell with the Overview section by default', async () => {
  const { container } = render(<App />);

  expect(
    screen.getByRole('heading', { level: 1, name: 'FSL Studio' })
  ).toBeInTheDocument();
  expect(screen.getByRole('banner')).toBeInTheDocument();
  expect(screen.getByRole('main')).toBeInTheDocument();
  expect(
    screen.getByRole('tablist', { name: 'Studio sections' })
  ).toBeInTheDocument();
  expect(
    screen.getByRole('heading', { name: 'The FSL proving ground' })
  ).toBeInTheDocument();

  expect(await axe(container)).toHaveNoViolations();
});

test('sidebar navigation switches sections and writes the URL hash', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('tab', { name: 'Blocks' }));

  expect(
    await screen.findByRole('heading', { level: 2, name: 'Blocks' })
  ).toBeInTheDocument();
  expect(window.location.hash).toBe('#/blocks');

  await user.click(screen.getByRole('tab', { name: 'Components' }));

  expect(
    await screen.findByRole('heading', { level: 2, name: 'Components' })
  ).toBeInTheDocument();
  expect(window.location.hash).toBe('#/components');
});

test('deep links: a section hash present at load selects that section', () => {
  window.history.replaceState(null, '', '/#/theme');

  render(<App />);

  expect(
    screen.getByRole('heading', { level: 2, name: 'Theme' })
  ).toBeInTheDocument();
});

test('an unknown hash falls back to the Overview section', () => {
  window.history.replaceState(null, '', '/#/nope');

  render(<App />);

  expect(
    screen.getByRole('heading', { name: 'The FSL proving ground' })
  ).toBeInTheDocument();
});

test('external hash changes (back/forward) drive the selected section', async () => {
  render(<App />);

  act(() => {
    window.location.hash = '/blocks';
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });

  expect(
    await screen.findByRole('heading', { level: 2, name: 'Blocks' })
  ).toBeInTheDocument();
});

test('the hashchange listener is removed on unmount', () => {
  const removeSpy = jest.spyOn(window, 'removeEventListener');

  const { unmount } = render(<App />);
  unmount();

  expect(removeSpy).toHaveBeenCalledWith('hashchange', expect.any(Function));
  removeSpy.mockRestore();
});

test('overview cards link into their sections through the hash', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('link', { name: 'Browse blocks' }));

  expect(
    await screen.findByRole('heading', { level: 2, name: 'Blocks' })
  ).toBeInTheDocument();
  expect(window.location.hash).toBe('#/blocks');
});

test('the header mode toggle drives the fsl-theme runtime', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('radio', { name: 'Dark' }));

  expect(document.documentElement.getAttribute('data-tt-mode')).toBe('dark');

  await user.click(screen.getByRole('radio', { name: 'Light' }));

  expect(document.documentElement.getAttribute('data-tt-mode')).toBe('light');
});
