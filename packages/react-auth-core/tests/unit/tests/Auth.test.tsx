import { render, screen, userEvent } from '@ttoss/test-utils/react';
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

describe('initialScreen prop', () => {
  test('should render signIn screen by default when no initialScreen is provided', () => {
    render(
      <Auth
        onSignIn={onSignIn}
        onSignUp={onSignUp}
        onForgotPassword={onForgotPassword}
      />
    );

    expect(
      screen.getByRole('heading', { name: 'Sign in' })
    ).toBeInTheDocument();
  });

  test('should render signUp screen when initialScreen is signUp', () => {
    render(
      <Auth
        initialScreen={{ value: 'signUp' }}
        onSignIn={onSignIn}
        onSignUp={onSignUp}
        onForgotPassword={onForgotPassword}
      />
    );

    expect(
      screen.getByRole('heading', { name: 'Sign up' })
    ).toBeInTheDocument();
  });

  test('should render forgotPassword screen when initialScreen is forgotPassword', () => {
    render(
      <Auth
        initialScreen={{ value: 'forgotPassword' }}
        onSignIn={onSignIn}
        onSignUp={onSignUp}
        onForgotPassword={onForgotPassword}
      />
    );

    expect(
      screen.getByRole('heading', { name: 'Recovering Password' })
    ).toBeInTheDocument();
  });

  test('should navigate between screens when using initialScreen', async () => {
    const user = userEvent.setup({ delay: null });

    render(
      <Auth
        initialScreen={{ value: 'signIn' }}
        onSignIn={onSignIn}
        onSignUp={onSignUp}
        onForgotPassword={onForgotPassword}
      />
    );

    const forgotPasswordLink = screen.getByText('Forgot password?');
    await user.click(forgotPasswordLink);

    expect(
      screen.getByRole('heading', { name: 'Recovering Password' })
    ).toBeInTheDocument();

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    await user.click(cancelButton);

    expect(
      screen.getByRole('heading', { name: 'Sign in' })
    ).toBeInTheDocument();
  });

  test('should work with external screen/setScreen when provided', async () => {
    const user = userEvent.setup({ delay: null });

    render(<AuthTest initialScreen={{ value: 'signUp' }} />);

    const signInLink = screen.getByText("I'm already registered");
    await user.click(signInLink);

    expect(
      screen.getByRole('heading', { name: 'Sign in' })
    ).toBeInTheDocument();
  });
});
