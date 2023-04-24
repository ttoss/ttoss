# @ttoss/logger

Simple logger package for Vite.

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

Just instantiate the logger and start to use:

```ts
import { logger } from '@ttoss/logger';

logger.warn('This will emit an warn on console');

logger.error('This will emit a log of type error on console');

loggger.info('This will emit a simple log on console');
```
