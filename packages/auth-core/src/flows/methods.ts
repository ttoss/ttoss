import {
  comparePassword,
  generateOneTimeToken,
  hashPassword,
  needsRehash,
  signJwt,
  verifyOneTimeToken,
} from '../index';
import {
  defaultMagicLinkEmail,
  defaultResetPasswordEmail,
  defaultVerifyEmail,
} from './defaults';
import type {
  AuthFlowsConfig,
  AuthFlowsUser,
  OneTimeTokenStore,
} from './types';
import { AuthFlowError, AuthFlowErrorCode } from './types';

export type Deps = {
  users: AuthFlowsConfig['users'];
  tokens: AuthFlowsConfig['tokens'];
  emailSender: AuthFlowsConfig['email'];
  jwtSecret: string;
  jwtExpiresInSeconds: number;
  passwordMinLength: number;
  magicLinkExpiresInSeconds: number;
  verifyEmailExpiresInSeconds: number;
  resetPasswordExpiresInSeconds: number;
  autoCreateUserOnMagicLink: boolean;
  urls: AuthFlowsConfig['urls'];
  templates: Required<NonNullable<AuthFlowsConfig['templates']>>;
  hooks: Required<NonNullable<AuthFlowsConfig['hooks']>>;
};

const issueJwt = (user: AuthFlowsUser, deps: Deps) => {
  return signJwt({
    payload: { sub: user.id, email: user.email },
    secret: deps.jwtSecret,
    expiresInSeconds: deps.jwtExpiresInSeconds,
  });
};

const validatePassword = (password: string, minLength: number) => {
  if (password.length < minLength) {
    throw new AuthFlowError(AuthFlowErrorCode.WEAK_PASSWORD, 422);
  }
};

const issueToken = async (
  identifier: string,
  expiresInSeconds: number,
  tokens: OneTimeTokenStore
) => {
  const { token, tokenHash, expires } = await generateOneTimeToken({
    expiresInSeconds,
  });
  await tokens.save({ identifier, tokenHash, expires });
  return token;
};

const consumeToken = async (
  identifier: string,
  token: string,
  tokens: OneTimeTokenStore
) => {
  const stored = await tokens.find(identifier);
  if (!stored) throw new AuthFlowError(AuthFlowErrorCode.INVALID_TOKEN, 400);
  const valid = await verifyOneTimeToken({
    token,
    tokenHash: stored.tokenHash,
    expires: stored.expires,
  });
  if (!valid) throw new AuthFlowError(AuthFlowErrorCode.INVALID_TOKEN, 400);
  await tokens.destroy(identifier);
};

export const sendMagicLink = async (
  { email }: { email: string },
  deps: Deps
) => {
  let user = await deps.users.findByEmail(email);
  if (!user && deps.autoCreateUserOnMagicLink) {
    user = await deps.users.create({ email });
    await deps.hooks.onUserCreated(user);
  }
  if (user) {
    const token = await issueToken(
      `magic-link:${email}`,
      deps.magicLinkExpiresInSeconds,
      deps.tokens
    );
    const link = deps.urls.magicLink(token, email);
    const { subject, html, text } = deps.templates.magicLink({ link, email });
    await deps.emailSender.send({ to: email, subject, html, text });
  }
};

export const verifyMagicLink = async (
  { email, token }: { email: string; token: string },
  deps: Deps
) => {
  await consumeToken(`magic-link:${email}`, token, deps.tokens);
  const user = await deps.users.findByEmail(email);
  if (!user) throw new AuthFlowError(AuthFlowErrorCode.INVALID_TOKEN, 400);
  if (!user.emailVerified) await deps.users.markEmailVerified(user.id);
  const verifiedUser = { ...user, emailVerified: true };
  await deps.hooks.onSignIn(verifiedUser, 'magic-link');
  return { user: verifiedUser, token: issueJwt(verifiedUser, deps) };
};

export const signUp = async (
  { email, password }: { email: string; password: string },
  deps: Deps
) => {
  validatePassword(password, deps.passwordMinLength);
  if (await deps.users.findByEmail(email)) {
    throw new AuthFlowError(AuthFlowErrorCode.EMAIL_ALREADY_EXISTS, 409);
  }
  const passwordHash = await hashPassword(password);
  const user = await deps.users.create({ email, passwordHash });
  await deps.hooks.onUserCreated(user);
  const token = await issueToken(
    `verify:${email}`,
    deps.verifyEmailExpiresInSeconds,
    deps.tokens
  );
  const link = deps.urls.verifyEmail(token, email);
  const { subject, html, text } = deps.templates.verifyEmail({ link, email });
  await deps.emailSender.send({ to: email, subject, html, text });
  return { user };
};

export const verifyEmail = async (
  { email, token }: { email: string; token: string },
  deps: Deps
) => {
  await consumeToken(`verify:${email}`, token, deps.tokens);
  const user = await deps.users.findByEmail(email);
  if (!user) throw new AuthFlowError(AuthFlowErrorCode.INVALID_TOKEN, 400);
  await deps.users.markEmailVerified(user.id);
  const verifiedUser = { ...user, emailVerified: true };
  return { user: verifiedUser, token: issueJwt(verifiedUser, deps) };
};

export const signIn = async (
  { email, password }: { email: string; password: string },
  deps: Deps
) => {
  const user = await deps.users.findByEmail(email);
  if (!user)
    throw new AuthFlowError(AuthFlowErrorCode.INVALID_CREDENTIALS, 401);
  if (!user.emailVerified)
    throw new AuthFlowError(AuthFlowErrorCode.EMAIL_NOT_VERIFIED, 403);
  if (!user.passwordHash)
    throw new AuthFlowError(AuthFlowErrorCode.NO_PASSWORD, 400);
  if (!(await comparePassword(password, user.passwordHash))) {
    throw new AuthFlowError(AuthFlowErrorCode.INVALID_CREDENTIALS, 401);
  }
  if (await needsRehash(user.passwordHash)) {
    await deps.users.setPasswordHash(user.id, await hashPassword(password));
  }
  await deps.hooks.onSignIn(user, 'password');
  return { user, token: issueJwt(user, deps) };
};

export const forgotPassword = async (
  { email }: { email: string },
  deps: Deps
) => {
  const user = await deps.users.findByEmail(email);
  if (user) {
    const token = await issueToken(
      `reset:${email}`,
      deps.resetPasswordExpiresInSeconds,
      deps.tokens
    );
    const link = deps.urls.resetPassword(token, email);
    const { subject, html, text } = deps.templates.resetPassword({
      link,
      email,
    });
    await deps.emailSender.send({ to: email, subject, html, text });
  }
};

export const resetPassword = async (
  {
    email,
    token,
    newPassword,
  }: { email: string; token: string; newPassword: string },
  deps: Deps
) => {
  validatePassword(newPassword, deps.passwordMinLength);
  await consumeToken(`reset:${email}`, token, deps.tokens);
  const user = await deps.users.findByEmail(email);
  if (!user) throw new AuthFlowError(AuthFlowErrorCode.INVALID_TOKEN, 400);
  await deps.users.setPasswordHash(user.id, await hashPassword(newPassword));
};

export const setPasswordForUser = async (
  {
    user,
    currentPassword,
    newPassword,
  }: { user: AuthFlowsUser; currentPassword?: string; newPassword: string },
  deps: Deps
) => {
  validatePassword(newPassword, deps.passwordMinLength);
  if (user.passwordHash) {
    if (!currentPassword) {
      throw new AuthFlowError(AuthFlowErrorCode.INVALID_CURRENT_PASSWORD, 400);
    }
    if (!(await comparePassword(currentPassword, user.passwordHash))) {
      throw new AuthFlowError(AuthFlowErrorCode.INVALID_CURRENT_PASSWORD, 401);
    }
  }
  await deps.users.setPasswordHash(user.id, await hashPassword(newPassword));
};

const noop = async () => {
  return undefined;
};

const resolveTemplates = (
  t: AuthFlowsConfig['templates']
): Deps['templates'] => {
  return {
    magicLink: t?.magicLink ?? defaultMagicLinkEmail,
    verifyEmail: t?.verifyEmail ?? defaultVerifyEmail,
    resetPassword: t?.resetPassword ?? defaultResetPasswordEmail,
  };
};

type PolicyDefaults = Pick<
  Deps,
  | 'passwordMinLength'
  | 'magicLinkExpiresInSeconds'
  | 'verifyEmailExpiresInSeconds'
  | 'resetPasswordExpiresInSeconds'
  | 'autoCreateUserOnMagicLink'
>;

const resolvePolicies = (p: AuthFlowsConfig['policies']): PolicyDefaults => {
  const {
    passwordMinLength = 8,
    magicLinkExpiresInSeconds = 86400,
    verifyEmailExpiresInSeconds = 86400,
    resetPasswordExpiresInSeconds = 3600,
    autoCreateUserOnMagicLink = true,
  } = p ?? {};
  return {
    passwordMinLength,
    magicLinkExpiresInSeconds,
    verifyEmailExpiresInSeconds,
    resetPasswordExpiresInSeconds,
    autoCreateUserOnMagicLink,
  };
};

export const buildDeps = (config: AuthFlowsConfig): Deps => {
  return {
    users: config.users,
    tokens: config.tokens,
    emailSender: config.email,
    jwtSecret: config.jwt.secret,
    jwtExpiresInSeconds: config.jwt.expiresInSeconds ?? 60 * 60 * 24 * 7,
    ...resolvePolicies(config.policies),
    urls: config.urls,
    templates: resolveTemplates(config.templates),
    hooks: {
      onUserCreated: config.hooks?.onUserCreated ?? noop,
      onSignIn: config.hooks?.onSignIn ?? noop,
    },
  };
};
