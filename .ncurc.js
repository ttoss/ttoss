module.exports = {
  reject: [
    /**
     * change-case v5 is ESM and carlin is CJS.
     */
    'change-case',
    /**
     * On 2023-11-22, updating to the latest version of `typescript` will
     * cause some errors:
     * - extends `@ttoss/config/tsconfig.json` will cause an error.
     * - tests with userEvent.setup will fail.
     */
    'typescript',
  ],
};
