export CARLIN_ENVIRONMENT=Production

# Fetch tags
git fetch --tags --quiet

# https://stackoverflow.com/a/25742085/8786986
yarn lerna changed || { echo "No changes detected, exiting main workflow" && exit 0; }

####
## If we're here, there are changes, so we need to run the main workflow
####

LATEST_TAG=$(git describe --tags --abbrev=0)

# Setup NPM token
echo //registry.npmjs.org/:\_authToken=$NPM_TOKEN > .npmrc

# Build config to run lint-staged for lint and version bump
yarn turbo run build --filter=@ttoss/config...

# Version before publish to rebuild all packages that Lerna will publish
yarn lerna version --yes --no-push

# Lint, test, build, and deploy all packages since $LATEST_TAG and their dependent packages.
# https://turbo.build/repo/docs/core-concepts/monorepos/filtering#include-dependents-of-matched-workspaces
yarn turbo run lint build test deploy --filter=...[$LATEST_TAG]

# Publish packages
yarn lerna publish from-git --yes

# Push only tags to check if there's no issues with the tags
git push --tags

# Push changes
git push --follow-tags