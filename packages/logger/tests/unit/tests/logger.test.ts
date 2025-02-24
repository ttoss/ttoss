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

describe('@ttoss/logger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should configure logger and send notification to Discord', async () => {
    const discordWebhookUrl = 'https://discord.com/api/webhooks/test-webhook';
    configureLogger({ discordWebhookUrl });

    const message = 'Test notification';
    await notify(message);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      discordWebhookUrl,
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      })
    );
  });

  test('should not call fetch if no webhook is configured', async () => {
    configureLogger({ discordWebhookUrl: undefined });

    await notify('This should not be sent');

    expect(fetch).not.toHaveBeenCalled();
  });

  test('should handle fetch errors gracefully', async () => {
    const discordWebhookUrl = 'https://discord.com/api/webhooks/test-webhook';
    configureLogger({ discordWebhookUrl });

    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    await expect(notify('Test error')).rejects.toThrow('Network error');

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  test('sendNotificationToDiscord should send POST request correctly', async () => {
    const url = 'https://discord.com/api/webhooks/test-webhook';
    const message = 'Direct test';

    await sendNotificationToDiscord({ message, url });

    expect(fetch).toHaveBeenCalledWith(
      url,
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      })
    );
  });
});
