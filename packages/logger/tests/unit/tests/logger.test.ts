import {
  configureLogger,
  notify,
  sendNotificationToDiscord,
} from '@ttoss/logger';

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

test('sendNotificationToDiscord should send POST request correctly', async () => {
  const url = 'https://discord.com/api/webhooks/test-webhook';
  const message = 'Direct test';

  await sendNotificationToDiscord({
    notification: {
      message,
      type: 'error',
    },
    url,
    project,
  });

  expect(fetch).toHaveBeenCalledWith(
    url,
    expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"embeds":[{"title":"ERROR from project-name","description":"Direct test","color":16711680,"footer":{"text":"Project: project-name"}}]}',
    })
  );
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
