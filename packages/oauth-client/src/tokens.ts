import type { TokenRecord } from './types';

/** Default scheduled-refresh window: 6 hours. */
export const DEFAULT_EXPIRING_WINDOW_MS = 6 * 60 * 60 * 1000;

/** Options for {@link findExpiringTokens}. */
export interface FindExpiringTokensOptions {
  /** Include records expiring within this window from now. Default: 6h. */
  windowMs?: number;
}

/**
 * Filter a list of token records down to those that expire within `windowMs`
 * from now (default 6 hours). Intended for a scheduled job that proactively
 * refreshes tokens before they lapse, keeping connections alive for inactive
 * users. Pure and provider-agnostic — it inspects only `accessTokenExpiresAt`.
 */
export const findExpiringTokens = <T extends TokenRecord>(
  records: T[],
  options?: FindExpiringTokensOptions
): T[] => {
  const windowMs = options?.windowMs ?? DEFAULT_EXPIRING_WINDOW_MS;
  const threshold = Date.now() + windowMs;
  return records.filter((record) => {
    return record.accessTokenExpiresAt.getTime() <= threshold;
  });
};
