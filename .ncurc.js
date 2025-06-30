// eslint-disable-next-line no-undef
module.exports = {
  reject: [
    /**
     * It breaks carlin build.
     */
    '@octokit/webhooks',
    /**
     * On 2024-01-29, updating to the 14.1.0 version of `next` will
     * cause dev and build to fail.
     * https://github.com/vercel/next.js/issues/61116
     */
    'next',
    /**
     * This package is used on `lambda-postgres-query` package and cannot be
     * updated to the latest version because next versions are ESM only.
     * `lambda-postgres-query` is a commonjs package because it uses `pg` and
     * `graphql` packages that are commonjs.
     */
    'camelcase-keys',
  ],
  target: (name) => {
    const minorPackages = ['typescript', '@types/node'];

    if (minorPackages.includes(name)) {
      return 'minor';
    }

    return 'latest';
  },
};
