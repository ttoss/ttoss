/**
 * A value whose formatting is deferred to render time, so it is formatted in
 * the reader's locale rather than in whatever locale the producer ran in.
 *
 * The locale (who reads it) is independent of the currency and the time zone
 * (whose money, whose day), which is why those two travel with the value.
 */
export type FormatValue =
  | {
      $fmt: 'currency';
      value: number;
      currency: string;
      minimumFractionDigits?: number;
      maximumFractionDigits?: number;
    }
  | {
      $fmt: 'number';
      value: number;
      options?: NumberFormatOptions;
    }
  | {
      $fmt: 'percent';
      ratio: number;
      maximumFractionDigits?: number;
    }
  | ({
      $fmt: 'date';
      /** ISO 8601, so the value survives JSON. */
      value: string;
      timeZone?: string;
    } & DateFormatOptions)
  | {
      $fmt: 'relativeTime';
      /** ISO 8601, so the value survives JSON. */
      value: string;
    };

/**
 * How a date renders: a preset style, or the components to show (`day` and
 * `month` alone give a day/month date, `26/08` in pt-BR). Never both, because
 * `Intl.DateTimeFormat` rejects a style mixed with components; with neither,
 * `dateStyle: 'short'` applies.
 */
export type DateFormatOptions =
  | {
      dateStyle?: 'short' | 'medium' | 'long' | 'full';
      timeStyle?: 'short' | 'medium';
      day?: never;
      month?: never;
      year?: never;
    }
  | {
      day?: 'numeric' | '2-digit';
      month?: 'numeric' | '2-digit' | 'long' | 'short' | 'narrow';
      year?: 'numeric' | '2-digit';
      dateStyle?: never;
      timeStyle?: never;
    };

export const hasDateComponents = (options: {
  day?: string;
  month?: string;
  year?: string;
}) => {
  return (
    options.day !== undefined ||
    options.month !== undefined ||
    options.year !== undefined
  );
};

/**
 * The JSON-safe subset of `Intl.NumberFormatOptions`.
 */
export type NumberFormatOptions = {
  style?: 'decimal' | 'unit';
  unit?: string;
  unitDisplay?: 'long' | 'short' | 'narrow';
  notation?: 'standard' | 'compact';
  compactDisplay?: 'short' | 'long';
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  signDisplay?: 'auto' | 'always' | 'never' | 'exceptZero';
};

const FORMAT_KINDS: ReadonlyArray<FormatValue['$fmt']> = [
  'currency',
  'number',
  'percent',
  'date',
  'relativeTime',
];

const toIsoString = (value: string | Date) => {
  const date = typeof value === 'string' ? new Date(value) : value;

  if (Number.isNaN(date.getTime())) {
    throw new RangeError(`fmt received an invalid date: ${String(value)}`);
  }

  return date.toISOString();
};

/**
 * Deferred formatters. Each returns a JSON-safe `FormatValue` to pass as a
 * `msg()` value; nothing is formatted until the reference is rendered.
 */
export const fmt = {
  currency: (args: {
    value: number;
    currency: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }): FormatValue => {
    return { $fmt: 'currency', ...args, currency: args.currency.toUpperCase() };
  },
  number: (args: {
    value: number;
    options?: NumberFormatOptions;
  }): FormatValue => {
    return { $fmt: 'number', ...args };
  },
  percent: (args: {
    ratio: number;
    maximumFractionDigits?: number;
  }): FormatValue => {
    return { $fmt: 'percent', ...args };
  },
  date: (
    args: { value: string | Date; timeZone?: string } & DateFormatOptions
  ): FormatValue => {
    // The type already forbids the mix; this catches untyped callers here
    // rather than at render time, where @formatjs/intl reports Intl's error to
    // onError and renders the raw date string instead.
    if (
      hasDateComponents(args) &&
      (args.dateStyle !== undefined || args.timeStyle !== undefined)
    ) {
      throw new TypeError(
        'fmt.date takes dateStyle/timeStyle or day/month/year, not both: Intl.DateTimeFormat rejects the mix.'
      );
    }

    return { $fmt: 'date', ...args, value: toIsoString(args.value) };
  },
  relativeTime: (args: { value: string | Date }): FormatValue => {
    return { $fmt: 'relativeTime', value: toIsoString(args.value) };
  },
};

export const isFormatValue = (value: unknown): value is FormatValue => {
  return (
    typeof value === 'object' &&
    value !== null &&
    FORMAT_KINDS.includes((value as { $fmt?: FormatValue['$fmt'] }).$fmt!)
  );
};
