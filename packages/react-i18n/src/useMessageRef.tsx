import {
  type IntlFormatters,
  type MessageRef,
  renderMessageRef,
} from '@ttoss/i18n-core';
import * as React from 'react';
import { useIntl } from 'react-intl';

/**
 * Returns a function that renders a message reference — one produced on the
 * backend with `@ttoss/i18n-core`'s `msg()` and sent over the wire — as plain
 * text in the current locale. A plain string is returned unchanged.
 */
export const useMessageRef = () => {
  const intl = useIntl();

  return React.useCallback(
    (ref: MessageRef | string) => {
      return renderMessageRef({
        intl: intl as unknown as IntlFormatters,
        ref,
        mode: 'text',
      });
    },
    [intl]
  );
};

export type LocalizedTextProps = {
  /** The message reference to render, or a plain string. */
  value: MessageRef | string;
};

/**
 * Renders a message reference from the backend — a notification, a blocker,
 * an error — in the current locale, formatting its deferred values
 * (`fmt.currency`, `fmt.date`, …) with the reader's conventions.
 */
export const LocalizedText = ({ value }: LocalizedTextProps) => {
  const render = useMessageRef();
  return <>{render(value)}</>;
};
