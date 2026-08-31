import { createEmailAuthHandlers } from 'src/emailAuth';
import type {
  EmailAuthDelivery,
  EmailAuthMode,
  EmailAuthOptions,
} from 'src/emailAuthTypes';
import {
  createMemoryOneTimeTokenStore,
  createMemoryUserStore,
} from 'src/memoryStores';
import type { AuthHttpRequest } from 'src/oauthServerTypes';

export const BASE_URL = 'https://app.example.com';

export const request = (body: Record<string, unknown>): AuthHttpRequest => {
  return { body, query: {}, headers: {} };
};

/**
 * Builds an engine over the in-memory reference stores, capturing every
 * delivery so a test can read the token the user would have received.
 */
export const setup = (
  args: {
    modes?: EmailAuthMode[];
    users?: Array<{
      email: string;
      passwordHash?: string | null;
      emailVerified?: boolean;
    }>;
  } & Partial<EmailAuthOptions> = {}
) => {
  const { modes = ['password'], users = [], ...overrides } = args;

  const sent: EmailAuthDelivery[] = [];

  const userStore = createMemoryUserStore(
    users.map((user, index) => {
      return {
        id: `user_${index + 1}`,
        email: user.email,
        passwordHash: user.passwordHash ?? null,
        emailVerified: user.emailVerified ?? false,
      };
    })
  );

  const oneTimeTokenStore = createMemoryOneTimeTokenStore();

  const handlers = createEmailAuthHandlers({
    modes,
    userStore,
    oneTimeTokenStore,
    baseUrl: BASE_URL,
    issueSession: (user) => {
      return { accessToken: `token-for-${user.id}`, userId: user.id };
    },
    sendEmail: (delivery) => {
      sent.push(delivery);
    },
    ...overrides,
  });

  return { handlers, userStore, oneTimeTokenStore, sent };
};

export const lastDelivery = (sent: EmailAuthDelivery[]): EmailAuthDelivery => {
  const delivery = sent.at(-1);

  if (!delivery) {
    throw new Error('No email was sent.');
  }

  return delivery;
};
