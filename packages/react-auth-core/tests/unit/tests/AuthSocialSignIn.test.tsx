import { render, screen, userEvent } from '@ttoss/test-utils/react';
import { AuthSignIn } from 'src/AuthSignIn';
import { AuthSocialSignIn } from 'src/AuthSocialSignIn';

const onSocialSignIn = jest.fn();

const onSignIn = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
});

test('should render nothing when no provider is configured', () => {
  render(<AuthSocialSignIn providers={[]} onSocialSignIn={onSocialSignIn} />);

  expect(screen.queryAllByRole('button')).toHaveLength(0);
});

test('should render one button per provider, in order', () => {
  render(
    <AuthSocialSignIn
      providers={['Google', 'Facebook']}
      onSocialSignIn={onSocialSignIn}
    />
  );

  const buttons = screen.getAllByRole('button');

  expect(buttons).toHaveLength(2);
  expect(buttons[0]).toHaveTextContent('Continue with Google');
  expect(buttons[1]).toHaveTextContent('Continue with Facebook');
});

test('should call onSocialSignIn with the clicked provider', async () => {
  const user = userEvent.setup({ delay: null });

  render(
    <AuthSocialSignIn
      providers={['Google', 'Facebook']}
      onSocialSignIn={onSocialSignIn}
    />
  );

  await user.click(screen.getByText('Continue with Facebook'));

  expect(onSocialSignIn).toHaveBeenCalledTimes(1);
  expect(onSocialSignIn).toHaveBeenCalledWith({ provider: 'Facebook' });
});

test('should not render social buttons on sign in when no handler is given', () => {
  render(<AuthSignIn onSignIn={onSignIn} socialProviders={['Google']} />);

  expect(screen.queryByText('Continue with Google')).not.toBeInTheDocument();
});

test('should render social buttons on the sign in screen', async () => {
  const user = userEvent.setup({ delay: null });

  render(
    <AuthSignIn
      onSignIn={onSignIn}
      socialProviders={['Google']}
      onSocialSignIn={onSocialSignIn}
    />
  );

  await user.click(screen.getByText('Continue with Google'));

  expect(onSocialSignIn).toHaveBeenCalledWith({ provider: 'Google' });
  expect(onSignIn).not.toHaveBeenCalled();
});
