import { fireEvent, render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { App } from 'src/App';

expect.extend(toHaveNoViolations);

/**
 * Axe-clean CI gate (PRD F1 AC / §8). Two rules are excluded, each for a
 * documented reason:
 *
 * - `color-contrast`: jsdom performs no layout or painting, so axe cannot
 *   compute it; contrast is instead checked as data by the Theme Lab's own
 *   WCAG math (palette.test.ts) and by fsl-ui upstream.
 * - `aria-allowed-attr`: React Aria's Meter renders the standard fallback
 *   `role="meter progressbar"`, which axe misreads as disallowing the
 *   aria-value* attributes. Upstream RAC pattern, not a Studio defect —
 *   reported per PRD §2 (recorded in §14).
 */
const runAxe = (container: Element) => {
  return axe(container, {
    rules: {
      'color-contrast': { enabled: false },
      'aria-allowed-attr': { enabled: false },
    },
  });
};

jest.setTimeout(30000);

test('home is axe clean', async () => {
  const { container } = render(<App />);
  expect(await runAxe(container)).toHaveNoViolations();
});

test('the theme lens is axe clean', async () => {
  const { container } = render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /Create a theme/ }));
  expect(await runAxe(container)).toHaveNoViolations();
});

test('the components lens is axe clean', async () => {
  const { container } = render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /Explore components/ }));
  expect(await runAxe(container)).toHaveNoViolations();
});

test('the open command palette is axe clean', async () => {
  const { container } = render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /Create a theme/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Open command palette' }));
  expect(await runAxe(container)).toHaveNoViolations();
});
