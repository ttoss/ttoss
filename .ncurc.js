module.exports = {
  reject: [
    /**
     * change-case v5 is ESM and carlin is CJS.
     */
    'change-case',
    /**
     * Waiting for https://github.com/ttoss/ttoss/issues/526
     */
    'eslint',
    /**
     * On 2024-01-29, updating to the 14.1.0 version of `next` will
     * cause dev and build to fail.
     * https://github.com/vercel/next.js/issues/61116
     */
    'next',
  ],
};
