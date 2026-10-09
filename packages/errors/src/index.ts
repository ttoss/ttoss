/**
 * Structurally identical to `@ttoss/i18n-core`'s `MessageRef`, declared here so
 * this package keeps zero runtime dependencies. `isLocalizedError` matches by
 * shape, so an `ExpectedError` carrying a `code` and a `messageRef` renders
 * through the i18n boundaries with no glue.
 *
 * `defaultMessage` is wider than i18n-core's, whose FormatJS AST element type
 * this package cannot name without depending on FormatJS.
 */
export type MessageRef = {
  id: string;
  defaultMessage: string | readonly unknown[];
  values?: Record<string, unknown>;
};

/**
 * A value an expected error carries for whoever renders its message. JSON-safe,
 * so the error can cross a process or wire boundary intact, and a
 * {@link MessageRef} so a value can point at copy its owner already defines.
 */
export type ExpectedErrorValue =
  | string
  | number
  | boolean
  | null
  | MessageRef
  | ExpectedErrorValue[]
  | { [key: string]: ExpectedErrorValue };

export type ExpectedErrorValues = Record<string, ExpectedErrorValue>;

export type ExpectedErrorOptions<
  TCode extends string | undefined = string | undefined,
  TValues extends ExpectedErrorValues | undefined =
    ExpectedErrorValues | undefined,
> = {
  /**
   * Stable identifier clients branch on. Never rename one once published —
   * change the copy instead.
   */
  code?: TCode;
  /**
   * The data the message is about — a limit, an id, the fields that failed —
   * kept apart from any sentence, so the code that owns the copy builds the
   * `messageRef` from `code` and `values` in the reader's locale.
   */
  values?: TValues;
  /** Localized message a boundary renders in the request locale. */
  messageRef?: MessageRef;
  cause?: unknown;
};

/**
 * What {@link isExpectedError} recognizes. An error that is expected only in
 * some cases — e.g. a third-party error class that is expected for one error
 * code and a fault for another — can satisfy this by setting `expected = true`
 * on itself, without extending {@link ExpectedError}.
 */
export type ExpectedErrorLike = Error & {
  readonly expected: true;
  readonly code?: string;
  readonly values?: ExpectedErrorValues;
  messageRef?: MessageRef;
};

/**
 * Base class for **expected** errors: outcomes an operation anticipates and
 * handles — invalid input, a missing resource, a degraded state the caller
 * already reacted to. They still reach the caller, so the message is shown;
 * they are just not faults, and an error tracker must not open an issue for
 * them. Bugs, infrastructure failures and unexpected third-party errors stay a
 * plain `Error`.
 *
 * Extend it to add your own kinds:
 *
 * ```ts
 * class PaymentDeclinedError extends ExpectedError {}
 * ```
 *
 * `name` defaults to the subclass's constructor name. A minifier that renames
 * classes changes it too, so a subclass whose name is matched downstream (an
 * error type a client branches on) pins it with `override name = '…'`.
 */
export class ExpectedError<
  TCode extends string | undefined = string | undefined,
  TValues extends ExpectedErrorValues | undefined =
    ExpectedErrorValues | undefined,
>
  extends Error
  implements ExpectedErrorLike
{
  /**
   * The discriminant {@link isExpectedError} reads. A marker rather than
   * `instanceof` because a bundler may inline its own copy of this class, and
   * an error thrown from that copy is not an instance of yours.
   */
  readonly expected = true as const;

  /**
   * A subclass narrows it through the type parameter, e.g.
   * `extends ExpectedError<'CARD_DECLINED' | 'CARD_EXPIRED'>`.
   */
  readonly code: TCode;

  /**
   * A subclass narrows it per code through the type parameter, so the
   * placeholders its copy interpolates are a checked contract.
   */
  readonly values: TValues;

  /** Mutable: a boundary may attach it before rendering. */
  messageRef?: MessageRef;

  constructor(
    message: string,
    options: ExpectedErrorOptions<TCode, TValues> = {}
  ) {
    super(message, 'cause' in options ? { cause: options.cause } : undefined);
    this.name = new.target.name;
    this.code = options.code as TCode;
    this.values = options.values as TValues;
    if (options.messageRef !== undefined) {
      this.messageRef = options.messageRef;
    }
  }
}

/** The caller supplied invalid input. */
export class ValidationError<
  TCode extends string | undefined = string | undefined,
  TValues extends ExpectedErrorValues | undefined =
    ExpectedErrorValues | undefined,
> extends ExpectedError<TCode, TValues> {}

/**
 * A referenced resource is missing, or the caller may not access it. Use it
 * for both so a response never reveals whether a resource the caller cannot
 * see exists.
 */
export class NotFoundError<
  TCode extends string | undefined = string | undefined,
  TValues extends ExpectedErrorValues | undefined =
    ExpectedErrorValues | undefined,
> extends ExpectedError<TCode, TValues> {}

/**
 * Whether `error` is expected — handled, and to be kept out of error tracking.
 * Matched by the `expected` marker, so it holds across bundle boundaries and
 * for errors that opt in without extending {@link ExpectedError}.
 */
export const isExpectedError = (error: unknown): error is ExpectedErrorLike => {
  return (
    error instanceof Error &&
    (error as { expected?: unknown }).expected === true
  );
};
