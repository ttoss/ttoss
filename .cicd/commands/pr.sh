# Retrieve the latest tag.
export LATEST_TAG=$(git describe --tags --abbrev=0)

# Build configs to syncpack:lint works properly.
pnpm turbo run build-config

# Check dependencies versions.
pnpm run syncpack:lint

# Test and build all packages since main
# and all the workspaces that depends on them.
# https://turbo.build/repo/docs/core-concepts/monorepos/filtering#include-dependents-of-matched-workspaces
pnpm turbo run i18n build test --filter=[main]

# Undo all files that were changed by the build command—this happens because
# the build can change files with different linting rules and `pnpm run lint`
# fix them.
#
# We don't want these changes becaues it will cause
# turbo cache missing. https://turbo.build/repo/docs/core-concepts/caching#missing-the-cache
#
# This command uses the git status --porcelain command to check if there are
# any modified, untracked, or staged files in the repository. If the output
# of the command is not empty (-z checks for empty output), it means there are changed files.
pnpm run lint -- --no-stash --allow-empty
[ -z "$(git status --porcelain)" ] || { echo "Error: There are changes after i18n/build/test. Please, commit them locally and push again"; git status; exit 1; }

# Run deploy separately from command above because we don't want to deploy
# packages with bug. As `test` isn't a dependsOn of `deploy` on turbo.json,
# we need to run them separately. If we run them together and deploy is faster,
# `deploy` will run even if `test` fails.
pnpm turbo run build test deploy --filter=[main]

# Build carlin CLI explicitly so it is available even when no packages changed
# since main (e.g. PRs that only touch workflow/config files), because the
# deploy task dependency on carlin#build only runs when packages are deployed.
pnpm turbo run build --filter=carlin

# After all packages are deployed, post or update a single PR comment with
# the consolidated deploy outputs from all .carlin/*.json files in the workspace.
pnpm carlin deploy report --channel=github-pr