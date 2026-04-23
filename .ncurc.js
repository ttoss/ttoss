export default {
  reject: [
    /**
     * It breaks carlin build.
     */
    '@octokit/webhooks',
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
