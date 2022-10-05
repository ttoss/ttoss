import * as fs from 'fs';
import yaml from 'js-yaml';

const prJob = {
  name: 'pr',
  on: {
    pull_request: {
      branch: ['main'],
      types: ['opened', 'synchronize', 'reopened'],
    },
  },
  jobs: {
    pr: {
      'runs-on': 'ubuntu-latest',
      steps: [
        {
          name: 'Checkout',
          uses: 'actions/checkout@v2',
        },
        {
          name: 'Setup Node.js',
          uses: 'actions/setup-node@v1',
          with: {
            'node-version': '16.x',
          },
        },
        {
          name: 'Install Dependencies',
          run: 'yarn install --frozen-lockfile',
        },
        {
          name: 'Run PR Command',
          run: 'sh -e ./.cicd/commands/pr',
        },
      ],
    },
  },
};

export const executeCommands = () => {
  if (!fs.existsSync('.github')) {
    fs.mkdirSync('.github');
  }

  if (!fs.existsSync('.github/workflows')) {
    fs.mkdirSync('.github/workflows');
  }

  fs.writeFileSync('.github/workflows/pr.yml', yaml.dump(prJob));
};
