import {
  generateWebhookSecret,
  signWebhookPayload,
  verifyWebhookSignature,
} from 'src/webhookSignature';

const payload = JSON.stringify({ event: 'user.created', id: 'user_123' });

test('it should sign and verify a payload', () => {
  const secret = generateWebhookSecret();
  const signature = signWebhookPayload({ payload, secret });

  expect(signature.startsWith('sha256=')).toBe(true);
  expect(verifyWebhookSignature({ payload, secret, signature })).toBe(true);
});

test('it should accept a signature without the sha256= prefix', () => {
  const secret = generateWebhookSecret();
  const signature = signWebhookPayload({ payload, secret }).slice(
    'sha256='.length
  );
  expect(verifyWebhookSignature({ payload, secret, signature })).toBe(true);
});

test('it should reject a signature from another secret', () => {
  const signature = signWebhookPayload({
    payload,
    secret: generateWebhookSecret(),
  });
  expect(
    verifyWebhookSignature({
      payload,
      secret: generateWebhookSecret(),
      signature,
    })
  ).toBe(false);
});

test('it should reject a tampered payload', () => {
  const secret = generateWebhookSecret();
  const signature = signWebhookPayload({ payload, secret });
  expect(
    verifyWebhookSignature({ payload: `${payload} `, secret, signature })
  ).toBe(false);
});

test('it should reject malformed signatures', () => {
  const secret = generateWebhookSecret();
  expect(
    verifyWebhookSignature({ payload, secret, signature: 'sha256=abc' })
  ).toBe(false);
});
