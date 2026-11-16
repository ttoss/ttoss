import { normalizeEmail } from './address';

/**
 * Why an address no longer receives marketing:
 *
 * - `manual`: the sender opted the contact out (a checkbox in a CRM). The only
 *   reason the sender may undo.
 * - `unsubscribe`: the recipient clicked the unsubscribe link.
 * - `complaint`: the recipient marked an e-mail as spam.
 * - `bounce`: the address does not exist (a permanent bounce).
 *
 * The recipient's own reasons are permanent: nobody but them can take them
 * back.
 */
export type SuppressionReason =
  'manual' | 'unsubscribe' | 'complaint' | 'bounce';

/**
 * One suppressed address. `scope` is the sender it applies to (a company, a
 * tenant); `null` means every sender, which is how a permanent bounce is kept.
 */
export type Suppression = {
  email: string;
  scope: string | null;
  reason: SuppressionReason;
  detail?: string | null;
};

/**
 * Where suppressions live. The engine has no database: implement this over
 * yours. Addresses arrive already normalized (`normalizeEmail`).
 */
export type SuppressionStore = {
  /** Every suppression of `email` whose scope is one of `scopes` (`null` included when listed). */
  find: (args: {
    email: string;
    scopes: Array<string | null>;
  }) => Promise<Suppression[]>;
  /** Inserts, or replaces the one with the same `email` and `scope`. */
  save: (suppression: Suppression) => Promise<void>;
  /** Removes the `manual` suppression of `email` in `scope`, if there is one. */
  removeManual: (args: { email: string; scope: string }) => Promise<void>;
};

const RANK: Record<SuppressionReason, number> = {
  manual: 0,
  unsubscribe: 1,
  complaint: 2,
  bounce: 3,
};

/** The reason to keep when an address is suppressed again: the stronger one. */
export const strongerReason = (
  a: SuppressionReason,
  b: SuppressionReason
): SuppressionReason => {
  return RANK[b] > RANK[a] ? b : a;
};

const strongest = (rows: Suppression[]): Suppression | null => {
  return rows.reduce<Suppression | null>((best, row) => {
    return !best || RANK[row.reason] > RANK[best.reason] ? row : best;
  }, null);
};

/** Thrown by `resubscribe` when the opt-out is not the sender's to undo. */
export class ResubscribeRefusedError extends Error {
  readonly reason: Exclude<SuppressionReason, 'manual'>;

  constructor(reason: Exclude<SuppressionReason, 'manual'>) {
    super(
      reason === 'bounce'
        ? 'The address does not exist (it bounced); fix the address to send again.'
        : 'The recipient opted out themselves; only they can take it back.'
    );
    this.name = 'ResubscribeRefusedError';
    this.reason = reason;
  }
}

export type SuppressionListOptions = {
  store: SuppressionStore;
  /** Called after an address is suppressed or its reason gets stronger, e.g. to flag the contact in your CRM. */
  onSuppress?: (suppression: Suppression) => Promise<void> | void;
  /** Called after a `manual` opt-out is undone. */
  onResubscribe?: (args: {
    scope: string;
    email: string;
  }) => Promise<void> | void;
};

export type SuppressionList = ReturnType<typeof createSuppressionList>;

/**
 * The rules of the suppression list, over a store you provide.
 *
 * @example
 * ```ts
 * const suppressions = createSuppressionList({ store });
 * await suppressions.suppress({ scope: 'company-1', email, reason: 'manual' });
 * await suppressions.isSuppressed({ scope: 'company-1', email }); // true
 * await suppressions.resubscribe({ scope: 'company-1', email }); // allowed: it was manual
 * ```
 */
export const createSuppressionList = ({
  store,
  onSuppress,
  onResubscribe,
}: SuppressionListOptions) => {
  /** The suppression that decides for this sender: the recipient's own over the sender's checkbox. */
  const find = async ({
    scope,
    email,
  }: {
    scope: string;
    email: string;
  }): Promise<Suppression | null> => {
    const address = normalizeEmail(email);
    if (!address) {
      return null;
    }
    return strongest(
      await store.find({ email: address, scopes: [scope, null] })
    );
  };

  const isSuppressed = async (args: { scope: string; email: string }) => {
    return Boolean(await find(args));
  };

  /**
   * Stops marketing to the address for one sender, or for every sender with
   * `scope: null`. Suppressing again keeps the stronger reason. Returns
   * whether anything changed.
   */
  const suppress = async ({
    scope,
    email,
    reason,
    detail,
  }: {
    scope: string | null;
    email: string;
    reason: SuppressionReason;
    detail?: string | null;
  }): Promise<boolean> => {
    const address = normalizeEmail(email);
    if (!address) {
      return false;
    }
    const [existing] = await store.find({ email: address, scopes: [scope] });
    const next = existing ? strongerReason(existing.reason, reason) : reason;
    if (existing && next === existing.reason) {
      return false;
    }
    const suppression: Suppression = {
      email: address,
      scope,
      reason: next,
      detail: detail ?? null,
    };
    await store.save(suppression);
    await onSuppress?.(suppression);
    return true;
  };

  /** Throws `ResubscribeRefusedError` unless the address is free or only `manual`ly suppressed. */
  const assertCanResubscribe = async (args: {
    scope: string;
    email: string;
  }) => {
    const found = await find(args);
    if (found && found.reason !== 'manual') {
      throw new ResubscribeRefusedError(found.reason);
    }
  };

  /** Undoes the sender's own (`manual`) opt-out. Refused for any other reason. */
  const resubscribe = async ({
    scope,
    email,
  }: {
    scope: string;
    email: string;
  }) => {
    const address = normalizeEmail(email);
    if (!address) {
      return;
    }
    await assertCanResubscribe({ scope, email: address });
    await store.removeManual({ email: address, scope });
    await onResubscribe?.({ scope, email: address });
  };

  return { find, isSuppressed, suppress, assertCanResubscribe, resubscribe };
};
