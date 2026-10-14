import type { MessageDescriptor } from 'react-intl';

/**
 * Defines a message for extraction, keeping react-intl 10's typing.
 *
 * react-intl 12 types a descriptor defined without an explicit values generic
 * as one that takes no values, so every
 * `intl.formatMessage(message, { name })` stops compiling. This keeps the
 * descriptor untyped: `formatMessage` and `FormattedMessage` accept any values,
 * as they did before. At runtime both functions return their argument, which is
 * all react-intl's do.
 */
export const defineMessage = <T extends MessageDescriptor>(
  message: T
): Readonly<T> => {
  return message;
};

/**
 * Defines messages for extraction, keeping react-intl 10's typing. See
 * {@link defineMessage}.
 */
export const defineMessages = <
  K extends PropertyKey,
  T = MessageDescriptor,
  U extends Record<K, T> = Record<K, T>,
>(
  messages: U
): { readonly [P in keyof U]: Readonly<U[P]> } => {
  return messages;
};
