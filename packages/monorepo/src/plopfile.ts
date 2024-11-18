import { NodePlopAPI } from 'plop';
import path from 'node:path';

export default (plop: NodePlopAPI) => {
  plop.setGenerator('monorepo cicd', {
    description: 'Setup a monorepo project',
    prompts: [],
    actions: ['pr', 'closed-pr', 'main', 'tag'].flatMap((file) => {
      return [
        {
          type: 'add',
          path: path.resolve(process.cwd(), `.cicd/commands/${file}.sh`),
          templateFile: `templates/monorepo/.cicd/commands/${file}.sh.hbs`,
        },
        {
          type: 'add',
          path: path.resolve(process.cwd(), `.github/workflows/${file}.yml`),
          templateFile: `templates/monorepo/.github/workflows/${file}.yml.hbs`,
        },
      ];
    }),
  });
};
