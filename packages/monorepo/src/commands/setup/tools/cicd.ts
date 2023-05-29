import { Tool } from '../executeTools';
import yaml from 'js-yaml';

const lintCommand = `
# Undo all files that were changed by the build command—this happens because
# the build can change files with different linting rules and \`pnpm run lint\`
# fix them.
#
# We don't want these changes becaues it will cause
# turbo cache missing. https://turbo.build/repo/docs/core-concepts/caching#missing-the-cache
#
# This command uses the git status --porcelain command to check if there are
# any modified, untracked, or staged files in the repository. If the output
# of the command is not empty (-z checks for empty output), it means there are changed files.
pnpm turbo run lint -- --allow-empty
[ -z "$(git status --porcelain)" ] || { echo "Error: There are changed files."; git status; exit 1; }
`;

const prCommand = `
# Retrieve the latest tag.
export LATEST_TAG=$(git describe --tags --abbrev=0)

# See description on the lint.sh file.
sh "$(dirname "$0")/lint.sh" || exit 1

# Test and build all packages since main
# and all the workspaces that depends on them.
# https://turbo.build/repo/docs/core-concepts/monorepos/filtering#include-dependents-of-matched-workspaces
pnpm turbo run build test --filter=...[main]

# See description on the lint.sh file.
sh "$(dirname "$0")/lint.sh" || exit 1

# Run deploy separately from command above because we don't want to deploy
# packages with bug. As \`test\` isn't a dependsOn of \`deploy\` on turbo.json,
# we need to run them separately. If we run them together and deploy is faster,
# \`deploy\` will run even if \`test\` fails.
pnpm turbo run deploy --filter=...[main]
`;

const prWorkflow = {
  name: 'pr',
  on: {
    pull_request: {
      branches: ['main'],
      types: ['opened', 'synchronize', 'reopened', 'closed'],
    },
  },
  concurrency: {
    group: 'pr-${{ github.head_ref || github.ref_name }}',
    'cancel-in-progress': true,
  },
  jobs: {
    pr: {
      if: "github.event.action != 'closed'",
      'runs-on': 'ubuntu-latest',
      steps: [
        {
          name: 'Configure AWS Credentials',
          uses: 'aws-actions/configure-aws-credentials@v1-node16',
          with: {
            'aws-region': 'us-east-1',
            'aws-access-key-id': '${{ secrets.AWS_ACCESS_KEY_ID }}',
            'aws-secret-access-key': '${{ secrets.AWS_SECRET_ACCESS_KEY }}',
          },
        },
        {
          name: 'Checkout',
          uses: 'actions/checkout@v3',
          with: {
            'fetch-depth': 50,
          },
        },
        {
          name: 'Fetch and merge most recent main',
          run: 'git fetch origin main:main\ngit merge main --ff-only --no-edit',
        },
        {
          name: 'Set up Node.js',
          uses: 'actions/setup-node@v3',
          with: {
            'node-version': '18',
          },
        },
        {
          name: 'Install pnpm',
          uses: 'pnpm/action-setup@v2',
          id: 'pnpm-install',
          with: {
            run_install: false,
            version: 8,
          },
        },
        {
          name: 'Get pnpm store directory',
          id: 'pnpm-cache',
          shell: 'bash',
          run: 'echo "STORE_PATH=$(pnpm store path)" >> $GITHUB_OUTPUT',
        },
        {
          name: 'Setup pnpm cache',
          uses: 'actions/cache@v3',
          with: {
            path: '${{ steps.pnpm-cache.outputs.STORE_PATH }}',
            key: "${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}",
            'restore-keys': '${{ runner.os }}-pnpm-store-',
          },
        },
        {
          name: 'Install dependencies',
          run: 'pnpm install --frozen-lockfile',
        },
        {
          name: 'Run pr command',
          run: 'sh -e ./.cicd/commands/pr.sh',
          env: {
            CARLIN_BRANCH: '${{ github.event.pull_request.head.ref }}',
            TURBO_TEAM: 'TURBO_TEAM',
            TURBO_TOKEN: '${{ secrets.TURBO_TOKEN }}',
          },
        },
      ],
    },
  },
};

const closedPrWorkflow = `
name: closed-pr

'on':
  pull_request:
    branches:
      - main
    types:
      - closed

jobs:
  closed-pr:
    runs-on: ubuntu-latest
    steps:
      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v1-node16
        with:
          aws-region: us-east-1
          aws-access-key-id: \${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: \${{ secrets.AWS_SECRET_ACCESS_KEY }}

      - name: Checkout
        uses: actions/checkout@v3

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - uses: pnpm/action-setup@v2
        name: Install pnpm
        id: pnpm-install
        with:
          run_install: false
          version: 8

      - name: Get pnpm store directory
        id: pnpm-cache
        shell: bash
        run: |
          echo "STORE_PATH=$(pnpm store path)" >> $GITHUB_OUTPUT

      - uses: actions/cache@v3
        name: Setup pnpm cache
        with:
          path: \${{ steps.pnpm-cache.outputs.STORE_PATH }}
          key: \${{ runner.os }}-pnpm-store-\${{ hashFiles('**/pnpm-lock.yaml') }}
          restore-keys: |
            \${{ runner.os }}-pnpm-store-

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run closed-pr command
        run: sh -e ./.cicd/commands/closed-pr.sh
        env:
          CARLIN_BRANCH: \${{ github.event.pull_request.head.ref }}
          TURBO_TEAM: TURBO_TEAM
          TURBO_TOKEN: \${{ secrets.TURBO_TOKEN }}

`;

export const cicd: Tool = async () => {
  return {
    configFiles: [
      {
        name: '.cicd/commands/lint.sh',
        content: lintCommand,
      },
      {
        name: '.cicd/commands/pr.sh',
        content: prCommand,
      },
      {
        name: '.github/workflows/pr.yml',
        content: yaml.dump(prWorkflow),
      },
    ],
  };
};
