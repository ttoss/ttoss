import {
  createIntl,
  createIntlCache,
  type IntlShape,
  type OnErrorFn,
} from '@formatjs/intl';

import {
  type FormatValue,
  hasDateComponents,
  isFormatValue,
  type ListItem,
} from './fmt';
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
  'div',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'li',
] as const;

const VOID_TAGS = ['br'] as const;

export type RenderMode = 'text' | 'html';

/**
 * The part of an `IntlShape` rendering needs — satisfied by `createI18n` and
 * by react-intl's `useIntl()` alike.
 */
export type IntlFormatters = Pick<
  IntlShape,
  | 'formatMessage'
  | 'formatNumber'
  | 'formatDate'
  | 'formatRelativeTime'
  | 'formatList'
>;

type Mode = RenderMode;

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
  /**
   * Whether a reference renders entirely in this instance's locale rather
   * than falling back to its `defaultMessage` — see `isMessageRefTranslated`.
   */
  isTranslated: (ref: MessageRef | string) => boolean;
};

type ListValue = Extract<FormatValue, { $fmt: 'list' }>;

const formatScalarValue = (
  intl: IntlFormatters,
  value: Exclude<FormatValue, ListValue>
): string => {
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
      // Intl rejects a style mixed with components, so the default style is
      // only injected when no component was asked for.
      return intl.formatDate(
        value.value,
        hasDateComponents(value)
          ? {
              timeZone: value.timeZone,
              day: value.day,
              month: value.month,
              year: value.year,
            }
          : {
              timeZone: value.timeZone,
              dateStyle:
                value.dateStyle ?? (value.timeStyle ? undefined : 'short'),
              timeStyle: value.timeStyle,
            }
      );
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
 * A list's items are rendered one by one — each escaped on its own in html
 * mode — and only then joined, so the locale's separators are never escaped
 * and a nested reference keeps its markup.
 */
const formatValue = ({
  intl,
  value,
  mode,
  render,
}: {
  intl: IntlFormatters;
  value: FormatValue;
  mode: Mode;
  render: (ref: MessageRef) => string;
}): string => {
  if (value.$fmt !== 'list') {
    const formatted = formatScalarValue(intl, value);
    return mode === 'html' ? escapeHtml(formatted) : formatted;
  }

  const items = value.items.map((item: ListItem) => {
    if (isMessageRef(item)) {
      return render(item);
    }

    if (isFormatValue(item)) {
      return formatValue({ intl, value: item, mode, render });
    }

    if (typeof item === 'number') {
      return intl.formatNumber(item);
    }

    return mode === 'html' ? escapeHtml(item) : item;
  });

  return intl.formatList(items, { type: value.type, style: value.style });
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
  intl: IntlFormatters;
  value: MessageValue;
  mode: Mode;
  render: (ref: MessageRef) => string;
}) => {
  if (isMessageRef(value)) {
    return render(value);
  }

  if (isFormatValue(value)) {
    return formatValue({ intl, value, mode, render });
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

/**
 * Render a reference with any FormatJS `IntlShape` — the one `createI18n`
 * builds, or react-intl's `useIntl()` — so every runtime renders references
 * identically. `text` drops rich-text markup; `html` keeps it and escapes
 * every interpolated value.
 */
export const renderMessageRef = ({
  intl,
  ref,
  mode,
}: {
  intl: IntlFormatters;
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
        return renderMessageRef({ intl, ref: nested, mode });
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

const sameLocale = (a: string, b: string) => {
  return a.toLowerCase() === b.toLowerCase();
};

/**
 * The references a value renders, a list's items included.
 */
const nestedRefs = (value: MessageValue): MessageRef[] => {
  if (isMessageRef(value)) {
    return [value];
  }

  if (isFormatValue(value) && value.$fmt === 'list') {
    return value.items.flatMap(nestedRefs);
  }

  return [];
};

/**
 * Whether a reference renders entirely in `intl.locale`: every message it
 * holds, nested references included, has an entry in `intl.messages`. In the
 * source locale (`intl.defaultLocale`) every reference is translated, since
 * its `defaultMessage` is already that language, and so is a plain string;
 * in any other locale a plain string is untranslated source text.
 *
 * `render` never says when it fell back, so this is how a caller records
 * which locale it actually served — a stored rendering, a wrong-locale alert.
 */
export const isMessageRefTranslated = ({
  intl,
  ref,
}: {
  intl: Pick<IntlShape, 'locale' | 'defaultLocale' | 'messages'>;
  ref: MessageRef | string;
}): boolean => {
  if (sameLocale(intl.locale, intl.defaultLocale)) {
    return true;
  }

  if (typeof ref === 'string') {
    return false;
  }

  if (!Object.prototype.hasOwnProperty.call(intl.messages, ref.id)) {
    return false;
  }

  return Object.values(ref.values ?? {})
    .flatMap(nestedRefs)
    .every((nested) => {
      return isMessageRefTranslated({ intl, ref: nested });
    });
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
  // An explicit `onError: undefined` replaces formatjs's default handler, and
  // a missing translation then throws `onError is not a function` instead of
  // falling back to `defaultMessage`.
  const intl = createIntl(
    { locale, messages, defaultLocale, ...(onError ? { onError } : {}) },
    createIntlCache()
  );

  return Object.assign(intl, {
    render: (ref: MessageRef | string) => {
      return renderMessageRef({ intl, ref, mode: 'text' });
    },
    renderHtml: (ref: MessageRef | string) => {
      return renderMessageRef({ intl, ref, mode: 'html' });
    },
    formatValue: (value: FormatValue) => {
      return formatValue({
        intl,
        value,
        mode: 'text',
        render: (ref) => {
          return renderMessageRef({ intl, ref, mode: 'text' });
        },
      });
    },
    isTranslated: (ref: MessageRef | string) => {
      return isMessageRefTranslated({ intl, ref });
    },
  });
};
