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

/**
 * Custom endpoint configuration for sending notifications to any platform.
 */
export type CustomEndpoint = {
  /**
   * The URL of the endpoint to send notifications to.
   */
  url: string;
  /**
   * Optional name to identify this endpoint (useful for debugging).
   */
  name?: string;
  /**
   * Function to format the notification message for this specific endpoint.
   * Receives the notification and project name, returns a plain object to be JSON serialized as the request body.
   * Must return a value of type Record<string, unknown>.
   */
  formatBody: (params: {
    notification: NotificationMessage;
    project: string;
  }) => Record<string, unknown>;
  /**
   * Optional custom headers for the request.
   * Defaults to { 'Content-Type': 'application/json' }
   */
  headers?: Record<string, string>;
  /**
   * HTTP method to use. Defaults to 'POST'.
   */
  method?: 'POST' | 'PUT' | 'PATCH';
};

type Configuration = {
  discordWebhookUrl?: string;
  project?: string;
  /**
   * Custom endpoints to send notifications to.
   * Can be a single endpoint or an array of endpoints.
   */
  customEndpoints?: CustomEndpoint | CustomEndpoint[];
};

let setup: Configuration | null = null;

export const configureLogger = (params: Configuration) => {
  setup = params;
};

const sendNotificationToDiscord = async ({
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

/**
 * Sends a notification to a custom endpoint.
 */
const sendToCustomEndpoint = async ({
  notification,
  endpoint,
  project,
}: {
  notification: NotificationMessage;
  endpoint: CustomEndpoint;
  project: string;
}) => {
  const body = endpoint.formatBody({ notification, project });

  await fetch(endpoint.url, {
    method: endpoint.method || 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(endpoint.headers ?? {}),
    },
    body: JSON.stringify(body),
  });
};

/**
 * Helper to normalize customEndpoints to always be an array.
 */
const getCustomEndpointsArray = (
  endpoints?: CustomEndpoint | CustomEndpoint[]
): CustomEndpoint[] => {
  if (!endpoints) {
    return [];
  }
  return Array.isArray(endpoints) ? endpoints : [endpoints];
};

export const notify = async (notification: NotificationMessage) => {
  if (notification.log) {
    const message = [notification.title, notification.message].join(': ');
    log[notification.type](message);
  }

  if (!setup?.project) {
    return;
  }

  const promises: Promise<void>[] = [];

  if (setup?.discordWebhookUrl) {
    promises.push(
      sendNotificationToDiscord({
        notification,
        url: setup.discordWebhookUrl,
        project: setup.project,
      })
    );
  }

  const customEndpoints = getCustomEndpointsArray(setup.customEndpoints);
  for (const endpoint of customEndpoints) {
    promises.push(
      sendToCustomEndpoint({
        notification,
        endpoint,
        project: setup.project,
      })
    );
  }

  await Promise.all(promises);
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
