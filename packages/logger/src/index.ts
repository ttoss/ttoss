/* eslint-disable no-console */
type Setup = {
  discordWebhookUrl: string;
};

let setup: Setup | null = null;

export const setupLogger = (params: Setup) => {
  setup = params;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const sendNotificationToDiscord = async (message: string) => {
  if (setup?.discordWebhookUrl) {
    await fetch(setup.discordWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
  }
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const sendNotification = (message: string) => {};

export const log = {
  warn: console.warn,
  error: console.error,
  info: console.info,
};
