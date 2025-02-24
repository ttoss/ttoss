/* eslint-disable no-console */
type Setup = {
  discordWebhookUrl?: string;
};

let setup: Setup | null = null;

export const configureLogger = (params: Setup) => {
  setup = params;
};

export const sendNotificationToDiscord = async ({
  message,
  url,
}: {
  message: string;
  url: string;
}) => {
  await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });
};

export const notify = async (message: string) => {
  if (setup?.discordWebhookUrl) {
    await sendNotificationToDiscord({
      message,
      url: setup.discordWebhookUrl,
    });
  }
};

export const log = {
  warn: console.warn,
  error: console.error,
  info: console.info,
};
