import type { MessageDescriptor } from '@ttoss/react-i18n';
import { useI18n } from '@ttoss/react-i18n';
import * as React from 'react';
import * as z from 'zod';
import { en, es, pt } from 'zod/locales';

import { validationMessages } from '../i18n/messages';

export type FormatMessage = (
  descriptor: MessageDescriptor,
  values?: Record<string, string | number>
) => string;

type TtossMessageKey = 'invalidCpf' | 'invalidCnpj' | 'passwordMinLength';

/**
 * Marks a refinement whose message the ttoss catalog renders:
 * `refine(check, ttossIssue('invalidCpf'))`.
 */
export const ttossIssue = (
  key: TtossMessageKey,
  values?: Record<string, string | number>
) => {
  return { params: { ttoss: key, values } };
};

type Issue = Parameters<NonNullable<z.core.$ZodConfig['customError']>>[0];

const renderTtossIssue = ({
  issue,
  formatMessage,
}: {
  issue: Issue;
  formatMessage: FormatMessage;
}) => {
  const params = (issue as { params?: { ttoss?: string; values?: never } })
    .params;
  const descriptor =
    params?.ttoss && params.ttoss in validationMessages
      ? validationMessages[params.ttoss as TtossMessageKey]
      : undefined;
  return descriptor ? formatMessage(descriptor, params?.values) : undefined;
};

/**
 * The messages ttoss owns, rendered from its catalog. Everything else returns
 * `undefined`, which hands the issue to Zod's own locale.
 */
export const createZodErrorMap = ({
  formatMessage,
}: {
  formatMessage: FormatMessage;
}) => {
  return (issue: Issue) => {
    if (issue.code === 'custom') {
      return renderTtossIssue({ issue, formatMessage });
    }

    if (issue.code === 'invalid_type' && issue.input === undefined) {
      return formatMessage(validationMessages.required);
    }

    if (issue.code === 'too_small' && issue.origin === 'string') {
      return Number(issue.minimum) <= 1
        ? formatMessage(validationMessages.required)
        : formatMessage(validationMessages.minLength, {
            min: Number(issue.minimum),
          });
    }

    return undefined;
  };
};

type MessageNode = { type: number; value: string };

/**
 * Renders a descriptor's `defaultMessage` with no catalog, for Zod used
 * outside any `I18nProvider`. It is a string in source and an AST once the
 * build or Jest preset compiled it; ttoss's validation messages only use
 * literals and plain arguments, which is all this handles.
 */
export const formatDefaultMessage: FormatMessage = (
  descriptor,
  values = {}
) => {
  const message = descriptor.defaultMessage as string | MessageNode[];

  if (typeof message === 'string') {
    return message.replace(/\{(\w+)\}/g, (_, name: string) => {
      return String(values[name] ?? `{${name}}`);
    });
  }

  return message
    .map((node) => {
      return node.type === 0 ? node.value : String(values[node.value] ?? '');
    })
    .join('');
};

/**
 * Keeps the ttoss refinements' English messages when nothing configured Zod
 * for a locale, without touching any other Zod message.
 */
export const installZodFallbackErrorMap = () => {
  if (z.config().customError) {
    return;
  }

  z.config({
    customError: (issue) => {
      return issue.code === 'custom'
        ? renderTtossIssue({ issue, formatMessage: formatDefaultMessage })
        : undefined;
    },
  });
};

// Zod's own translations for every message ttoss does not own. A language
// without one here falls back to English.
const ZOD_LOCALES = { en, es, pt };

/**
 * Configures Zod's global error messages for `locale`. `Form` calls it
 * through `useZodI18n`; call it yourself outside a `Form`.
 */
export const configureZodI18n = ({
  locale,
  formatMessage,
}: {
  locale: string;
  formatMessage: FormatMessage;
}) => {
  const language = locale.split('-')[0] as keyof typeof ZOD_LOCALES;
  const zodLocale = (ZOD_LOCALES[language] ?? en)();
  z.config({
    ...zodLocale,
    customError: createZodErrorMap({ formatMessage }),
  });
};

// `Form` has always mounted without an `I18nProvider` (only rendering an
// error message needs one), so a missing provider leaves Zod unconfigured
// instead of throwing. Whether a provider exists never changes between renders
// of one component, so the hook order inside `useI18n` is stable.
const useOptionalIntl = () => {
  try {
    return useI18n().intl;
  } catch {
    return undefined;
  }
};

/**
 * Keeps Zod's error messages in the current `I18nProvider` locale.
 */
export const useZodI18n = () => {
  const intl = useOptionalIntl();

  React.useEffect(() => {
    if (!intl) {
      return;
    }
    configureZodI18n({
      locale: intl.locale,
      formatMessage: intl.formatMessage as FormatMessage,
    });
  }, [intl]);
};
