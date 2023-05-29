import { Tool } from '../executeTools';

export const monorepo: Tool = async ({ ttoss }) => {
  const packages = (() => {
    if (ttoss) {
      /**
       * Return nothing because of "workspace:^".
       */
      return [];
    }

    return ['@ttoss/monorepo'];
  })();

  return {
    packages,
    scripts: {
      'monorepo:update': 'ttoss-monorepo setup',
    },
  };
};
