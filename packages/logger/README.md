# @ttoss/logger

Send notifications to Discord, Slack, or any custom endpoint from your applications.

## Installation

```bash
pnpm add @ttoss/logger
```

## Quick Start

```ts
import { configureLogger, notify, log } from '@ttoss/logger';

// Configure once at app startup
configureLogger({
  project: 'My App',
  discordWebhookUrl: 'https://discord.com/api/webhooks/xxx',
});

// Send notifications
await notify({ type: 'error', message: 'Something went wrong!' });
await notify({ type: 'info', title: 'Deploy', message: 'v1.2.0 released' });

// Local console logging
log.info('Server started');
log.warn('High memory usage');
log.error('Database connection failed');
```

## Custom Endpoints

Send notifications to any platform by providing a custom formatter:

```ts
configureLogger({
  project: 'My App',
  discordWebhookUrl: 'https://discord.com/api/webhooks/xxx',
  customEndpoints: [
    {
      url: 'https://hooks.slack.com/services/xxx',
      formatBody: ({ notification, project }) => ({
        text: `[${project}] ${notification.type}: ${notification.message}`,
      }),
    },
    {
      url: 'https://my-api.com/alerts',
      headers: { Authorization: 'Bearer token' },
      method: 'PUT',
      formatBody: ({ notification }) => ({
        severity: notification.type,
        message: notification.message,
      }),
    },
  ],
});
```

### CustomEndpoint Options

| Property     | Type                         | Description                                                        |
| ------------ | ---------------------------- | ------------------------------------------------------------------ |
| `url`        | `string`                     | Endpoint URL (required)                                            |
| `formatBody` | `function`                   | Formats the request body (required)                                |
| `headers`    | `Record<string, string>`     | Custom headers (default: `{ 'Content-Type': 'application/json' }`) |
| `method`     | `'POST' \| 'PUT' \| 'PATCH'` | HTTP method (default: `'POST'`)                                    |
| `name`       | `string`                     | Optional identifier for debugging                                  |

## API

### `configureLogger(config)`

| Parameter           | Type                                 | Description                           |
| ------------------- | ------------------------------------ | ------------------------------------- |
| `project`           | `string`                             | Project name for notification context |
| `discordWebhookUrl` | `string`                             | Discord webhook URL                   |
| `customEndpoints`   | `CustomEndpoint \| CustomEndpoint[]` | Custom notification endpoints         |

### `notify(notification)`

| Parameter | Type                          | Description           |
| --------- | ----------------------------- | --------------------- |
| `type`    | `'info' \| 'warn' \| 'error'` | Notification severity |
| `message` | `string`                      | Notification content  |
| `title`   | `string`                      | Optional title        |
| `log`     | `boolean`                     | Also log to console   |

### `notifyError({ error, title?, log? })`

Convenience method for error notifications that extracts the message from Error objects.

### `log`

Console logging methods: `log.info()`, `log.warn()`, `log.error()`

## License

[MIT](https://github.com/ttoss/ttoss/blob/main/LICENSE)
