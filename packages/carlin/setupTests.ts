/**
 * Avoid the error: 'TypeError [ERR_INVALID_ARG_TYPE]: The "original"
 * argument must be of type function. Received undefined.'
 */
jest.mock('find-up', () => ({
  sync: jest.fn().mockReturnValue('./some-dir'),
}));

jest.mock('prettier', () => ({
  format: jest.fn((code) => code),
}));

jest.mock('uglify-js', () => ({
  minify: jest.fn((code) => ({ code })),
}));
