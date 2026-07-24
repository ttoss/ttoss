import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { App } from 'src/App';
import { signIn } from 'src/session';
import { resetWorkspace } from 'src/store';

beforeEach(() => {
  resetWorkspace();
});

describe('App', () => {
  test('signed out, the login gate renders instead of the product', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { name: 'Sign in to northline' })
    ).toBeInTheDocument();
    expect(screen.queryByText('Overview')).not.toBeInTheDocument();
  });

  test('signing in through the form reaches the dashboard', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText('Email'), 'ana@northline.dev');
    await user.type(screen.getByLabelText('Password'), 'correct-horse');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(
      await screen.findByRole('heading', { name: 'Overview' })
    ).toBeInTheDocument();
    expect(screen.getByText('ana@northline.dev')).toBeInTheDocument();
  });

  test('sidebar tabs route between the product pages', async () => {
    const user = userEvent.setup();
    render(<App />);

    act(() => {
      signIn({ email: 'ana@northline.dev' });
    });

    await user.click(await screen.findByRole('tab', { name: 'Team' }));
    expect(
      await screen.findByRole('heading', { name: 'Team' })
    ).toBeInTheDocument();
    expect(window.location.hash).toBe('#/team');

    await user.click(screen.getByRole('tab', { name: 'Billing' }));
    expect(
      await screen.findByRole('heading', { name: 'Billing' })
    ).toBeInTheDocument();
    expect(window.location.hash).toBe('#/billing');
  });

  test('the dark switch flips the resolved color mode', async () => {
    const user = userEvent.setup();
    render(<App />);

    act(() => {
      signIn({ email: 'ana@northline.dev' });
    });

    const darkSwitch = await screen.findByRole('switch', { name: 'Dark' });
    expect(darkSwitch).not.toBeChecked();

    await user.click(darkSwitch);
    expect(darkSwitch).toBeChecked();
    expect(document.documentElement.getAttribute('data-tt-mode')).toBe('dark');

    await user.click(darkSwitch);
    expect(darkSwitch).not.toBeChecked();
  });

  test('signing out returns to the login gate', async () => {
    const user = userEvent.setup();
    render(<App />);

    act(() => {
      signIn({ email: 'ana@northline.dev' });
    });

    await user.click(screen.getByRole('button', { name: 'ana@northline.dev' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Sign out' }));

    expect(
      await screen.findByRole('heading', { name: 'Sign in to northline' })
    ).toBeInTheDocument();
  });

  test('login gate has no axe violations', async () => {
    const { container } = render(<App />);
    expect(await axe(container)).toHaveNoViolations();
  });

  test('dashboard has no axe violations', async () => {
    act(() => {
      signIn({ email: 'ana@northline.dev' });
    });
    const { container } = render(<App />);

    await screen.findByRole('heading', { name: 'Overview' });
    expect(await axe(container)).toHaveNoViolations();
  });
});
