import { comparePassword, hashPassword } from 'src/hash';

test('it should hash and compare password', async () => {
  const plainPassword = 'password12345678';
  const hash = await hashPassword(plainPassword);
  const isMatch = await comparePassword(plainPassword, hash);
  expect(isMatch).toBe(true);
  expect(hash).not.toBe(plainPassword);
});

test('it should not match different passwords', async () => {
  const plainPassword = 'password123';
  const hash = await hashPassword(plainPassword);
  const isMatch = await comparePassword('wrongPassword', hash);
  expect(isMatch).toBe(false);
});

test('should match known hash', async () => {
  const knownHash =
    'b8296cd24c275e87525626c90eceeab7:2b1ababeac3e34cc5f9bdb97d17007cfb783ce12fbd0148875ddcdeffd74d88b2dd167050e8f528683e0d73ea63e16ea90a1155503ea5956de7769b2c5d223fa';
  const plainPassword = 'password12345678';
  const isMatch = await comparePassword(plainPassword, knownHash);
  expect(isMatch).toBe(true);
});
