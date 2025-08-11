import { render, screen, userEvent } from '@ttoss/test-utils';
import type { AuthScreen } from 'src/index';
import { Auth, useAuthScreen } from 'src/index';

const onSignIn = jest.fn();

const onSignUp = jest.fn();

const onForgotPassword = jest.fn();

const AuthTest = (props: { initialScreen?: AuthScreen }) => {
  const { screen, setScreen } = useAuthScreen(props.initialScreen);
  return (
    <Auth
      screen={screen}
      setScreen={setScreen}
      onSignIn={onSignIn}
      onSignUp={onSignUp}
      onForgotPassword={onForgotPassword}
    />
  );
};

describe('signIn screen', () => {
  test('should go to forgot password screen when clicking on forgot password link', async () => {
    const user = userEvent.setup({ delay: null });

    render(<AuthTest initialScreen={{ value: 'signIn' }} />);

    const forgotPasswordLink = screen.getByText('Forgot password?');

    await user.click(forgotPasswordLink);

    expect(
      screen.getByRole('heading', { name: 'Recovering Password' })
    ).toBeInTheDocument();
  });
});

describe('signUp screen', () => {
  test('should go to sign in screen when clicking on sign in link', async () => {
    const user = userEvent.setup({ delay: null });

    render(<AuthTest initialScreen={{ value: 'signUp' }} />);

    const signInLink = screen.getByText("I'm already registered");

    await user.click(signInLink);

    expect(
      screen.getByRole('heading', { name: 'Sign in' })
    ).toBeInTheDocument();
  });
});
