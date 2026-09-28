import {
  createCatalog,
  defineMessages,
  LocalizedError,
  msg,
} from '@ttoss/i18n-core';
import { requestContextStore } from 'src/context';
import { createGatedToolRegistrar, getRequestLocale } from 'src/index';

type ToolCallResult = {
  isError?: true;
  content: Array<{ type: string; text: string }>;
};

const messages = defineMessages({
  notActive: {
    defaultMessage: 'Your subscription is not active.',
    description: 'Gate refusal',
  },
});

const catalog = createCatalog({
  supported: ['en', 'pt-BR'],
  fallback: 'en',
  load: (locale) => {
    return locale === 'pt-BR'
      ? { [messages.notActive.id!]: 'Sua assinatura não está ativa.' }
      : {};
  },
});

const refusal = () => {
  return new LocalizedError({
    code: 'SUBSCRIPTION_NOT_ACTIVE',
    message: msg(messages.notActive),
  });
};

const setup = ({
  i18n,
  gate,
  method = jest.fn().mockResolvedValue({ ok: true }),
  onError,
}: {
  i18n?: Parameters<typeof createGatedToolRegistrar>[0]['i18n'];
  gate?: () => void;
  method?: jest.Mock;
  onError?: jest.Mock;
}) => {
  let callback:
    ((args: Record<string, unknown>) => Promise<unknown>) | undefined;
  const server = {
    registerTool: jest.fn((_name, _config, cb) => {
      callback = cb;
    }),
  } as unknown as Parameters<typeof createGatedToolRegistrar>[0]['server'];

  const { register } = createGatedToolRegistrar({
    server,
    resolveIdentity: () => {
      return { userId: 'u1', scopes: ['read'] };
    },
    gates: gate ? [gate] : [],
    onError,
    i18n,
  });

  register({
    name: 'tool',
    description: 'tool',
    requiredScope: 'read',
    inputSchema: {},
    method,
  });

  const call = (acceptLanguage?: string) => {
    return requestContextStore.run({ apiHeaders: {}, acceptLanguage }, () => {
      return callback!({}) as Promise<ToolCallResult>;
    });
  };

  return { call, method };
};

const body = (result: ToolCallResult) => {
  return JSON.parse(result.content[0].text);
};

describe('getRequestLocale', () => {
  test('reads the request Accept-Language, undefined outside a request', () => {
    expect(getRequestLocale()).toBeUndefined();
    requestContextStore.run({ apiHeaders: {}, acceptLanguage: 'pt-BR' }, () => {
      expect(getRequestLocale()).toBe('pt-BR');
    });
  });
});

describe('createGatedToolRegistrar i18n', () => {
  test('renders a gate refusal in the request locale; the handler never runs', async () => {
    const { call, method } = setup({
      i18n: { catalog },
      gate: () => {
        throw refusal();
      },
    });

    const result = await call('pt-BR');

    expect(result.isError).toBe(true);
    expect(body(result)).toEqual({
      error: 'Sua assinatura não está ativa.',
      code: 'SUBSCRIPTION_NOT_ACTIVE',
    });
    expect(method).not.toHaveBeenCalled();
  });

  test('renders a handler LocalizedError after onError, in a pinned locale', async () => {
    const onError = jest.fn();
    const error = refusal();
    const { call } = setup({
      i18n: {
        catalog,
        getLocale: () => {
          return 'en';
        },
      },
      method: jest.fn().mockRejectedValue(error),
      onError,
    });

    const result = await call('pt-BR');

    expect(onError).toHaveBeenCalledWith(error, expect.anything());
    expect(body(result)).toEqual({
      error: 'Your subscription is not active.',
      code: 'SUBSCRIPTION_NOT_ACTIVE',
    });
  });

  test('rethrows errors that are not localized', async () => {
    const fault = new Error('boom');
    const gateFault = new Error('gate boom');

    await expect(
      setup({
        i18n: { catalog },
        method: jest.fn().mockRejectedValue(fault),
      }).call()
    ).rejects.toBe(fault);
    await expect(
      setup({
        i18n: { catalog },
        gate: () => {
          throw gateFault;
        },
      }).call()
    ).rejects.toBe(gateFault);
  });

  test('without the option, a LocalizedError is rethrown as before', async () => {
    const error = refusal();

    await expect(
      setup({
        gate: () => {
          throw error;
        },
      }).call('pt-BR')
    ).rejects.toBe(error);
  });

  test('rethrows the original error when the catalog fails', async () => {
    const error = refusal();
    const { call } = setup({
      i18n: {
        catalog: {
          getI18n: () => {
            return Promise.reject(new Error('S3 down'));
          },
        },
      },
      gate: () => {
        throw error;
      },
    });

    await expect(call()).rejects.toBe(error);
  });
});
