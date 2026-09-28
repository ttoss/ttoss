import { parseContentTypes } from 'src/deploy/staticApp/contentTypes';

const LINKSET =
  'application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"';

test('should return no mapping when the option is not defined', () => {
  expect(parseContentTypes(undefined)).toEqual({});
});

test('should keep the path to content type mapping', () => {
  expect(
    parseContentTypes({
      '.well-known/api-catalog': LINKSET,
      'data/feed': 'application/feed+json',
    })
  ).toEqual({
    '.well-known/api-catalog': LINKSET,
    'data/feed': 'application/feed+json',
  });
});

/**
 * Paths are written the way a URL reads, so `/.well-known/api-catalog` and
 * `.well-known/api-catalog` name the same object.
 */
test('should accept a path with a leading slash', () => {
  expect(parseContentTypes({ '/.well-known/api-catalog': LINKSET })).toEqual({
    '.well-known/api-catalog': LINKSET,
  });
});

/**
 * yargs reads a dot in an option key as nesting, so `.well-known/api-catalog`
 * and `feed.json` arrive split into objects. A content type is a string, so a
 * nested object can only be a split path, and joining it back on the dot
 * restores the key as written.
 */
test.each([
  [{ '': { 'well-known/api-catalog': LINKSET } }, '.well-known/api-catalog'],
  [{ '/': { 'well-known/api-catalog': LINKSET } }, '.well-known/api-catalog'],
  [{ 'data/feed': { json: LINKSET } }, 'data/feed.json'],
  [{ data: { feed: { json: LINKSET } } }, 'data.feed.json'],
])('should rejoin a path yargs split on its dots: %p', (arg, path) => {
  expect(parseContentTypes(arg)).toEqual({ [path]: LINKSET });
});

test.each([['text/plain'], [['text/plain']], [42]])(
  'should throw when the option is not an object: %p',
  (arg) => {
    expect(() => {
      return parseContentTypes(arg);
    }).toThrow('The content-types option must be an object');
  }
);

test.each([[''], ['   '], [42]])(
  'should throw when a content type is not a non-empty string: %p',
  (value) => {
    expect(() => {
      return parseContentTypes({ 'data/feed': value });
    }).toThrow('The content type of "data/feed" must be a non-empty string.');
  }
);

test('should throw when a path is empty', () => {
  expect(() => {
    return parseContentTypes({ '/': LINKSET });
  }).toThrow('The content-types option has an empty path.');
});
