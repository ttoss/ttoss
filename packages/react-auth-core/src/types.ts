export type AuthUser = {
  id: string;
  email: string;
  emailVerified?: boolean;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  expiresIn?: number;
  expiresAt?: number;
};

export type AuthData = {
  user: AuthUser | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean | undefined;
};

export type AuthContextValue = {
  signOut?: () => Promise<void>;
  isAuthenticated: boolean;
  user: AuthUser | null;
  tokens: AuthTokens | null;
  setAuthData: React.Dispatch<React.SetStateAction<AuthData>>;
};

export type AuthScreen =
  | { value: 'signIn' }
  | { value: 'signUp' }
  | { value: 'confirmSignUpWithCode'; context: { email: string } }
  | { value: 'confirmSignUpCheckEmail' }
  | { value: 'forgotPassword' }
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

export type OnConfirmSignUpWithCodeInput = {
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

export type OnConfirmSignUpCheckEmail = () => Promise<void> | void;

export type OnConfirmSignUpWithCode = (
  input: OnConfirmSignUpWithCodeInput
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
