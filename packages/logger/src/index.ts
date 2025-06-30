/* eslint-disable no-console */
type NotificationType = 'info' | 'warn' | 'error';

export const log = {
  warn: console.warn,
  error: console.error,
  info: console.info,
};

type NotificationMessage = {
  type: NotificationType;
  title?: string;
  message: string;
  log?: boolean;
};

type Configuration = {
  discordWebhookUrl?: string;
  project?: string;
};

let setup: Configuration | null = null;

export const configureLogger = (params: Configuration) => {
  setup = params;
};

export const sendNotificationToDiscord = async ({
  notification,
  url,
  project,
}: {
  notification: NotificationMessage;
  url: string;
  project: string;
}) => {
  const embedMessage = {
    embeds: [
      {
        title:
          notification.title ||
          `${notification.type.toUpperCase()} from ${project}`,
        description: notification.message,
        color:
          notification.type === 'error'
            ? 0xff0000
            : notification.type === 'warn'
              ? 0xffff00
              : 0x00ff00,
        footer: { text: `Project: ${project}` },
      },
    ],
  };

  const body = JSON.stringify(embedMessage);

  await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body,
  });
};

export const notify = async (notification: NotificationMessage) => {
  if (notification.log) {
    const message = [notification.title, notification.message].join(': ');
    log[notification.type](message);
  }

  if (!setup?.project) {
    return;
  }

  if (setup?.discordWebhookUrl) {
    await sendNotificationToDiscord({
      notification,
      url: setup.discordWebhookUrl,
      project: setup.project,
    });
  }
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown error:' + JSON.stringify(error);
};

export const notifyError = async (notification: {
  error: unknown;
  title?: string;
  log?: boolean;
}) => {
  return notify({
    type: 'error',
    message: getErrorMessage(notification.error),
    title: notification.title,
    log: notification.log,
  });
};
