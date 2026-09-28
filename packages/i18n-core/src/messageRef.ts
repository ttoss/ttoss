import type { MessageDescriptor } from '@formatjs/intl';

import { type FormatValue, isFormatValue } from './fmt';

/**
 * The source text of a message: a string, or the pre-parsed ICU AST that
 * `@ttoss/config`'s formatjs plugin emits (`ast: true`). Both are JSON-safe.
 */
export type DefaultMessage = NonNullable<MessageDescriptor['defaultMessage']>;

/**
 * A value interpolated into a message reference. Only JSON-safe shapes are
 * allowed, so a reference can be stored, queued or sent over the wire and
 * rendered later, by whoever knows the reader's locale.
 */
export type MessageValue =
  string | number | boolean | null | MessageRef | FormatValue;

/**
 * A serializable pointer to a message plus its values. Code that produces
 * text returns one of these and needs no locale; the edge that knows the
 * reader renders it with `createI18n().render`.
 */
export type MessageRef = {
  id: string;
  /**
   * Carried so a reference always renders, even when the catalog it is read
   * against no longer has its id.
   */
  defaultMessage: DefaultMessage;
  values?: Record<string, MessageValue>;
};

/**
 * Create a message reference from a descriptor declared with
 * `defineMessages`.
 *
 * @throws {TypeError} when the descriptor has no `id` or no `defaultMessage`
 * — a reference that cannot be looked up, or cannot fall back, would render as
 * an empty string far from where it was created.
 */
export const msg = (
  descriptor: MessageDescriptor,
  values?: Record<string, MessageValue>
): MessageRef => {
  if (typeof descriptor.id !== 'string' || descriptor.id === '') {
    throw new TypeError(
      'msg() received a descriptor without an id. Declare it with defineMessages and build with the formatjs plugin (@ttoss/config does), or give it an explicit id.'
    );
  }

  if (descriptor.defaultMessage === undefined) {
    throw new TypeError(
      `msg() received descriptor "${descriptor.id}" without a defaultMessage.`
    );
  }

  const ref: MessageRef = {
    id: descriptor.id,
    defaultMessage: descriptor.defaultMessage,
  };

  if (values !== undefined) {
    ref.values = values;
  }

  return ref;
};

/**
 * Structural check, so a reference that went through `JSON.stringify` /
 * `JSON.parse` (a database row, a queue message) is still recognized.
 */
export const isMessageRef = (value: unknown): value is MessageRef => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  if (isFormatValue(value)) {
    return false;
  }

  const candidate = value as Partial<MessageRef>;

  return (
    typeof candidate.id === 'string' &&
    (typeof candidate.defaultMessage === 'string' ||
      Array.isArray(candidate.defaultMessage))
  );
};
