import { decode, encode } from 'src/index';

test('should encode and decode correctly', () => {
  const data = {
    id: '123',
    email: 'email@email.com',
  };
  const encoded = encode(data);
  const decoded = decode(encoded);
  expect(decoded).toEqual(data);
});
