module.exports = {
  reject: [
    'lint-staged',
    /**
     * Avoid this error: https://github.com/vercel/turbo/issues/3918#issuecomment-1460471320
     */
    'turbo',
  ],
};
