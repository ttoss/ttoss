// Core authentication types
export type AuthUser = {
  id: string;
  email: string;
  emailVerified?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
} | null;

export type AuthTokens = {
  idToken: string;
  accessToken: string;
  refreshToken: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
} | null;

export type AuthScreen =
  | { value: 'signIn'; context: { email?: string } }
  | { value: 'signUp'; context: Record<string, never> }
  | { value: 'confirmSignUp'; context: { email: string } }
  | { value: 'resendSignUpCode'; context: { email: string } }
  | { value: 'forgotPassword'; context: Record<string, never> }
  | { value: 'confirmResetPassword'; context: { email: string } };

// Input types for authentication actions
export type OnSignInInput = {
  email: string;
  password: string;
};

export type OnSignUpInput = {
  email: string;
  password: string;
  confirmPassword: string;
  signUpTerms?: boolean;
};

export type OnConfirmSignUpInput = {
  email: string;
  code: string;
};

export type OnForgotPasswordInput = {
  email: string;
};

export type OnForgotPasswordResetPasswordInput = {
  email: string;
  code: string;
  newPassword: string;
};

// Handler function types
export type OnSignIn = (input: OnSignInInput) => Promise<void> | void;
export type OnSignUp = (input: OnSignUpInput) => Promise<void> | void;
export type OnConfirmSignUp = (
  input: OnConfirmSignUpInput
) => Promise<void> | void;
export type OnForgotPassword = (
  input: OnForgotPasswordInput
) => Promise<void> | void;
export type OnForgotPasswordResetPassword = (
  input: OnForgotPasswordResetPasswordInput
) => Promise<void> | void;

// Sign up terms configuration
export type SignUpTerms = {
  isRequired: boolean;
  terms: {
    label: string;
    url: string;
  }[];
};
