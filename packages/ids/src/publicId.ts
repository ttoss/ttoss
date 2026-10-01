/**
 * Crockford base32, lowercase. `i`, `l`, `o` and `u` are absent: the first
 * three are the characters a reader — or a model copying an id from one tool
 * call into the next — confuses with `1` and `0`, and `u` is dropped so the
 * alphabet cannot spell an accidental obscenity.
 */
export const PUBLIC_ID_ALPHABET = '0123456789abcdefghjkmnpqrstvwxyz';

/**
 * Ten characters, so fifty bits: the first expected collision is around thirty
 * million ids per prefix, far past the point where the unique index that
 * actually guarantees uniqueness would be the answer anyway.
 */
export const DEFAULT_PUBLIC_ID_LENGTH = 10;

/** The character class {@link PUBLIC_ID_ALPHABET} spells, for a regex. */
const ALPHABET_CLASS = '[0-9a-hjkmnp-tv-z]';

// A prefix is interpolated into a regular expression, so it is held to a shape
// that has no metacharacter in it rather than escaped.
const PREFIX_SHAPE = /^[a-z][a-z0-9]*$/;

export type PublicIdOptions = {
  /** The type prefix, e.g. `task` in `task_x7kp2mq4vb`. Lowercase letters and digits. */
  prefix: string;
  /**
   * How many random characters follow the prefix.
   * @default DEFAULT_PUBLIC_ID_LENGTH
   */
  length?: number;
};

const validate = ({
  prefix,
  length = DEFAULT_PUBLIC_ID_LENGTH,
}: PublicIdOptions) => {
  if (!PREFIX_SHAPE.test(prefix)) {
    throw new TypeError(
      `@ttoss/ids: invalid public id prefix '${prefix}'; it must be lowercase letters and digits, starting with a letter.`
    );
  }

  if (!Number.isInteger(length) || length < 1) {
    throw new TypeError(
      `@ttoss/ids: invalid public id length ${length}; it must be a positive integer.`
    );
  }

  return { prefix, length };
};

/**
 * Creates a prefixed, random public id — `task_x7kp2mq4vb`.
 *
 * Meant to be assigned by the server, never chosen by a caller, and stored
 * beside an internal primary key rather than as one: the key rows join on can
 * then change without any id the outside world holds changing.
 */
export const createPublicId = (options: PublicIdOptions): string => {
  const { prefix, length } = validate(options);

  // `getRandomValues` rather than `Math.random`: a guessable id is a record
  // somebody can try for. A plain `% 32` is unbiased only because 256 is a
  // multiple of 32 — the same line over another alphabet size would skew.
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(length));

  let suffix = '';

  for (const byte of bytes) {
    suffix += PUBLIC_ID_ALPHABET[byte % PUBLIC_ID_ALPHABET.length];
  }

  return `${prefix}_${suffix}`;
};

/**
 * A regular expression matching one prefix's ids and nothing else, for a
 * validator at the API boundary.
 */
export const publicIdPattern = (options: PublicIdOptions): RegExp => {
  const { prefix, length } = validate(options);

  return new RegExp(`^${prefix}_${ALPHABET_CLASS}{${length}}$`);
};

/** Whether `value` is an id with this prefix. */
export const isPublicId = ({
  value,
  ...options
}: PublicIdOptions & { value: string }): boolean => {
  return publicIdPattern(options).test(value);
};
