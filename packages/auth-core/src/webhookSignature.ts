import crypto from 'node:crypto';

/**
 * HMAC-SHA256 webhook payload signing, following the common
 * `sha256=<hex>` signature header convention (e.g., GitHub's
 * `X-Hub-Signature-256`).
 *
 * The sender signs the serialized payload with a per-endpoint secret and
 * sends the signature in a header; the receiver recomputes it and compares
 * in constant time.
 */

const SIGNATURE_PREFIX = 'sha256=';

/**
 * Generates a random secret for a webhook endpoint, hex encoded.
 */
export const generateWebhookSecret = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Signs a serialized payload, returning a `sha256=<hex>` signature to send
 * in a header alongside the request.
 */
export const signWebhookPayload = (args: {
  payload: string;
  secret: string;
}): string => {
  const hex = crypto
    .createHmac('sha256', args.secret)
    .update(args.payload)
    .digest('hex');
  return `${SIGNATURE_PREFIX}${hex}`;
};

/**
 * Constant-time verification of a received webhook signature. Accepts the
 * signature with or without the `sha256=` prefix.
 */
export const verifyWebhookSignature = (args: {
  payload: string;
  secret: string;
  signature: string;
}): boolean => {
  const expected = signWebhookPayload({
    payload: args.payload,
    secret: args.secret,
  });
  const received = args.signature.startsWith(SIGNATURE_PREFIX)
    ? args.signature
    : `${SIGNATURE_PREFIX}${args.signature}`;
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(a, b);
};
