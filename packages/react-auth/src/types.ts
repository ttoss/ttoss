export type OnSignInInput = {
  email: string;
  password: string;
};

export type OnSignIn = (input: OnSignInInput) => void;

export type OnSignUpInput = {
  email: string;
  password: string;
};

export type OnSignUp = (input: OnSignUpInput) => void;

export type OnConfirmSignUp = (input: { email: string; code: string }) => void;
