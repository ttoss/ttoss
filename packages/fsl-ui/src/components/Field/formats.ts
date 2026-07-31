/**
 * Field format registry — named, locale-scoped format data (forms item H,
 * ADR-026).
 *
 * The `Icon`-intent pattern applied to input formats: a format is named by
 * **what it is** (`{locale}.{format}`), never by how it is rendered, and the
 * registry grows by one entry when a real consumer needs one — never
 * speculatively, never as a `type` prop explosion on `TextField`.
 *
 * A format resolves everything a formatted field needs declared together:
 * the mask (display shape), `inputMode` (the keyboard a phone raises) and
 * `autoComplete` (what the browser may fill). Declaring them separately at
 * every call site is how they drift apart — a CEP field with the right mask
 * and the wrong keyboard is half a format.
 *
 * ## What a format deliberately does NOT resolve
 *
 * - **Validation.** A `validate` function returns the *message the user
 *   reads*, and this package ships no user-facing copy in any language
 *   (ADR-001) — so a format cannot ship its checksum (CPF/CNPJ have one)
 *   without shipping untranslated copy with it. Callers own `validate`,
 *   with their own localized message.
 * - **Currency.** Not a mask at all: grouping separators move as digits are
 *   typed (`R$ 1.234` → `R$ 12.345`), which is Intl's job, not a fixed
 *   pattern's. `NumberField` already owns it:
 *   `formatOptions={{ style: 'currency', currency: 'BRL' }}`.
 *
 * ## The mask engine
 *
 * A pattern string where `0` is a digit slot and every other character is a
 * literal. Formats whose shape depends on length (BR phone: 10 digits for a
 * landline, 11 for mobile) list patterns short-to-long and the engine picks
 * the first that fits. Non-digits are stripped before masking, so paste
 * accepts any punctuation.
 */

/** The formats currently backed by data, named `{locale}.{format}`. */
export const FIELD_FORMATS = [
  'br.cep',
  'br.cpf',
  'br.cnpj',
  'br.phone',
] as const;

/** A registered field format — the public "name" of an input shape. */
export type FieldFormat = (typeof FIELD_FORMATS)[number];

interface FieldFormatData {
  /**
   * Mask patterns, short-to-long. `0` marks a digit slot; every other
   * character is a literal the engine inserts. The engine picks the first
   * pattern whose slot count fits the typed digits and never accepts more
   * digits than the longest pattern holds.
   */
  masks: readonly string[];
  /** The keyboard a touch device raises. */
  inputMode: 'numeric' | 'tel';
  /** WHATWG autofill token, where one exists for the format. */
  autoComplete?: string;
}

const FORMAT_DATA: Record<FieldFormat, FieldFormatData> = {
  'br.cep': {
    masks: ['00000-000'],
    inputMode: 'numeric',
    autoComplete: 'postal-code',
  },
  'br.cpf': {
    masks: ['000.000.000-00'],
    inputMode: 'numeric',
  },
  'br.cnpj': {
    masks: ['00.000.000/0000-00'],
    inputMode: 'numeric',
  },
  'br.phone': {
    // Landline (10 digits) and mobile (11) — the engine switches as the
    // eleventh digit arrives.
    masks: ['(00) 0000-0000', '(00) 00000-0000'],
    inputMode: 'tel',
    autoComplete: 'tel-national',
  },
};

const digitCount = (pattern: string): number => {
  return pattern.split('').filter((char) => {
    return char === '0';
  }).length;
};

/** Strip everything but digits — what a mask actually stores. */
export const formatDigits = (value: string): string => {
  return value.replace(/\D/g, '');
};

/**
 * Apply a format's mask to a raw value. Non-digits are stripped first, the
 * shortest pattern that fits is used, and digits past the longest pattern
 * are dropped.
 */
export const applyFieldFormat = (
  format: FieldFormat,
  value: string
): string => {
  const { masks } = FORMAT_DATA[format];
  let digits = formatDigits(value);

  const pattern =
    masks.find((candidate) => {
      return digitCount(candidate) >= digits.length;
    }) ?? masks[masks.length - 1];
  digits = digits.slice(0, digitCount(pattern));

  let out = '';
  let index = 0;
  for (const char of pattern) {
    if (index >= digits.length) break;
    if (char === '0') {
      out += digits[index];
      index += 1;
    } else {
      out += char;
    }
  }
  return out;
};

/** The control attributes a format resolves alongside its mask. */
export const fieldFormatInputProps = (
  format: FieldFormat
): { inputMode: 'numeric' | 'tel'; autoComplete?: string } => {
  const { inputMode, autoComplete } = FORMAT_DATA[format];
  return { inputMode, autoComplete };
};

/**
 * The caret position after a reformat: count the digits at or before the
 * caret in the raw string, then sit after that many digits in the masked one.
 * Counting digits rather than characters is what keeps the caret stable when
 * the mask inserts a literal to the left of it.
 */
export const fieldFormatCaret = ({
  masked,
  raw,
  rawCaret,
}: {
  masked: string;
  raw: string;
  rawCaret: number;
}): number => {
  const digitsBefore = formatDigits(raw.slice(0, rawCaret)).length;
  if (digitsBefore === 0) return 0;

  let seen = 0;
  for (let index = 0; index < masked.length; index += 1) {
    if (/\d/.test(masked[index])) {
      seen += 1;
      if (seen === digitsBefore) return index + 1;
    }
  }
  return masked.length;
};

/**
 * The next masked value for an input event. One deliberate rule beyond
 * stripping and masking: **backspacing over a literal deletes the digit
 * before it**. Without this, deleting the `-` in `12345-6` re-inserts it on
 * the next mask pass and the field is stuck — the classic masked-input trap.
 * A deletion is recognised as the raw value shrinking while its digits stay
 * identical to the previous value's.
 */
export const nextFieldFormatValue = ({
  format,
  raw,
  rawCaret,
  previous,
}: {
  format: FieldFormat;
  raw: string;
  rawCaret: number;
  previous: string;
}): { value: string; caret: number } => {
  let digits = formatDigits(raw);
  let caretDigits = formatDigits(raw.slice(0, rawCaret)).length;

  const isLiteralOnlyDeletion =
    raw.length < previous.length && digits === formatDigits(previous);
  if (isLiteralOnlyDeletion && caretDigits > 0) {
    digits = digits.slice(0, caretDigits - 1) + digits.slice(caretDigits);
    caretDigits -= 1;
  }

  const value = applyFieldFormat(format, digits);
  const caret = fieldFormatCaret({
    masked: value,
    raw: digits.slice(0, caretDigits),
    rawCaret: caretDigits,
  });
  return { value, caret };
};
