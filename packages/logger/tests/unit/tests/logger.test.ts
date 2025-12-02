import { faker } from '@ttoss/test-utils/faker';
import {
  configureLogger,
  CustomEndpoint,
  log,
  notify,
  notifyError,
} from 'src/index';

global.fetch = jest.fn(() => {
  return Promise.resolve({
    json: () => {
      return Promise.resolve({ test: 100 });
    },
  });
}) as jest.Mock;

const project = 'project-name';

beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('should configure logger and send notification to Discord', async () => {
  const discordWebhookUrl = 'https://discord.com/api/webhooks/test-webhook';
  configureLogger({ discordWebhookUrl, project });

  const message = 'Test notification';
  await notify({ message, type: 'error' });

  expect(fetch).toHaveBeenCalledTimes(1);
  expect(fetch).toHaveBeenCalledWith(
    discordWebhookUrl,
    expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"embeds":[{"title":"ERROR from project-name","description":"Test notification","color":16711680,"footer":{"text":"Project: project-name"}}]}',
    })
  );
});

test('should not call fetch if no webhook is configured', async () => {
  configureLogger({ discordWebhookUrl: undefined, project });

  await notify({ type: 'error', message: 'This should not be sent' });

  expect(fetch).not.toHaveBeenCalled();
});

test('should handle fetch errors gracefully', async () => {
  const discordWebhookUrl = 'https://discord.com/api/webhooks/test-webhook';
  configureLogger({ discordWebhookUrl, project });

  (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

  await expect(
    notify({ type: 'error', message: 'Test error' })
  ).rejects.toThrow('Network error');

  expect(fetch).toHaveBeenCalledTimes(1);
});

test('should send a formatted notification with prefix', async () => {
  configureLogger({
    discordWebhookUrl: 'https://discord.com/api/webhooks/test-webhook',
    project: 'TestApp',
  });

  await notify({
    type: 'warn',
    title: 'Alert',
    message: 'Test warning',
  });

  expect(fetch).toHaveBeenCalledWith(
    'https://discord.com/api/webhooks/test-webhook',
    expect.objectContaining({
      body: '{"embeds":[{"title":"Alert","description":"Test warning","color":16776960,"footer":{"text":"Project: TestApp"}}]}',
    })
  );
});

test.each<keyof typeof log>(['error', 'warn', 'info'])(
  'should call log.%s and log when log is true',
  async (type) => {
    jest.spyOn(console, type).mockImplementation(() => {});

    const logSpy = jest.spyOn(log, type);

    const title = faker.word.words(2);

    const message = faker.word.words(8);

    await notify({
      type,
      title,
      message,
      log: true,
    });

    expect(logSpy).toHaveBeenCalledWith(`${title}: ${message}`);
  }
);

test('sendNotificationToDiscord should send POST request correctly when using notifyError', async () => {
  const discordWebhookUrl = 'https://discord.com/api/webhooks/test-webhook';
  configureLogger({ discordWebhookUrl, project });

  const error = new Error('This is an error');
  await notifyError({ error });

  expect(fetch).toHaveBeenCalledTimes(1);
  expect(fetch).toHaveBeenCalledWith(
    discordWebhookUrl,
    expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"embeds":[{"title":"ERROR from project-name","description":"This is an error","color":16711680,"footer":{"text":"Project: project-name"}}]}',
    })
  );
});

describe('Custom Endpoints', () => {
  const customEndpointUrl = 'https://custom-api.example.com/notifications';

  test('should send notification to a single custom endpoint', async () => {
    const formatBody = jest.fn().mockReturnValue({ text: 'Custom message' });
    const customEndpoint: CustomEndpoint = {
      url: customEndpointUrl,
      name: 'Custom API',
      formatBody,
    };

    configureLogger({ project, customEndpoints: customEndpoint });

    await notify({ type: 'info', message: 'Test message' });

    expect(formatBody).toHaveBeenCalledWith({
      notification: { type: 'info', message: 'Test message' },
      project,
    });
    expect(fetch).toHaveBeenCalledWith(
      customEndpointUrl,
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{"text":"Custom message"}',
      })
    );
  });

  test('should send notification to multiple custom endpoints', async () => {
    const endpoint1: CustomEndpoint = {
      url: 'https://api1.example.com/notify',
      formatBody: () => {
        return { channel: '#alerts', text: 'Alert!' };
      },
    };
    const endpoint2: CustomEndpoint = {
      url: 'https://api2.example.com/webhook',
      formatBody: () => {
        return { message: 'Notification received' };
      },
    };

    configureLogger({ project, customEndpoints: [endpoint1, endpoint2] });

    await notify({ type: 'warn', message: 'Warning message' });

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenCalledWith(
      'https://api1.example.com/notify',
      expect.objectContaining({
        body: '{"channel":"#alerts","text":"Alert!"}',
      })
    );
    expect(fetch).toHaveBeenCalledWith(
      'https://api2.example.com/webhook',
      expect.objectContaining({
        body: '{"message":"Notification received"}',
      })
    );
  });

  test('should send to both Discord and custom endpoints when both are configured', async () => {
    const discordWebhookUrl = 'https://discord.com/api/webhooks/test-webhook';
    const customEndpoint: CustomEndpoint = {
      url: customEndpointUrl,
      formatBody: ({ notification }) => {
        return { msg: notification.message };
      },
    };

    configureLogger({
      project,
      discordWebhookUrl,
      customEndpoints: customEndpoint,
    });

    await notify({ type: 'error', message: 'Critical error' });

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenCalledWith(discordWebhookUrl, expect.anything());
    expect(fetch).toHaveBeenCalledWith(customEndpointUrl, expect.anything());
  });

  test('should use custom headers when provided', async () => {
    const customEndpoint: CustomEndpoint = {
      url: customEndpointUrl,
      formatBody: () => {
        return { data: 'test' };
      },
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer token123',
        'X-Custom-Header': 'custom-value',
      },
    };

    configureLogger({ project, customEndpoints: customEndpoint });

    await notify({ type: 'info', message: 'Test' });

    expect(fetch).toHaveBeenCalledWith(
      customEndpointUrl,
      expect.objectContaining({
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer token123',
          'X-Custom-Header': 'custom-value',
        },
      })
    );
  });

  test('should use custom HTTP method when provided', async () => {
    const customEndpoint: CustomEndpoint = {
      url: customEndpointUrl,
      formatBody: () => {
        return { status: 'ok' };
      },
      method: 'PUT',
    };

    configureLogger({ project, customEndpoints: customEndpoint });

    await notify({ type: 'info', message: 'Test' });

    expect(fetch).toHaveBeenCalledWith(
      customEndpointUrl,
      expect.objectContaining({
        method: 'PUT',
      })
    );
  });

  test('should not call custom endpoints if project is not configured', async () => {
    const customEndpoint: CustomEndpoint = {
      url: customEndpointUrl,
      formatBody: () => {
        return { test: true };
      },
    };

    configureLogger({ customEndpoints: customEndpoint });

    await notify({ type: 'info', message: 'Test' });

    expect(fetch).not.toHaveBeenCalled();
  });

  test('should handle empty customEndpoints array', async () => {
    configureLogger({ project, customEndpoints: [] });

    await notify({ type: 'info', message: 'Test' });

    expect(fetch).not.toHaveBeenCalled();
  });
});
