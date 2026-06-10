import type {
  AuthFlowsUser,
  EmailSender,
  OneTimeTokenStore,
  UserStore,
} from 'src/flows';
import { AuthFlowError, AuthFlowErrorCode, createAuthFlows } from 'src/flows';

// In-memory fakes

const makeUserStore = (): UserStore & { users: Map<string, AuthFlowsUser> } => {
  const users = new Map<string, AuthFlowsUser>();
  let nextId = 1;
  return {
    users,
    findByEmail: async (email) => {
      for (const u of users.values()) {
        if (u.email === email) return u;
      }
      return null;
    },
    create: async ({ email, passwordHash }) => {
      const user: AuthFlowsUser = {
        id: String(nextId++),
        email,
        passwordHash: passwordHash ?? null,
        emailVerified: false,
      };
      users.set(user.id, user);
      return user;
    },
    setPasswordHash: async (id, passwordHash) => {
      const u = users.get(id);
      if (u) users.set(id, { ...u, passwordHash });
    },
    markEmailVerified: async (id) => {
      const u = users.get(id);
      if (u) users.set(id, { ...u, emailVerified: true });
    },
  };
};

const makeTokenStore = (): OneTimeTokenStore & {
  store: Map<string, { tokenHash: string; expires: Date }>;
} => {
  const store = new Map<string, { tokenHash: string; expires: Date }>();
  return {
    store,
    save: async ({ identifier, tokenHash, expires }) => {
      store.set(identifier, { tokenHash, expires });
    },
    find: async (identifier) => {
      return store.get(identifier) ?? null;
    },
    destroy: async (identifier) => {
      store.delete(identifier);
    },
  };
};

const makeEmailSender = (): EmailSender & {
  sent: Array<{ to: string; subject: string; html: string; text: string }>;
} => {
  const sent: Array<{
    to: string;
    subject: string;
    html: string;
    text: string;
  }> = [];
  return {
    sent,
    send: async (args) => {
      sent.push(args);
    },
  };
};

const makeFlows = (
  overrides?: Partial<Parameters<typeof createAuthFlows>[0]>
) => {
  const userStore = makeUserStore();
  const tokenStore = makeTokenStore();
  const emailSender = makeEmailSender();
  const flows = createAuthFlows({
    users: userStore,
    tokens: tokenStore,
    email: emailSender,
    jwt: { secret: 'test-secret', expiresInSeconds: 3600 },
    urls: {
      magicLink: (t, e) => {
        return `https://app.example.com/auth/magic-link?token=${t}&email=${e}`;
      },
      verifyEmail: (t, e) => {
        return `https://app.example.com/auth/verify-email?token=${t}&email=${e}`;
      },
      resetPassword: (t, e) => {
        return `https://app.example.com/auth/reset-password?token=${t}&email=${e}`;
      },
    },
    ...overrides,
  });
  return { flows, userStore, tokenStore, emailSender };
};

const makeFlowsForSignup = () => {
  const us = makeUserStore();
  const ts = makeTokenStore();
  const es = makeEmailSender();
  const flows = createAuthFlows({
    users: us,
    tokens: ts,
    email: es,
    jwt: { secret: 'secret' },
    urls: {
      magicLink: (t) => {
        return `https://app/magic?token=${t}`;
      },
      verifyEmail: (t, e) => {
        return `https://app/verify?token=${t}&email=${e}`;
      },
      resetPassword: (t, e) => {
        return `https://app/reset?token=${t}&email=${e}`;
      },
    },
  });
  return { flows, us, ts, es };
};

const extractToken = (html: string) => {
  const m = html.match(/token=([^&"?]+)/);
  return m![1];
};

// ── Magic link ──────────────────────────────────────────────────────────────

describe('sendMagicLink', () => {
  test('creates user and sends email when autoCreateUserOnMagicLink is true (default)', async () => {
    const { flows, userStore, emailSender } = makeFlows();
    await flows.sendMagicLink({ email: 'alice@example.com' });
    expect(userStore.users.size).toBe(1);
    expect(emailSender.sent).toHaveLength(1);
    expect(emailSender.sent[0].to).toBe('alice@example.com');
  });

  test('does not create user when autoCreateUserOnMagicLink is false but still resolves', async () => {
    const { flows, userStore, emailSender } = makeFlows({
      policies: { autoCreateUserOnMagicLink: false },
    });
    await flows.sendMagicLink({ email: 'unknown@example.com' });
    expect(userStore.users.size).toBe(0);
    expect(emailSender.sent).toHaveLength(0);
  });

  test('sends email to existing user when autoCreateUserOnMagicLink is false', async () => {
    const { flows, userStore, emailSender } = makeFlows({
      policies: { autoCreateUserOnMagicLink: false },
    });
    await userStore.create({ email: 'alice@example.com' });
    await flows.sendMagicLink({ email: 'alice@example.com' });
    expect(emailSender.sent).toHaveLength(1);
  });

  test('resolves without error for non-existent email (no enumeration)', async () => {
    const { flows } = makeFlows({
      policies: { autoCreateUserOnMagicLink: false },
    });
    await expect(
      flows.sendMagicLink({ email: 'ghost@example.com' })
    ).resolves.toBeUndefined();
  });
});

describe('verifyMagicLink', () => {
  test('returns user and JWT, marks email verified', async () => {
    const { flows, emailSender } = makeFlows();
    await flows.sendMagicLink({ email: 'alice@example.com' });
    const token = extractToken(emailSender.sent[0].html);
    const result = await flows.verifyMagicLink({
      email: 'alice@example.com',
      token,
    });
    expect(result.user.email).toBe('alice@example.com');
    expect(result.user.emailVerified).toBe(true);
    expect(typeof result.token).toBe('string');
  });

  test('throws INVALID_TOKEN for wrong token', async () => {
    const { flows } = makeFlows();
    await flows.sendMagicLink({ email: 'alice@example.com' });
    await expect(
      flows.verifyMagicLink({
        email: 'alice@example.com',
        token: 'wrong-token',
      })
    ).rejects.toThrow(AuthFlowError);
  });

  test('is single-use: second verification fails', async () => {
    const { flows, emailSender } = makeFlows();
    await flows.sendMagicLink({ email: 'alice@example.com' });
    const token = extractToken(emailSender.sent[0].html);
    await flows.verifyMagicLink({ email: 'alice@example.com', token });
    await expect(
      flows.verifyMagicLink({ email: 'alice@example.com', token })
    ).rejects.toMatchObject({ code: AuthFlowErrorCode.INVALID_TOKEN });
  });
});

// ── Sign up / verify email ───────────────────────────────────────────────────

describe('signUp', () => {
  test('creates user and sends verification email', async () => {
    const { flows, es } = makeFlowsForSignup();
    const { user } = await flows.signUp({
      email: 'bob@example.com',
      password: 'password123',
    });
    expect(user.email).toBe('bob@example.com');
    expect(user.emailVerified).toBe(false);
    expect(es.sent).toHaveLength(1);
    expect(es.sent[0].subject).toContain('erify');
  });

  test('throws EMAIL_ALREADY_EXISTS for duplicate email', async () => {
    const { flows } = makeFlowsForSignup();
    await flows.signUp({ email: 'bob@example.com', password: 'password123' });
    await expect(
      flows.signUp({ email: 'bob@example.com', password: 'otherpass' })
    ).rejects.toMatchObject({
      code: AuthFlowErrorCode.EMAIL_ALREADY_EXISTS,
      statusCode: 409,
    });
  });

  test('throws WEAK_PASSWORD for short password', async () => {
    const { flows } = makeFlowsForSignup();
    await expect(
      flows.signUp({ email: 'bob@example.com', password: 'short' })
    ).rejects.toMatchObject({ code: AuthFlowErrorCode.WEAK_PASSWORD });
  });

  test('respects custom passwordMinLength policy', async () => {
    const us = makeUserStore();
    const ts = makeTokenStore();
    const es = makeEmailSender();
    const flows = createAuthFlows({
      users: us,
      tokens: ts,
      email: es,
      jwt: { secret: 'secret' },
      policies: { passwordMinLength: 12 },
      urls: {
        magicLink: (t) => {
          return t;
        },
        verifyEmail: (t) => {
          return t;
        },
        resetPassword: (t) => {
          return t;
        },
      },
    });
    await expect(
      flows.signUp({ email: 'x@x.com', password: 'onlyeleven' })
    ).rejects.toMatchObject({ code: AuthFlowErrorCode.WEAK_PASSWORD });
  });
});

describe('verifyEmail', () => {
  test('marks email verified and returns JWT', async () => {
    const { flows, es } = makeFlowsForSignup();
    await flows.signUp({ email: 'bob@example.com', password: 'password123' });
    const result = await flows.verifyEmail({
      email: 'bob@example.com',
      token: extractToken(es.sent[0].html),
    });
    expect(result.user.emailVerified).toBe(true);
    expect(typeof result.token).toBe('string');
  });

  test('throws INVALID_TOKEN for wrong token', async () => {
    const { flows } = makeFlowsForSignup();
    await flows.signUp({ email: 'bob@example.com', password: 'password123' });
    await expect(
      flows.verifyEmail({ email: 'bob@example.com', token: 'bad' })
    ).rejects.toMatchObject({ code: AuthFlowErrorCode.INVALID_TOKEN });
  });

  test('is single-use', async () => {
    const { flows, es } = makeFlowsForSignup();
    await flows.signUp({ email: 'bob@example.com', password: 'password123' });
    const token = extractToken(es.sent[0].html);
    await flows.verifyEmail({ email: 'bob@example.com', token });
    await expect(
      flows.verifyEmail({ email: 'bob@example.com', token })
    ).rejects.toMatchObject({ code: AuthFlowErrorCode.INVALID_TOKEN });
  });
});

// ── Sign in ──────────────────────────────────────────────────────────────────

describe('signIn', () => {
  const setupVerifiedUser = async () => {
    const { flows, es } = makeFlowsForSignup();
    await flows.signUp({ email: 'alice@example.com', password: 'correctpass' });
    await flows.verifyEmail({
      email: 'alice@example.com',
      token: extractToken(es.sent[0].html),
    });
    return { flows };
  };

  test('returns user and JWT for correct credentials', async () => {
    const { flows } = await setupVerifiedUser();
    const result = await flows.signIn({
      email: 'alice@example.com',
      password: 'correctpass',
    });
    expect(result.user.email).toBe('alice@example.com');
    expect(typeof result.token).toBe('string');
  });

  test('throws INVALID_CREDENTIALS for wrong password', async () => {
    const { flows } = await setupVerifiedUser();
    await expect(
      flows.signIn({ email: 'alice@example.com', password: 'wrongpass' })
    ).rejects.toMatchObject({
      code: AuthFlowErrorCode.INVALID_CREDENTIALS,
      statusCode: 401,
    });
  });

  test('throws INVALID_CREDENTIALS for unknown email', async () => {
    const { flows } = await setupVerifiedUser();
    await expect(
      flows.signIn({ email: 'ghost@example.com', password: 'anypass' })
    ).rejects.toMatchObject({ code: AuthFlowErrorCode.INVALID_CREDENTIALS });
  });

  test('throws EMAIL_NOT_VERIFIED when email not verified', async () => {
    const { flows } = makeFlowsForSignup();
    await flows.signUp({
      email: 'unverified@example.com',
      password: 'password123',
    });
    await expect(
      flows.signIn({ email: 'unverified@example.com', password: 'password123' })
    ).rejects.toMatchObject({
      code: AuthFlowErrorCode.EMAIL_NOT_VERIFIED,
      statusCode: 403,
    });
  });

  test('throws NO_PASSWORD for magic-link-only account', async () => {
    const { flows, us } = makeFlowsForSignup();
    const user = await us.create({ email: 'ml@example.com' });
    await us.markEmailVerified(user.id);
    await expect(
      flows.signIn({ email: 'ml@example.com', password: 'anypass' })
    ).rejects.toMatchObject({ code: AuthFlowErrorCode.NO_PASSWORD });
  });
});

// ── Forgot / reset password ──────────────────────────────────────────────────

describe('forgotPassword', () => {
  test('sends reset email for known user', async () => {
    const { flows, us, es } = makeFlowsForSignup();
    await us.create({ email: 'alice@example.com' });
    await flows.forgotPassword({ email: 'alice@example.com' });
    expect(es.sent).toHaveLength(1);
    expect(es.sent[0].subject.toLowerCase()).toContain('password');
  });

  test('resolves without error for unknown email (no enumeration)', async () => {
    const { flows } = makeFlowsForSignup();
    await expect(
      flows.forgotPassword({ email: 'ghost@example.com' })
    ).resolves.toBeUndefined();
  });
});

describe('resetPassword', () => {
  const setupReset = async () => {
    const { flows, us, es } = makeFlowsForSignup();
    const user = await us.create({ email: 'alice@example.com' });
    await us.markEmailVerified(user.id);
    await flows.forgotPassword({ email: 'alice@example.com' });
    return { flows, us, token: extractToken(es.sent[0].html) };
  };

  test('sets new password hash', async () => {
    const { flows, us, token } = await setupReset();
    await flows.resetPassword({
      email: 'alice@example.com',
      token,
      newPassword: 'newpassword1',
    });
    const user = await us.findByEmail('alice@example.com');
    expect(user!.passwordHash).toBeTruthy();
  });

  test('throws INVALID_TOKEN for wrong token', async () => {
    const { flows } = await setupReset();
    await expect(
      flows.resetPassword({
        email: 'alice@example.com',
        token: 'bad',
        newPassword: 'newpassword1',
      })
    ).rejects.toMatchObject({ code: AuthFlowErrorCode.INVALID_TOKEN });
  });

  test('throws WEAK_PASSWORD for short new password', async () => {
    const { flows, token } = await setupReset();
    await expect(
      flows.resetPassword({
        email: 'alice@example.com',
        token,
        newPassword: 'short',
      })
    ).rejects.toMatchObject({ code: AuthFlowErrorCode.WEAK_PASSWORD });
  });

  test('is single-use: second reset with same token fails', async () => {
    const { flows, token } = await setupReset();
    await flows.resetPassword({
      email: 'alice@example.com',
      token,
      newPassword: 'newpassword1',
    });
    await expect(
      flows.resetPassword({
        email: 'alice@example.com',
        token,
        newPassword: 'newpassword2',
      })
    ).rejects.toMatchObject({ code: AuthFlowErrorCode.INVALID_TOKEN });
  });
});

// ── setPasswordForUser ───────────────────────────────────────────────────────

describe('setPasswordForUser', () => {
  test('sets first password for magic-link-only user (no currentPassword required)', async () => {
    const { flows, us } = makeFlowsForSignup();
    const user = await us.create({ email: 'ml@example.com' });
    await flows.setPasswordForUser({ user, newPassword: 'newpassword1' });
    const updated = await us.findByEmail('ml@example.com');
    expect(updated!.passwordHash).toBeTruthy();
  });

  test('requires currentPassword when user already has a password', async () => {
    const { flows, us } = makeFlowsForSignup();
    await flows.signUp({ email: 'alice@example.com', password: 'oldpassword' });
    const user = await us.findByEmail('alice@example.com');
    await expect(
      flows.setPasswordForUser({ user: user!, newPassword: 'newpassword1' })
    ).rejects.toMatchObject({
      code: AuthFlowErrorCode.INVALID_CURRENT_PASSWORD,
    });
  });

  test('throws INVALID_CURRENT_PASSWORD for wrong current password', async () => {
    const { flows, us } = makeFlowsForSignup();
    await flows.signUp({ email: 'alice@example.com', password: 'oldpassword' });
    const user = await us.findByEmail('alice@example.com');
    await expect(
      flows.setPasswordForUser({
        user: user!,
        currentPassword: 'wrongold',
        newPassword: 'newpassword1',
      })
    ).rejects.toMatchObject({
      code: AuthFlowErrorCode.INVALID_CURRENT_PASSWORD,
    });
  });

  test('succeeds with correct current password', async () => {
    const { flows, us } = makeFlowsForSignup();
    await flows.signUp({ email: 'alice@example.com', password: 'oldpassword' });
    const user = await us.findByEmail('alice@example.com');
    await flows.setPasswordForUser({
      user: user!,
      currentPassword: 'oldpassword',
      newPassword: 'newpassword1',
    });
    const updated = await us.findByEmail('alice@example.com');
    expect(updated!.passwordHash).not.toBe(user!.passwordHash);
  });

  test('throws WEAK_PASSWORD for short new password', async () => {
    const { flows, us } = makeFlowsForSignup();
    const user = await us.create({ email: 'ml@example.com' });
    await expect(
      flows.setPasswordForUser({ user, newPassword: 'short' })
    ).rejects.toMatchObject({ code: AuthFlowErrorCode.WEAK_PASSWORD });
  });
});

// ── Hooks ────────────────────────────────────────────────────────────────────

describe('hooks', () => {
  test('calls onUserCreated when magic link creates a user', async () => {
    const onUserCreated = jest.fn().mockResolvedValue(undefined);
    const { flows } = makeFlows({ hooks: { onUserCreated } });
    await flows.sendMagicLink({ email: 'new@example.com' });
    expect(onUserCreated).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'new@example.com' })
    );
  });

  test('calls onSignIn after successful signIn', async () => {
    const onSignIn = jest.fn().mockResolvedValue(undefined);
    const us = makeUserStore();
    const ts = makeTokenStore();
    const es = makeEmailSender();
    const flows = createAuthFlows({
      users: us,
      tokens: ts,
      email: es,
      jwt: { secret: 'secret' },
      urls: {
        magicLink: (t) => {
          return t;
        },
        verifyEmail: (t, e) => {
          return `verify?token=${t}&email=${e}`;
        },
        resetPassword: (t) => {
          return t;
        },
      },
      hooks: { onSignIn },
    });
    await flows.signUp({ email: 'a@x.com', password: 'password1' });
    await flows.verifyEmail({
      email: 'a@x.com',
      token: extractToken(es.sent[0].html),
    });
    await flows.signIn({ email: 'a@x.com', password: 'password1' });
    expect(onSignIn).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'a@x.com' }),
      'password'
    );
  });
});

// ── Custom templates ─────────────────────────────────────────────────────────

describe('custom templates', () => {
  test('uses custom magicLink template', async () => {
    const customTemplate = jest.fn().mockReturnValue({
      subject: 'Custom',
      html: '<p>custom token=abc</p>',
      text: 'custom',
    });
    const us = makeUserStore();
    const ts = makeTokenStore();
    const es = makeEmailSender();
    const flows = createAuthFlows({
      users: us,
      tokens: ts,
      email: es,
      jwt: { secret: 'secret' },
      urls: {
        magicLink: (t) => {
          return `magic?token=${t}`;
        },
        verifyEmail: (t) => {
          return t;
        },
        resetPassword: (t) => {
          return t;
        },
      },
      templates: { magicLink: customTemplate },
    });
    await flows.sendMagicLink({ email: 'a@x.com' });
    expect(customTemplate).toHaveBeenCalled();
    expect(es.sent[0].subject).toBe('Custom');
  });
});

// ── AuthFlowError ────────────────────────────────────────────────────────────

describe('AuthFlowError', () => {
  test('has correct code and statusCode', () => {
    const err = new AuthFlowError(AuthFlowErrorCode.INVALID_CREDENTIALS, 401);
    expect(err.code).toBe('INVALID_CREDENTIALS');
    expect(err.statusCode).toBe(401);
    expect(err instanceof AuthFlowError).toBe(true);
    expect(err instanceof Error).toBe(true);
  });
});
