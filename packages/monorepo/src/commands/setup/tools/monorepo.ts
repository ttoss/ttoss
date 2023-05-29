import { Tool } from '../executeTools';

export const monorepo: Tool = async () => {
  return {
    packages: ['@ttoss/monorepo'],
    scripts: {
      'monorepo:update': 'ttoss-monorepo setup',
    },
  };
};
