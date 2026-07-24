import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  LoginPage,
  validateEmail,
  validatePassword,
} from 'src/pages/LoginPage';
import { getSession } from 'src/session';

describe('validateEmail', () => {
  test.each([
    ['', 'Enter your email.'],
    ['not-an-email', 'Enter a valid email address.'],
    ['a@b', 'Enter a valid email address.'],
    ['ana@northline.dev', null],
  ])('%s → %s', (value, expected) => {
    expect(validateEmail(value)).toBe(expected);
  });
});

describe('validatePassword', () => {
  test.each([
    ['', 'Enter your password.'],
    ['short', 'Password must be at least 8 characters.'],
    ['long-enough-password', null],
  ])('%s → %s', (value, expected) => {
    expect(validatePassword(value)).toBe(expected);
  });
});

describe('LoginPage', () => {
  test('invalid submission surfaces errors and creates no session', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Enter your email.')).toBeInTheDocument();
    expect(screen.getByText('Enter your password.')).toBeInTheDocument();
    expect(getSession()).toBeNull();
  });

  test('valid credentials sign in', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText('Email'), 'ana@northline.dev');
    await user.type(screen.getByLabelText('Password'), 'correct-horse');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(getSession()).toEqual({ email: 'ana@northline.dev' });
  });
});
