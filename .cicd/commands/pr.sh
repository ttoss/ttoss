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
# packages with bug. As `test` isn't a dependsOn of `deploy` on turbo.json,
# we need to run them separately. If we run them together and deploy is faster,
# `deploy` will run even if `test` fails.
pnpm turbo run deploy --filter=...[main]
