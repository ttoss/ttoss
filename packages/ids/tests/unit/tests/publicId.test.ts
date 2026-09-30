import {
  createPublicId,
  DEFAULT_PUBLIC_ID_LENGTH,
  isPublicId,
  PUBLIC_ID_ALPHABET,
  publicIdPattern,
} from 'src/index';

test('creates an id with the prefix and the default length', () => {
  const id = createPublicId({ prefix: 'task' });

  expect(id).toMatch(/^task_[0-9a-z]{10}$/);
  expect(id.length).toBe('task_'.length + DEFAULT_PUBLIC_ID_LENGTH);
});

test('creates an id with a custom length', () => {
  expect(createPublicId({ prefix: 'ak', length: 16 })).toMatch(
    /^ak_[0-9a-z]{16}$/
  );
});

test('uses only the Crockford alphabet', () => {
  const suffixes = Array.from({ length: 200 }, () => {
    return createPublicId({ prefix: 'user' }).slice('user_'.length);
  }).join('');

  for (const character of suffixes) {
    expect(PUBLIC_ID_ALPHABET).toContain(character);
  }

  expect(suffixes).not.toMatch(/[ilou]/);
});

test('creates distinct ids', () => {
  const ids = new Set(
    Array.from({ length: 1000 }, () => {
      return createPublicId({ prefix: 'proj' });
    })
  );

  expect(ids.size).toBe(1000);
});

test('the alphabet has 32 distinct characters, so byte % 32 is unbiased', () => {
  expect(new Set(PUBLIC_ID_ALPHABET).size).toBe(32);
  expect(256 % PUBLIC_ID_ALPHABET.length).toBe(0);
});

test('the pattern matches its own prefix and nothing else', () => {
  const pattern = publicIdPattern({ prefix: 'task' });

  expect(pattern.test(createPublicId({ prefix: 'task' }))).toBe(true);
  expect(pattern.test(createPublicId({ prefix: 'proj' }))).toBe(false);
  expect(pattern.test('task_x7kp2mq4v')).toBe(false);
  expect(pattern.test('task_x7kp2mq4vbb')).toBe(false);
  expect(pattern.test('task_X7KP2MQ4VB')).toBe(false);
  expect(pattern.test('task_i7kp2mq4vb')).toBe(false);
  expect(pattern.test(' task_x7kp2mq4vb')).toBe(false);
});

test('isPublicId honours the prefix and length', () => {
  expect(isPublicId({ value: 'task_x7kp2mq4vb', prefix: 'task' })).toBe(true);
  expect(isPublicId({ value: 'task_x7kp2mq4vb', prefix: 'proj' })).toBe(false);
  expect(isPublicId({ value: 'ak_x7kp', prefix: 'ak', length: 4 })).toBe(true);
});

test.each(['', 'Task', '1task', 'ta-sk', 'ta_sk', 'task.*'])(
  'refuses the prefix %p',
  (prefix) => {
    expect(() => {
      return createPublicId({ prefix });
    }).toThrow(TypeError);
    expect(() => {
      return publicIdPattern({ prefix });
    }).toThrow(TypeError);
  }
);

test.each([0, -1, 1.5, Number.NaN])('refuses the length %p', (length) => {
  expect(() => {
    return createPublicId({ prefix: 'task', length });
  }).toThrow(TypeError);
});
