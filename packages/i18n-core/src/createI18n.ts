import {
  createIntl,
  createIntlCache,
  type IntlShape,
  type OnErrorFn,
} from '@formatjs/intl';

import { type FormatValue, isFormatValue } from './fmt';
import { isMessageRef, type MessageRef, type MessageValue } from './messageRef';

export type Messages = NonNullable<
  Parameters<typeof createIntl>[0]['messages']
>;

/**
 * `en` because it is the source locale of every `@ttoss/*` package.
 */
export const DEFAULT_LOCALE = 'en';

/**
 * Rich-text tags a message may use. `renderHtml` keeps them, `render` drops
 * the markup and keeps the text. Tags cannot carry attributes in ICU, so there
 * is nothing unsafe to allow here; anything else still needs a caller that
 * formats with `intl.formatMessage` directly.
 */
const RICH_TEXT_TAGS = [
  'b',
  'strong',
  'i',
  'em',
  'u',
  's',
  'small',
  'code',
  'p',
  'ul',
  'ol',
  'li',
] as const;

const VOID_TAGS = ['br'] as const;

type Mode = 'text' | 'html';

const escapeHtml = (value: string) => {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const RELATIVE_TIME_UNITS: Array<{
  unit: Intl.RelativeTimeFormatUnit;
  seconds: number;
}> = [
  { unit: 'year', seconds: 365 * 24 * 60 * 60 },
  { unit: 'month', seconds: 30 * 24 * 60 * 60 },
  { unit: 'week', seconds: 7 * 24 * 60 * 60 },
  { unit: 'day', seconds: 24 * 60 * 60 },
  { unit: 'hour', seconds: 60 * 60 },
  { unit: 'minute', seconds: 60 },
  { unit: 'second', seconds: 1 },
];

const tagHandlers = (mode: Mode) => {
  const handlers: Record<string, (chunks: unknown[]) => string> = {};

  for (const tag of RICH_TEXT_TAGS) {
    handlers[tag] = (chunks) => {
      const inner = chunks.join('');
      return mode === 'html' ? `<${tag}>${inner}</${tag}>` : inner;
    };
  }

  for (const tag of VOID_TAGS) {
    handlers[tag] = () => {
      return mode === 'html' ? `<${tag}>` : '\n';
    };
  }

  return handlers;
};

export type I18n = IntlShape & {
  /**
   * Render a reference as plain text — WhatsApp, push, SMS, logs. A plain
   * string is returned unchanged, so rows written before references existed
   * still render.
   */
  render: (ref: MessageRef | string) => string;
  /**
   * Render a reference for an HTML body — email. Every interpolated value is
   * escaped; the message's own rich-text tags are kept. A plain string is
   * escaped.
   */
  renderHtml: (ref: MessageRef | string) => string;
  /**
   * Format a deferred value on its own, outside a message.
   */
  formatValue: (value: FormatValue) => string;
};

const formatValue = (intl: IntlShape, value: FormatValue): string => {
  switch (value.$fmt) {
    case 'currency':
      return intl.formatNumber(value.value, {
        style: 'currency',
        currency: value.currency,
        minimumFractionDigits: value.minimumFractionDigits,
        maximumFractionDigits: value.maximumFractionDigits,
      });
    case 'number':
      return intl.formatNumber(value.value, value.options);
    case 'percent':
      return intl.formatNumber(value.ratio, {
        style: 'percent',
        maximumFractionDigits: value.maximumFractionDigits,
      });
    case 'date':
      return intl.formatDate(value.value, {
        timeZone: value.timeZone,
        dateStyle: value.dateStyle ?? (value.timeStyle ? undefined : 'short'),
        timeStyle: value.timeStyle,
      });
    case 'relativeTime': {
      const diffSeconds = (new Date(value.value).getTime() - Date.now()) / 1000;
      const { unit, seconds } =
        RELATIVE_TIME_UNITS.find(({ seconds }) => {
          return Math.abs(diffSeconds) >= seconds;
        }) ?? RELATIVE_TIME_UNITS[RELATIVE_TIME_UNITS.length - 1];
      return intl.formatRelativeTime(Math.round(diffSeconds / seconds), unit, {
        numeric: 'auto',
      });
    }
  }
};

/**
 * A value as `formatMessage` takes it. Nested references are rendered — and,
 * in html mode, escaped — by the recursive call, so they are not escaped again.
 */
const resolveValue = ({
  intl,
  value,
  mode,
  render,
}: {
  intl: IntlShape;
  value: MessageValue;
  mode: Mode;
  render: (ref: MessageRef) => string;
}) => {
  if (isMessageRef(value)) {
    return render(value);
  }

  if (isFormatValue(value)) {
    const formatted = formatValue(intl, value);
    return mode === 'html' ? escapeHtml(formatted) : formatted;
  }

  if (typeof value === 'string') {
    return mode === 'html' ? escapeHtml(value) : value;
  }

  if (value === null) {
    return '';
  }

  // Numbers stay numbers so plural and number arguments keep working.
  return typeof value === 'boolean' ? String(value) : value;
};

const renderRef = ({
  intl,
  ref,
  mode,
}: {
  intl: IntlShape;
  ref: MessageRef | string;
  mode: Mode;
}): string => {
  if (typeof ref === 'string') {
    return mode === 'html' ? escapeHtml(ref) : ref;
  }

  const values: Record<string, unknown> = { ...tagHandlers(mode) };

  for (const [key, value] of Object.entries(ref.values ?? {})) {
    values[key] = resolveValue({
      intl,
      value,
      mode,
      render: (nested) => {
        return renderRef({ intl, ref: nested, mode });
      },
    });
  }

  // A variable, not an inline literal: the formatjs build plugin rejects
  // an inline descriptor it cannot statically evaluate.
  const descriptor = { id: ref.id, defaultMessage: ref.defaultMessage };

  const result: unknown = intl.formatMessage(
    descriptor,
    values as Parameters<IntlShape['formatMessage']>[1]
  );

  return Array.isArray(result) ? result.join('') : String(result);
};

export const createI18n = ({
  locale,
  messages,
  defaultLocale = DEFAULT_LOCALE,
  onError,
}: {
  locale: string;
  messages: Messages;
  /**
   * The locale `defaultMessage` is written in. An app authoring in pt-BR sets
   * `pt-BR`, or every untranslated message reports `MISSING_TRANSLATION` and
   * its fallback text is formatted with English rules.
   */
  defaultLocale?: string;
  onError?: OnErrorFn;
}): I18n => {
  const intl = createIntl(
    { locale, messages, defaultLocale, onError },
    createIntlCache()
  );

  return Object.assign(intl, {
    render: (ref: MessageRef | string) => {
      return renderRef({ intl, ref, mode: 'text' });
    },
    renderHtml: (ref: MessageRef | string) => {
      return renderRef({ intl, ref, mode: 'html' });
    },
    formatValue: (value: FormatValue) => {
      return formatValue(intl, value);
    },
  });
};
