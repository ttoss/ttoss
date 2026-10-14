import { log } from 'src/utils/log';

const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {
  return undefined;
});

beforeEach(() => {
  consoleErrorSpy.mockClear();
});

afterAll(() => {
  consoleErrorSpy.mockRestore();
});

test.each([
  ['info', 'info'],
  ['warn', 'WARN'],
  ['error', 'ERR!'],
  ['event', 'event'],
  ['output', 'output'],
] as const)(
  '%s writes "<label> <prefix> <message>" to stderr',
  (level, label) => {
    log[level]('my-prefix', 'my message');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      `${label} my-prefix my message`
    );
  }
);

test('should format extra arguments like util.format', () => {
  log.info('prefix', 'value %s and %d', 'text', 42, { a: 1 });
  expect(consoleErrorSpy).toHaveBeenCalledWith(
    'info prefix value text and 42 { a: 1 }'
  );
});

test('should stringify non-string values', () => {
  log.output('EnableTerminationProtection', false);
  expect(consoleErrorSpy).toHaveBeenCalledWith(
    'output EnableTerminationProtection false'
  );
});

test('should print only the prefix when there is no message', () => {
  log.output('Describe Stack');
  expect(consoleErrorSpy).toHaveBeenCalledWith('output Describe Stack');
});

test('should omit an undefined prefix', () => {
  log.event(undefined, 'reason');
  expect(consoleErrorSpy).toHaveBeenCalledWith('event reason');
});

test('should prepend level and prefix to every line', () => {
  log.error('prefix', 'line 1\nline 2');
  expect(consoleErrorSpy).toHaveBeenCalledWith(
    'ERR! prefix line 1\nERR! prefix line 2'
  );
});
