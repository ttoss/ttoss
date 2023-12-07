module.exports = {
  reject: [
    /**
     * @testing-library/jest-dom v6 breaks TypeScript custom matchers.
     * Example https://github.com/testing-library/jest-dom/issues/546
     */
    '@testing-library/jest-dom',
    'aws-amplify',
    /**
     * change-case v5 is ESM and carlin is CJS.
     */
    'change-case',
    /**
     * On 2023-11-22, updating to the 5.3 version of `typescript` will
     * cause some errors:
     * - extends `@ttoss/config/tsconfig.json` will cause an error.
     * - tests with userEvent.setup will fail.
     */
    'typescript',
  ],
};
