# @ttoss/logger

Simple environment agnostic logger.

## Motivation

Often, for debugging some piece of code, developers use console.log for it. When the application goes for production, some of these logs still appears, most because they forget to clear these logs.
These package solves this, providing some levels of log that are emitted based on the environment of the application.

## Log Levels vs Environments

<table>
<thead>
<tr><th>Log Level</th><th>Environment</th></tr>
</thead>
<tbody>
<tr><td>Warn</td><td>Dev-only</td></tr>
<tr><td>Error</td><td>All</td></tr>
<tr><td>Info</td><td>Dev-only</td></tr>
</tbody>
</table>

## How to use

Just instantiate the logger, providing the `isDev` value configuration and start to use:

```ts
// createLogger.ts

import { Logger } from '@ttoss/logger';
import { config } from 'dotenv';

config();

export const createLogger = Logger(process.env.DEV === 'true');

// randomFile.ts

const logger = createLogger('randomFile');

logger.warn('This will emit an warn on console');

logger.error('This will emit a log of type error on console');

loggger.info('This will emit a simple log on console');
```

If you not pass any parameter to `Logger`, it gonna considers to be in dev environment:

```ts
// createLogger.ts

import { Logger } from '@ttoss/logger';

// In dev environment, gonna log everything
export const createLogger = Logger();
```
