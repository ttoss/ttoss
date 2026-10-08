import type { MessageDescriptor } from '@formatjs/intl';

// Declared here rather than re-exported from `@formatjs/intl`: its 6.x
// overloads put `TypedMessageDescriptor` in every inferred type, and a consumer
// without a direct `@formatjs/intl` dependency cannot name it in its emitted
// declarations (TS2883). The formatjs babel plugin and `ttoss-i18n` match these
// calls by name, so ids and extraction work as before.

/**
 * Declares a set of messages. Returns its argument unchanged; the formatjs
 * build plugin adds each message's `id`.
 */
export const defineMessages = <T extends Record<string, MessageDescriptor>>(
  messages: T
): T => {
  return messages;
};

/**
 * Declares one message. Returns its argument unchanged; the formatjs build
 * plugin adds its `id`.
 */
export const defineMessage = <T extends MessageDescriptor>(message: T): T => {
  return message;
};
