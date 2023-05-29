import { Tool } from '../executeTools';

export const husky: Tool = async () => {
  return {
    beforeCommands: ['rm -rf .husky'],
    packages: ['husky'],
    scripts: {
      prepare: 'husky install',
    },
  };
};
