import { jest } from '@jest/globals';
import { render, screen, userEvent } from '@ttoss/test-utils';
import { AuthSignUp } from 'src/AuthSignUp';

const onSignUp = jest.fn();

const onReturnToSignIn = jest.fn();

const userForm = {
  email: 'user@example.com',
  password: 'password',
  confirmPassword: 'password',
};

test('Should render the correct error message for password requirement', async () => {
  const user = userEvent.setup({ delay: null });

  render(<AuthSignUp {...{ onSignUp, onReturnToSignIn }} />);

  const password = screen.getByLabelText('Password');
  const buttonSubmit = screen.getByLabelText('submit-button');

  await user.type(password, 'pass');
  await user.click(buttonSubmit);

  expect(
    screen.getByText('Password requires 8 characters')
  ).toBeInTheDocument();
});

test('Should not call the onSubmit function if click on the Signup button without filling in the fields', async () => {
  const user = userEvent.setup({ delay: null });

  render(<AuthSignUp {...{ onSignUp, onReturnToSignIn }} />);

  await user.click(screen.getByLabelText('submit-button'));

  expect(onSignUp).toHaveBeenCalledTimes(0);
});

test('Should call the onSubmit function if click on the Signup button with the fields filled', async () => {
  const user = userEvent.setup({ advanceTimers: jest.runAllTimersAsync });

  render(<AuthSignUp {...{ onSignUp, onReturnToSignIn }} />);

  const emailInput = screen.getByLabelText('Email');
  const password = screen.getByLabelText('Password');
  const confirmPassword = screen.getByLabelText('Confirm password');
  const buttonSubmit = screen.getByLabelText('submit-button');

  await user.type(emailInput, userForm.email);
  await user.type(password, userForm.password);
  await user.type(confirmPassword, userForm.password);

  await user.click(buttonSubmit);

  expect(onSignUp).toHaveBeenCalledWith(userForm);
});

describe('sign up terms', () => {
  test.each([true, false])(
    'Should render the terms and conditions link if they exist and isRequired is %s',
    (isRequired) => {
      render(
        <AuthSignUp
          {...{
            onSignUp,
            onReturnToSignIn,
            signUpTerms: {
              isRequired,
              termsAndConditions: [
                {
                  label: 'Terms and Conditions',
                  url: 'https://example.com/terms',
                },
                {
                  label: 'Privacy Policy',
                  url: 'https://example.com/privacy',
                },
              ],
            },
          }}
        />
      );

      const termsAndConditions = screen.getByText('Terms and Conditions');

      expect(termsAndConditions).toBeInTheDocument();
      expect(termsAndConditions).toHaveAttribute(
        'href',
        'https://example.com/terms'
      );

      const privacyPolicy = screen.getByText('Privacy Policy');

      expect(privacyPolicy).toBeInTheDocument();
      expect(privacyPolicy).toHaveAttribute(
        'href',
        'https://example.com/privacy'
      );
    }
  );

  test('cannot submit form if terms and conditions are required and not checked', async () => {
    const user = userEvent.setup({ advanceTimers: jest.runAllTimersAsync });

    render(
      <AuthSignUp
        {...{
          onSignUp,
          onReturnToSignIn,
          signUpTerms: {
            isRequired: true,
            termsAndConditions: [
              {
                label: 'Terms and Conditions',
                url: 'https://example.com/terms',
              },
            ],
          },
        }}
      />
    );

    const emailInput = screen.getByLabelText('Email');
    const password = screen.getByLabelText('Password');
    const confirmPassword = screen.getByLabelText('Confirm password');
    const buttonSubmit = screen.getByLabelText('submit-button');

    await user.type(emailInput, userForm.email);
    await user.type(password, userForm.password);
    await user.type(confirmPassword, userForm.password);

    await user.click(buttonSubmit);

    expect(onSignUp).toHaveBeenCalledTimes(0);
  });

  test('can submit form if terms and conditions are required and checked', async () => {
    const user = userEvent.setup({ advanceTimers: jest.runAllTimersAsync });

    render(
      <AuthSignUp
        {...{
          onSignUp,
          onReturnToSignIn,
          signUpTerms: {
            isRequired: true,
            termsAndConditions: [
              {
                label: 'Terms and Conditions',
                url: 'https://example.com/terms',
              },
            ],
          },
        }}
      />
    );

    const emailInput = screen.getByLabelText('Email');
    const password = screen.getByLabelText('Password');
    const confirmPassword = screen.getByLabelText('Confirm password');
    const checkbox = screen.getByRole('checkbox');
    const buttonSubmit = screen.getByLabelText('submit-button');

    await user.type(emailInput, userForm.email);
    await user.type(password, userForm.password);
    await user.type(confirmPassword, userForm.password);
    await user.click(checkbox);

    await user.click(buttonSubmit);

    expect(onSignUp).toHaveBeenCalledTimes(1);
  });

  test('can submit form if terms and conditions are not required', async () => {
    const user = userEvent.setup({ advanceTimers: jest.runAllTimersAsync });

    render(
      <AuthSignUp
        {...{
          onSignUp,
          onReturnToSignIn,
          signUpTerms: {
            isRequired: false,
            termsAndConditions: [
              {
                label: 'Terms and Conditions',
                url: 'https://example.com/terms',
              },
            ],
          },
        }}
      />
    );

    const emailInput = screen.getByLabelText('Email');
    const password = screen.getByLabelText('Password');
    const confirmPassword = screen.getByLabelText('Confirm password');
    const buttonSubmit = screen.getByLabelText('submit-button');

    await user.type(emailInput, userForm.email);
    await user.type(password, userForm.password);
    await user.type(confirmPassword, userForm.password);

    await user.click(buttonSubmit);

    expect(onSignUp).toHaveBeenCalledTimes(1);
  });
});
