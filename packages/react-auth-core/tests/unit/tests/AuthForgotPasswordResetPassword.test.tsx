import { render, screen, userEvent, waitFor } from '@ttoss/test-utils/react';
import { AuthForgotPasswordResetPassword } from 'src/AuthForgotPasswordResetPassword';

const onForgotPasswordResetPassword = jest.fn();
const onGoToSignIn = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
});

describe('AuthForgotPasswordResetPassword', () => {
  test('should apply max validation when maxCodeLength is defined', async () => {
    const user = userEvent.setup({ delay: null });

    render(
      <AuthForgotPasswordResetPassword
        email="user@example.com"
        maxCodeLength={6}
        onForgotPasswordResetPassword={onForgotPasswordResetPassword}
        onGoToSignIn={onGoToSignIn}
        passwordMinimumLength={8}
      />
    );

    const codeInput = screen.getByLabelText('Confirmation code');
    const passwordInput = screen.getByLabelText('New Password');
    const submitButton = screen.getByRole('button', {
      name: /reset password/i,
    });

    // Type a code that exceeds maxCodeLength
    await user.type(codeInput, '1234567'); // 7 characters, exceeds max of 6
    await user.type(passwordInput, 'ValidPassword123');

    await user.tab();

    // Should show validation error for code field
    await waitFor(() => {
      expect(screen.getByText('Maximum 6 characters')).toBeInTheDocument();
    });

    // Submit button should remain disabled due to validation error
    expect(submitButton).toBeDisabled();
    expect(onForgotPasswordResetPassword).not.toHaveBeenCalled();
  });

  test('should not apply max validation when maxCodeLength is not defined', async () => {
    const user = userEvent.setup({ delay: null });

    render(
      <AuthForgotPasswordResetPassword
        email="user@example.com"
        onForgotPasswordResetPassword={onForgotPasswordResetPassword}
        onGoToSignIn={onGoToSignIn}
        passwordMinimumLength={8}
      />
    );

    const codeInput = screen.getByLabelText('Confirmation code');
    const passwordInput = screen.getByLabelText('New Password');
    const submitButton = screen.getByRole('button', {
      name: /reset password/i,
    });

    // Type a long code (no maxCodeLength defined)
    await user.type(codeInput, '12345678910'); // 11 characters
    await user.type(passwordInput, 'ValidPassword123');

    await user.tab();

    // Should not show max length validation error
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });

    // Should be able to submit
    await user.click(submitButton);

    await waitFor(() => {
      expect(onForgotPasswordResetPassword).toHaveBeenCalledWith({
        email: 'user@example.com',
        code: '12345678910',
        newPassword: 'ValidPassword123',
      });
    });
  });

  test('should submit successfully with code within maxCodeLength limit', async () => {
    const user = userEvent.setup({ delay: null });

    render(
      <AuthForgotPasswordResetPassword
        email="user@example.com"
        maxCodeLength={6}
        onForgotPasswordResetPassword={onForgotPasswordResetPassword}
        onGoToSignIn={onGoToSignIn}
        passwordMinimumLength={8}
      />
    );

    const codeInput = screen.getByLabelText('Confirmation code');
    const passwordInput = screen.getByLabelText('New Password');
    const submitButton = screen.getByRole('button', {
      name: /reset password/i,
    });

    // Type a valid code within maxCodeLength
    await user.type(codeInput, '123456');
    await user.type(passwordInput, 'ValidPassword123');

    await user.tab();

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });

    await user.click(submitButton);

    await waitFor(() => {
      expect(onForgotPasswordResetPassword).toHaveBeenCalledWith({
        email: 'user@example.com',
        code: '123456',
        newPassword: 'ValidPassword123',
      });
    });
  });

  test('should not submit if required fields are empty', async () => {
    const user = userEvent.setup({ delay: null });

    render(
      <AuthForgotPasswordResetPassword
        email="user@example.com"
        maxCodeLength={6}
        onForgotPasswordResetPassword={onForgotPasswordResetPassword}
        onGoToSignIn={onGoToSignIn}
      />
    );

    const submitButton = screen.getByRole('button', {
      name: /reset password/i,
    });

    await user.click(submitButton);
    await user.tab();

    expect(onForgotPasswordResetPassword).not.toHaveBeenCalled();
  });

  test('should call onGoToSignIn when cancel button is clicked', async () => {
    const user = userEvent.setup({ delay: null });

    render(
      <AuthForgotPasswordResetPassword
        email="user@example.com"
        onForgotPasswordResetPassword={onForgotPasswordResetPassword}
        onGoToSignIn={onGoToSignIn}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });

    await user.click(cancelButton);

    expect(onGoToSignIn).toHaveBeenCalledTimes(1);
  });
});
