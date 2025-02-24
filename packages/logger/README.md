# @ttoss/logger

A simple module to configure and send notifications to services like Discord from your applications.

## Installation

Install the package via pnpm:

```bash
pnpm add @ttoss/logger
```

## Usage

The `@ttoss/logger` module allows you to configure a logger and send notifications to external services, such as Discord, with ease. It also provides basic methods for local console logging.

### Configuration

First, configure the logger with the necessary parameters, such as a Discord webhook URL:

```ts
import { configureLogger } from '@ttoss/logger';

configureLogger({
  discordWebhookUrl: 'https://discord.com/api/webhooks/your-webhook-here',
});
```

### Sending Notifications

Use the `notify` method to send messages to the configured services:

```ts
import { notify } from '@ttoss/logger';

await notify('Hello! This is a notification for Discord.');
```

### Local Logging

For console logs, use the `log` object:

```ts
import { log } from '@ttoss/logger';

log.info('Useful information');

log.warn('Important warning');

log.error('Critical error');
```

## API

### `configureLogger(params)`

Configures the logger with notification sending options.

- **Parameters**:
  - `params.discordWebhookUrl` (string): The Discord webhook URL.

### `notify(message)`

Sends a notification to the configured services.

- **Parameters**:
  - `message` (string): The message to send.
- **Returns**: A Promise that resolves when the sending is complete.

### `log`

Object with methods for local logging:

- `log.warn(message)`: Displays a warning in the console.
- `log.error(message)`: Displays an error in the console.
- `log.info(message)`: Displays an info message in the console.

## Complete Example

```ts
import { configureLogger, notify, log } from '@ttoss/logger';

// Configure the logger

configureLogger({
  discordWebhookUrl: 'https://discord.com/api/webhooks/your-webhook-here',
});

// Send a notification

await notify('Application started successfully!');

// Local logs

log.info('Starting the server...');

log.warn('Low memory.');

log.error('Failed to connect to the database.');
```

## Notes

- Currently, support is limited to Discord via webhooks, but more services will be added in the future.
- Ensure the `discordWebhookUrl` is valid to avoid silent failures.

## License

[MIT](https://github.com/ttoss/ttoss/blob/main/LICENSE)
