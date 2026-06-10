export const AuthFlowErrorCode = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  NO_PASSWORD: 'NO_PASSWORD',
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
  INVALID_TOKEN: 'INVALID_TOKEN',
  WEAK_PASSWORD: 'WEAK_PASSWORD',
  INVALID_CURRENT_PASSWORD: 'INVALID_CURRENT_PASSWORD',
} as const;

export type AuthFlowErrorCodeType =
  (typeof AuthFlowErrorCode)[keyof typeof AuthFlowErrorCode];

export class AuthFlowError extends Error {
  code: AuthFlowErrorCodeType;
  statusCode: number;

  constructor(
    code: AuthFlowErrorCodeType,
    statusCode: number,
    message?: string
  ) {
    super(message ?? code);
    this.name = 'AuthFlowError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export type AuthFlowsUser = {
  id: string;
  email: string;
  passwordHash?: string | null;
  emailVerified: boolean;
};

export type UserStore = {
  findByEmail: (email: string) => Promise<AuthFlowsUser | null>;
  create: (args: {
    email: string;
    passwordHash?: string;
  }) => Promise<AuthFlowsUser>;
  setPasswordHash: (id: string, passwordHash: string) => Promise<void>;
  markEmailVerified: (id: string) => Promise<void>;
};

export type OneTimeTokenStore = {
  save: (args: {
    identifier: string;
    tokenHash: string;
    expires: Date;
  }) => Promise<void>;
  find: (
    identifier: string
  ) => Promise<{ tokenHash: string; expires: Date } | null>;
  destroy: (identifier: string) => Promise<void>;
};

export type EmailSender = {
  send: (args: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }) => Promise<void>;
};

type EmailTemplate = (args: { link: string; email: string }) => {
  subject: string;
  html: string;
  text: string;
};

export type AuthFlowsConfig = {
  users: UserStore;
  tokens: OneTimeTokenStore;
  email: EmailSender;
  jwt: { secret: string; expiresInSeconds?: number };
  urls: {
    magicLink: (token: string, email: string) => string;
    verifyEmail: (token: string, email: string) => string;
    resetPassword: (token: string, email: string) => string;
  };
  policies?: {
    passwordMinLength?: number;
    magicLinkExpiresInSeconds?: number;
    verifyEmailExpiresInSeconds?: number;
    resetPasswordExpiresInSeconds?: number;
    autoCreateUserOnMagicLink?: boolean;
  };
  templates?: {
    magicLink?: EmailTemplate;
    verifyEmail?: EmailTemplate;
    resetPassword?: EmailTemplate;
  };
  hooks?: {
    onUserCreated?: (user: AuthFlowsUser) => Promise<void>;
    onSignIn?: (
      user: AuthFlowsUser,
      method: 'password' | 'magic-link'
    ) => Promise<void>;
  };
};
