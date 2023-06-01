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

const closedPrCommand = `
export CARLIN_DESTROY=true

# Need to run build carlin before deploy because we're using the flag --only.
pnpm turbo run build --filter=carlin

pnpm turbo run deploy --only
`;

const mainCommand = `
export CARLIN_ENVIRONMENT=Production

# Fetch tags.
git fetch --tags --quiet

# 1. \`git tag --points-at HEAD\`: This command lists all tags that point to the
# current commit, which is specified as HEAD.
# 2. \`grep -q .\`: This command searches for any character in the output of the
# git tag command. If there are no tags, the output will be empty and grep will
# return a non-zero exit code, which indicates failure. If there are tags, grep
# will find at least one character in the output and return a zero exit code,
# which indicates success.
git tag --points-at HEAD | grep -q . && { echo "There are tags in the current commit, exiting main workflow" && exit 0; }

# Retrieve the latest tag.
export LATEST_TAG=$(git describe --tags --abbrev=0)

# Setup NPM token.
# Using ~/.npmrc instead of .npmrc because pnpm uses .npmrc and appending
# the token to .npmrc will cause git uncommitted changes error.
echo //registry.npmjs.org/:\\_authToken=$NPM_TOKEN > ~/.npmrc

# Print "NPM whoami" to check if the token is valid.
echo NPM whoami: $(npm whoami)

# Build @ttoss/config package to lerna version command works properly
# when commiting changes. If we don't build this package, commit will fail
# because pre-commit hook will run syncpack:list with default config, that
# not works because of package version and "workspace:^" mismatch.
pnpm turbo run build:config

# Publish packages only if \`pnpm lerna changed\` is success. This happens when
# exists an update on root and no packages changes. This way, \`version\` won't
# create tags and \`git diff HEAD^1 origin/main --quiet\` will fail because
# HEAD^1 will diff from origin/main.
if pnpm lerna changed; then
  echo "Changes detected on packages, publishing them..."
  
  # Version before publish to rebuild all packages that Lerna will publish.
  pnpm lerna version --yes --no-push

  # Test and build all packages since $LATEST_TAG
  # and all the workspaces that depends on them.
  # https://turbo.build/repo/docs/core-concepts/monorepos/filtering#include-dependents-of-matched-workspaces
  pnpm turbo run build test --filter=...[$LATEST_TAG]

  # See description on the lint.sh file.
  sh "$(dirname "$0")/lint.sh" || exit 1

  # Use Git to check for changes in the origin repository. If there are any
  # changes, "git push --follow-tags" will fail. The error message will be:
  #
  # error: failed to push some refs to 'github.com:ttoss/ttoss.git'
  # hint: Updates were rejected because the remote contains work that you do
  # hint: not have locally. This is usually caused by another repository pushing
  # hint: to the same ref. You may want to first integrate the remote changes
  # hint: (e.g., 'git pull ...') before pushing again.
  #
  # To avoid this, we need to:
  #
  # 1. Fetch the latest changes from the origin/main repository.
  # 2. Compare the local and remote main branches using \`git diff\`.
  # 3. Check if there are any changes and stop the workflow if there are any.
  # 4. Exit and wait to the next main workflow starts because of the changes.
  git fetch

  # HEAD^1 because lerna version created a commit.
  git diff HEAD^1 origin/main --quiet || { echo "Changes found before publishing. Workflow stopped." && exit 1; }

  # Push changes.
  git push --follow-tags

  # Publish packages.
  pnpm -r publish
else
  echo "No changes detected on packages, skipping publish..."
fi

# Deploy after publish because there are cases in which a package is versioned
# and it should be on NPM registry to Lambda Layer create the new version when
# carlin deploy starts.
pnpm turbo run deploy --filter=...[$LATEST_TAG]
`;

const configureAwsCredentialsStep = () => {
  return {
    name: 'Configure AWS Credentials',
    uses: 'aws-actions/configure-aws-credentials@v1-node16',
    with: {
      'aws-region': 'us-east-1',
      'aws-access-key-id': '${{ secrets.AWS_ACCESS_KEY_ID }}',
      'aws-secret-access-key': '${{ secrets.AWS_SECRET_ACCESS_KEY }}',
    },
  };
};

const checkoutStep = ({
  fetchDepth,
  token,
}: { fetchDepth?: number; token?: string } = {}) => {
  const config = {
    name: 'Checkout',
    uses: 'actions/checkout@v3',
    with: {},
  };

  if (fetchDepth) {
    config.with['fetch-depth'] = fetchDepth;
  }

  if (token) {
    config.with['token'] = token;
  }

  return config;
};

const setupNodejsStep = () => {
  return {
    name: 'Set up Node.js',
    uses: 'actions/setup-node@v3',
    with: {
      'node-version': '18',
    },
  };
};

const setupPnpmSteps = () => {
  return [
    {
      name: 'Install pnpm',
      uses: 'pnpm/action-setup@v2',
      id: 'pnpm-install',
      with: {
        run_install: false,
        version: '8.5.0',
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
  ];
};

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
        configureAwsCredentialsStep(),
        checkoutStep({ fetchDepth: 50 }),
        {
          name: 'Fetch and merge most recent main',
          run: 'git fetch origin main:main\ngit merge main --ff-only --no-edit',
        },
        setupNodejsStep(),
        ...setupPnpmSteps(),
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

const closedPrWorkflow = {
  name: 'closed-pr',
  on: {
    pull_request: {
      branches: ['main'],
      types: ['closed'],
    },
  },
  jobs: {
    'closed-pr': {
      'runs-on': 'ubuntu-latest',
      steps: [
        configureAwsCredentialsStep(),
        checkoutStep(),
        setupNodejsStep(),
        ...setupPnpmSteps(),
        {
          name: 'Run closed-pr command',
          run: 'sh -e ./.cicd/commands/closed-pr.sh',
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

const mainWorkflow = {
  name: 'main',
  on: {
    push: {
      branches: ['main'],
    },
  },
  concurrency: {
    group: 'main',
    /**
     * Do not cancel to avoid stopping a release in progress.
     * It could be a deploy or a package publish.
     */
    'cancel-in-progress': false,
  },
  jobs: {
    main: {
      'runs-on': 'ubuntu-latest',
      /**
       * Run only if github.event.head_commit.message IS NOT "chore(release): publish packages"
       */
      if: "${{ !contains(github.event.head_commit.message, 'chore(release):') }}",
      environment: 'Production',
      steps: [
        configureAwsCredentialsStep(),
        checkoutStep({
          fetchDepth: 20,
          token: '${{ secrets.PERSONAL_ACCESS_TOKEN }}',
        }),
        {
          /**
           * Need this because of Lerna tag creation. It needs a user to be set.
           * https://github.com/actions/checkout/issues/13#issuecomment-724415212
           */
          name: 'Setup git user',
          run: [
            'git config user.email "41898282+github-actions[bot]@users.noreply.github.com"',
            'git config user.name "github-actions[bot]"',
          ].join('\n'),
        },
        setupNodejsStep(),
        ...setupPnpmSteps(),
        {
          name: 'Run main command',
          run: 'sh -e ./.cicd/commands/main.sh',
          env: {
            NPM_TOKEN: '${{ secrets.NPM_TOKEN }}',
            TURBO_TEAM: 'TURBO_TEAM',
            TURBO_TOKEN: '${{ secrets.TURBO_TOKEN }}',
            /**
             * https://stackoverflow.com/a/71372524/8786986
             */
            GH_TOKEN: '${{ secrets.PERSONAL_ACCESS_TOKEN }}',
          },
        },
      ],
    },
  },
};

export const cicd: Tool = async ({ ttoss }) => {
  const scripts = (() => {
    if (ttoss) {
      return {
        'build:config': 'pnpm run --filter=@ttoss/config build && pnpm i',
      };
    }

    return {} as any;
  })();

  return {
    scripts,
    packages: [
      '@lerna-lite/changed',
      '@lerna-lite/cli',
      '@lerna-lite/list',
      '@lerna-lite/version',
    ],
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
        name: '.cicd/commands/closed-pr.sh',
        content: closedPrCommand,
      },
      {
        name: '.cicd/commands/main.sh',
        content: mainCommand,
      },
      {
        name: '.github/workflows/pr.yml',
        content: yaml.dump(prWorkflow),
      },
      {
        name: '.github/workflows/closed-pr.yml',
        content: yaml.dump(closedPrWorkflow),
      },
      {
        name: '.github/workflows/main.yml',
        content: yaml.dump(mainWorkflow),
      },
    ],
  };
};
