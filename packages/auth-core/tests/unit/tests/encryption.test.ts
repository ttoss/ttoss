import {
  decryptValue,
  encryptValue,
  generateEncryptionKey,
} from 'src/encryption';

test('it should encrypt and decrypt a value', () => {
  const key = generateEncryptionKey();
  const ciphertext = encryptValue({ plaintext: 'my secret value', key });

  expect(ciphertext).not.toContain('my secret value');
  expect(decryptValue({ ciphertext, key })).toBe('my secret value');
});

test('it should produce different ciphertexts for the same plaintext', () => {
  const key = generateEncryptionKey();
  const a = encryptValue({ plaintext: 'same', key });
  const b = encryptValue({ plaintext: 'same', key });
  expect(a).not.toBe(b);
});

test('it should throw when decrypting with a wrong key', () => {
  const ciphertext = encryptValue({
    plaintext: 'value',
    key: generateEncryptionKey(),
  });
  expect(() => {
    return decryptValue({ ciphertext, key: generateEncryptionKey() });
  }).toThrow();
});

test('it should throw when the ciphertext is tampered with', () => {
  const key = generateEncryptionKey();
  const buf = Buffer.from(encryptValue({ plaintext: 'value', key }), 'base64');
  buf[buf.length - 1] ^= 0xff;
  expect(() => {
    return decryptValue({ ciphertext: buf.toString('base64'), key });
  }).toThrow();
});

test('it should reject invalid keys', () => {
  expect(() => {
    return encryptValue({ plaintext: 'value', key: 'too-short' });
  }).toThrow('Encryption key must be a 64-character hex string (32 bytes)');
});
