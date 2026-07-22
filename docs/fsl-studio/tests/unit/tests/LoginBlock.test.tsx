import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@ttoss/fsl-theme/react';
import { axe } from 'jest-axe';

import { LoginBlock } from '../../../src/blocks/LoginBlock';
import { theme } from '../../../src/theme';

const renderBlock = () => {
  return render(
    <ThemeProvider theme={theme}>
      <LoginBlock />
    </ThemeProvider>
  );
};

test('renders the sign-in flow with no accessibility violations', async () => {
  const { container } = renderBlock();

  expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
  expect(screen.getByLabelText('Email')).toBeInTheDocument();
  expect(screen.getByLabelText('Password')).toBeInTheDocument();
  expect(
    screen.getByRole('checkbox', { name: 'Stay signed in' })
  ).toBeInTheDocument();

  expect(await axe(container)).toHaveNoViolations();
});

test('submitting empty surfaces the Zod messages through the invalid state', async () => {
  const user = userEvent.setup();
  renderBlock();

  await user.click(screen.getByRole('button', { name: 'Sign in' }));

  expect(
    await screen.findByText('Enter a valid email address')
  ).toBeInTheDocument();
  expect(
    screen.getByText('Password must have at least 8 characters')
  ).toBeInTheDocument();
  expect(screen.getByLabelText('Email')).toHaveAttribute(
    'aria-invalid',
    'true'
  );
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
});

test('a valid submission completes the demo flow', async () => {
  const user = userEvent.setup();
  renderBlock();

  await user.type(screen.getByLabelText('Email'), 'ada@ttoss.dev');
  await user.type(screen.getByLabelText('Password'), 'correct-horse');
  await user.click(screen.getByRole('checkbox', { name: 'Stay signed in' }));
  await user.click(screen.getByRole('button', { name: 'Sign in' }));

  expect(await screen.findByRole('status')).toHaveTextContent(
    'Signed in as ada@ttoss.dev'
  );
  expect(
    screen.queryByText('Enter a valid email address')
  ).not.toBeInTheDocument();
});

test('fixing an invalid field clears its message on resubmit', async () => {
  const user = userEvent.setup();
  renderBlock();

  await user.click(screen.getByRole('button', { name: 'Sign in' }));
  expect(
    await screen.findByText('Enter a valid email address')
  ).toBeInTheDocument();

  await user.type(screen.getByLabelText('Email'), 'ada@ttoss.dev');
  await user.type(screen.getByLabelText('Password'), 'correct-horse');
  await user.click(screen.getByRole('button', { name: 'Sign in' }));

  expect(await screen.findByRole('status')).toBeInTheDocument();
  expect(
    screen.queryByText('Enter a valid email address')
  ).not.toBeInTheDocument();
});
