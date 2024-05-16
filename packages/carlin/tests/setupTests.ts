/**
 * Avoid the error: 'TypeError [ERR_INVALID_ARG_TYPE]: The "original"
 * argument must be of type function. Received undefined.'
 */
jest.mock('findup-sync', () => {
  return {
    __esModule: true,
    default: jest.fn().mockReturnValue('./some-dir'),
  };
});

jest.mock('prettier', () => {
  return {
    format: jest.fn((code) => {
      return code;
    }),
  };
});

jest.mock('uglify-js', () => {
  return {
    minify: jest.fn((code) => {
      return { code };
    }),
  };
});

/**
 * Delete possible `process.env.ENVIRONMENT` defined. For example, GitHub
 * Actions tag pipeline sets it to Production and fails some tests that
 * expect it to be undefined.
 */
delete process.env.ENVIRONMENT;
