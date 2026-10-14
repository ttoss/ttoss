/* eslint-disable no-console */
import { format, styleText } from 'node:util';

type LogLevel = 'info' | 'warn' | 'error' | 'event' | 'output';

const levels: Record<
  LogLevel,
  { label: string; color: Parameters<typeof styleText>[0] }
> = {
  info: { label: 'info', color: 'green' },
  warn: { label: 'WARN', color: 'yellow' },
  error: { label: 'ERR!', color: 'red' },
  event: { label: 'event', color: 'yellow' },
  output: { label: 'output', color: 'blue' },
};

/**
 * Color only when stderr supports it, honoring `NO_COLOR` and `FORCE_COLOR`.
 */
const paint = ({
  color,
  text,
}: {
  color: Parameters<typeof styleText>[0];
  text: string;
}) => {
  return styleText(color, text, { stream: process.stderr });
};

const write = ({
  level,
  prefix,
  args,
}: {
  level: LogLevel;
  prefix?: unknown;
  args: unknown[];
}) => {
  const { label, color } = levels[level];

  const header = [
    paint({ color, text: label }),
    prefix ? paint({ color: 'magenta', text: String(prefix) }) : '',
  ]
    .filter(Boolean)
    .join(' ');

  /**
   * Every line of a multi-line message carries the level and the prefix, so
   * interleaved output stays attributable.
   */
  const lines = format(...args)
    .split('\n')
    .map((line) => {
      return line ? `${header} ${line}` : header;
    });

  /**
   * Logs go to stderr so stdout stays clean for command output.
   */
  console.error(lines.join('\n'));
};

const createLevel = (level: LogLevel) => {
  return (prefix?: unknown, ...args: unknown[]) => {
    write({ level, prefix, args });
  };
};

/**
 * Minimal logger with the `log.<level>(prefix, message, ...args)` signature.
 * Messages are formatted with `util.format` and written to stderr as
 * `<level> <prefix> <message>`.
 */
export const log = {
  info: createLevel('info'),
  warn: createLevel('warn'),
  error: createLevel('error'),
  /**
   * CloudFormation stack events.
   */
  event: createLevel('event'),
  /**
   * CloudFormation stack outputs.
   */
  output: createLevel('output'),
};
