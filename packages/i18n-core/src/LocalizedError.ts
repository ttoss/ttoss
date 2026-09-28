import { createI18n, type I18n } from './createI18n';
import { isMessageRef, type MessageRef } from './messageRef';

let sourceI18n: I18n | undefined;

/**
 * Renders a reference against no catalog, so `error.message` reads in the
 * source language for logs and for callers that know nothing of references.
 */
const renderSource = (ref: MessageRef) => {
  sourceI18n ??= createI18n({
    locale: 'en',
    messages: {},
    onError: () => {
      return undefined;
    },
  });
  return sourceI18n.render(ref);
};

/**
 * An error a reader should see in their own language. `code` is the stable
 * identifier for machines (clients branch on it; it does not change when the
 * copy does); `messageRef` is what a boundary renders in the request locale.
 */
export class LocalizedError extends Error {
  readonly code: string;

  readonly messageRef: MessageRef;

  constructor({
    code,
    message,
    cause,
  }: {
    code: string;
    message: MessageRef;
    cause?: unknown;
  }) {
    super(renderSource(message), cause === undefined ? undefined : { cause });
    this.name = 'LocalizedError';
    this.code = code;
    this.messageRef = message;
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      messageRef: this.messageRef,
    };
  }
}

/**
 * Structural, not `instanceof`: an error class in a package that must not
 * depend on this one (a zero-dependency errors package), or an error that
 * crossed a bundle boundary, is recognized by shape — a string `code` and a
 * `messageRef`.
 */
export const isLocalizedError = (
  error: unknown
): error is Error & { code: string; messageRef: MessageRef } => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const candidate = error as { code?: unknown; messageRef?: unknown };

  return (
    typeof candidate.code === 'string' && isMessageRef(candidate.messageRef)
  );
};
