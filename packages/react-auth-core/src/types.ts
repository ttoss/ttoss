export type OnSignInInput = {
  email: string;
  password: string;
};

export type OnSignIn = (input: OnSignInInput) => void;

export type OnSignUpInput = {
  email: string;
  password: string;
  confirmPassword: string;
};

export type OnSignUp = (input: OnSignUpInput) => void;

export type OnConfirmSignUp = (input: { email: string; code: string }) => void;

export type OnForgotPassword = (input: { email: string }) => void;

export type OnForgotPasswordResetPassword = (input: {
  email: string;
  code: string;
  newPassword: string;
}) => void;
